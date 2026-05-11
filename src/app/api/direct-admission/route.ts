/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { AtcUser } from "@/models/AtcUser";
import { AtcApplication } from "@/models/AtcApplication";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

const normalizeIsoDate = (raw: unknown): string => {
  const cleaned = String(raw ?? "").trim().replace(/[^\d-]/g, "");
  const parts = cleaned.split("-");
  const year = (parts[0] || "").slice(0, 4);
  const month = (parts[1] || "").slice(0, 2);
  const day = (parts[2] || "").slice(0, 2);
  return [year, month, day].filter(Boolean).join("-");
};

const isValidIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
};

const toBase64 = async (file: any) => {
  try {
    if (!file || typeof file === "string") return file || "";
    if (!file.size || file.size === 0) return "";
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
  } catch (e: any) {
    console.error("toBase64 conversion fail:", e.message);
    return "";
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const requiredFields = [
      "name",
      "fatherName",
      "motherName",
      "dob",
      "gender",
      "mobile",
      "email",
      "currentAddress",
      "course",
      "session",
      "centerCode",
    ];

    for (const field of requiredFields) {
      const value = String(formData.get(field) ?? "").trim();
      if (!value) {
        return NextResponse.json({ message: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const mobile = String(formData.get("mobile") ?? "");
    const email = String(formData.get("email") ?? "");
    const centerCode = String(formData.get("centerCode") ?? "");
    const qualYearPassing = String(formData.get("qualYearPassing") ?? "").replace(/\D/g, "").slice(0, 4);
    const dob = normalizeIsoDate(formData.get("dob"));
    const admissionDate = normalizeIsoDate(formData.get("admissionDate") || new Date().toISOString().split("T")[0]);

    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ message: "Mobile must be exactly 10 digits." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }
    if (qualYearPassing && !/^\d{4}$/.test(qualYearPassing)) {
      return NextResponse.json({ message: "Year of passing must be exactly 4 digits." }, { status: 400 });
    }
    if (!isValidIsoDate(dob)) {
      return NextResponse.json({ message: "Date of birth must be a valid date in YYYY-MM-DD format." }, { status: 400 });
    }
    if (!isValidIsoDate(admissionDate)) {
      return NextResponse.json({ message: "Admission date must be a valid date in YYYY-MM-DD format." }, { status: 400 });
    }

    await connectDB();

    // Find ATC center
    let atc = await AtcUser.findOne({ tpCode: centerCode });
    
    // Auto-recovery: If user missing but approved application exists, heal the state.
    if (!atc) {
      const app = await AtcApplication.findOne({ tpCode: centerCode, status: "approved" });
      if (app) {
        atc = await AtcUser.create({
          tpCode: app.tpCode,
          trainingPartnerName: app.trainingPartnerName,
          email: String(app.email || "").toLowerCase().trim(),
          mobile: app.mobile || "0000000000",
          password: await bcrypt.hash(app.mobile || "0000000000", 10),
          applicationId: app._id,
          zones: (app as any).zones || [],
          status: "active",
        });
        console.log(`[Self-Healing] Dynamically created missing AtcUser for application ${app._id} (tpCode: ${centerCode})`);
      }
    }

    if (!atc) {
      return NextResponse.json({ message: "Invalid Study Center code selected." }, { status: 400 });
    }

    // Process files
    const photo = await toBase64(formData.get("photo"));
    const studentSignature = await toBase64(formData.get("studentSignature"));
    const aadharDoc = await toBase64(formData.get("aadharDoc"));
    const marksheet10th = await toBase64(formData.get("marksheet10th"));
    const marksheet12th = await toBase64(formData.get("marksheet12th"));
    const graduationDoc = await toBase64(formData.get("graduationDoc"));
    const highestQualDoc = await toBase64(formData.get("highestQualDoc"));
    const otherDocs = await toBase64(formData.get("otherDocs"));

    const studentData: any = {
      atcId: atc._id,
      tpCode: atc.tpCode,
      name: String(formData.get("name")).trim(),
      fatherName: String(formData.get("fatherName")).trim(),
      motherName: String(formData.get("motherName")).trim(),
      dob,
      gender: String(formData.get("gender")),
      mobile: mobile,
      parentsMobile: String(formData.get("parentsMobile") || "").trim(),
      email: email.toLowerCase(),
      currentAddress: String(formData.get("currentAddress")).trim(),
      permanentAddress: String(formData.get("permanentAddress") || formData.get("currentAddress")).trim(),
      course: String(formData.get("course")).trim(),
      session: String(formData.get("session")).trim(),
      highestQualification: String(formData.get("highestQualification") ?? "").trim(),
      qualSchool: String(formData.get("qualSchool") ?? "").trim(),
      qualSchoolOther: String(formData.get("qualSchoolOther") ?? "").trim(),
      qualYearPassing,
      qualPercentObtained: String(formData.get("qualPercentObtained") ?? "").trim(),
      credentialEntries: String(formData.get("credentialEntries") ?? "").trim(),
      aadharNo: String(formData.get("aadharNo") || "").trim(),
      referredBy: String(formData.get("referredBy") || "").trim(),
      category: String(formData.get("category") || "General"),
      nationality: String(formData.get("nationality") || "Indian"),
      religion: String(formData.get("religion") || ""),
      maritalStatus: String(formData.get("maritalStatus") || ""),
      disability: formData.get("disability") === "Yes",
      disabilityDetails: String(formData.get("disabilityDetails") || ""),
      examMode: String(formData.get("examMode") || "online"),
      admissionDate,
      enrollmentNo: `DIRECT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      password: mobile, // default password
      status: "pending_atc",
      isDirectAdmission: true,
      admissionFees: "0", // Will be set by ATC during approval
      totalFee: 0,
      paidAmount: 0,
      duesAmount: 0
    };

    // Prepare media items for separate storage
    const mediaToSave = [
      { name: "photo", content: photo },
      { name: "studentSignature", content: studentSignature },
      { name: "aadharDoc", content: aadharDoc },
      { name: "marksheet10th", content: marksheet10th },
      { name: "marksheet12th", content: marksheet12th },
      { name: "graduationDoc", content: graduationDoc },
      { name: "highestQualDoc", content: highestQualDoc },
      { name: "otherDocs", content: otherDocs }
    ];

    // Important: Keep main student object light to avoid 16MB MongoDB limit
    // We only store the basic info in AtcStudent, media goes to StudentMedia
    const student = await AtcStudent.create(studentData);

    // Save media separately
    const { StudentMedia } = await import("@/models/StudentMedia");
    for (const m of mediaToSave) {
      if (m.content && String(m.content).startsWith("data:")) {
        await StudentMedia.findOneAndUpdate(
          { studentId: student._id, fieldName: m.name },
          { content: m.content },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({ 
      message: "Direct admission application submitted successfully! Your Study Center will review your details soon.",
      success: true
    });
  } catch (error: any) {
    console.error("Direct Admission Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
