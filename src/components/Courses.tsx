import Card from "@/components/Card";
import SectionWrapper from "@/components/SectionWrapper";
import { FRONT_COURSE_LIST } from "@/data/frontCourses";
import { getPublicCourses } from "@/lib/courseMedia";
import { getFrontCourseDescription, getHomeCourseImage } from "@/utils/courseDisplay";

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export default async function Courses() {
  let dbCourses: Awaited<ReturnType<typeof getPublicCourses>> = [];

  try {
    dbCourses = await getPublicCourses();
  } catch (error) {
    console.error("Failed to load public courses:", error);
  }

  const frontNames = new Set(FRONT_COURSE_LIST.map((course) => normalizeName(course.name)));

  const homepageCourses = [
    ...FRONT_COURSE_LIST.map((course, index) => ({
      id: `front-${index}`,
      title: course.name,
      description: course.description,
      image: course.image || getHomeCourseImage(index, course.name),
      pdfUrl: null as string | null,
    })),
    ...dbCourses
      .filter((course) => !frontNames.has(normalizeName(course.name)))
      .map((course, index) => ({
        id: course._id,
        title: course.name,
        description: course.description || getFrontCourseDescription(course.name),
        image: course.image || getHomeCourseImage(index, course.name, course.shortName),
        pdfUrl: course.pdfUrl,
      })),
  ];

  return (
    <SectionWrapper
      id="courses"
      title="Courses"
      subtitle="Fashion, leather, glass, computer, beautician, industries training and more."
      className="bg-white"
    >
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
        {homepageCourses.map((course) => (
          <Card
            key={course.id}
            title={course.title}
            description={course.description}
            image={course.image}
            pdfUrl={course.pdfUrl}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
