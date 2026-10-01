import CertificatesClient from "./CertificatesClient";

export default function AdminCertificatesPage() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Administration
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Certificates
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
          Create and manage certificate definitions, configure
          certificate requirements, issue certificates to users,
          and manage certificate validity and status.
        </p>
      </div>

      {/* Certificate management */}
      <div className="mt-8">
        <CertificatesClient />
      </div>
    </div>
  );
}