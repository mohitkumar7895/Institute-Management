import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WebsitePdf } from "@/models/WebsitePdf";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    await connectDB();
    const item = await WebsitePdf.findByIdAndDelete(id);
    if (!item) return NextResponse.json({ message: "PDF not found" }, { status: 404 });
    return NextResponse.json({ message: "PDF deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
