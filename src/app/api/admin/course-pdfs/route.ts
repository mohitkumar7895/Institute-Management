import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WebsitePdf } from "@/models/WebsitePdf";
import { verifyAdmin } from "@/lib/auth";
import { isPdfDataUrl } from "@/lib/pdfResponse";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const items = await WebsitePdf.find().sort({ createdAt: -1 }).lean();
    const safe = items.map(({ pdf: _pdf, ...rest }) => ({
      ...rest,
      hasPdf: true,
    }));
    return NextResponse.json(safe);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const pdf = typeof body.pdf === "string" ? body.pdf.trim() : "";
    const pdfFileName = typeof body.pdfFileName === "string" ? body.pdfFileName.trim() : "";
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : pdfFileName.replace(/\.pdf$/i, "") || "Course PDF";

    if (!isPdfDataUrl(pdf)) {
      return NextResponse.json({ message: "Please upload a valid PDF file." }, { status: 400 });
    }

    await connectDB();
    const item = await WebsitePdf.create({ title, pdf, pdfFileName });
    const { pdf: _stored, ...safe } = item.toObject();
    return NextResponse.json({ ...safe, hasPdf: true }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
