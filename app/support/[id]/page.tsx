import TicketClient from "./TicketClient";

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
    <div className="mx-auto max-w-5xl">
      <TicketClient ticketId={id} />
    </div>
  );
}