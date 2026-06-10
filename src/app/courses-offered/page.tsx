import CoursesOfferedContent from "@/components/courses/CoursesOfferedContent";
import InternalPageLayout from "@/components/InternalPageLayout";

export default function CoursesOfferedPage() {
  return (
    <InternalPageLayout
      title="Courses Offered"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Courses Offered" }]}
    >
      <CoursesOfferedContent />
    </InternalPageLayout>
  );
}
