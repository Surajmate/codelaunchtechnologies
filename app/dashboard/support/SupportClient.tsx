"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Ticket as TicketIcon,
  User,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

/*
 * ======================================================
 * TYPES
 * ======================================================
 */

interface AssignedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: AssignedUser | null;
  unreadCount: number;
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

interface MessageSender {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface SupportMessage {
  _id: string;
  ticket: string;
  sender: MessageSender | null;
  senderType: "USER" | "ADMIN" | "SYSTEM";
  message: string;
  attachments: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  }[];
  internalNote: boolean;
  readByUser: boolean;
  readByAdmin?: boolean;
  createdAt: string;
}

interface TicketDetail {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: AssignedUser | null;
  lastRepliedBy?: AssignedUser | null;
  lastRepliedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetailResponse {
  success: boolean;
  message?: string;
  ticket: TicketDetail;
  messages: SupportMessage[];
  messageCount?: number;
}

/*
 * ======================================================
 * FILTERS
 * ======================================================
 */

const statuses = [
  "",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
];

const priorities = [
  "",
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const categories = [
  "",
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

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString(
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

function formatMessageDate(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function statusClass(
  status: string
) {
  switch (status) {
    case "OPEN":
      return "bg-blue-500/10 text-blue-400";

    case "IN_PROGRESS":
      return "bg-yellow-500/10 text-yellow-400";

    case "WAITING_FOR_USER":
      return "bg-purple-500/10 text-purple-400";

    case "RESOLVED":
      return "bg-green-500/10 text-green-400";

    case "CLOSED":
      return "bg-white/5 text-white/40";

    default:
      return "bg-white/5 text-white/50";
  }
}

function priorityClass(
  priority: string
) {
  switch (priority) {
    case "URGENT":
      return "bg-red-500/10 text-red-400";

    case "HIGH":
      return "bg-orange-500/10 text-orange-400";

    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-400";

    case "LOW":
      return "bg-green-500/10 text-green-400";

    default:
      return "bg-white/5 text-white/40";
  }
}

/*
 * ======================================================
 * COMPONENT
 * ======================================================
 */

export default function SupportClient() {
  /*
   * ====================================================
   * TICKETS
   * ====================================================
   */

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 15,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ====================================================
   * FILTERS
   * ====================================================
   */

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [priority, setPriority] =
    useState("");

  const [category, setCategory] =
    useState("");

  /*
   * ====================================================
   * CREATE TICKET
   * ====================================================
   */

  const [showCreate, setShowCreate] =
    useState(false);

  const [subject, setSubject] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [newCategory, setNewCategory] =
    useState("OTHER");

  const [newPriority, setNewPriority] =
    useState("MEDIUM");

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  /*
   * ====================================================
   * OFFCANVAS
   * ====================================================
   */

  const [selectedTicketId, setSelectedTicketId] =
    useState<string | null>(null);

  const [selectedTicket, setSelectedTicket] =
    useState<TicketDetail | null>(null);

  const [messages, setMessages] =
    useState<SupportMessage[]>([]);

  const [loadingConversation, setLoadingConversation] =
    useState(false);

  const [conversationError, setConversationError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * ====================================================
   * LOAD TICKETS
   * ====================================================
   */

  async function loadTickets(
    page = 1
  ) {
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
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        console.error(
          "[SUPPORT] API ERROR",
          {
            status:
              response.status,
            statusText:
              response.statusText,
            response: result,
          }
        );

        throw new Error(
          result?.message ||
            result?.error ||
            `Unable to load support tickets (${response.status})`
        );
      }

      if (!result.success) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to load support tickets"
        );
      }

      setTickets(
        result.tickets || []
      );

      setPagination(
        result.pagination
      );
    } catch (err) {
      console.error(
        "[SUPPORT] LOAD TICKETS ERROR:",
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
  }

  useEffect(() => {
    loadTickets(1);
  }, [
    status,
    priority,
    category,
  ]);

  /*
   * ====================================================
   * OPEN CONVERSATION
   * ====================================================
   */

  async function openConversation(
    ticketId: string
  ) {
    setSelectedTicketId(
      ticketId
    );

    setSelectedTicket(null);
    setMessages([]);
    setConversationError("");
    setMessage("");
    setLoadingConversation(true);

    try {
      /*
       * Use the existing user-side
       * ticket detail API.
       *
       * GET
       * /api/support/[id]
       */

      const response =
        await fetch(
          `/api/support/${ticketId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const result =
        (await response.json()) as
          TicketDetailResponse;

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to load support ticket"
        );
      }

      if (!result.success) {
        throw new Error(
          result?.message ||
            "Unable to load support ticket"
        );
      }

      setSelectedTicket(
        result.ticket
      );

      setMessages(
        result.messages || []
      );

      /*
       * Remove unread badge
       * immediately from the list.
       */

      setTickets(
        (current) =>
          current.map(
            (ticket) =>
              ticket._id ===
              ticketId
                ? {
                    ...ticket,
                    unreadCount: 0,
                  }
                : ticket
          )
      );
    } catch (err) {
      console.error(
        "[SUPPORT] OPEN CONVERSATION ERROR:",
        err
      );

      setConversationError(
        err instanceof Error
          ? err.message
          : "Unable to load support ticket"
      );
    } finally {
      setLoadingConversation(
        false
      );
    }
  }

  /*
   * ====================================================
   * CLOSE OFFCANVAS
   * ====================================================
   */

  function closeConversation() {
    setSelectedTicketId(null);
    setSelectedTicket(null);
    setMessages([]);
    setConversationError("");
    setMessage("");
  }

  /*
   * ====================================================
   * SEND MESSAGE
   * ====================================================
   */

  async function sendMessage() {
    if (
      !selectedTicketId ||
      !message.trim() ||
      sending
    ) {
      return;
    }

    const text =
      message.trim();

    try {
      setSending(true);
      setConversationError("");

      /*
       * Existing endpoint:
       *
       * POST
       * /api/support/[id]/messages
       */

      const response =
        await fetch(
          `/api/support/${selectedTicketId}/messages`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              message: text,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Unable to send message (${response.status})`
        );
      }

      if (!result.success) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to send message"
        );
      }

      /*
       * API returns:
       *
       * {
       *   success: true,
       *   data: {...}
       * }
       */

      if (result.data) {
        setMessages(
          (current) => [
            ...current,
            result.data,
          ]
        );
      } else {
        /*
         * Fallback:
         * reload conversation.
         */

        await reloadConversation(
          selectedTicketId
        );
      }

      setMessage("");

      /*
       * Update ticket list preview.
       */

      setTickets(
        (current) =>
          current.map(
            (ticket) =>
              ticket._id ===
              selectedTicketId
                ? {
                    ...ticket,
                    updatedAt:
                      new Date().toISOString(),
                    unreadCount: 0,
                  }
                : ticket
          )
      );
    } catch (err) {
      console.error(
        "[SUPPORT] SEND MESSAGE ERROR:",
        err
      );

      setConversationError(
        err instanceof Error
          ? err.message
          : "Unable to send message"
      );
    } finally {
      setSending(false);
    }
  }

  /*
   * ====================================================
   * RELOAD CONVERSATION
   * ====================================================
   */

  async function reloadConversation(
    ticketId?: string
  ) {
    const id =
      ticketId ||
      selectedTicketId;

    if (!id) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/support/${id}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to refresh conversation"
        );
      }

