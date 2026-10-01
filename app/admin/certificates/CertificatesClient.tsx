"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

type Certificate = {
  _id: string;
  title: string;
  description?: string;
  issuer?: string;
  issuerName?: string;
  issuerLogo?: string;
  template?: string;
  validity?: string;
  validityDays?: number | null;
  status?: string;
  isActive?: boolean;
  requirements?: {
    completionPercentage?: number;
    minimumScore?: number | null;
    requireFinalAssessment?: boolean;
  };
  course?: {
    _id: string;
    title: string;
    slug?: string;
    thumbnail?: string;
  } | null;
  statistics?: {
    total?: number;
    issued?: number;
    pending?: number;
    revoked?: number;
    expired?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

type Stats = {
  total: number;
  active: number;
  inactive: number;
  issued: number;
  revoked: number;
  expired: number;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  certificates?: Certificate[];
  stats?: Stats;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const PAGE_SIZE = 10;

export default function CertificatesClient() {
  const [certificates, setCertificates] =
    useState<Certificate[]>([]);

  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    issued: 0,
    revoked: 0,
    expired: 0,
  });

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [loading, setLoading] =
    useState(true);

  const [statsLoading, setStatsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Certificate | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  /*
   * ========================================================
   * FETCH STATISTICS
   * ========================================================
   */

  const fetchStats =
    useCallback(async () => {
      try {
        setStatsLoading(true);

        const response =
          await fetch(
            "/api/admin/certificates/stats",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data: ApiResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load statistics"
          );
        }

        if (data.stats) {
          setStats({
            total:
              Number(
                data.stats.total || 0
              ),
            active:
              Number(
                data.stats.active || 0
              ),
            inactive:
              Number(
                data.stats.inactive || 0
              ),
            issued:
              Number(
                data.stats.issued || 0
              ),
            revoked:
              Number(
                data.stats.revoked || 0
              ),
            expired:
              Number(
                data.stats.expired || 0
              ),
          });
        }
      } catch (err: any) {
        console.error(
          "Certificate stats error:",
          err
        );
      } finally {
        setStatsLoading(false);
      }
    }, []);

  /*
   * ========================================================
   * FETCH CERTIFICATES
   * ========================================================
   */

  const fetchCertificates =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(page)
        );

        params.set(
          "limit",
          String(PAGE_SIZE)
        );

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (status !== "ALL") {
          params.set(
            "status",
            status
          );
        }

        const response =
          await fetch(
            `/api/admin/certificates?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data: ApiResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load certificates"
          );
        }

        setCertificates(
          Array.isArray(
            data.certificates
          )
            ? data.certificates
            : []
        );

        const pagination =
          data.pagination;

        if (pagination) {
          setTotal(
            Number(
              pagination.total || 0
            )
          );

          setTotalPages(
            Math.max(
              1,
              Number(
                pagination.totalPages ||
                  1
              )
            )
          );
        } else {
          setTotal(
            data.certificates
              ?.length || 0
          );

          setTotalPages(1);
        }
      } catch (err: any) {
        console.error(
          "Certificates error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load certificates"
        );

        setCertificates([]);
      } finally {
        setLoading(false);
      }
    }, [
      page,
      search,
      status,
    ]);

  /*
   * ========================================================
   * INITIAL LOAD
   * ========================================================
   */

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  /*
   * ========================================================
   * SEARCH DEBOUNCE
   * ========================================================
   */

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  /*
   * ========================================================
   * ACTIVATE / DEACTIVATE
   * ========================================================
   */

  const toggleStatus =
    async (
      certificate: Certificate
    ) => {
      try {
        setActionLoading(
          certificate._id
        );

        const nextActive =
          certificate.isActive !==
          true;

        const response =
          await fetch(
            `/api/admin/certificates/${certificate._id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                isActive:
                  nextActive,

                status:
                  nextActive
                    ? "ACTIVE"
                    : "INACTIVE",
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to update certificate"
          );
        }

        await Promise.all([
          fetchCertificates(),
          fetchStats(),
        ]);
      } catch (err: any) {
        alert(
          err?.message ||
            "Unable to update certificate"
        );
      } finally {
        setActionLoading(null);
      }
    };

  /*
   * ========================================================
   * DELETE
   * ========================================================
   */

  const deleteCertificate =
    async () => {
      if (!deleteTarget) {
        return;
      }

      try {
        setDeleteLoading(true);

        const response =
          await fetch(
            `/api/admin/certificates/${deleteTarget._id}`,
            {
              method: "DELETE",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to delete certificate"
          );
        }

        setDeleteTarget(null);

        /*
         * If the last item on the page was deleted,
         * move back one page.
         */

        if (
          certificates.length ===
            1 &&
          page > 1
        ) {
          setPage(
            (current) =>
              current - 1
          );
        } else {
          await fetchCertificates();
        }

        await fetchStats();
      } catch (err: any) {
        alert(
          err?.message ||
            "Unable to delete certificate"
        );
      } finally {
        setDeleteLoading(false);
      }
    };

  /*
   * ========================================================
   * MANUAL REFRESH
   * ========================================================
   */

  const refresh =
    async () => {
      await Promise.all([
        fetchCertificates(),
        fetchStats(),
      ]);
    };

  /*
   * ========================================================
   * PAGINATION
   * ========================================================
   */

  const paginationItems =
    useMemo(() => {
      const items: (
        | number
        | "..."
      )[] = [];

      if (totalPages <= 7) {
        for (
          let i = 1;
          i <= totalPages;
          i++
        ) {
          items.push(i);
        }

        return items;
      }

      items.push(1);

      if (page > 4) {
        items.push("...");
      }

      const start =
        Math.max(
          2,
          page - 1
        );

      const end =
        Math.min(
          totalPages - 1,
          page + 1
        );

      for (
        let i = start;
        i <= end;
        i++
      ) {
        items.push(i);
      }

      if (
        page <
        totalPages - 3
      ) {
        items.push("...");
      }

      items.push(totalPages);

      return items;
    }, [
      page,
      totalPages,
    ]);

  /*
   * ========================================================
   * HELPERS
   * ========================================================
   */

  const formatDate =
    (date?: string) => {
      if (!date) {
        return "—";
      }

      const parsed =
        new Date(date);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return "—";
      }

      return parsed.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    };

  const getStatusClass =
    (
      certificate: Certificate
    ) => {
      if (
        certificate.isActive ===
        true
      ) {
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
      }

      return "border-white/10 bg-white/5 text-white/40";
    };

  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* STATISTICS */}
      {/* ================================================== */}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total"
          value={stats.total}
          loading={statsLoading}
        />

        <StatCard
          label="Active"
          value={stats.active}
          loading={statsLoading}
        />

        <StatCard
          label="Inactive"
          value={stats.inactive}
          loading={statsLoading}
        />

        <StatCard
          label="Issued"
          value={stats.issued}
          loading={statsLoading}
        />

        <StatCard
          label="Revoked"
          value={stats.revoked}
          loading={statsLoading}
        />

        <StatCard
          label="Expired"
          value={stats.expired}
          loading={statsLoading}
        />
      </div>

      {/* ================================================== */}
      {/* TOOLBAR */}
      {/* ================================================== */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search certificates..."
                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.04]"
              />
            </div>

            {/* Status */}
            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="h-10 rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-white outline-none focus:border-white/20"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={
                loading ||
                statsLoading
              }
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/70 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                className={`mr-2 h-4 w-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 11a8.1 8.1 0 0 0-15.5-3M4 4v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 3M20 20v-4h-4" />
              </svg>

              Refresh
            </button>

            <Link
              href="/admin/certificates/create"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <span className="mr-2 text-base">
                +
              </span>

              Create Certificate
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* ERROR */}
      {/* ================================================== */}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={fetchCertificates}
            className="font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* TABLE */}
      {/* ================================================== */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                  Certificate
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                  Course
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                  Requirements
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                  Issued
                </th>

                <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-white/30">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <LoadingRows />
              ) : certificates.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-xl">
                        🏆
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-white">
                        No certificates found
                      </h3>

                      <p className="mt-1 text-sm text-white/35">
                        {search ||
                        status !== "ALL"
                          ? "Try changing your search or filters."
                          : "Create your first certificate definition to get started."}
                      </p>

                      {!search &&
                        status ===
                          "ALL" && (
                          <Link
                            href="/admin/certificates/create"
                            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
                          >
                            Create Certificate
                          </Link>
                        )}
                    </div>
                  </td>
                </tr>
              ) : (
                certificates.map(
                  (certificate) => (
                    <tr
                      key={
                        certificate._id
                      }
                      className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                    >
                      {/* Certificate */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-lg">
                            {certificate.issuerLogo ? (
                              <img
                                src={
                                  certificate.issuerLogo
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              "🏆"
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">
                              {
                                certificate.title
                              }
                            </div>

                            <div className="mt-0.5 truncate text-xs text-white/35">
                              {certificate.issuerName ||
                                certificate.issuer ||
                                "No issuer"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="px-5 py-4">
                        {certificate.course ? (
                          <div className="max-w-[220px]">
                            <div className="truncate text-sm text-white/70">
                              {
                                certificate
                                  .course
                                  .title
                              }
                            </div>

                            <div className="mt-0.5 text-xs text-white/30">
                              Course certificate
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-white/30">
                            All courses
                          </span>
                        )}
                      </td>

                      {/* Requirements */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs text-white/50">
                          <div>
                            Completion:{" "}
                            <span className="text-white/75">
                              {certificate
                                .requirements
                                ?.completionPercentage ??
                                100}
                              %
                            </span>
                          </div>

                          {certificate
                            .requirements
                            ?.minimumScore !==
                            null &&
                            certificate
                              .requirements
                              ?.minimumScore !==
                              undefined && (
                              <div>
                                Score:{" "}
                                <span className="text-white/75">
                                  {
                                    certificate
                                      .requirements
                                      .minimumScore
                                  }
                                  %
                                </span>
                              </div>
                            )}
                        </div>
                      </td>

                      {/* Issued */}
                      <td className="px-5 py-4">
                        <div className="text-sm text-white/70">
                          {Number(
                            certificate
                              .statistics
                              ?.issued ||
                              certificate
                                .statistics
                                ?.total ||
                              0
                          )}
                        </div>

                        <div className="mt-0.5 text-xs text-white/30">
                          certificates
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                            certificate
                          )}`}
                        >
                          {certificate.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/certificates/${certificate._id}`}
                            className="rounded-lg px-2.5 py-2 text-xs font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            disabled={
                              actionLoading ===
                              certificate._id
                            }
                            onClick={() =>
                              toggleStatus(
                                certificate
                              )
                            }
                            className="rounded-lg px-2.5 py-2 text-xs font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                          >
                            {actionLoading ===
                            certificate._id
                              ? "..."
                              : certificate.isActive
                              ? "Disable"
                              : "Enable"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget(
                                certificate
                              )
                            }
                            className="rounded-lg px-2.5 py-2 text-xs font-medium text-red-300/60 transition hover:bg-red-400/10 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* ================================================= */}
        {/* PAGINATION */}
        {/* ================================================= */}

        {!loading &&
          certificates.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-white/30">
                Showing{" "}
                <span className="text-white/60">
                  {Math.min(
                    (page - 1) *
                      PAGE_SIZE +
                      1,
                    total
                  )}
                </span>{" "}
                to{" "}
                <span className="text-white/60">
                  {Math.min(
                    page *
                      PAGE_SIZE,
                    total
                  )}
                </span>{" "}
                of{" "}
                <span className="text-white/60">
                  {total}
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={
                      page <= 1
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:bg-white/[0.05] hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    ‹
                  </button>

                  {paginationItems.map(
                    (
                      item,
                      index
                    ) =>
                      item ===
                      "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="flex h-8 w-8 items-center justify-center text-xs text-white/25"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            setPage(
                              item
                            )
                          }
                          className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs transition ${
                            page ===
                            item
                              ? "border-white/20 bg-white text-black"
                              : "border-white/10 text-white/50 hover:bg-white/[0.05] hover:text-white"
                          }`}
                        >
                          {
                            item
                          }
                        </button>
                      )
                  )}

                  <button
                    type="button"
                    disabled={
                      page >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.min(
                            totalPages,
                            current +
                              1
                          )
                      )
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:bg-white/[0.05] hover:text-white disabled:pointer-events-none disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
      </div>

      {/* ================================================== */}
      {/* DELETE CONFIRMATION */}
      {/* ================================================== */}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-lg">
              ⚠
            </div>

            <h2 className="mt-4 text-lg font-semibold text-white">
              Delete certificate?
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/45">
              You are about to delete{" "}
              <span className="font-medium text-white/80">
                {deleteTarget.title}
              </span>
              .
            </p>

            {Number(
              deleteTarget.statistics
                ?.total || 0
            ) > 0 ? (
              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200/80">
                This certificate has already
                been issued. The server will
                prevent deletion to protect
                historical certificate records.
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs leading-5 text-red-200/80">
                This action cannot be undone.
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={
                  deleteLoading
                }
                onClick={() =>
                  setDeleteTarget(
                    null
                  )
                }
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleteLoading
                }
                onClick={
                  deleteCertificate
                }
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Delete Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
  loading,
}: {
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/35">
        {label}
      </div>

      {loading ? (
        <div className="mt-2 h-7 w-14 animate-pulse rounded bg-white/10" />
      ) : (
        <div className="mt-2 text-2xl font-bold tracking-tight text-white">
          {value.toLocaleString(
            "en-IN"
          )}
        </div>
      )}
    </div>
  );
}

/*
 * ============================================================
 * LOADING ROWS
 * ============================================================
 */

function LoadingRows() {
  return (
    <>
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <tr
          key={index}
          className="border-b border-white/[0.06]"
        >
          {Array.from({
            length: 6,
          }).map(
            (
              __,
              columnIndex
            ) => (
              <td
                key={columnIndex}
                className="px-5 py-5"
              >
                <div
                  className={`h-4 animate-pulse rounded bg-white/[0.06] ${
                    columnIndex ===
                    0
                      ? "w-44"
                      : columnIndex ===
                        1
                      ? "w-32"
                      : "w-20"
                  }`}
                />
              </td>
            )
          )}
        </tr>
      ))}
    </>
  );
}