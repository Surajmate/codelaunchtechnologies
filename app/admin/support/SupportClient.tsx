"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Ticket,
  UserRound,
  X,
} from "lucide-react";

/*
 * ======================================================
 * TYPES
 * ======================================================
 */

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

type TicketItem = {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;

  user: User | null;

  assignedTo: User | null;

  lastRepliedBy: User | null;

  lastRepliedAt: string | null;

  resolvedAt: string | null;

  closedAt: string | null;

  createdAt: string;

  updatedAt: string;
};

type MessageItem = {
  _id: string;

  ticket: string;

  sender: User | null;

  senderType: string;

  message: string;

  attachments: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];

  internalNote: boolean;

  readByUser: boolean;

  readByAdmin: boolean;

  createdAt: string;
};

type Stats = {
  total: number;

  open: number;

  inProgress: number;

  waitingForUser: number;

  resolved: number;

  closed: number;

  urgent: number;

  unassigned: number;
};

type StatsResponse = {
  success: boolean;

  stats: Stats;
};

type TicketResponse = {
  success: boolean;

  tickets: TicketItem[];

  pagination: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;

    hasNextPage: boolean;

    hasPreviousPage: boolean;
  };
};

type DetailResponse = {
  success: boolean;

  ticket: TicketItem;

  messages: MessageItem[];
};

/*
 * ======================================================
 * OPTIONS
 * ======================================================
 */

const STATUS_OPTIONS = [
  "ALL",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
];

