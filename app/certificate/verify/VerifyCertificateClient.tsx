"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";

type Certificate = {
  certificateNumber: string;
  certificateTitle: string;
  recipientName: string;
  courseTitle: string;
  issuerName: string;
  issuerLogo?: string;
  issuedAt: string;
  expiresAt?: string | null;
  status: string;
  completionPercentage?: number | null;
};

type VerifyResponse = {
  success: boolean;
  valid: boolean;
  message?: string;
  certificate?: Certificate;
};

export default function VerifyCertificateClient() {
  const searchParams = useSearchParams();

  const urlCertificateNumber =
    searchParams.get("certificateNumber")?.trim() || "";

  const [certificateNumber, setCertificateNumber] = useState(
    urlCertificateNumber
  );

  const [certificate, setCertificate] = useState<Certificate | null>(null);

  const [loading, setLoading] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [error, setError] = useState("");

  const [qrCode, setQrCode] = useState("");

  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  /*
   * ---------------------------------------------------------
   * FORMAT DATE
   * ---------------------------------------------------------
   */

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return "—";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /*
   * ---------------------------------------------------------
   * VERIFICATION URL
   * ---------------------------------------------------------
   */

  const verificationUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const url = new URL(window.location.href);

    if (certificate?.certificateNumber) {
      url.searchParams.set(
        "certificateNumber",
        certificate.certificateNumber
      );
    }

    return url.toString();
  }, [certificate]);

  /*
   * ---------------------------------------------------------
   * UPDATE INPUT FROM URL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    setCertificateNumber(urlCertificateNumber);
  }, [urlCertificateNumber]);

  /*
   * ---------------------------------------------------------
   * GENERATE QR CODE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function generateQRCode() {
      if (!verificationUrl) {
        setQrCode("");
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#05070f",
            light: "#ffffff",
          },
        });

        if (!cancelled) {
          setQrCode(dataUrl);
        }
      } catch (qrError) {
        console.error("QR generation failed:", qrError);

        if (!cancelled) {
          setQrCode("");
        }
      }
    }

    generateQRCode();

    return () => {
      cancelled = true;
    };
  }, [verificationUrl]);

  /*
   * ---------------------------------------------------------
   * VERIFY CERTIFICATE
   * ---------------------------------------------------------
   */

  const verifyCertificate = useCallback(
    async (numberOverride?: string) => {
      const number = (numberOverride ?? certificateNumber).trim();

      if (!number) {
        setError("Please enter a certificate number.");
        setCertificate(null);
        setHasVerified(false);
        return;
      }

      setLoading(true);
      setError("");
      setCertificate(null);
      setHasVerified(false);

      try {
        const response = await fetch(
          `/api/certificates/verify?certificateNumber=${encodeURIComponent(
            number
          )}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        let data: VerifyResponse;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "Unable to read the verification response from the server."
          );
        }

        if (!response.ok || !data.success || !data.valid || !data.certificate) {
          setError(
            data?.message ||
              "Certificate could not be verified. Please check the certificate number."
          );

          setCertificate(null);
          setHasVerified(true);
          return;
        }

        setCertificate(data.certificate);
        setHasVerified(true);

        /*
         * Keep the URL synchronized without using Next.js router.
         * This avoids the "Router action dispatched before initialization"
         * issue.
         */
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);

          url.searchParams.set(
            "certificateNumber",
            data.certificate.certificateNumber
          );

          window.history.replaceState({}, "", url.toString());
        }
      } catch (err) {
        console.error("Certificate verification error:", err);

        setCertificate(null);
        setHasVerified(true);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify certificate. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [certificateNumber]
  );

  /*
   * ---------------------------------------------------------
   * AUTOMATIC VERIFICATION FROM URL
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!urlCertificateNumber) {
      return;
    }

    verifyCertificate(urlCertificateNumber);
  }, [urlCertificateNumber, verifyCertificate]);

  /*
   * ---------------------------------------------------------
   * FORM SUBMIT
   * ---------------------------------------------------------
   */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await verifyCertificate();
  };

  /*
   * ---------------------------------------------------------
   * VERIFY ANOTHER
   * ---------------------------------------------------------
   */

  const handleVerifyAnother = () => {
    setCertificate(null);
    setError("");
    setHasVerified(false);
    setCertificateNumber("");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);

      url.searchParams.delete("certificateNumber");

      window.history.replaceState({}, "", url.toString());

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  /*
   * ---------------------------------------------------------
   * COPY VERIFICATION LINK
   * ---------------------------------------------------------
   */

  const handleCopyLink = async () => {
    if (!verificationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(verificationUrl);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);

      /*
       * Fallback for browsers where Clipboard API is unavailable.
       */
      try {
        const textarea = document.createElement("textarea");

        textarea.value = verificationUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * SHARE
   * ---------------------------------------------------------
   */

  const handleShare = async () => {
    if (!verificationUrl || !certificate) {
      return;
    }

    setSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${certificate.certificateTitle} - Certificate Verification`,
          text: `${certificate.recipientName}'s certificate issued by Codelaunch Technologies.`,
          url: verificationUrl,
        });
      } else {
        await handleCopyLink();
      }
    } catch (err) {
      /*
       * User cancellation of the share dialog is not an error
       * that needs to be shown to the user.
       */
      console.log("Share cancelled or unavailable:", err);
    } finally {
      setSharing(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * PRINT
   * ---------------------------------------------------------
   */

  const handlePrint = () => {
    window.print();
  };

  /*
   * ---------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------
   */

  const statusText = certificate?.status || "ISSUED";

  const isActive =
    statusText.toUpperCase() === "ISSUED" ||
    statusText.toUpperCase() === "ACTIVE";

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      {/* =====================================================
          PRINT STYLES
      ====================================================== */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-card {
            display: block !important;
            background: white !important;
            color: black !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }

          .print-card * {
            color: black !important;
          }
        }
      `}</style>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="no-print sticky top-0 z-50 border-b border-white/[0.08] bg-[#05070f]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="flex items-center gap-3"
            aria-label="Go to Codelaunch home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-bold text-[#05070f] shadow-lg">
              &lt;/&gt;
            </div>

            <div className="text-left">
              <div className="text-base font-bold tracking-tight">
                Codelaunch
              </div>

              <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Technologies
              </div>
            </div>
          </button>

          {/* Navigation */}

          <nav className="flex items-center gap-2 sm:gap-6">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:block"
            >
              Home
            </button>

            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
              Official Verification Portal
            </div>
          </nav>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        {/* ===================================================
            HERO
        ==================================================== */}

        <section className="mx-auto max-w-4xl text-center">
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-4xl shadow-2xl">
              🎓
            </div>
          </div>

          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">
            Codelaunch Technologies
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Verify Certificate
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Verify the authenticity of a certificate issued by Codelaunch
            Technologies using its unique certificate number.
          </p>
        </section>

        {/* ===================================================
            VERIFICATION FORM
        ==================================================== */}

        <section className="mx-auto mt-10 max-w-5xl">
          <div className="rounded-3xl border border-white/[0.09] bg-[#0a0d17] p-6 shadow-2xl sm:p-8">
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="certificateNumber"
                className="mb-3 block text-sm font-medium text-slate-200"
              >
                Certificate Number
              </label>

              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <input
                    id="certificateNumber"
                    type="text"
                    value={certificateNumber}
                    onChange={(event) =>
                      setCertificateNumber(event.target.value)
                    }
                    placeholder="Enter certificate number"
                    autoComplete="off"
                    className="h-14 w-full rounded-xl border border-white/[0.1] bg-[#05070f] px-5 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-14 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify Certificate"
                  )}
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-slate-500 md:text-left">
                Enter the certificate number exactly as shown on the
                certificate.
              </p>
            </form>
          </div>
        </section>

        {/* ===================================================
            LOADING
        ==================================================== */}

        {loading && (
          <section className="mx-auto mt-8 max-w-5xl">
            <div className="rounded-3xl border border-white/[0.08] bg-[#0a0d17] p-10 text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />

              <h2 className="text-lg font-semibold text-white">
                Verifying certificate
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Checking the certificate against the Codelaunch verification
                system...
              </p>
            </div>
          </section>
        )}

        {/* ===================================================
            ERROR
        ==================================================== */}

        {!loading && hasVerified && error && !certificate && (
          <section className="mx-auto mt-8 max-w-5xl">
            <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.06] p-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl">
                ✕
              </div>

              <h2 className="text-xl font-semibold text-white">
                Certificate Not Verified
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
                {error}
              </p>

              <button
                type="button"
                onClick={handleVerifyAnother}
                className="mt-6 rounded-xl border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
              >
                Verify Another Certificate
              </button>
            </div>
          </section>
        )}

        {/* ===================================================
            VERIFIED CERTIFICATE
        ==================================================== */}

        {!loading && certificate && (
          <section className="mx-auto mt-8 max-w-5xl">
            {/* Verification Success Banner */}

            <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] px-5 py-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-lg text-emerald-400">
                  ✓
                </div>

                <div>
                  <h2 className="font-semibold text-emerald-300">
                    Certificate Verified
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    This certificate has been successfully verified as
                    authentic and was issued by Codelaunch Technologies.
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate */}

            <div className="print-card overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0a0d17] shadow-2xl">
              {/* Certificate Header */}

              <div className="border-b border-white/[0.08] p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
                      Verified Certificate
                    </div>

                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                      {certificate.certificateTitle}
                    </h2>

                    <p className="mt-3 text-sm text-slate-400">
                      Certificate issued to{" "}
                      <span className="font-semibold text-white">
                        {certificate.recipientName}
                      </span>
                    </p>
                  </div>

                  {/* Status */}

                  <div
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                      isActive
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    ✓ {statusText}
                  </div>
                </div>
              </div>

              {/* Certificate Details */}

              <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2">
                <DetailItem
                  label="Certificate Number"
                  value={certificate.certificateNumber}
                  mono
                />

                <DetailItem
                  label="Recipient"
                  value={certificate.recipientName}
                />

                <DetailItem
                  label="Course"
                  value={certificate.courseTitle}
                />

                <DetailItem
                  label="Issued By"
                  value={certificate.issuerName}
                />

                <DetailItem
                  label="Issue Date"
                  value={formatDate(certificate.issuedAt)}
                />

                <DetailItem
                  label="Completion"
                  value={`${certificate.completionPercentage ?? 0}%`}
                  highlight
                />

                <DetailItem
                  label="Status"
                  value={statusText}
                />

                <DetailItem
                  label="Validity"
                  value={
                    certificate.expiresAt
                      ? `Valid until ${formatDate(certificate.expiresAt)}`
                      : "Permanent"
                  }
                />
              </div>

              {/* QR / Authenticity */}

              <div className="border-t border-white/[0.08] p-6 sm:p-8">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
                      Authenticity Guaranteed
                    </div>

                    <h3 className="text-xl font-bold text-white">
                      Independently verify this certificate
                    </h3>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                      This certificate can be independently verified using the
                      unique certificate number. The information shown here is
                      retrieved directly from the Codelaunch certificate
                      verification system.
                    </p>

                    <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <div className="text-xs text-slate-500">
                        Verification URL
                      </div>

                      <div className="mt-2 break-all text-xs text-slate-300">
                        {verificationUrl}
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}

                  <div className="flex flex-col items-center">
                    <div className="rounded-2xl bg-white p-4 shadow-xl">
                      {qrCode ? (
                        <img
                          src={qrCode}
                          alt="QR code to verify this certificate"
                          className="h-40 w-40 sm:h-48 sm:w-48"
                        />
                      ) : (
                        <div className="flex h-40 w-40 items-center justify-center text-center text-xs text-slate-500 sm:h-48 sm:w-48">
                          QR code unavailable
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-center text-xs font-medium text-slate-400">
                      Scan this QR to view
                    </div>

                    <div className="mt-1 text-center text-[11px] text-slate-600">
                      Certificate verification
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}

              <div className="no-print flex flex-wrap gap-3 border-t border-white/[0.08] p-6 sm:p-8">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  {copied ? "✓ Link Copied" : "Copy Verification Link"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  disabled={sharing}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-60"
                >
                  {sharing ? "Sharing..." : "Share"}
                </button>

                {/* <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Print Certificate
                </button> */}

                <button
                  type="button"
                  onClick={handleVerifyAnother}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
                >
                  Verify Another Certificate
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================
            CODELAUNCH PROMOTION
        ==================================================== */}

        <section className="no-print mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.10] via-[#0a0d17] to-[#0a0d17] p-7 sm:p-10">
            <div className="max-w-2xl">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
                Codelaunch Technologies
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Build skills that matter.
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
                Explore practical technology learning, real-world development
                and modern engineering with Codelaunch Technologies.
              </p>
            </div>

            {/* Promotional Cards */}

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <PromoCard
                icon="🚀"
                title="Full Stack Development"
                description="Build modern web applications across frontend, backend and databases."
              />

              <PromoCard
                icon="🤖"
                title="AI & Agentic Development"
                description="Explore AI-powered applications, automation and intelligent agents."
              />

              <PromoCard
                icon="☁️"
                title="Cloud & Integration"
                description="Design scalable applications, APIs, integrations and cloud solutions."
              />
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#05070f] transition hover:bg-slate-200"
              >
                Explore Codelaunch →
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            WHY VERIFY
        ==================================================== */}

        <section className="no-print mx-auto mt-10 max-w-5xl">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard
              icon="🔐"
              title="Authentic"
              description="Certificate information is retrieved from the official Codelaunch verification system."
            />

            <InfoCard
              icon="⚡"
              title="Instant"
              description="Verify a certificate in seconds using its unique certificate number."
            />

            <InfoCard
              icon="🌐"
              title="Shareable"
              description="Use the verification link or QR code to share certificate authenticity."
            />
          </div>
        </section>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="no-print border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-semibold text-white">
              Codelaunch Technologies
            </div>

            <div className="mt-1 text-xs text-slate-600">
              Technology • Learning • Innovation
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="transition hover:text-white"
            >
              Home
            </button>

            <button
              type="button"
              onClick={handleVerifyAnother}
              className="transition hover:text-white"
            >
              Verify Certificate
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="transition hover:text-white"
            >
              Contact
            </button>
          </div>

          <div className="text-xs text-slate-600">
            © {new Date().getFullYear()} Codelaunch Technologies
          </div>
        </div>
      </footer>
    </main>
  );
}

/*
 * =========================================================
 * DETAIL ITEM
 * =========================================================
 */

function DetailItem({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[#0a0d17] p-5 sm:p-6">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-600">
        {label}
      </div>

      <div
        className={`mt-2 break-words text-sm font-medium sm:text-base ${
          highlight ? "text-emerald-400" : "text-white"
        } ${mono ? "font-mono" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * PROMO CARD
 * =========================================================
 */

function PromoCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-xl">
        {icon}
      </div>

      <h3 className="font-semibold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

/*
 * =========================================================
 * INFO CARD
 * =========================================================
 */

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0d17] p-6">
      <div className="mb-4 text-2xl">{icon}</div>

      <h3 className="font-semibold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}