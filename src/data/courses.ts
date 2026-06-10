import { INSTITUTE_COURSES } from "@/data/instituteCourses";

export type Course = {
  title: string;
  description: string;
  image: string;
};

export const courses: Course[] = INSTITUTE_COURSES.map((course) => ({
  title: course.title,
  description: course.description,
  image: course.image,
}));
