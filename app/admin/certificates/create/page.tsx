import CreateCertificateClient from "./CreateCertificateClient";

export default function CreateCertificatePage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Administration / Certificates
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Create Certificate
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
          Create a certificate definition and configure the
          course, eligibility requirements, issuer information,
          and certificate validity.
        </p>
      </div>

      {/* Form */}
      <div className="mt-8">
        <CreateCertificateClient />
      </div>
    </div>
  );
}