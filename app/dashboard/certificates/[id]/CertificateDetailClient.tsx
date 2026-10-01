"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Course = {
  _id?: string;
  title?: string;
  slug?: string;
  thumbnail?: string;
};

type Certificate = {
  _id: string;
  certificateNumber?: string;
  title?: string;
  description?: string;

  recipientName?: string;
  recipientEmail?: string;

  issuedAt?: string | null;
  expiresAt?: string | null;

  status?: string;

  issuer?: string;
  issuerName?: string;
  issuerLogo?: string;

  template?: string;

  course?: Course | null;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  certificate?: Certificate;
};

type Props = {
  certificateId: string;
};

export default function CertificateDetailClient({
  certificateId,
}: Props) {
  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [downloading, setDownloading] =
    useState(false);

  /*
   * ============================================================
   * LOAD CERTIFICATE
   * ============================================================
   */

  async function loadCertificate() {
    if (!certificateId) {
      setError(
        "Invalid certificate ID."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/certificates/${encodeURIComponent(
          certificateId
        )}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
          cache: "no-store",
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load certificate."
        );
      }

      if (!data.success) {
        throw new Error(
          data?.message ||
            "Unable to load certificate."
        );
      }

      if (!data.certificate) {
        throw new Error(
          "Certificate was not found."
        );
      }

      setCertificate(
        data.certificate
      );
    } catch (err: any) {
      console.error(
        "[CERTIFICATE DETAIL] LOAD ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to load certificate."
      );

      setCertificate(null);
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    loadCertificate();
  }, [certificateId]);

  /*
   * ============================================================
   * DATE FORMAT
   * ============================================================
   */

  function formatDate(
    value?: string | null
  ) {
    if (!value) {
      return "No Expiry";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  /*
   * ============================================================
   * GET STATUS
   * ============================================================
   */

  function getStatus(
    item: Certificate
  ) {
    const status =
      String(
        item.status || ""
      ).toUpperCase();

    if (
      status === "REVOKED"
    ) {
      return "REVOKED";
    }

    if (
      status === "EXPIRED"
    ) {
      return "EXPIRED";
    }

    if (
      item.expiresAt
    ) {
      const expiry =
        new Date(
          item.expiresAt
        );

      if (
        !Number.isNaN(
          expiry.getTime()
        ) &&
        expiry.getTime() <
          Date.now()
      ) {
        return "EXPIRED";
      }
    }

    return "VALID";
  }

  /*
   * ============================================================
   * DOWNLOAD
   * ============================================================
   */

  async function downloadCertificate() {
    if (!certificate?._id) {
      return;
    }

    try {
      setDownloading(true);

      const response =
        await fetch(
          `/api/certificates/${encodeURIComponent(
            certificate._id
          )}/download`,
          {
            method: "GET",
          }
        );

      if (!response.ok) {
        let message =
          "Unable to download certificate.";

        try {
          const data =
            await response.json();

          message =
            data?.message ||
            message;
        } catch {
          // Response may be a PDF/blob.
        }

        throw new Error(
          message
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download = `${
        certificate.certificateNumber ||
        "certificate"
      }.pdf`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      window.URL.revokeObjectURL(
        url
      );
    } catch (err: any) {
      console.error(
        "[CERTIFICATE DOWNLOAD]",
        err
      );

      alert(
        err?.message ||
          "Unable to download certificate."
      );
    } finally {
      setDownloading(false);
    }
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05070d] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-5 w-32 rounded bg-white/10" />

          <div className="mt-8 h-12 w-80 rounded bg-white/10" />

          <div className="mt-8 h-[500px] rounded-3xl bg-white/5" />
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error || !certificate) {
    return (
      <main className="min-h-screen bg-[#05070d] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-6xl">
            🎓
          </div>

          <h1 className="mt-6 text-2xl font-bold">
            Certificate Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {error ||
              "The requested certificate could not be found."}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={
                loadCertificate
              }
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-500"
            >
              Try Again
            </button>

            <Link
              href="/dashboard/certificates"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
            >
              Back to Certificates
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const status =
    getStatus(certificate);

  const isValid =
    status === "VALID";

  /*
   * ============================================================
   * MAIN
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* ======================================================
            BACK
            ====================================================== */}

        <Link
          href="/dashboard/certificates"
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-white"
        >
          <span>←</span>
          Back to Certificates
        </Link>

        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-400">
              Certificate
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {certificate.certificateDefinition.title ||
                "Certificate"}
            </h1>

            {certificate
              .certificateNumber && (
              <p className="mt-3 font-mono text-xs text-gray-600">
                {
                  certificate.certificateNumber
                }
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/certificate/verify?certificateNumber=${encodeURIComponent(
                certificate.certificateNumber ||
                  ""
              )}`}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              Verify
            </Link>

            <button
              type="button"
              onClick={
                downloadCertificate
              }
              disabled={
                downloading
              }
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading
                ? "Preparing PDF..."
                : "Download Certificate"}
            </button>
          </div>
        </div>

        {/* ======================================================
            CERTIFICATE PREVIEW
            ====================================================== */}

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f18] shadow-2xl">
          <div className="relative min-h-[500px] overflow-hidden bg-gradient-to-br from-indigo-950 via-[#111827] to-[#070a11] px-6 py-12 sm:px-12 lg:px-20">
            {/* Decorative elements */}

            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/5" />

            <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full border border-white/5" />

            {/* Issuer */}

            <div className="relative flex justify-center">
              {certificate.certificateDefinition.issuerLogo ? (
                <img
                  src={
                    certificate.certificateDefinition.issuerLogo
                  }
                  alt={
                    certificate.certificateDefinition.issuerName ||
                    certificate.certificateDefinition.issuer ||
                    "Issuer"
                  }
                  className="h-12 max-w-[180px] object-contain"
                />
              ) : (
                <div className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">
                  {certificate.certificateDefinition
                    .issuerName ||
                    certificate.certificateDefinition.issuer ||
                    "Codelaunch Technologies"}
                </div>
              )}
            </div>

            <div className="relative mx-auto mt-12 max-w-3xl text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-300/70">
                Certificate of Achievement
              </p>

              <h2 className="mt-5 text-3xl font-bold text-white sm:text-5xl">
                {certificate.certificateDefinition.title ||
                  "Certificate"}
              </h2>

              <div className="mx-auto mt-8 h-px w-32 bg-white/20" />

              <p className="mt-8 text-xs uppercase tracking-widest text-gray-500">
                This certificate is proudly
                presented to
              </p>

              <p className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                {certificate.metadata.userName ||
                  "Certificate Recipient"}
              </p>

              {certificate
                .description && (
                <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-gray-400">
                  {
                    certificate.description
                  }
                </p>
              )}

              {certificate.course
                ?.title && (
                <div className="mt-7">
                  <p className="text-xs text-gray-600">
                    Course
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-300">
                    {
                      certificate
                        .course.title
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}

            <div className="relative mx-auto mt-12 grid max-w-3xl gap-6 border-t border-white/10 pt-6 text-center sm:grid-cols-3">
              <CertificateMeta
                label="Issued"
                value={formatDate(
                  certificate.issuedAt
                )}
              />

              <CertificateMeta
                label="Certificate No."
                value={
                  certificate.certificateNumber ||
                  "—"
                }
                mono
              />

              <CertificateMeta
                label="Validity"
                value={
                  certificate.expiresAt
                    ? formatDate(
                        certificate.expiresAt
                      )
                    : "Lifetime"
                }
              />
            </div>
          </div>
        </section>

        {/* ======================================================
            STATUS
            ====================================================== */}

        <div
          className={`mt-6 rounded-2xl border p-5 ${
            isValid
              ? "border-emerald-500/20 bg-emerald-500/5"
              : status ===
                "REVOKED"
              ? "border-red-500/20 bg-red-500/5"
              : "border-yellow-500/20 bg-yellow-500/5"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${
                isValid
                  ? "bg-emerald-500/15 text-emerald-400"
                  : status ===
                    "REVOKED"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-yellow-500/15 text-yellow-400"
              }`}
            >
              {isValid
                ? "✓"
                : status ===
                  "REVOKED"
                ? "×"
                : "!"}
            </div>

            <div>
              <p
                className={`font-semibold ${
                  isValid
                    ? "text-emerald-400"
                    : status ===
                      "REVOKED"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {isValid
                  ? "Certificate is valid"
                  : `Certificate status: ${status}`}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {isValid
                  ? "This certificate is currently valid and can be independently verified."
                  : "Please contact the issuer if you believe this status is incorrect."}
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================
            INFORMATION
            ====================================================== */}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* Recipient */}

          <InfoCard title="Recipient Information">
            <InfoRow
              label="Name"
              value={
                certificate.metadata.userName ||
                "—"
              }
            />

            <InfoRow
              label="Email"
              value={
                certificate.metadata.userEmail ||
                "—"
              }
            />
          </InfoCard>

          {/* Certificate */}

          <InfoCard title="Certificate Information">
            <InfoRow
              label="Certificate Number"
              value={
                certificate.certificateNumber ||
                "—"
              }
              mono
            />

            <InfoRow
              label="Issued Date"
              value={formatDate(
                certificate.issuedAt
              )}
            />

            <InfoRow
              label="Expiry Date"
              value={
                certificate.expiresAt
                  ? formatDate(
                      certificate.expiresAt
                    )
                  : "No Expiry"
              }
            />

            <InfoRow
              label="Status"
              value={status}
            />
          </InfoCard>
        </section>

        {/* ======================================================
            COURSE
            ====================================================== */}

        {certificate.course && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#0b0f18] p-6">
            <p className="text-xs uppercase tracking-widest text-gray-600">
              Associated Course
            </p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {
                    certificate
                      .course.title
                  }
                </h2>

                {certificate.course
                  .slug && (
                  <p className="mt-1 text-xs text-gray-600">
                    {
                      certificate
                        .course.slug
                    }
                  </p>
                )}
              </div>

              {certificate.course
                .slug && (
                <Link
                  href={`/dashboard/courses/${certificate.course.slug}`}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  View Course
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ======================================================
            VERIFICATION
            ====================================================== */}

        <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center">
          <div className="text-3xl">
            🔐
          </div>

          <h2 className="mt-3 text-lg font-semibold">
            Verify this certificate
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
            Anyone can verify the authenticity
            of this certificate using its unique
            certificate number.
          </p>

          <Link
            href={`/certificate/verify?certificateNumber=${encodeURIComponent(
              certificate.certificateNumber ||
                ""
            )}`}
            className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Verify Certificate
          </Link>
        </div>
      </div>
    </main>
  );
}

/*
 * ============================================================
 * CERTIFICATE META
 * ============================================================
 */

function CertificateMeta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-600">
        {label}
      </p>

      <p
        className={`mt-2 break-all text-xs text-gray-400 ${
          mono
            ? "font-mono"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * INFO CARD
 * ============================================================
 */

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0f18] p-6">
      <h2 className="text-base font-semibold">
        {title}
      </h2>

      <div className="mt-5 divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * INFO ROW
 * ============================================================
 */

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="text-xs text-gray-600">
        {label}
      </span>

      <span
        className={`break-all text-sm text-gray-300 sm:text-right ${
          mono
            ? "font-mono"
            : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}