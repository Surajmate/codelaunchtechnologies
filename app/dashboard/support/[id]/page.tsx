import SupportTicketClient from "./SupportTicketClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SupportTicketPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <SupportTicketClient id={id} />
    </div>
  );
}