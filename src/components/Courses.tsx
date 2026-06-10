import Card from "@/components/Card";
import SectionWrapper from "@/components/SectionWrapper";
import { courses } from "@/data/courses";

export default function Courses() {
  return (
    <SectionWrapper
      id="courses"
      title="Courses"
      subtitle="Fashion, interior, glass design, skill development, seminars and more."
      className="bg-white"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course.title}
            title={course.title}
            description={course.description}
            image={course.image}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
