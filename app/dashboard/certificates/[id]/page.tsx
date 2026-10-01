import CertificateDetailClient from "./CertificateDetailClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "Certificate | Codelaunch Technologies",
  description:
    "View your certificate details and verify its authenticity.",
};

export default async function CertificateDetailPage({
  params,
}: Props) {
  const { id } = await params;

  return (
    <CertificateDetailClient
      certificateId={id}
    />
  );
}