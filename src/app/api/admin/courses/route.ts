import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Course, type ICourseSubject } from "@/models/Course";
import { verifyAdmin } from "@/lib/auth";

export const dynamic = 'force-dynamic';

/**
 * Coerce an unknown payload into a validated subjects array. Each entry must
 * have a non-empty `name` and non-negative numeric `fullMarks`,
 * `theoryMarks`, `practicalMarks`. Theory + practical must equal full marks
 * (within ±1 to allow rounding).
 */
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

export async function GET(req: Request) {
  try {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    const safe = courses.map((course) => {
      const hasPdf = Boolean(course.pdf?.trim());
      const { pdf: _pdf, ...rest } = course;
      return { ...rest, hasPdf };
    });
    return NextResponse.json(safe);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
      hasMarksheet,
      hasCertificate,
      subjects,
      courseFee,
    } = body;

    if (
      !name ||
      !shortName ||
      !durationMonths ||
      registrationFee === undefined ||
      registrationFee === null ||
      !zone
    ) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    const course = await Course.create({
      name,
      shortName,
      description: typeof description === "string" ? description.trim() : "",
      image: typeof image === "string" ? image.trim() : "",
      pdf: typeof pdf === "string" ? pdf.trim() : "",
      pdfFileName: typeof pdfFileName === "string" ? pdfFileName.trim() : "",
      durationMonths,
      registrationFee: Number(registrationFee),
      zone,
      hasMarksheet: hasMarksheet ?? true,
      hasCertificate: hasCertificate ?? true,
      subjects: normaliseSubjects(subjects),
      courseFee: Number(courseFee) || 0,
    });
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
