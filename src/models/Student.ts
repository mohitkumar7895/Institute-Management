import mongoose, { Schema, model, models } from "mongoose";

/**
 * Legacy DBs may still use `registrationNo` — migrate once to `enrollmentNo` (mongosh):
 * db.atcstudents.updateMany(
 *   { registrationNo: { $exists: true } },
 *   [{ $set: { enrollmentNo: "$registrationNo" } }, { $unset: "registrationNo" }]
 * )
 *
 * Official `enrollmentNo` is generated from Settings `reg_format_student` when admin approves
 * admission (see assignEnrollmentNoIfPending), or when an exam is approved with `admitCardReleased`
 * if still pending.
 * `registrationNo` is generated from `reg_format_student_registration` at the same time
 * (see assignRegistrationNoIfPending) and shown on the admit card.
 */

export interface IStudent {
  _id: mongoose.Types.ObjectId;
  atcId: mongoose.Types.ObjectId;
  tpCode: string;
  enrollmentNo: string;
  /** Admit-card registration id from `reg_format_student_registration` when admit is released. */
  registrationNo?: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  mobile: string;
  parentsMobile?: string;
  email: string;
  currentAddress: string;
  permanentAddress: string;
  course: string; // or Schema.Types.ObjectId if referencing Course
  courseId?: mongoose.Types.ObjectId;
  courseType?: "Regular" | "ODL";
  session: string;
  classRollNo?: string;
  nationality: string;
  category: string;
  maritalStatus?: string;
  religion?: string;
  disability: boolean;
  disabilityDetails?: string;
  admissionFees: string;
  highestQualification: string;
  /** College/school name (free text). Legacy rows may have old dropdown values in `qualSchool` + `qualSchoolOther`. */
  qualSchool?: string;
  qualSchoolOther?: string;
  qualYearPassing?: string;
  qualPercentObtained?: string;
  qualificationDoc?: string;
  photo?: string;
  idProof?: string;
  aadharNo?: string;
  aadharDoc?: string;
  studentSignature?: string;
  otherDocs?: string;
  marksheet12th?: string;
  graduationDoc?: string;
  highestQualDoc?: string;
  referredBy?: string;
  admissionDate: string;
  password?: string; // hashed
  status: "pending" | "approved" | "rejected" | "active" | "pending_atc" | "pending_admin";
  userStatus: "active" | "disabled";
  
  // Offline Exam Tracking
  offlineExamStatus: "not_appeared" | "appeared" | "review_pending" | "published";
  offlineExamMarks: string;
  offlineExamResult: "Pass" | "Fail" | "Waiting";
  offlineExamCopy?: string; // PDF URL
  examMode?: string;

  totalFee: number;
  paidAmount: number;
  duesAmount: number;

  isDirectAdmission?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    atcId: { type: Schema.Types.ObjectId, ref: "AtcUser", required: true },
    tpCode: { type: String, required: true },
    enrollmentNo: { type: String, unique: true, sparse: true },
    registrationNo: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    mobile: { type: String, required: true },
    parentsMobile: { type: String },
    email: { type: String, default: "" },
    currentAddress: { type: String, required: true },
    permanentAddress: { type: String, required: true },
    course: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    courseType: { type: String, enum: ["Regular", "ODL", "ODL (Open Distance Learning)"], default: "Regular" },
    session: { type: String, required: true },
    classRollNo: { type: String },
    nationality: { type: String, default: "Indian" },
    category: { type: String, required: true },
    maritalStatus: { type: String },
    religion: { type: String },
    disability: { type: Boolean, default: false },
    disabilityDetails: { type: String },
    admissionFees: { type: String, required: true },
    admissionDate: { type: String, required: true },
    highestQualification: { type: String, default: "" },
    qualSchool: { type: String, default: "" },
    qualSchoolOther: { type: String, default: "" },
    qualYearPassing: { type: String, default: "" },
    qualPercentObtained: { type: String, default: "" },
    qualificationDoc: { type: String },
    photo: { type: String },
    idProof: { type: String },
    aadharNo: { type: String },
    aadharDoc: { type: String },
    studentSignature: { type: String },
    otherDocs: { type: String },
    marksheet12th: { type: String },
    graduationDoc: { type: String },
    highestQualDoc: { type: String },
    referredBy: { type: String },
    password: { type: String },
    status: { type: String, default: "pending" },
    userStatus: { type: String, default: "active" },

    // Offline Exam Tracking
    offlineExamStatus: { type: String, enum: ["not_appeared", "appeared", "review_pending", "published"], default: "not_appeared" },
    offlineExamMarks: { type: String, default: "" },
    offlineExamResult: { type: String, enum: ["Pass", "Fail", "Waiting"], default: "Waiting" },
    offlineExamCopy: { type: String, default: "" },
    examMode: { type: String, default: "online" },

    // Fee Management
    totalFee: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    duesAmount: { type: Number, default: 0 },

    // Direct Admission
    isDirectAdmission: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Add Indexes for Performance
StudentSchema.index({ atcId: 1, status: 1 });
StudentSchema.index({ atcId: 1, userStatus: 1 });
StudentSchema.index({ atcId: 1, createdAt: -1 });
StudentSchema.index({ enrollmentNo: 1 });
StudentSchema.index({ registrationNo: 1 });

// Force re-registration of the model to handle schema updates in development
if (models.AtcStudent) {
  Reflect.deleteProperty(models as Record<string, mongoose.Model<unknown>>, "AtcStudent");
}

export const AtcStudent = model<IStudent>("AtcStudent", StudentSchema);