      if (!result.success) {
        throw new Error(
          result?.message ||
            "Unable to refresh conversation"
        );
      }

      setSelectedTicket(
        result.ticket
      );

      setMessages(
        result.messages || []
      );
    } catch (err) {
      console.error(
        "[SUPPORT] REFRESH ERROR:",
        err
      );

      setConversationError(
        err instanceof Error
          ? err.message
          : "Unable to refresh conversation"
      );
    }
  }

  /*
   * ====================================================
   * AUTO SCROLL
   * ====================================================
   */

  useEffect(() => {
    if (!selectedTicketId) {
      return;
    }

    const timeout =
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView(
          {
            behavior: "smooth",
          }
        );
      }, 50);

    return () =>
      clearTimeout(timeout);
  }, [
    messages,
    selectedTicketId,
  ]);

  /*
   * ====================================================
   * ESCAPE KEY
   * ====================================================
   */

  useEffect(() => {
    if (!selectedTicketId) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        closeConversation();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [
    selectedTicketId,
  ]);

  /*
   * ====================================================
   * CREATE TICKET
   * ====================================================
   */

  async function createTicket() {
    try {
      setCreating(true);
      setCreateError("");

      if (!subject.trim()) {
        setCreateError(
          "Subject is required"
        );
        return;
      }

      if (!description.trim()) {
        setCreateError(
          "Description is required"
        );
        return;
      }

      const response =
        await fetch(
          "/api/support",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              subject:
                subject.trim(),

              description:
                description.trim(),

              category:
                newCategory,

              priority:
                newPriority,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to create ticket"
        );
      }

      if (!result.success) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to create ticket"
        );
      }

      const createdTicketId =
        result?.ticket?._id;

      setShowCreate(false);

      setSubject("");
      setDescription("");
      setNewCategory("OTHER");
      setNewPriority("MEDIUM");

      await loadTickets(1);

      /*
       * Automatically open the newly
       * created ticket in the offcanvas.
       */

      if (createdTicketId) {
        await openConversation(
          createdTicketId
        );
      }
    } catch (err) {
      console.error(
        "[SUPPORT] CREATE TICKET ERROR:",
        err
      );

      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create ticket"
      );
    } finally {
      setCreating(false);
    }
  }

  /*
   * ====================================================
   * KEYBOARD SEND
   * ====================================================
   */

  function handleMessageKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  }

  /*
   * ====================================================
   * PAGE
   * ====================================================
   */

  return (
    <>
      <div className="space-y-6">
        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/30">
              Support
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Help & Support
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Create and manage your support
              requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateError("");
              setShowCreate(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <Plus size={16} />
            New Ticket
          </button>
        </div>

        {/* ==================================================
            FILTERS
            ================================================== */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    loadTickets(1);
                  }
                }}
                placeholder="Search tickets..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
              />
            </div>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            >
              {statuses.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-black"
                  >
                    {item
                      ? formatLabel(
                          item
                        )
                      : "All Statuses"}
                  </option>
                )
              )}
            </select>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value
                )
              }
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            >
              {priorities.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-black"
                  >
                    {item
                      ? formatLabel(
                          item
                        )
                      : "All Priorities"}
                  </option>
                )
              )}
            </select>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            >
              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                    className="bg-black"
                  >
                    {item
                      ? formatLabel(
                          item
                        )
                      : "All Categories"}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* ==================================================
            ERROR
            ================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <div>
              <div className="font-medium">
                Unable to load tickets
              </div>

              <div className="mt-1 text-red-400/70">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            TICKETS
            ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2
                size={22}
                className="mx-auto animate-spin text-white/30"
              />

              <p className="mt-3 text-sm text-white/40">
                Loading support tickets...
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <TicketIcon
                  size={24}
                  className="text-white/30"
                />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No support tickets
              </h3>

              <p className="mt-2 text-sm text-white/40">
                You haven't created any
                support tickets yet.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(true)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
              >
                <Plus size={16} />
                Create your first ticket
              </button>
            </div>
          ) : (
            <div>
              {tickets.map(
                (ticket) => (
                  <button
                    key={ticket._id}
                    type="button"
                    onClick={() =>
                      openConversation(
                        ticket._id
                      )
                    }
                    className="group block w-full border-b border-white/5 p-5 text-left transition hover:bg-white/[0.035] last:border-b-0"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-white/30">
                            {
                              ticket.ticketNumber
                            }
                          </span>

                          {ticket.unreadCount >
                            0 && (
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400">
                              {
                                ticket.unreadCount
                              }{" "}
                              new
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-white">
                            {
                              ticket.subject
                            }
                          </h3>

                          <MessageCircle
                            size={15}
                            className="shrink-0 text-white/20 transition group-hover:text-white/50"
                          />
                        </div>

                        <p className="mt-1 line-clamp-1 text-sm text-white/40">
                          {
                            ticket.description
                          }
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${priorityClass(
                            ticket.priority
                          )}`}
                        >
                          {formatLabel(
                            ticket.priority
                          )}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                            ticket.status
                          )}`}
                        >
                          {formatLabel(
                            ticket.status
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/25">
                      <span>
                        {formatLabel(
                          ticket.category
                        )}
                      </span>

                      <span>
                        {formatDate(
                          ticket.createdAt
                        )}
                      </span>

                      {ticket.assignedTo && (
                        <span>
                          Assigned to{" "}
                          {
                            ticket
                              .assignedTo
                              .name
                          }
                        </span>
                      )}

                      <span className="ml-auto hidden text-white/20 transition group-hover:text-white/50 sm:block">
                        Open conversation →
                      </span>
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* ==================================================
            PAGINATION
            ================================================== */}

        {!loading &&
          pagination.totalPages >
            0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/30">
                Page{" "}
                {pagination.page}{" "}
                of{" "}
                {
                  pagination.totalPages
                }
              </div>

              <div className="flex gap-2">
                <button
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    loadTickets(
                      pagination.page -
                        1
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft
                    size={15}
                  />
                  Previous
                </button>

                <button
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    loadTickets(
                      pagination.page +
                        1
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Next
                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ====================================================
          CREATE TICKET MODAL
          ==================================================== */}

      {showCreate && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreate(false);
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f18] shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/25">
                  Support
                </div>

                <h2 className="mt-1 text-xl font-semibold">
                  Create Support Ticket
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Tell us what you need
                  help with.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {createError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {createError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Subject
                </label>

                <input
                  value={subject}
                  onChange={(event) =>
                    setSubject(
                      event.target.value
                    )
                  }
                  maxLength={200}
                  placeholder="What do you need help with?"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                />

                <div className="mt-1 text-right text-[10px] text-white/20">
                  {subject.length}/200
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  maxLength={10000}
                  rows={6}
                  placeholder="Describe your issue in detail..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                />

                <div className="mt-1 text-right text-[10px] text-white/20">
                  {
                    description.length
                  }
                  /10000
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Category
                  </label>

                  <select
                    value={
                      newCategory
                    }
                    onChange={(
                      event
                    ) =>
                      setNewCategory(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                  >
                    {categories
                      .filter(
                        Boolean
                      )
                      .map(
                        (item) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                            className="bg-black"
                          >
                            {formatLabel(
                              item
                            )}
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Priority
                  </label>

                  <select
                    value={
                      newPriority
                    }
                    onChange={(
                      event
                    ) =>
                      setNewPriority(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                  >
                    {priorities
                      .filter(
                        Boolean
                      )
                      .map(
                        (item) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                            className="bg-black"
                          >
                            {formatLabel(
                              item
                            )}
                          </option>
                        )
                      )}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-5">
              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                disabled={creating}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  createTicket
                }
                disabled={
                  creating
                }
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus
                      size={16}
                    />
                    Create Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          BACKDROP
          ==================================================== */}

      {selectedTicketId && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]"
          onClick={
            closeConversation
          }
        />
      )}

      {/* ====================================================
          CONVERSATION OFFCANVAS
          ==================================================== */}

      <aside
        className={`fixed right-0 top-0 z-[90] flex h-screen w-full flex-col border-l border-white/10 bg-[#080a12] shadow-2xl transition-transform duration-300 ease-out sm:w-[75vw] lg:w-[52vw] xl:w-[48vw] ${
          selectedTicketId
            ? "translate-x-0"
            : "translate-x-full"
        }`}
        aria-hidden={
          !selectedTicketId
        }
      >
        {/* ==================================================
            PANEL HEADER
            ================================================== */}

        <div className="shrink-0 border-b border-white/10 bg-[#080a12]/95 px-5 py-4 backdrop-blur">
          {loadingConversation ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={
                  closeConversation
                }
                className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft
                  size={18}
                />
              </button>

              <div>
                <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-5 w-52 animate-pulse rounded bg-white/10" />
              </div>

              <Loader2
                size={18}
                className="ml-auto animate-spin text-white/30"
              />
            </div>
          ) : selectedTicket ? (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-white/30">
                      {
                        selectedTicket.ticketNumber
                      }
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass(
                        selectedTicket.status
                      )}`}
                    >
                      {formatLabel(
                        selectedTicket.status
                      )}
                    </span>
                  </div>

                  <h2 className="mt-2 truncate text-lg font-semibold">
                    {
                      selectedTicket.subject
                    }
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/30">
                    <span>
                      {formatLabel(
                        selectedTicket.category
                      )}
                    </span>

                    <span>
                      •
                    </span>

                    <span
                      className={
                        priorityClass(
                          selectedTicket.priority
                        )
                      }
                    >
                      {formatLabel(
                        selectedTicket.priority
                      )}
                    </span>

                    <span>
                      •
                    </span>

                    <span>
                      {formatDate(
                        selectedTicket.createdAt
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    closeConversation
                  }
                  className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close conversation"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* ==================================================
            PANEL CONTENT
            ================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingConversation ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center">
                <Loader2
                  size={28}
                  className="mx-auto animate-spin text-white/30"
                />

                <p className="mt-4 text-sm text-white/40">
                  Loading conversation...
                </p>
              </div>
            </div>
          ) : conversationError ? (
            <div className="p-5">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 text-red-400"
                  />

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-red-300">
                      Unable to load conversation
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-red-400/70">
                      {
                        conversationError
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        reloadConversation()
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                    >
                      <RefreshCw
                        size={13}
                      />
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedTicket ? (
            <div className="p-5">
              {/* ==================================================
                  TICKET INFO
                  ================================================== */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/25">
                  <FileText
                    size={14}
                  />
                  Ticket Description
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/65">
                  {
                    selectedTicket.description
                  }
                </p>
              </div>

              {/* ==================================================
                  CONVERSATION
                  ================================================== */}

              <div className="mt-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">
                      Conversation
                    </h3>

                    <p className="mt-1 text-xs text-white/30">
                      Messages between you
                      and support.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      reloadConversation()
                    }
                    className="rounded-lg border border-white/10 p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
                    title="Refresh conversation"
                  >
                    <RefreshCw
                      size={14}
                    />
                  </button>
                </div>

                {messages.length ===
                0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                    <MessageCircle
                      size={24}
                      className="mx-auto text-white/20"
                    />

                    <p className="mt-3 text-sm text-white/40">
                      No messages yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(
                      (
                        item
                      ) => {
                        const isUser =
                          item.senderType ===
                          "USER";

                        const isSystem =
                          item.senderType ===
                          "SYSTEM";

                        return (
                          <div
                            key={
                              item._id
                            }
                            className={`flex ${
                              isUser
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[88%] ${
                                isUser
                                  ? "items-end"
                                  : "items-start"
                              }`}
                            >
                              {/* SENDER */}

                              <div
                                className={`mb-1.5 flex items-center gap-2 text-[10px] text-white/25 ${
                                  isUser
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                {!isUser &&
                                  !isSystem && (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                                      <User
                                        size={
                                          10
                                        }
                                      />
                                    </div>
                                  )}

                                <span>
                                  {isSystem
                                    ? "System"
                                    : isUser
                                      ? "You"
                                      : item
                                          .sender
                                          ?.name ||
                                        "Support"}
                                </span>

                                <span>
                                  •
                                </span>

                                <span>
                                  {formatMessageDate(
                                    item.createdAt
                                  )}
                                </span>
                              </div>

                              {/* MESSAGE */}

                              <div
                                className={`rounded-2xl px-4 py-3 ${
                                  isUser
                                    ? "rounded-br-md bg-white text-black"
                                    : isSystem
                                      ? "border border-white/10 bg-white/[0.03] text-white/50"
                                      : "rounded-bl-md border border-white/10 bg-white/[0.04] text-white/75"
                                }`}
                              >
                                <p
                                  className={`whitespace-pre-wrap break-words text-sm leading-6 ${
                                    isUser
                                      ? "text-black"
                                      : "text-white/70"
                                  }`}
                                >
                                  {
                                    item.message
                                  }
                                </p>

                                {/* ATTACHMENTS */}

                                {item
                                  .attachments
                                  ?.length >
                                  0 && (
                                  <div className="mt-3 space-y-2 border-t border-black/10 pt-3">
                                    {item.attachments.map(
                                      (
                                        attachment,
                                        index
                                      ) => (
                                        <a
                                          key={`${attachment.url}-${index}`}
                                          href={
                                            attachment.url
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                                            isUser
                                              ? "bg-black/5 text-black/70 hover:bg-black/10"
                                              : "bg-white/5 text-white/50 hover:bg-white/10"
                                          }`}
                                        >
                                          <Paperclip
                                            size={
                                              13
                                            }
                                          />

                                          <span className="min-w-0 flex-1 truncate">
                                            {
                                              attachment.name
                                            }
                                          </span>
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
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <MessageCircle
                  size={30}
                  className="mx-auto text-white/20"
                />

                <p className="mt-4 text-sm text-white/40">
                  Select a ticket to
                  view the conversation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            COMPOSER
            ================================================== */}

        {selectedTicket &&
          !loadingConversation && (
            <div className="shrink-0 border-t border-white/10 bg-[#080a12] p-4">
              {conversationError && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  <span>
                    {
                      conversationError
                    }
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setConversationError(
                        ""
                      )
                    }
                    className="text-red-400/60 hover:text-red-400"
                  >
                    <X
                      size={14}
                    />
                  </button>
                </div>
              )}

              {selectedTicket.status ===
              "CLOSED" ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/30">
                  <CheckCircle2
                    size={15}
                  />
                  This ticket is
                  closed and cannot
                  receive new messages.
                </div>
              ) : (
                <>
                  <div className="relative rounded-2xl border border-white/10 bg-white/[0.025] focus-within:border-white/20">
                    <textarea
                      value={message}
                      onChange={(event) =>
                        setMessage(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={
                        handleMessageKeyDown
                      }
                      disabled={
                        sending
                      }
                      maxLength={
                        10000
                      }
                      rows={3}
                      placeholder="Write a message..."
                      className="w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={
                        sendMessage
                      }
                      disabled={
                        sending ||
                        !message.trim()
                      }
                      className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Send message"
                    >
                      {sending ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Send
                          size={15}
                        />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between px-1">
                    <span className="text-[10px] text-white/20">
                      Press Enter to
                      send • Shift +
                      Enter for new line
                    </span>

                    <span className="text-[10px] text-white/20">
                      {
                        message.length
                      }
                      /10000
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
      </aside>
    </>
  );
}