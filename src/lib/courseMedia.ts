import { connectDB } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { parseDataUrl } from "@/lib/galleryMedia";
import { getHomeCourseImage } from "@/utils/courseDisplay";
import { courseImageFallback } from "@/utils/unsplashImage";

import { coursePdfEmbedUrl } from "@/lib/pdfResponse";

export function coursePdfUrl(id: string | undefined | null): string | null {
  const normalized = String(id ?? "").trim();
  if (!normalized || normalized === "undefined" || normalized === "null") {
    return null;
  }
  return coursePdfEmbedUrl(normalized);
}

export type PublicCourseItem = {
  _id: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
  courseFee: number;
  durationMonths: number;
  hasPdf: boolean;
  pdfUrl: string | null;
  pdfFileName: string;
};

export async function getPublicCourses(): Promise<PublicCourseItem[]> {
  const connection = await connectDB();
  if (connection.readyState !== 1) {
    return [];
  }

  const courses = await Course.find({ status: "active" })
    .select("name shortName description image courseFee durationMonths pdf pdfFileName")
    .sort({ createdAt: -1 })
    .lean();

  return courses.map((course, index) => {
    const id = String(course._id);
    const hasPdf = Boolean(course.pdf?.trim());
    return {
      _id: id,
      name: course.name,
      shortName: course.shortName,
      description: course.description?.trim() || `Professional training in ${course.name}.`,
      image:
        course.image?.trim() ||
        getHomeCourseImage(index, course.name, course.shortName) ||
        courseImageFallback(course.name),
      courseFee: course.courseFee || 0,
      durationMonths: course.durationMonths || 0,
      hasPdf,
      pdfUrl: hasPdf ? coursePdfUrl(id) : null,
      pdfFileName: course.pdfFileName?.trim() || `${course.shortName || "course"}.pdf`,
    };
  });
}

export { parseDataUrl };
