"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  certificates?: Certificate[];
  stats?: {
    total?: number;
    valid?: number;
    expired?: number;
    revoked?: number;
  };
};

export default function CertificatesClient() {
  const [certificates, setCertificates] =
    useState<Certificate[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<
      "ALL" | "VALID" | "EXPIRED" | "REVOKED"
    >("ALL");

  /*
   * ============================================================
   * LOAD CERTIFICATES
   * ============================================================
   */

  async function loadCertificates() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/certificates",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load certificates."
        );
      }

      if (!data.success) {
        throw new Error(
          data?.message ||
            "Unable to load certificates."
        );
      }

      setCertificates(
        Array.isArray(
          data.certificates
        )
          ? data.certificates
          : []
      );
    } catch (err: any) {
      console.error(
        "[CERTIFICATES CLIENT] LOAD ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to load certificates."
      );

      setCertificates([]);
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
    loadCertificates();
  }, []);

  /*
   * ============================================================
   * FORMAT DATE
   * ============================================================
   */

  function formatDate(
    value?: string | null
  ) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

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
        month: "short",
        year: "numeric",
      }
    );
  }

  /*
   * ============================================================
   * STATUS
   * ============================================================
   */

  function getStatus(
    certificate: Certificate
  ) {
    const status =
      String(
        certificate.status ||
          ""
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
      certificate.expiresAt
    ) {
      const expiry =
        new Date(
          certificate.expiresAt
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
   * FILTER CERTIFICATES
   * ============================================================
   */

  const filteredCertificates =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return certificates.filter(
        (certificate) => {
          const status =
            getStatus(
              certificate
            );

          /*
           * Status filter
           */

          if (
            filter !== "ALL" &&
            status !== filter
          ) {
            return false;
          }

          /*
           * Search filter
           */

          if (!searchValue) {
            return true;
          }

          const searchableText =
            [
              certificate.title,
              certificate.certificateNumber,
              certificate.course
                ?.title,
              certificate.issuer,
              certificate.issuerName,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            searchValue
          );
        }
      );
    }, [
      certificates,
      search,
      filter,
    ]);

  /*
   * ============================================================
   * COUNTS
   * ============================================================
   */

  const counts = useMemo(() => {
    let valid = 0;
    let expired = 0;
    let revoked = 0;

    for (const certificate of certificates) {
      const status =
        getStatus(
          certificate
        );

      if (status === "VALID") {
        valid++;
      }

      if (
        status === "EXPIRED"
      ) {
        expired++;
      }

      if (
        status === "REVOKED"
      ) {
        revoked++;
      }
    }

    return {
      total:
        certificates.length,
      valid,
      expired,
      revoked,
    };
  }, [certificates]);

  /*
   * ============================================================
   * STATUS STYLE
   * ============================================================
   */

  function statusClasses(
    status: string
  ) {
    switch (status) {
      case "VALID":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

      case "EXPIRED":
        return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

      case "REVOKED":
        return "border-red-500/20 bg-red-500/10 text-red-400";

      default:
        return "border-white/10 bg-white/5 text-gray-400";
    }
  }

  /*
   * ============================================================
   * LOADING STATE
   * ============================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05070d] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-56 rounded-lg bg-white/10" />

            <div className="mt-3 h-4 w-80 rounded bg-white/5" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-28 rounded-2xl bg-white/5"
                  />
                )
              )}
            </div>

            <div className="mt-8 h-16 rounded-2xl bg-white/5" />

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(
                (item) => (
                  <div
                    key={item}
                    className="h-72 rounded-2xl bg-white/5"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * MAIN UI
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-4xl">
              🎓
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              My Certificates
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              View your earned certificates,
              download them, and verify their
              authenticity.
            </p>
          </div>

          <Link
            href="/certificate/verify"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/10 hover:text-white"
          >
            Verify a Certificate
          </Link>
        </div>

        {/* ======================================================
            ERROR
            ====================================================== */}

        {error && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-red-400">
                Unable to load certificates
              </p>

              <p className="mt-1 text-sm text-red-300/70">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={
                loadCertificates
              }
              className="rounded-lg border border-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ======================================================
            STATS
            ====================================================== */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Certificates"
            value={counts.total}
            icon="🏆"
          />

          <StatCard
            label="Valid"
            value={counts.valid}
            icon="✓"
          />

          <StatCard
            label="Expired"
            value={counts.expired}
            icon="⏳"
          />

          <StatCard
            label="Revoked"
            value={counts.revoked}
            icon="!"
          />
        </div>

        {/* ======================================================
            FILTER BAR
            ====================================================== */}

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b0f18] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}

            <div className="relative w-full lg:max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                🔍
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search certificates..."
                maxLength={100}
                className="w-full rounded-xl border border-white/10 bg-[#070a11] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* FILTER */}

            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="All"
                count={counts.total}
                active={
                  filter === "ALL"
                }
                onClick={() =>
                  setFilter("ALL")
                }
              />

              <FilterButton
                label="Valid"
                count={counts.valid}
                active={
                  filter === "VALID"
                }
                onClick={() =>
                  setFilter("VALID")
                }
              />

              <FilterButton
                label="Expired"
                count={counts.expired}
                active={
                  filter ===
                  "EXPIRED"
                }
                onClick={() =>
                  setFilter("EXPIRED")
                }
              />

              <FilterButton
                label="Revoked"
                count={counts.revoked}
                active={
                  filter ===
                  "REVOKED"
                }
                onClick={() =>
                  setFilter("REVOKED")
                }
              />
            </div>
          </div>
        </div>

        {/* ======================================================
            EMPTY STATE
            ====================================================== */}

        {filteredCertificates.length ===
          0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b0f18] px-6 py-16 text-center">
            <div className="text-5xl">
              🎓
            </div>

            <h2 className="mt-5 text-xl font-bold">
              {certificates.length ===
              0
                ? "No certificates yet"
                : "No certificates found"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {certificates.length ===
              0
                ? "Complete eligible courses to earn your certificates."
                : "Try changing your search or filter."}
            </p>

            {certificates.length >
              0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter(
                    "ALL"
                  );
                }}
                className="mt-6 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* ======================================================
             CERTIFICATE GRID
             ====================================================== */

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCertificates.map(
              (certificate) => {
                const status =
                  getStatus(
                    certificate
                  );

                return (
                  <CertificateCard
                    key={
                      certificate._id
                    }
                    certificate={
                      certificate
                    }
                    status={
                      status
                    }
                    statusClasses={statusClasses(
                      status
                    )}
                    formatDate={
                      formatDate
                    }
                  />
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/*
 * ============================================================
 * STAT CARD
 * ============================================================
 */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0f18] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {label}
        </span>

        <span className="text-xl">
          {icon}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * FILTER BUTTON
 * ============================================================
 */

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}

      <span
        className={`ml-2 ${
          active
            ? "text-indigo-200"
            : "text-gray-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/*
 * ============================================================
 * CERTIFICATE CARD
 * ============================================================
 */

function CertificateCard({
  certificate,
  status,
  statusClasses,
  formatDate,
}: {
  certificate: Certificate;
  status: string;
  statusClasses: string;
  formatDate: (
    value?: string | null
  ) => string;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f18] transition hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl">
      {/* ======================================================
          CERTIFICATE PREVIEW
          ====================================================== */}

      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-950 via-[#111827] to-[#070a11]">
        {certificate.issuerLogo ? (
          <img
            src={
              certificate.issuerLogo
            }
            alt={
              certificate.issuerName ||
              certificate.issuer ||
              "Certificate issuer"
            }
            className="absolute right-4 top-4 h-8 max-w-[120px] object-contain opacity-80"
          />
        ) : null}

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-4xl">
            🏆
          </div>

          <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-gray-500">
            Certificate of Achievement
          </p>

          <h2 className="mt-2 line-clamp-2 text-xl font-bold text-white">
            {certificate.title ||
              "Certificate"}
          </h2>
        </div>

        <div className="absolute bottom-3 left-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClasses}`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* ======================================================
          DETAILS
          ====================================================== */}

      <div className="p-5">
        {certificate.course
          ?.title && (
          <p className="line-clamp-1 text-sm font-medium text-gray-300">
            {certificate.course.title}
          </p>
        )}

        {certificate
          .certificateNumber && (
          <p className="mt-2 break-all font-mono text-xs text-gray-600">
            {certificate.certificateNumber}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-600">
              Issued
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {formatDate(
                certificate.issuedAt
              )}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-600">
              Expires
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {certificate.expiresAt
                ? formatDate(
                    certificate.expiresAt
                  )
                : "No Expiry"}
            </p>
          </div>
        </div>

        {/* ====================================================
            ACTIONS
            ==================================================== */}

        <div className="mt-5 flex gap-2">
          <Link
            href={`/dashboard/certificates/${certificate._id}`}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            View Certificate
          </Link>

          <Link
            href={`/api/certificates/${certificate._id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
            title="Download certificate"
          >
            ↓
          </Link>
        </div>
      </div>
    </div>
  );
}