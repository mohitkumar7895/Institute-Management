import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { connectDB } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { verifyAtc } from "@/lib/auth";

export async function GET(request: Request) {
  const sessionUser = await verifyAtc(request);
  if (!sessionUser) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const courses = await Course.find({ status: "active" }).sort({ name: 1 }).lean();
    return NextResponse.json(courses);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
