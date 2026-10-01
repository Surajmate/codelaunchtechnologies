import NewSupportTicketClient from "./NewSupportTicketClient";

export default function NewSupportTicketPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Support
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Create Support Ticket
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Tell us what you need help with and our support
          team will get back to you.
        </p>
      </div>

      <div className="mt-8">
        <NewSupportTicketClient />
      </div>
    </div>
  );
}