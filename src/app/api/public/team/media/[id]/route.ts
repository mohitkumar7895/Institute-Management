import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TeamMember } from "@/models/TeamMember";
import { parseDataUrl } from "@/lib/teamMedia";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectDB();

    const member = await TeamMember.findById(id).select("image").lean();
    if (!member?.image?.startsWith("data:")) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const parsed = parseDataUrl(member.image);
    if (!parsed) {
      return NextResponse.json({ message: "Invalid image." }, { status: 400 });
    }

    const bytes = Uint8Array.from(parsed.buffer);
    return new NextResponse(new Blob([bytes], { type: parsed.contentType }), {
      headers: {
        "Content-Type": parsed.contentType,
        "Content-Length": String(parsed.buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
