import EditCourseClient from "./EditCourseClient";

interface EditCoursePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCoursePage({
  params,
}: EditCoursePageProps) {
  const { id } = await params;

  return (
    <EditCourseClient courseId={id} />
  );
}