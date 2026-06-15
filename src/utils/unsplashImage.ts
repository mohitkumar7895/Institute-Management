import {
  DEFAULT_COURSE_IMAGE,
  getCourseImageByName,
  getCourseImageBySlug,
} from "@/utils/courseImages";

export function courseCardImage(slug: string) {
  return getCourseImageBySlug(slug) ?? DEFAULT_COURSE_IMAGE;
}

export function courseImageFallback(title: string) {
  return getCourseImageByName(title) ?? DEFAULT_COURSE_IMAGE;
}

/** @deprecated Use courseCardImage or getCourseImageByName instead. */
export function unsplashCourseImage(_photoId: string, _width = 800) {
  return DEFAULT_COURSE_IMAGE;
}
