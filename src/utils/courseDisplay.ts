import { FRONT_COURSE_LIST, getFrontCourseItem } from "@/data/frontCourses";
import { INSTITUTE_COURSES } from "@/data/instituteCourses";
import { DEFAULT_COURSE_IMAGE, getCourseImageByName } from "@/utils/courseImages";
import { courseImageFallback } from "@/utils/unsplashImage";

export { DEFAULT_COURSE_IMAGE };

function normalizeCourseName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findInstituteCourse(name: string, shortName?: string) {
  const normalizedName = normalizeCourseName(name);
  const normalizedShort = shortName ? normalizeCourseName(shortName) : "";

  return INSTITUTE_COURSES.find((course) => {
    const candidates = [course.name, course.shortName, course.title].map(normalizeCourseName);
    return candidates.includes(normalizedName) || (normalizedShort && candidates.includes(normalizedShort));
  });
}

export function getHomeCourseImage(index: number, name: string, shortName?: string) {
  const frontCourse = getFrontCourseItem(name);
  if (frontCourse?.image) return frontCourse.image;

  const byName = getCourseImageByName(name) ?? (shortName ? getCourseImageByName(shortName) : null);
  if (byName) return byName;

  const matched = findInstituteCourse(name, shortName);
  if (matched?.image && !matched.image.includes("unsplash.com") && !matched.image.includes("picsum.photos")) {
    return matched.image;
  }

  if (FRONT_COURSE_LIST.length > 0) {
    return FRONT_COURSE_LIST[Math.abs(index) % FRONT_COURSE_LIST.length].image;
  }

  return courseImageFallback(name);
}

export function assignHomeCourseImages(courses: { name: string; shortName?: string }[]) {
  return courses.map((course, index) => getHomeCourseImage(index, course.name, course.shortName));
}

export function getFrontCourseDescription(name: string) {
  const frontCourse = getFrontCourseItem(name);
  if (frontCourse?.description) return frontCourse.description;

  const matched = findInstituteCourse(name);
  if (matched) return matched.description;

  return `Professional training in ${name} under SIFT Skill Development Institute and SGEFTT.`;
}
