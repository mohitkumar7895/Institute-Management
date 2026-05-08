/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { AtcUser } from "@/models/AtcUser";
import { Course } from "@/models/Course";
import { WalletTransaction } from "@/models/WalletTransaction";
import { assignEnrollmentNoIfPending } from "@/lib/assignStudentEnrollmentNo";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action, updateData, newPassword } = await request.json();

    if (!action) return NextResponse.json({ message: "Action is required" }, { status: 400 });

    await connectDB();
    const student = await AtcStudent.findById(id);
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    if (action === "approved" || action === "rejected") {
      if (action === "approved" && student.status !== "active") {
        const normalizedCourse = String(student.course || "").trim();
        const courseQuery: any[] = [
          { name: normalizedCourse },
          { shortName: normalizedCourse },
          { name: { $regex: `^${escapeRegex(normalizedCourse)}$`, $options: "i" } },
          { shortName: { $regex: `^${escapeRegex(normalizedCourse)}$`, $options: "i" } },
        ];
        if (student.courseId) courseQuery.push({ _id: student.courseId });
        const course = await Course.findOne({ $or: courseQuery }).lean() as any;

        if (!course) {
          return NextResponse.json({ message: "Course not found for this admission" }, { status: 400 });
        }

        const registrationFee = Number(course.registrationFee || 0);
        if (registrationFee < 0) {
          return NextResponse.json({ message: "Invalid course registration fee" }, { status: 400 });
        }
        const updatedAtc = await AtcUser.findOneAndUpdate(
          { _id: student.atcId, walletBalance: { $gte: registrationFee } },
          { $inc: { walletBalance: -registrationFee } },
          { new: true }
        ).lean();

        if (!updatedAtc) {
          return NextResponse.json({ message: "Insufficient Balance" }, { status: 400 });
        }

        // Keep student's total fee/admission fee unchanged.
        // Only course registration fee is deducted from ATC wallet.
        await WalletTransaction.create({
          atcId: student.atcId,
          tpCode: student.tpCode,
          type: "debit",
          amount: registrationFee,
          reason: "Course registration fee deduction",
          studentId: student._id,
          studentName: student.name,
          courseName: student.course,
        });
      }

      // Final enrollment number is issued here when admission is approved (reg_format_student).
      // Exam/admit-card flow still calls assignEnrollmentNoIfPending as a no-op if already set.
      student.status = action === "approved" ? "active" : action;
    } 
    else if (action === "toggleStatus") {
      student.userStatus = student.userStatus === "active" ? "disabled" : "active";
    }
    else if (action === "resetPassword") {
      if (!newPassword) return NextResponse.json({ message: "New password is required" }, { status: 400 });
      student.password = newPassword;
    }
    else if (action === "updateDetails") {
      if (!updateData) return NextResponse.json({ message: "Update data is required" }, { status: 400 });
      if (typeof updateData.qualYearPassing === "string") {
        const normalizedYear = updateData.qualYearPassing.replace(/\D/g, "").slice(0, 4);
        if (normalizedYear && !/^\d{4}$/.test(normalizedYear)) {
          return NextResponse.json({ message: "Year of passing must be exactly 4 digits." }, { status: 400 });
        }
        updateData.qualYearPassing = normalizedYear;
      }
      // Filter out fields we don't want to update via this action
      const allowedFields = [
        "name", "fatherName", "motherName", "mobile", "email", "course", 
        "currentAddress", "permanentAddress", "parentsMobile", "aadharNo",
        "photo", "studentSignature", "qualificationDoc", "highestQualDoc", "marksheet10th", "marksheet12th",
        "graduationDoc", "aadharDoc", "otherDocs",
        "dob", "gender", "category", "religion", "nationality", "session",
        "maritalStatus", "courseType", "highestQualification", "qualSchool", "qualSchoolOther",
        "qualYearPassing", "qualPercentObtained", "credentialEntries", "admissionFees",
        "admissionDate", "referredBy", "examMode", "totalFee"
      ];
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          (student as any)[key] = updateData[key];
        }
      });

      if (updateData.password) {
        student.password = updateData.password;
      }
    }

    await student.save();

    if (action === "approved") {
      try {
        await assignEnrollmentNoIfPending(student._id);
      } catch (e) {
        console.error("[admin/students PATCH] assign enrollment", e);
      }
    }

    const responseStudent =
      action === "approved" ? await AtcStudent.findById(student._id) : student;

    return NextResponse.json({
      message: "Action processed successfully",
      student: responseStudent ?? student,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const deleted = await AtcStudent.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ message: "Student not found" }, { status: 404 });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
