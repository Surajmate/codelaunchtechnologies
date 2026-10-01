"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

/*
 * ======================================================
 * TYPES
 * ======================================================
 */

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

interface Attachment {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

interface SupportMessage {
  _id: string;
  ticket: string;
  sender: User | null;
  senderType: "USER" | "ADMIN" | "SYSTEM";
  message: string;
  attachments: Attachment[];
  internalNote: boolean;
  readByUser?: boolean;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;

  category:
    | "ACCOUNT"
    | "TECHNICAL"
    | "COURSE"
    | "QUIZ"
    | "INTEGRATION"
    | "PAYMENT"
    | "BUG"
    | "FEATURE_REQUEST"
    | "OTHER";

  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";

  status:
    | "OPEN"
    | "IN_PROGRESS"
    | "WAITING_FOR_USER"
    | "RESOLVED"
    | "CLOSED";

  assignedTo?: User | null;

  lastRepliedBy?: User | null;
  lastRepliedAt?: string | null;

  resolvedAt?: string | null;
  closedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
  ticket?: T;
  messages?: T;
}

/*
 * ======================================================
 * HELPERS
 * ======================================================
 */

function formatDate(date?: string | null) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) return "";

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function getCategoryLabel(category: string) {
  return category.replaceAll("_", " ");
}

/*
 * ======================================================
 * STATUS STYLES
 * ======================================================
 */

function getStatusClass(status: SupportTicket["status"]) {
  switch (status) {
    case "OPEN":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "IN_PROGRESS":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "WAITING_FOR_USER":
      return "border-orange-500/20 bg-orange-500/10 text-orange-400";

    case "RESOLVED":
      return "border-green-500/20 bg-green-500/10 text-green-400";

    case "CLOSED":
      return "border-gray-500/20 bg-gray-500/10 text-gray-400";

    default:
      return "border-white/10 bg-white/5 text-white/60";
  }
}

/*
 * ======================================================
 * PRIORITY STYLES
 * ======================================================
 */

function getPriorityClass(priority: SupportTicket["priority"]) {
  switch (priority) {
    case "LOW":
      return "border-white/10 bg-white/5 text-white/50";

    case "MEDIUM":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "HIGH":
      return "border-orange-500/20 bg-orange-500/10 text-orange-400";

    case "URGENT":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    default:
      return "border-white/10 bg-white/5 text-white/50";
  }
}

/*
 * ======================================================
 * COMPONENT
 * ======================================================
 */

