import { NextResponse } from "next/server";
import { getPublicCoursePdfs } from "@/lib/websitePdfs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getPublicCoursePdfs();
    return NextResponse.json(items);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
