type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoursePdfViewerPage({ params }: PageProps) {
  const { id } = await params;
  const src = `/api/public/courses/${encodeURIComponent(id)}/pdf`;

  return (
    <main className="fixed inset-0 z-50 bg-slate-900">
      <iframe
        src={src}
        title="Course PDF"
        className="h-full w-full border-0 bg-white"
      />
    </main>
  );
}