export default function SupportTicketClient() {
  const params = useParams();

  const ticketId = useMemo(() => {
    const value = params?.id;

    if (Array.isArray(value)) {
      return value[0] || "";
    }

    return value ? String(value) : "";
  }, [params]);

  const [ticket, setTicket] =
    useState<SupportTicket | null>(null);

  const [messages, setMessages] =
    useState<SupportMessage[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [messagesLoading, setMessagesLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [messageError, setMessageError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /*
   * ====================================================
   * LOAD TICKET
   * ====================================================
   */

  const loadTicket = useCallback(async () => {
    if (!ticketId) {
      setError("Ticket ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/support/${encodeURIComponent(ticketId)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      let result: ApiResponse<SupportTicket> = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      console.log(
        "[USER SUPPORT] TICKET RESPONSE:",
        result
      );

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            result.error ||
            `Unable to load support ticket (${response.status})`
        );
      }

      const loadedTicket =
        result.ticket ||
        result.data;

      if (!loadedTicket) {
        throw new Error(
          "Support ticket data was not returned by the server."
        );
      }

      setTicket(
        loadedTicket as SupportTicket
      );
    } catch (err: any) {
      console.error(
        "[USER SUPPORT] LOAD TICKET ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to load support ticket"
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  /*
   * ====================================================
   * LOAD MESSAGES
   * ====================================================
   */

  const loadMessages = useCallback(async () => {
    if (!ticketId) {
      return;
    }

    try {
      setMessagesLoading(true);
      setMessageError("");

      const response = await fetch(
        `/api/support/${encodeURIComponent(
          ticketId
        )}/messages`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      let result: ApiResponse<SupportMessage[]> =
        {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      console.log(
        "[USER SUPPORT] MESSAGES RESPONSE:",
        result
      );

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            result.error ||
            `Unable to load messages (${response.status})`
        );
      }

      const loadedMessages =
        Array.isArray(result.messages)
          ? result.messages
          : Array.isArray(result.data)
          ? result.data
          : [];

      setMessages(
        loadedMessages as SupportMessage[]
      );
    } catch (err: any) {
      console.error(
        "[USER SUPPORT] LOAD MESSAGES ERROR:",
        err
      );

      setMessageError(
        err?.message ||
          "Unable to load messages"
      );
    } finally {
      setMessagesLoading(false);
    }
  }, [ticketId]);

  /*
   * ====================================================
   * INITIAL LOAD
   * ====================================================
   */

  useEffect(() => {
    if (!ticketId) {
      return;
    }

    loadTicket();
    loadMessages();
  }, [
    ticketId,
    loadTicket,
    loadMessages,
  ]);

  /*
   * ====================================================
   * SEND MESSAGE
   * ====================================================
   */

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!ticketId) {
      setMessageError(
        "Ticket ID is missing."
      );
      return;
    }

    const trimmedMessage =
      message.trim();

    if (!trimmedMessage) {
      setMessageError(
        "Please enter a message."
      );
      return;
    }

    if (trimmedMessage.length > 10000) {
      setMessageError(
        "Message cannot exceed 10000 characters."
      );
      return;
    }

    if (ticket?.status === "CLOSED") {
      setMessageError(
        "Cannot reply to a closed ticket."
      );
      return;
    }

    try {
      setSending(true);
      setMessageError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/support/${encodeURIComponent(
          ticketId
        )}/messages`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            message: trimmedMessage,
          }),
        }
      );

      let result: ApiResponse<SupportMessage> =
        {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      /*
       * IMPORTANT:
       *
       * Log complete server response.
       * This will make API errors much easier
       * to identify during development.
       */

      console.log(
        "[USER SUPPORT] SEND MESSAGE RESPONSE:",
        {
          status: response.status,
          ok: response.ok,
          result,
        }
      );

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            result.error ||
            `Unable to send message (${response.status})`
        );
      }

      /*
       * ------------------------------------------------
       * ADD RETURNED MESSAGE IMMEDIATELY
       * ------------------------------------------------
       */

      const sentMessage =
        result.data;

      if (sentMessage) {
        setMessages(
          (previous) => [
            ...previous,
            sentMessage as SupportMessage,
          ]
        );
      } else {
        /*
         * If the API does not return the created
         * message, reload messages.
         */

        await loadMessages();
      }

      /*
       * ------------------------------------------------
       * CLEAR INPUT
       * ------------------------------------------------
       */

      setMessage("");

      setSuccessMessage(
        result.message ||
          "Reply sent successfully."
      );

      /*
       * ------------------------------------------------
       * REFRESH TICKET
       *
       * Ticket status can change from:
       *
       * WAITING_FOR_USER
       * ->
       * IN_PROGRESS
       *
       * ------------------------------------------------
       */

      await loadTicket();

      /*
       * Remove success message after a short time.
       */

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      console.error(
        "[USER SUPPORT] SEND MESSAGE ERROR:",
        err
      );

      setMessageError(
        err?.message ||
          "Unable to send message"
      );
    } finally {
      setSending(false);
    }
  }

  /*
   * ====================================================
   * REFRESH
   * ====================================================
   */

  async function refreshConversation() {
    await Promise.all([
      loadTicket(),
      loadMessages(),
    ]);
  }

  /*
   * ====================================================
   * LOADING
   * ====================================================
   */

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/dashboard/support"
            className="text-sm text-white/40 transition hover:text-white"
          >
            ← Back to Support
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <div className="animate-pulse space-y-5">
            <div className="h-4 w-40 rounded bg-white/10" />

            <div className="h-8 w-2/3 rounded bg-white/10" />

            <div className="h-4 w-1/3 rounded bg-white/10" />

            <div className="h-24 rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  /*
   * ====================================================
   * TICKET LOAD ERROR
   * ====================================================
   */

  if (!ticket) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/dashboard/support"
            className="text-sm text-white/40 transition hover:text-white"
          >
            ← Back to Support
          </Link>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
          {error ||
            "Unable to load support ticket"}
        </div>

        <button
          type="button"
          onClick={loadTicket}
          className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  /*
   * ====================================================
   * MAIN UI
   * ====================================================
   */

  return (
    <div className="mx-auto max-w-5xl">
      {/* ================================================
          HEADER
      ================================================= */}

      <div className="mb-6">
        <Link
          href="/dashboard/support"
          className="text-sm text-white/40 transition hover:text-white"
        >
          ← Back to Support
        </Link>
      </div>

      {/* ================================================
          TICKET HEADER
      ================================================= */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-medium tracking-[0.15em] text-white/35">
              {ticket.ticketNumber}
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              {ticket.subject}
            </h1>

            <div className="mt-3 text-sm text-white/40">
              Created{" "}
              {formatDate(
                ticket.createdAt
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getPriorityClass(
                ticket.priority
              )}`}
            >
              {ticket.priority}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                ticket.status
              )}`}
            >
              {getStatusLabel(
                ticket.status
              )}
            </span>
          </div>
        </div>

        {/* ==============================================
            META
        ============================================== */}

        <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/30">
              Category
            </div>

            <div className="mt-1 text-sm text-white/70">
              {getCategoryLabel(
                ticket.category
              )}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-white/30">
              Priority
            </div>

            <div className="mt-1 text-sm text-white/70">
              {ticket.priority}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-white/30">
              Status
            </div>

            <div className="mt-1 text-sm text-white/70">
              {getStatusLabel(
                ticket.status
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================
          TICKET DESCRIPTION
      ================================================= */}

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="text-xs font-medium tracking-wider text-white/30">
          TICKET DESCRIPTION
        </div>

        <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/75">
          {ticket.description}
        </div>
      </div>

      {/* ================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ================================================
          SUCCESS
      ================================================= */}

      {successMessage && (
        <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
          {successMessage}
        </div>
      )}

      {/* ================================================
          CONVERSATION
      ================================================= */}

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Conversation
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Messages between you and support.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshConversation}
            disabled={
              messagesLoading ||
              sending
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {messagesLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* ==============================================
            MESSAGE ERROR
        ============================================== */}

        {messageError && (
          <div className="m-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {messageError}
          </div>
        )}

        {/* ==============================================
            MESSAGES
        ============================================== */}

        <div className="space-y-5 p-6">
          {messagesLoading ? (
            <>
              <div className="animate-pulse">
                <div className="h-20 w-3/4 rounded-2xl bg-white/5" />
              </div>

              <div className="flex justify-end">
                <div className="animate-pulse">
                  <div className="h-20 w-72 rounded-2xl bg-white/5" />
                </div>
              </div>
            </>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-sm text-white/40">
                No messages yet.
              </div>

              <div className="mt-1 text-xs text-white/25">
                Send a message below to contact
                support.
              </div>
            </div>
          ) : (
            messages.map((item) => {
              const isUser =
                item.senderType ===
                  "USER" ||
                item.sender?._id ===
                  ticket.user;

              return (
                <div
                  key={item._id}
                  className={`flex ${
                    isUser
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] ${
                      isUser
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    {/* Sender */}

                    <div
                      className={`mb-2 flex items-center gap-2 text-xs text-white/35 ${
                        isUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <span>
                        {isUser
                          ? "You"
                          : item.sender
                              ?.name ||
                            "Support"}
                      </span>

                      <span>
                        •
                      </span>

                      <span>
                        {formatDate(
                          item.createdAt
                        )}
                      </span>
                    </div>

                    {/* Message */}

                    <div
                      className={`rounded-2xl border px-4 py-3 ${
                        isUser
                          ? "border-blue-500/20 bg-blue-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white/75"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-6">
                        {item.message}
                      </div>

                      {/* Attachments */}

                      {item.attachments &&
                        item.attachments
                          .length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
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
                                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs transition hover:bg-white/10"
                                >
                                  <span className="truncate text-white/70">
                                    📎{" "}
                                    {
                                      attachment.name
                                    }
                                  </span>

                                  {attachment.size ? (
                                    <span className="ml-3 shrink-0 text-white/30">
                                      {formatFileSize(
                                        attachment.size
                                      )}
                                    </span>
                                  ) : null}
                                </a>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ==============================================
            REPLY BOX
        ============================================== */}

        <div className="border-t border-white/10 p-6">
          {ticket.status ===
          "CLOSED" ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-sm font-medium text-white/70">
                This ticket is closed.
              </div>

              <div className="mt-1 text-xs text-white/35">
                You cannot send additional
                messages to a closed ticket.
              </div>
            </div>
          ) : (
            <form
              onSubmit={sendMessage}
              className="space-y-3"
            >
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(
                    event.target.value
                  );

                  if (messageError) {
                    setMessageError("");
                  }
                }}
                placeholder="Write your message..."
                rows={5}
                maxLength={10000}
                disabled={sending}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 transition focus:border-white/20 focus:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-white/25">
                  {message.length.toLocaleString()}
                  /10,000 characters
                </div>

                <button
                  type="submit"
                  disabled={
                    sending ||
                    !message.trim()
                  }
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending
                    ? "Sending..."
                    : "Send Message"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}