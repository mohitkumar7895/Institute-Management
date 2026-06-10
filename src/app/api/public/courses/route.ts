import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Course } from "@/models/Course";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find({ status: "active" }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(courses);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
