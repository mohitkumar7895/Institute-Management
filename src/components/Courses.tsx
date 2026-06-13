"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import SectionWrapper from "@/components/SectionWrapper";
import {
  assignHomeCourseImages,
  DEFAULT_COURSE_IMAGE,
  getCourseDescription,
  HOME_COURSE_LIMIT,
} from "@/utils/courseDisplay";

interface PublicCourse {
  _id: string;
  name: string;
  shortName: string;
  durationMonths: number;
  courseFee: number;
}

export default function Courses() {
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/public/courses");
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  const displayedCourses = useMemo(() => courses.slice(0, HOME_COURSE_LIMIT), [courses]);
  const courseImages = useMemo(() => assignHomeCourseImages(displayedCourses), [displayedCourses]);

  return (
    <SectionWrapper
      id="courses"
      title="Courses"
      subtitle="Fashion, interior, glass design, skill development, seminars and more."
      className="bg-white"
    >
      {loading ? (
        <p className="text-center text-sm text-slate-500">Loading courses...</p>
      ) : displayedCourses.length === 0 ? (
        <p className="text-center text-sm text-slate-500">
          No courses added yet. Admin will publish courses here.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayedCourses.map((course, index) => (
            <Card
              key={course._id}
              title={course.name}
              description={getCourseDescription(
                course.name,
                course.durationMonths,
                course.courseFee,
                course.shortName,
              )}
              image={courseImages[index] || DEFAULT_COURSE_IMAGE}
            />
          ))}
        </div>
      )}
    </SectionWrapper>
  );
}
