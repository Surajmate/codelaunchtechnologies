import SupportClient from "./SupportClient";

export default function AdminSupportPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Support
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Support Center
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Manage customer support tickets,
          conversations, assignments, and resolutions.
        </p>
      </div>

      <div className="mt-8">
        <SupportClient />
      </div>
    </div>
  );
}