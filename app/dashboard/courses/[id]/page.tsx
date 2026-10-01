import { notFound } from "next/navigation";

import CourseDetailClient from "./CourseDetailClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CourseDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CourseDetailClient courseId={id} />
      </div>
    </main>
  );
}