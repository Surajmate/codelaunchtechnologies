import CourseAdminClient from "./CourseAdminClient";

interface CoursePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CourseAdminPage({
  params,
}: CoursePageProps) {
  const { id } = await params;

  return <CourseAdminClient courseId={id} />;
}