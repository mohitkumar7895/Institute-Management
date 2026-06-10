import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { GalleryPhoto } from "@/models/GalleryPhoto";
import { parseDataUrl } from "@/lib/galleryMedia";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toResponseBody(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectDB();

    const item = await GalleryPhoto.findById(id).select("image type").lean();
    if (!item?.image) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const parsed = parseDataUrl(item.image);
    if (!parsed) {
      return NextResponse.json({ message: "Invalid media." }, { status: 400 });
    }

    const { contentType, buffer } = parsed;
    const total = buffer.length;
    const range = request.headers.get("range");

    if (range?.startsWith("bytes=") && contentType.startsWith("video/")) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = Number.parseInt(startStr, 10);
      const end = endStr ? Number.parseInt(endStr, 10) : total - 1;

      if (Number.isNaN(start) || start >= total || end >= total || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }

      const chunk = buffer.subarray(start, end + 1);
      return new NextResponse(toResponseBody(chunk), {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new NextResponse(toResponseBody(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(total),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
