import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WebsitePdf } from "@/models/WebsitePdf";
import { parseDataUrl } from "@/lib/galleryMedia";
import { pdfBinaryResponse } from "@/lib/pdfResponse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectDB();

    const item = await WebsitePdf.findById(id).select("pdf pdfFileName status").lean();
    if (!item?.pdf?.trim()) {
      return NextResponse.json({ message: "PDF not found." }, { status: 404 });
    }

    const parsed = parseDataUrl(item.pdf);
    if (!parsed) {
      return NextResponse.json({ message: "Invalid PDF." }, { status: 400 });
    }

    const fileName = item.pdfFileName?.trim() || "course.pdf";
    return pdfBinaryResponse(parsed.buffer, fileName, parsed.contentType || "application/pdf");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
