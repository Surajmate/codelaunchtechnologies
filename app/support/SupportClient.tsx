"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";


/*
 * ======================================================
 * TYPES
 * ======================================================
 */

interface SupportTicket {
  _id: string;

  ticketNumber: string;

  subject: string;

  description: string;

  category: string;

  priority: string;

  status: string;

  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  } | null;

  lastRepliedBy?: {
    _id: string;
    name: string;
    role: string;
  } | null;

  lastRepliedAt?: string | null;

  resolvedAt?: string | null;

  closedAt?: string | null;

  createdAt: string;

  updatedAt: string;
}

interface Pagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

interface SupportResponse {
  success: boolean;

  tickets: SupportTicket[];

  pagination: Pagination;

  filters: {
    search: string;

    status: string;

    priority: string;

    category: string;
  };

  message?: string;
}


/*
 * ======================================================
 * CONSTANTS
 * ======================================================
 */

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All Status",
  },
  {
    value: "OPEN",
    label: "Open",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    value: "WAITING_FOR_USER",
    label: "Waiting for You",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "",
    label: "All Priority",
  },
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "MEDIUM",
    label: "Medium",
  },
  {
    value: "HIGH",
    label: "High",
  },
  {
    value: "URGENT",
    label: "Urgent",
  },
];

const CATEGORY_OPTIONS = [
  {
    value: "",
    label: "All Categories",
  },
  {
    value: "ACCOUNT",
    label: "Account",
  },
  {
    value: "TECHNICAL",
    label: "Technical",
  },
  {
    value: "COURSE",
    label: "Course",
  },
  {
    value: "QUIZ",
    label: "Quiz",
  },
  {
    value: "INTEGRATION",
    label: "Integration",
  },
  {
    value: "PAYMENT",
    label: "Payment",
  },
  {
    value: "BUG",
    label: "Bug",
  },
  {
    value: "FEATURE_REQUEST",
    label: "Feature Request",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];


/*
 * ======================================================
 * HELPERS
 * ======================================================
 */

function formatStatus(
  status: string
) {
  switch (status) {
    case "OPEN":
      return "Open";

    case "IN_PROGRESS":
      return "In Progress";

    case "WAITING_FOR_USER":
      return "Waiting for You";

    case "RESOLVED":
      return "Resolved";

    case "CLOSED":
      return "Closed";

    default:
      return status;
  }
}

function formatPriority(
  priority: string
) {
  switch (priority) {
    case "LOW":
      return "Low";

    case "MEDIUM":
      return "Medium";

    case "HIGH":
      return "High";

    case "URGENT":
      return "Urgent";

    default:
      return priority;
  }
}

function formatCategory(
  category: string
) {
  switch (category) {
    case "FEATURE_REQUEST":
      return "Feature Request";

    case "INTEGRATION":
      return "Integration";

    case "TECHNICAL":
      return "Technical";

    case "ACCOUNT":
      return "Account";

    case "COURSE":
      return "Course";

    case "QUIZ":
      return "Quiz";

    case "PAYMENT":
      return "Payment";

    case "BUG":
      return "Bug";

    default:
      return category;
  }
}

function formatDate(
  value: string
) {
  try {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

function statusClass(
  status: string
) {
  switch (status) {
    case "OPEN":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "IN_PROGRESS":
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

    case "WAITING_FOR_USER":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    case "RESOLVED":
      return "border-green-400/20 bg-green-400/10 text-green-300";

    case "CLOSED":
      return "border-white/10 bg-white/5 text-white/40";

    default:
      return "border-white/10 bg-white/5 text-white/50";
  }
}

function priorityClass(
  priority: string
) {
  switch (priority) {
    case "URGENT":
      return "text-red-300";

    case "HIGH":
      return "text-orange-300";

    case "MEDIUM":
      return "text-yellow-300";

    case "LOW":
      return "text-white/40";

    default:
      return "text-white/40";
  }
}


/*
 * ======================================================
 * STAT CARD
 * ======================================================
 */

function StatCard({
  label,
  value,
  description,
}: {
  label: string;

  value: number;

  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.15em] text-white/30">
        {label}
      </div>

      <div className="mt-3 text-3xl font-semibold">
        {value}
      </div>

      <div className="mt-1 text-xs text-white/30">
        {description}
      </div>
    </div>
  );
}


/*
 * ======================================================
 * MAIN COMPONENT
 * ======================================================
 */

export default function SupportClient() {
  const [
    tickets,
    setTickets,
  ] = useState<SupportTicket[]>(
    []
  );

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("");

  /*
   * ------------------------------------------------------
   * FETCH TICKETS
   * ------------------------------------------------------
   */

  const loadTickets =
    useCallback(
      async (
        requestedPage = 1
      ) => {
        try {
          setLoading(true);
          setError("");

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(
              requestedPage
            )
          );

          params.set(
            "limit",
            "15"
          );

          if (search.trim()) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (status) {
            params.set(
              "status",
              status
            );
          }

          if (priority) {
            params.set(
              "priority",
              priority
            );
          }

          if (category) {
            params.set(
              "category",
              category
            );
          }

          const response =
            await fetch(
              `/api/support?${params.toString()}`,
              {
                method: "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data: SupportResponse =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load support tickets"
            );
          }

          setTickets(
            data.tickets || []
          );

          setPagination(
            data.pagination
          );
        } catch (
          fetchError
        ) {
          console.error(
            "[SUPPORT UI] LOAD ERROR:",
            fetchError
          );

          setError(
            fetchError instanceof
              Error
              ? fetchError.message
              : "Unable to load support tickets"
          );

          setTickets([]);
        } finally {
          setLoading(false);
        }
      },
      [
        search,
        status,
        priority,
        category,
      ]
    );

  /*
   * ------------------------------------------------------
   * INITIAL LOAD
   * ------------------------------------------------------
   */

  useEffect(() => {
    loadTickets(1);
  }, [loadTickets]);


  /*
   * ------------------------------------------------------
   * LOCAL STATS
   * ------------------------------------------------------
   *
   * The API currently returns paginated tickets,
   * so these values represent the currently loaded
   * tickets only.
   *
   * We'll later add a dedicated user stats endpoint
   * if you want global counts.
   *
   * ------------------------------------------------------
   */

  const stats =
    useMemo(() => {
      return {
        total:
          pagination.total,

        open:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              "OPEN"
          ).length,

        inProgress:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              "IN_PROGRESS"
          ).length,

        waiting:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              "WAITING_FOR_USER"
          ).length,

        resolved:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              "RESOLVED"
          ).length,
      };
    }, [
      tickets,
      pagination.total,
    ]);


  /*
   * ------------------------------------------------------
   * FILTER HANDLER
   * ------------------------------------------------------
   */

  function handleFilterChange(
    setter: (
      value: string
    ) => void,
    value: string
  ) {
    setter(value);
  }


  /*
   * ------------------------------------------------------
   * CLEAR FILTERS
   * ------------------------------------------------------
   */

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategory("");
  }


  /*
   * ------------------------------------------------------
   * RENDER
   * ------------------------------------------------------
   */

  return (
    <div className="space-y-6">

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="text-sm font-medium text-white">
            My Support Tickets
          </div>

          <p className="mt-1 text-sm text-white/40">
            Track your requests and communicate
            with the support team.
          </p>
        </div>

        <Link
          href="/support/new"
          className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          + New Ticket
        </Link>

      </div>


      {/* ==================================================
          ERROR
          ================================================== */}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}


      {/* ==================================================
          STATS
          ================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <StatCard
          label="Total"
          value={
            stats.total
          }
          description="All your tickets"
        />

        <StatCard
          label="Open"
          value={
            stats.open
          }
          description="Awaiting support"
        />

        <StatCard
          label="In Progress"
          value={
            stats.inProgress
          }
          description="Being handled"
        />

        <StatCard
          label="Waiting"
          value={
            stats.waiting
          }
          description="Needs your response"
        />

        <StatCard
          label="Resolved"
          value={
            stats.resolved
          }
          description="Resolved tickets"
        />

      </div>


      {/* ==================================================
          FILTERS
          ================================================== */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_200px_auto]">

          {/* Search */}

          <div className="relative">

            <input
              type="text"
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search tickets..."
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
            />

          </div>


          {/* Status */}

          <select
            value={
              status
            }
            onChange={(event) =>
              handleFilterChange(
                setStatus,
                event.target
                  .value
              )
            }
            className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-white/25"
          >
            {STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                  className="bg-neutral-900"
                >
                  {
                    option.label
                  }
                </option>
              )
            )}
          </select>


          {/* Priority */}

          <select
            value={
              priority
            }
            onChange={(event) =>
              handleFilterChange(
                setPriority,
                event.target
                  .value
              )
            }
            className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-white/25"
          >
            {PRIORITY_OPTIONS.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                  className="bg-neutral-900"
                >
                  {
                    option.label
                  }
                </option>
              )
            )}
          </select>


          {/* Category */}

          <select
            value={
              category
            }
            onChange={(event) =>
              handleFilterChange(
                setCategory,
                event.target
                  .value
              )
            }
            className="h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-white/25"
          >
            {CATEGORY_OPTIONS.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                  className="bg-neutral-900"
                >
                  {
                    option.label
                  }
                </option>
              )
            )}
          </select>


          {/* Clear */}

          {(search ||
            status ||
            priority ||
            category) && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="h-11 rounded-xl border border-white/10 px-4 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              Clear
            </button>
          )}

        </div>

      </div>


      {/* ==================================================
          TICKETS
          ================================================== */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

        {/* Loading */}

        {loading ? (
          <div className="divide-y divide-white/5">

            {Array.from({
              length: 5,
            }).map(
              (_, index) => (
                <div
                  key={
                    index
                  }
                  className="animate-pulse p-5"
                >
                  <div className="h-4 w-48 rounded bg-white/10" />

                  <div className="mt-3 h-3 w-80 rounded bg-white/5" />

                  <div className="mt-4 h-3 w-32 rounded bg-white/5" />
                </div>
              )
            )}

          </div>
        ) : tickets.length ===
          0 ? (
          /* Empty state */

          <div className="px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl">
              ?
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              No support tickets
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-white/35">
              {search ||
              status ||
              priority ||
              category
                ? "No tickets match your current filters."
                : "You haven't created any support tickets yet."}
            </p>

            {!(
              search ||
              status ||
              priority ||
              category
            ) && (
              <Link
                href="/support/new"
                className="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
              >
                Create Your First Ticket
              </Link>
            )}

          </div>
        ) : (
          /* Ticket list */

          <div className="divide-y divide-white/5">

            {tickets.map(
              (
                ticket
              ) => (
                <Link
                  key={
                    ticket._id
                  }
                  href={`/support/${ticket._id}`}
                  className="block p-5 transition hover:bg-white/[0.04]"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    {/* Main */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="font-mono text-xs text-white/30">
                          {
                            ticket.ticketNumber
                          }
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                            ticket.status
                          )}`}
                        >
                          {
                            formatStatus(
                              ticket.status
                            )
                          }
                        </span>

                      </div>

                      <h3 className="mt-2 truncate text-sm font-semibold text-white">
                        {
                          ticket.subject
                        }
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm text-white/35">
                        {
                          ticket.description
                        }
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/30">

                        <span>
                          {
                            formatCategory(
                              ticket.category
                            )
                          }
                        </span>

                        <span className="h-1 w-1 rounded-full bg-white/20" />

                        <span
                          className={
                            priorityClass(
                              ticket.priority
                            )
                          }
                        >
                          {
                            formatPriority(
                              ticket.priority
                            )
                          }
                        </span>

                        <span className="h-1 w-1 rounded-full bg-white/20" />

                        <span>
                          Created{" "}
                          {formatDate(
                            ticket.createdAt
                          )}
                        </span>

                      </div>

                    </div>


                    {/* Right */}

                    <div className="flex items-center justify-between gap-6 lg:justify-end">

                      <div className="text-right">

                        <div className="text-xs text-white/25">
                          Last updated
                        </div>

                        <div className="mt-1 text-xs text-white/50">
                          {formatDate(
                            ticket.updatedAt
                          )}
                        </div>

                      </div>

                      <div className="text-white/20">
                        →
                      </div>

                    </div>

                  </div>

                </Link>
              )
            )}

          </div>
        )}

      </div>


      {/* ==================================================
          PAGINATION
          ================================================== */}

      {!loading &&
        pagination.total >
          0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="text-xs text-white/30">
              Showing{" "}
              {Math.min(
                (pagination.page -
                  1) *
                  pagination.limit +
                  1,
                pagination.total
              )}
              {" - "}
              {Math.min(
                pagination.page *
                  pagination.limit,
                pagination.total
              )}
              {" of "}
              {
                pagination.total
              }
              {" tickets"}
            </div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={
                  !pagination.hasPreviousPage
                }
                onClick={() =>
                  loadTickets(
                    pagination.page -
                      1
                  )
                }
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>

              <div className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/40">
                Page{" "}
                {
                  pagination.page
                }
                {" / "}
                {
                  pagination.totalPages
                }
              </div>

              <button
                type="button"
                disabled={
                  !pagination.hasNextPage
                }
                onClick={() =>
                  loadTickets(
                    pagination.page +
                      1
                  )
                }
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>

            </div>

          </div>
        )}

    </div>
  );
}