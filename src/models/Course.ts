import mongoose, { Schema, model, models } from "mongoose";

/**
 * A single subject row in a course's syllabus.
 *
 * Used by the marksheet generator: when an admin approves a result, the exam's
 * total obtained / total max are distributed across these subjects in
 * proportion to each row's `fullMarks`, and `theoryMarks` / `practicalMarks`
 * become the External / Internal column maxes on the printed marksheet.
 */
export interface ICourseSubject {
  name: string;
  fullMarks: number;
  theoryMarks: number;
  practicalMarks: number;
}

export interface ICourse {
  _id: mongoose.Types.ObjectId;
  name: string;
  shortName: string;
  description?: string;
  image?: string;
  pdf?: string;
  pdfFileName?: string;
  durationMonths: number;
  registrationFee: number;
  courseFee: number;
  zone: string; // Label from Affiliation zones and fees (`GET /year-plans` → zones)
  hasMarksheet: boolean;
  hasCertificate: boolean;
  subjects?: ICourseSubject[];
  status: "active" | "inactive";
  createdAt: Date;
}

const CourseSubjectSchema = new Schema<ICourseSubject>(
  {
    name: { type: String, required: true, trim: true },
    fullMarks: { type: Number, required: true, min: 0 },
    theoryMarks: { type: Number, required: true, min: 0 },
    practicalMarks: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    pdf: { type: String, default: "" },
    pdfFileName: { type: String, default: "" },
    durationMonths: { type: Number, required: true },
    registrationFee: { type: Number, required: true, min: 0, default: 0 },
    courseFee: { type: Number, required: true, min: 0, default: 0 },
    zone: { type: String, required: true },
    hasMarksheet: { type: Boolean, default: true },
    hasCertificate: { type: Boolean, default: true },
    subjects: { type: [CourseSubjectSchema], default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

if (mongoose.models.Course) {
  delete mongoose.models.Course;
}
export const Course = model<ICourse>("Course", CourseSchema);
