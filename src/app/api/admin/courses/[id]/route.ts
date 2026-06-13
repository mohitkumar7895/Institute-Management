import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Course, type ICourseSubject } from "@/models/Course";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

function normaliseSubjects(input: unknown): ICourseSubject[] {
  if (!Array.isArray(input)) return [];
  const out: ICourseSubject[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const name = String(r.name ?? "").trim();
    const fullMarks = Number(r.fullMarks);
    const theoryMarks = Number(r.theoryMarks);
    const practicalMarks = Number(r.practicalMarks);
    if (!name) continue;
    if (![fullMarks, theoryMarks, practicalMarks].every((n) => Number.isFinite(n) && n >= 0)) continue;
    if (Math.abs(theoryMarks + practicalMarks - fullMarks) > 1) continue;
    out.push({ name, fullMarks, theoryMarks, practicalMarks });
  }
  return out;
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      shortName,
      description,
      image,
      pdf,
      pdfFileName,
      durationMonths,
      registrationFee,
      zone,
      status,
      hasMarksheet,
      hasCertificate,
      subjects,
      courseFee,
    } = body;
    const { id } = await context.params;

    await connectDB();
    const updateData: Record<string, unknown> = {};
    if (typeof name !== "undefined") updateData.name = name;
    if (typeof shortName !== "undefined") updateData.shortName = shortName;
    if (typeof description !== "undefined") updateData.description = String(description).trim();
    if (typeof image !== "undefined") updateData.image = String(image).trim();
    if (typeof pdf !== "undefined") updateData.pdf = String(pdf).trim();
    if (typeof pdfFileName !== "undefined") updateData.pdfFileName = String(pdfFileName).trim();
    if (typeof durationMonths !== "undefined") updateData.durationMonths = durationMonths;
    if (typeof registrationFee !== "undefined") updateData.registrationFee = registrationFee;
    if (typeof zone !== "undefined") updateData.zone = zone;
    if (typeof status !== "undefined") updateData.status = status;
    if (typeof hasMarksheet !== "undefined") updateData.hasMarksheet = hasMarksheet;
    if (typeof hasCertificate !== "undefined") updateData.hasCertificate = hasCertificate;
    if (typeof subjects !== "undefined") updateData.subjects = normaliseSubjects(subjects);
    if (typeof courseFee !== "undefined") updateData.courseFee = courseFee;

    const course = await Course.findByIdAndUpdate(id, updateData, { new: true });

    if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    await connectDB();
    const course = await Course.findByIdAndDelete(id);
    if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 });
    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
