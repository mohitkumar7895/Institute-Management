import { INSTITUTE_COURSES } from "@/data/instituteCourses";

export const HOME_COURSE_LIMIT = 9;

export const DEFAULT_COURSE_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

export const HOME_COURSE_IMAGES = [
  "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1586350977773-b3b7cdc4fcc0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1578507066246-86aa9c593b86?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
];

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
  const matched = findInstituteCourse(name, shortName);
  if (matched?.image) return matched.image;

  return HOME_COURSE_IMAGES[index % HOME_COURSE_IMAGES.length] || DEFAULT_COURSE_IMAGE;
}

export function assignHomeCourseImages(courses: { name: string; shortName?: string }[]) {
  return courses.map((course, index) => getHomeCourseImage(index, course.name, course.shortName));
}

export function getCourseDescription(
  name: string,
  durationMonths: number,
  courseFee: number,
  shortName?: string,
) {
  const matched = findInstituteCourse(name, shortName);
  if (matched) return matched.description;

  const durationLabel = durationMonths === 1 ? "1 month" : `${durationMonths} months`;
  return `Professional training in ${name}. Duration: ${durationLabel}. Course fee: ₹${courseFee || 0}.`;
}
