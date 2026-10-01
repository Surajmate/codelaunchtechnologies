import CertificateAdminClient from "./CertificateAdminClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CertificateAdminPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Administration / Certificates
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Certificate Details
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
          Manage certificate configuration, eligibility
          requirements, issued certificates, and certificate
          status.
        </p>
      </div>

      {/* Certificate */}
      <div className="mt-8">
        <CertificateAdminClient
          certificateId={id}
        />
      </div>
    </div>
  );
}