const PRIORITY_OPTIONS = [
  "ALL",
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const CATEGORY_OPTIONS = [
  "ALL",
  "ACCOUNT",
  "TECHNICAL",
  "COURSE",
  "QUIZ",
  "INTEGRATION",
  "PAYMENT",
  "BUG",
  "FEATURE_REQUEST",
  "OTHER",
];

/*
 * ======================================================
 * HELPERS
 * ======================================================
 */

function formatDate(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatShortDate(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
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

function statusLabel(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function statusClass(
  status: string
) {
  switch (status) {
    case "OPEN":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "IN_PROGRESS":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "WAITING_FOR_USER":
      return "border-purple-500/20 bg-purple-500/10 text-purple-400";

    case "RESOLVED":
      return "border-green-500/20 bg-green-500/10 text-green-400";

    case "CLOSED":
      return "border-white/10 bg-white/[0.03] text-white/30";

    default:
      return "border-white/10 bg-white/[0.03] text-white/40";
  }
}

function priorityClass(
  priority: string
) {
  switch (priority) {
    case "URGENT":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "HIGH":
      return "border-orange-500/20 bg-orange-500/10 text-orange-400";

    case "MEDIUM":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "LOW":
      return "border-green-500/20 bg-green-500/10 text-green-400";

    default:
      return "border-white/10 bg-white/[0.03] text-white/40";
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
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="text-xs uppercase tracking-[0.15em] text-white/30">
        {label}
      </div>

      <div className="mt-3 text-2xl font-bold text-white">
        {value}
      </div>

      {description && (
        <div className="mt-1 text-xs text-white/25">
          {description}
        </div>
      )}
    </div>
  );
}

/*
 * ======================================================
 * MAIN COMPONENT
 * ======================================================
 */

export default function SupportClient() {
  /*
   * ====================================================
   * LIST
   * ====================================================
   */

  const [tickets, setTickets] =
    useState<TicketItem[]>([]);

  const [stats, setStats] =
    useState<Stats>({
      total: 0,
      open: 0,
      inProgress: 0,
      waitingForUser: 0,
      resolved: 0,
      closed: 0,
      urgent: 0,
      unassigned: 0,
    });

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const limit = 15;

  /*
   * ====================================================
   * FILTERS
   * ====================================================
   */

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [priority, setPriority] =
    useState("ALL");

  const [category, setCategory] =
    useState("ALL");

  /*
   * ====================================================
   * LOADING
   * ====================================================
   */

  const [loading, setLoading] =
    useState(true);

  const [statsLoading, setStatsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ====================================================
   * DETAIL / DRAWER
   * ====================================================
   */

  const [
    selectedTicketId,
    setSelectedTicketId,
  ] = useState<string | null>(
    null
  );

  const [
    selectedTicket,
    setSelectedTicket,
  ] = useState<TicketItem | null>(
    null
  );

  const [messages, setMessages] =
    useState<MessageItem[]>([]);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  /*
   * ====================================================
   * MESSAGE
   * ====================================================
   */

  const [reply, setReply] =
    useState("");

  const [internalNote, setInternalNote] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  /*
   * ====================================================
   * UPDATE
   * ====================================================
   */

  const [updating, setUpdating] =
    useState(false);

  /*
   * ====================================================
   * MESSAGE SCROLL
   * ====================================================
   */

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /*
   * ====================================================
   * FETCH STATS
   * ====================================================
   */

  const fetchStats =
    useCallback(async () => {
      try {
        setStatsLoading(true);

        const response =
          await fetch(
            "/api/admin/support/stats",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data: StatsResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            "Unable to load support statistics"
          );
        }

        setStats(
          data.stats
        );
      } catch (err) {
        console.error(
          "[ADMIN SUPPORT] Stats error:",
          err
        );
      } finally {
        setStatsLoading(false);
      }
    }, []);

  /*
   * ====================================================
   * FETCH TICKETS
   * ====================================================
   */

  const fetchTickets =
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
          String(limit)
        );

        if (search) {
          params.set(
            "search",
            search
          );
        }

        if (
          status !== "ALL"
        ) {
          params.set(
            "status",
            status
          );
        }

        if (
          priority !== "ALL"
        ) {
          params.set(
            "priority",
            priority
          );
        }

        if (
          category !== "ALL"
        ) {
          params.set(
            "category",
            category
          );
        }

        const response =
          await fetch(
            `/api/admin/support?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data: TicketResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            "Unable to load support tickets"
          );
        }

        setTickets(
          data.tickets || []
        );

        setTotal(
          data.pagination?.total ||
            0
        );

        setTotalPages(
          Math.max(
            data.pagination
              ?.totalPages || 1,
            1
          )
        );
      } catch (err) {
        console.error(
          "[ADMIN SUPPORT] Tickets error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load support tickets"
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      search,
      status,
      priority,
      category,
    ]);

  /*
   * ====================================================
   * INITIAL LOAD
   * ====================================================
   */

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  /*
   * ====================================================
   * OPEN DRAWER
   * ====================================================
   */

  const openTicket =
    async (
      ticketId: string
    ) => {
      try {
        setSelectedTicketId(
          ticketId
        );

        setDetailLoading(
          true
        );

        setSelectedTicket(null);

        setMessages([]);

        setReply("");

        setInternalNote(
          false
        );

        setError("");

        const response =
          await fetch(
            `/api/admin/support/${ticketId}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data: DetailResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to load ticket"
          );
        }

        setSelectedTicket(
          data.ticket
        );

        setMessages(
          data.messages || []
        );
      } catch (err) {
        console.error(
          "[ADMIN SUPPORT] Detail error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load ticket"
        );

        setSelectedTicketId(
          null
        );
      } finally {
        setDetailLoading(
          false
        );
      }
    };

  /*
   * ====================================================
   * CLOSE DRAWER
   * ====================================================
   */

  const closeDetail =
    () => {
      setSelectedTicketId(
        null
      );

      setSelectedTicket(null);

      setMessages([]);

      setReply("");

      setInternalNote(
        false
      );
    };

  /*
   * ====================================================
   * ESC CLOSE
   * ====================================================
   */

  useEffect(() => {
    if (!selectedTicketId) {
      return;
    }

    const handleKeyDown =
      (event: KeyboardEvent) => {
        if (
          event.key === "Escape"
        ) {
          closeDetail();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    selectedTicketId,
  ]);

  /*
   * ====================================================
   * BODY SCROLL LOCK
   * ====================================================
   */

  useEffect(() => {
    if (!selectedTicketId) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    selectedTicketId,
  ]);

  /*
   * ====================================================
   * SCROLL TO BOTTOM
   * ====================================================
   */

  useEffect(() => {
    if (!selectedTicketId) {
      return;
    }

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior: "smooth",
        }
      );
    }, 50);
  }, [
    messages,
    selectedTicketId,
  ]);

  /*
   * ====================================================
   * SEND MESSAGE
   * ====================================================
   */

  const sendMessage =
    async () => {
      if (
        !selectedTicketId ||
        !reply.trim() ||
        sending
      ) {
        return;
      }

      try {
        setSending(true);

        setError("");

        const response =
          await fetch(
            `/api/admin/support/${selectedTicketId}/messages`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                message:
                  reply.trim(),

                internalNote,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to send message"
          );
        }

        if (data.data) {
          setMessages(
            (current) => [
              ...current,
              data.data,
            ]
          );
        }

        setReply("");

        /*
         * Refresh the selected
         * ticket without closing
         * the drawer.
         */

        await openTicket(
          selectedTicketId
        );

        await Promise.all([
          fetchStats(),
          fetchTickets(),
        ]);
      } catch (err) {
        console.error(
          "[ADMIN SUPPORT] Send error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to send message"
        );
      } finally {
        setSending(false);
      }
    };

  /*
   * ====================================================
   * UPDATE TICKET
   * ====================================================
   */

  const updateTicket =
    async (
      field:
        | "status"
        | "priority"
        | "category"
        | "assignedTo",
      value: string
    ) => {
      if (
        !selectedTicketId ||
        updating
      ) {
        return;
      }

      try {
        setUpdating(true);

        setError("");

        const response =
          await fetch(
            `/api/admin/support/${selectedTicketId}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                [field]:
                  value,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data?.message ||
              `Unable to update ${field}`
          );
        }

        /*
         * Reload drawer data.
         */

        await openTicket(
          selectedTicketId
        );

        /*
         * Reload list/stats.
         */

        await Promise.all([
          fetchStats(),
          fetchTickets(),
        ]);
      } catch (err) {
        console.error(
          "[ADMIN SUPPORT] Update error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : `Unable to update ${field}`
        );
      } finally {
        setUpdating(false);
      }
    };

  /*
   * ====================================================
   * SEARCH
   * ====================================================
   */

  const submitSearch =
    () => {
      setPage(1);

      setSearch(
        searchInput.trim()
      );
    };

  /*
   * ====================================================
   * RESET FILTERS
   * ====================================================
   */

  const resetFilters =
    () => {
      setSearchInput("");

      setSearch("");

      setStatus("ALL");

      setPriority("ALL");

      setCategory("ALL");

      setPage(1);
    };

  /*
   * ====================================================
   * REFRESH
   * ====================================================
   */

  const refresh =
    async () => {
      await Promise.all([
        fetchStats(),
        fetchTickets(),
      ]);

      if (
        selectedTicketId
      ) {
        await openTicket(
          selectedTicketId
        );
      }
    };

  /*
   * ====================================================
   * RENDER
   * ====================================================
   */

  return (
    <div className="relative space-y-6">
      {/* ==================================================
          ERROR
          ================================================== */}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <AlertCircle
              size={17}
              className="shrink-0 text-white/50"
            />

            <span className="truncate text-sm text-white/60">
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="shrink-0 text-white/30 transition hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ==================================================
          STATS
          ================================================== */}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard
          label="Total"
          value={
            statsLoading
              ? 0
              : stats.total
          }
        />

        <StatCard
          label="Open"
          value={
            statsLoading
              ? 0
              : stats.open
          }
        />

        <StatCard
          label="In Progress"
          value={
            statsLoading
              ? 0
              : stats.inProgress
          }
        />

        <StatCard
          label="Waiting"
          value={
            statsLoading
              ? 0
              : stats.waitingForUser
          }
        />

        <StatCard
          label="Resolved"
          value={
            statsLoading
              ? 0
              : stats.resolved
          }
        />

        <StatCard
          label="Closed"
          value={
            statsLoading
              ? 0
              : stats.closed
          }
        />

        <StatCard
          label="Urgent"
          value={
            statsLoading
              ? 0
              : stats.urgent
          }
        />

        <StatCard
          label="Unassigned"
          value={
            statsLoading
              ? 0
              : stats.unassigned
          }
        />
      </div>

      {/* ==================================================
          FILTER BAR
          ================================================== */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          {/* SEARCH */}

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3">
            <Search
              size={16}
              className="shrink-0 text-white/25"
            />

            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  submitSearch();
                }
              }}
              placeholder="Search tickets, subjects, users..."
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput(
                    ""
                  );

                  setSearch("");

                  setPage(1);
                }}
                className="text-white/20 hover:text-white/60"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={
              submitSearch
            }
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Search
          </button>

          {/* STATUS */}

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value
              );

              setPage(1);
            }}
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white/60 outline-none"
          >
            {STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-black"
                >
                  {option ===
                  "ALL"
                    ? "All Status"
                    : statusLabel(
                        option
                      )}
                </option>
              )
            )}
          </select>

          {/* PRIORITY */}

          <select
            value={priority}
            onChange={(event) => {
              setPriority(
                event.target.value
              );

              setPage(1);
            }}
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white/60 outline-none"
          >
            {PRIORITY_OPTIONS.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-black"
                >
                  {option ===
                  "ALL"
                    ? "All Priority"
                    : statusLabel(
                        option
                      )}
                </option>
              )
            )}
          </select>

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(event) => {
              setCategory(
                event.target.value
              );

              setPage(1);
            }}
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white/60 outline-none"
          >
            {CATEGORY_OPTIONS.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                  className="bg-black"
                >
                  {option ===
                  "ALL"
                    ? "All Categories"
                    : statusLabel(
                        option
                      )}
                </option>
              )
            )}
          </select>

          {/* RESET */}

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <Filter size={15} />

            Reset
          </button>

          {/* REFRESH */}

          <button
            type="button"
            onClick={
              refresh
            }
            disabled={loading}
            className="flex h-10 items-center justify-center rounded-xl border border-white/10 px-3 text-white/40 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      {/* ==================================================
          TICKET LIST
          ================================================== */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Ticket
                  size={16}
                  className="text-white/40"
                />

                <h2 className="text-sm font-semibold text-white/80">
                  Support Tickets
                </h2>
              </div>

              <p className="mt-1 text-xs text-white/25">
                {total} ticket
                {total === 1
                  ? ""
                  : "s"}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2
              size={24}
              className="animate-spin text-white/30"
            />
          </div>
        ) : tickets.length ===
          0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <MessageCircle
              size={28}
              className="text-white/15"
            />

            <div className="mt-4 text-sm text-white/40">
              No support tickets
              found
            </div>

            <div className="mt-1 text-xs text-white/20">
              Try changing your
              filters or search.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map(
              (ticket) => (
                <button
                  key={
                    ticket._id
                  }
                  type="button"
                  onClick={() =>
                    openTicket(
                      ticket._id
                    )
                  }
                  className="group block w-full text-left transition hover:bg-white/[0.035]"
                >
                  <div className="flex items-start gap-4 px-5 py-5">
                    {/* ICON */}

                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <MessageCircle
                        size={16}
                        className="text-white/35 transition group-hover:text-white/70"
                      />
                    </div>

                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-white/30">
                          {
                            ticket.ticketNumber
                          }
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(
                            ticket.status
                          )}`}
                        >
                          {statusLabel(
                            ticket.status
                          )}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityClass(
                            ticket.priority
                          )}`}
                        >
                          {statusLabel(
                            ticket.priority
                          )}
                        </span>
                      </div>

                      <div className="mt-2 truncate text-sm font-medium text-white/80">
                        {
                          ticket.subject
                        }
                      </div>

                      <div className="mt-1 line-clamp-1 text-xs text-white/30">
                        {
                          ticket.description
                        }
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/25">
                        <span className="flex items-center gap-1.5">
                          <UserRound
                            size={12}
                          />

                          {ticket.user
                            ?.name ||
                            "Unknown user"}
                        </span>

                        <span>
                          {ticket.category
                            ? statusLabel(
                                ticket.category
                              )
                            : "Other"}
                        </span>

                        <span className="flex items-center gap-1.5">
                          <Clock3
                            size={12}
                          />

                          {formatShortDate(
                            ticket.createdAt
                          )}
                        </span>

                        <span>
                          {ticket.assignedTo
                            ? `Assigned to ${ticket.assignedTo.name}`
                            : "Unassigned"}
                        </span>
                      </div>
                    </div>

                    {/* ARROW */}

                    <ChevronRight
                      size={17}
                      className="mt-2 shrink-0 text-white/15 transition group-hover:translate-x-0.5 group-hover:text-white/50"
                    />
                  </div>
                </button>
              )
            )}
          </div>
        )}

        {/* ==================================================
            PAGINATION
            ================================================== */}

        {!loading &&
          tickets.length >
            0 && (
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
              <div className="text-xs text-white/25">
                Page{" "}
                <span className="text-white/50">
                  {page}
                </span>{" "}
                of{" "}
                <span className="text-white/50">
                  {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    page <= 1 ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          current - 1,
                          1
                        )
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft
                    size={16}
                  />
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                      totalPages ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          current + 1,
                          totalPages
                        )
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight
                    size={16}
                  />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ==================================================
          OFF-CANVAS DRAWER
          ================================================== */}

      {selectedTicketId && (
        <div className="fixed inset-0 z-[100]">
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close support ticket"
            onClick={
              closeDetail
            }
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* ==================================================
              DRAWER
              ================================================== */}

          <aside
            className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-white/10 bg-[#090909] shadow-2xl sm:w-[50vw] sm:min-w-[520px] lg:w-[52vw] xl:w-[48vw]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* ==================================================
                DRAWER HEADER
                ================================================== */}

            <div className="shrink-0 border-b border-white/10 bg-[#0b0b0b]">
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tracking-wide text-white/30">
                      {selectedTicket
                        ?.ticketNumber ||
                        "Loading..."}
                    </span>

                    {selectedTicket && (
                      <>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${statusClass(
                            selectedTicket.status
                          )}`}
                        >
                          {statusLabel(
                            selectedTicket.status
                          )}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${priorityClass(
                            selectedTicket.priority
                          )}`}
                        >
                          {statusLabel(
                            selectedTicket.priority
                          )}
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="mt-2 truncate text-base font-semibold text-white">
                    {selectedTicket
                      ?.subject ||
                      "Loading ticket..."}
                  </h2>

                  {selectedTicket?.user && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-white/35">
                      <UserRound
                        size={12}
                      />

                      <span>
                        {
                          selectedTicket
                            .user
                            .name
                        }
                      </span>

                      <span className="text-white/15">
                        •
                      </span>

                      <span>
                        {
                          selectedTicket
                            .user
                            .email
                        }
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={
                    closeDetail
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/35 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>

              {/* ==================================================
                  TICKET CONTROLS
                  ================================================== */}

              {selectedTicket && (
                <div className="grid grid-cols-3 gap-2 px-5 pb-4">
                  {/* STATUS */}

                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/25">
                      Status
                    </label>

                    <select
                      value={
                        selectedTicket.status
                      }
                      disabled={
                        updating
                      }
                      onChange={(
                        event
                      ) =>
                        updateTicket(
                          "status",
                          event
                            .target
                            .value
                        )
                      }
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-white/60 outline-none"
                    >
                      {STATUS_OPTIONS.filter(
                        (value) =>
                          value !==
                          "ALL"
                      ).map(
                        (
                          value
                        ) => (
                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                            className="bg-black"
                          >
                            {statusLabel(
                              value
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* PRIORITY */}

                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/25">
                      Priority
                    </label>

                    <select
                      value={
                        selectedTicket.priority
                      }
                      disabled={
                        updating
                      }
                      onChange={(
                        event
                      ) =>
                        updateTicket(
                          "priority",
                          event
                            .target
                            .value
                        )
                      }
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-white/60 outline-none"
                    >
                      {PRIORITY_OPTIONS.filter(
                        (value) =>
                          value !==
                          "ALL"
                      ).map(
                        (
                          value
                        ) => (
                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                            className="bg-black"
                          >
                            {statusLabel(
                              value
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* CATEGORY */}

                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-white/25">
                      Category
                    </label>

                    <select
                      value={
                        selectedTicket.category
                      }
                      disabled={
                        updating
                      }
                      onChange={(
                        event
                      ) =>
                        updateTicket(
                          "category",
                          event
                            .target
                            .value
                        )
                      }
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-white/60 outline-none"
                    >
                      {CATEGORY_OPTIONS.filter(
                        (value) =>
                          value !==
                          "ALL"
                      ).map(
                        (
                          value
                        ) => (
                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                            className="bg-black"
                          >
                            {statusLabel(
                              value
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* ==================================================
                DRAWER BODY
                ================================================== */}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Loader2
                      size={24}
                      className="mx-auto animate-spin text-white/25"
                    />

                    <p className="mt-3 text-xs text-white/25">
                      Loading conversation...
                    </p>
                  </div>
                </div>
              ) : selectedTicket ? (
                <div className="flex min-h-full flex-col">
                  {/* ==================================================
                      TICKET INFO
                      ================================================== */}

                  <div className="border-b border-white/5 px-5 py-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-white/25">
                        Ticket Description
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/55">
                        {
                          selectedTicket.description
                        }
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-white/20">
                            Created
                          </div>

                          <div className="mt-1 text-white/45">
                            {formatDate(
                              selectedTicket.createdAt
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-white/20">
                            Assigned
                          </div>

                          <div className="mt-1 text-white/45">
                            {selectedTicket
                              .assignedTo
                              ?.name ||
                              "Unassigned"}
                          </div>
                        </div>

                        {selectedTicket.lastRepliedAt && (
                          <div>
                            <div className="text-white/20">
                              Last Reply
                            </div>

                            <div className="mt-1 text-white/45">
                              {formatDate(
                                selectedTicket.lastRepliedAt
                              )}
                            </div>
                          </div>
                        )}

                        {selectedTicket.resolvedAt && (
                          <div>
                            <div className="text-white/20">
                              Resolved
                            </div>

                            <div className="mt-1 text-white/45">
                              {formatDate(
                                selectedTicket.resolvedAt
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      CONVERSATION
                      ================================================== */}

                  <div className="flex-1 px-5 py-5">
                    <div className="mb-4 flex items-center gap-2">
                      <MessageCircle
                        size={15}
                        className="text-white/30"
                      />

                      <span className="text-xs font-medium text-white/45">
                        Conversation
                      </span>

                      <span className="text-[10px] text-white/20">
                        {messages.length}{" "}
                        message
                        {messages.length ===
                        1
                          ? ""
                          : "s"}
                      </span>
                    </div>

                    {messages.length ===
                    0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                        <MessageCircle
                          size={22}
                          className="mx-auto text-white/15"
                        />

                        <p className="mt-3 text-xs text-white/25">
                          No messages yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(
                          (
                            message
                          ) => {
                            const isAdmin =
                              message.senderType ===
                              "ADMIN";

                            const isSystem =
                              message.senderType ===
                              "SYSTEM";

                            return (
                              <div
                                key={
                                  message._id
                                }
                                className={`flex ${
                                  isAdmin
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[88%] ${
                                    message.internalNote
                                      ? "w-[92%]"
                                      : ""
                                  }`}
                                >
                                  {/* INTERNAL NOTE */}

                                  {message.internalNote && (
                                    <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-yellow-500/60">
                                      <AlertCircle
                                        size={
                                          11
                                        }
                                      />

                                      Internal
                                      Note
                                    </div>
                                  )}

                                  <div
                                    className={`rounded-2xl border px-4 py-3 ${
                                      message.internalNote
                                        ? "border-yellow-500/20 bg-yellow-500/[0.05]"
                                        : isAdmin
                                          ? "border-white/10 bg-white/[0.06]"
                                          : isSystem
                                            ? "border-white/10 bg-white/[0.025]"
                                            : "border-white/10 bg-black/20"
                                    }`}
                                  >
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-medium text-white/45">
                                          {message
                                            .sender
                                            ?.name ||
                                            (isSystem
                                              ? "System"
                                              : "Unknown")}
                                        </span>

                                        <span className="text-[10px] text-white/15">
                                          {isAdmin
                                            ? "Support"
                                            : "User"}
                                        </span>
                                      </div>

                                      <span className="shrink-0 text-[10px] text-white/20">
                                        {formatDate(
                                          message.createdAt
                                        )}
                                      </span>
                                    </div>

                                    <p className="whitespace-pre-wrap text-sm leading-6 text-white/65">
                                      {
                                        message.message
                                      }
                                    </p>

                                    {/* ATTACHMENTS */}

                                    {message
                                      .attachments
                                      ?.length >
                                      0 && (
                                      <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                                        {message.attachments.map(
                                          (
                                            attachment,
                                            index
                                          ) => (
                                            <a
                                              key={`${message._id}-${index}`}
                                              href={
                                                attachment.url
                                              }
                                              target="_blank"
                                              rel="noreferrer"
                                              className="block rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/45 transition hover:bg-white/5 hover:text-white"
                                            >
                                              {
                                                attachment.name
                                              }
                                            </a>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}

                        <div
                          ref={
                            messagesEndRef
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* ==================================================
                REPLY AREA
                ================================================== */}

            {selectedTicket &&
              selectedTicket.status !==
                "CLOSED" && (
                <div className="shrink-0 border-t border-white/10 bg-[#0b0b0b] p-4">
                  {/* MODE */}

                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.025] p-1">
                      <button
                        type="button"
                        onClick={() =>
                          setInternalNote(
                            false
                          )
                        }
                        className={`rounded-md px-3 py-1.5 text-[11px] transition ${
                          !internalNote
                            ? "bg-white/10 text-white"
                            : "text-white/30 hover:text-white/60"
                        }`}
                      >
                        Reply
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setInternalNote(
                            true
                          )
                        }
                        className={`rounded-md px-3 py-1.5 text-[11px] transition ${
                          internalNote
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "text-white/30 hover:text-white/60"
                        }`}
                      >
                        Internal Note
                      </button>
                    </div>

                    <span className="text-[10px] text-white/20">
                      {reply.length}/10000
                    </span>
                  </div>

                  {/* TEXTAREA */}

                  <div
                    className={`rounded-xl border ${
                      internalNote
                        ? "border-yellow-500/20 bg-yellow-500/[0.025]"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <textarea
                      value={reply}
                      onChange={(event) =>
                        setReply(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                            "Enter" &&
                          (event.ctrlKey ||
                            event.metaKey)
                        ) {
                          event.preventDefault();

                          sendMessage();
                        }
                      }}
                      maxLength={
                        10000
                      }
                      rows={4}
                      placeholder={
                        internalNote
                          ? "Write an internal note for the support team..."
                          : "Write a reply to the user..."
                      }
                      className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/20"
                    />

                    <div className="flex items-center justify-between border-t border-white/5 px-3 py-2">
                      <div className="text-[10px] text-white/20">
                        Ctrl + Enter
                        to send
                      </div>

                      <button
                        type="button"
                        onClick={
                          sendMessage
                        }
                        disabled={
                          !reply.trim() ||
                          sending
                        }
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${
                          internalNote
                            ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/15"
                            : "bg-white text-black hover:bg-white/90"
                        } disabled:cursor-not-allowed disabled:opacity-30`}
                      >
                        {sending ? (
                          <Loader2
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <Send
                            size={13}
                          />
                        )}

                        {sending
                          ? "Sending..."
                          : internalNote
                            ? "Add Note"
                            : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* CLOSED */}

            {selectedTicket &&
              selectedTicket.status ===
                "CLOSED" && (
                <div className="shrink-0 border-t border-white/10 bg-[#0b0b0b] px-5 py-4">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
                    <CheckCircle2
                      size={17}
                      className="text-green-400/60"
                    />

                    <div>
                      <div className="text-xs font-medium text-white/50">
                        Ticket closed
                      </div>

                      <div className="mt-0.5 text-[10px] text-white/25">
                        This ticket cannot
                        receive new replies.
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </aside>
        </div>
      )}
    </div>
  );
}