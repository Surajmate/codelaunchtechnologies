"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";


/*
 * ======================================================
 * TYPES
 * ======================================================
 */

interface User {
  _id: string;
  name: string;
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
  sender: User;
  senderType: "USER" | "ADMIN" | "SYSTEM";
  message: string;
  attachments?: Attachment[];
  internalNote?: boolean;
  readByUser?: boolean;
  readByAdmin?: boolean;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;

  user?: User;

  assignedTo?: User | null;

  lastRepliedBy?: User | null;
  lastRepliedAt?: string | null;

  resolvedAt?: string | null;
  closedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

interface TicketResponse {
  success: boolean;
  ticket?: SupportTicket;
  messages?: SupportMessage[];
  message?: string;
}

interface MessageResponse {
  success: boolean;
  message?: string;
  data?: SupportMessage;
  ticket?: SupportTicket;
}


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

function formatDateTime(
  value: string
) {
  try {
    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

function formatFileSize(
  size = 0
) {
  if (!size) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


/*
 * ======================================================
 * COMPONENT
 * ======================================================
 */

export default function TicketClient({
  ticketId,
}: {
  ticketId: string;
}) {
  /*
   * ------------------------------------------------------
   * STATE
   * ------------------------------------------------------
   */

  const [
    ticket,
    setTicket,
  ] = useState<SupportTicket | null>(
    null
  );

  const [
    messages,
    setMessages,
  ] = useState<SupportMessage[]>(
    []
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    closing,
    setClosing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    sendError,
    setSendError,
  ] = useState("");

  const [
    sendSuccess,
    setSendSuccess,
  ] = useState("");


  /*
   * ------------------------------------------------------
   * LOAD TICKET
   * ------------------------------------------------------
   *
   * Expected endpoint:
   *
   * GET /api/support/[id]
   *
   * ------------------------------------------------------
   */

  const loadTicket =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `/api/support/${ticketId}`,
              {
                method: "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data: TicketResponse =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load support ticket."
            );
          }

          setTicket(
            data.ticket ||
              null
          );

          setMessages(
            data.messages ||
              []
          );
        } catch (
          loadError
        ) {
          console.error(
            "[SUPPORT TICKET] LOAD ERROR:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load support ticket."
          );
        } finally {
          setLoading(false);
        }
      },
      [ticketId]
    );


  /*
   * ------------------------------------------------------
   * INITIAL LOAD
   * ------------------------------------------------------
   */

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);


  /*
   * ------------------------------------------------------
   * SEND MESSAGE
   * ------------------------------------------------------
   *
   * Expected endpoint:
   *
   * POST /api/support/[id]/messages
   *
   * ------------------------------------------------------
   */

  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanMessage =
      message.trim();

    if (!cleanMessage) {
      return;
    }

    if (
      cleanMessage.length >
      10000
    ) {
      setSendError(
        "Message cannot exceed 10,000 characters."
      );

      return;
    }

    setSendError("");
    setSendSuccess("");

    try {
      setSending(true);

      const response =
        await fetch(
          `/api/support/${ticketId}/messages`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify({
              message:
                cleanMessage,
            }),
          }
        );

      const data: MessageResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to send message."
        );
      }

      /*
       * Add message immediately if API
       * returned it.
       */

      if (data.data) {
        setMessages(
          (current) => [
            ...current,
            data.data!,
          ]
        );
      } else {
        /*
         * Otherwise reload the ticket.
         */

        await loadTicket();
      }

      setMessage("");

      /*
       * Ticket may have automatically
       * changed to WAITING_FOR_ADMIN /
       * IN_PROGRESS depending on API logic.
       */

      if (data.ticket) {
        setTicket(
          data.ticket
        );
      }

      setSendSuccess(
        "Message sent."
      );

      setTimeout(() => {
        setSendSuccess("");
      }, 2500);
    } catch (
      messageError
    ) {
      console.error(
        "[SUPPORT TICKET] SEND ERROR:",
        messageError
      );

      setSendError(
        messageError instanceof
          Error
          ? messageError.message
          : "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  }


  /*
   * ------------------------------------------------------
   * CLOSE TICKET
   * ------------------------------------------------------
   *
   * Expected endpoint:
   *
   * PATCH /api/support/[id]
   *
   * body:
   *
   * {
   *   status: "CLOSED"
   * }
   *
   * ------------------------------------------------------
   */

  async function handleCloseTicket() {
    if (!ticket) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to close this ticket?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setClosing(true);
      setError("");

      const response =
        await fetch(
          `/api/support/${ticketId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify({
              status:
                "CLOSED",
            }),
          }
        );

      const data: TicketResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to close ticket."
        );
      }

      if (data.ticket) {
        setTicket(
          data.ticket
        );
      } else {
        await loadTicket();
      }
    } catch (
      closeError
    ) {
      console.error(
        "[SUPPORT TICKET] CLOSE ERROR:",
        closeError
      );

      setError(
        closeError instanceof
          Error
          ? closeError.message
          : "Unable to close ticket."
      );
    } finally {
      setClosing(false);
    }
  }


  /*
   * ------------------------------------------------------
   * LOADING
   * ------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="space-y-6">

        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="h-5 w-64 animate-pulse rounded bg-white/10" />

          <div className="mt-4 h-4 w-40 animate-pulse rounded bg-white/5" />

          <div className="mt-8 h-32 animate-pulse rounded-xl bg-white/5" />

        </div>

      </div>
    );
  }


  /*
   * ------------------------------------------------------
   * ERROR / NOT FOUND
   * ------------------------------------------------------
   */

  if (
    error ||
    !ticket
  ) {
    return (
      <div className="space-y-6">

        <Link
          href="/support"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"
        >
          ← Back to Support
        </Link>

        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-6 py-14 text-center">

          <div className="text-lg font-semibold">
            Unable to load ticket
          </div>

          <p className="mt-2 text-sm text-white/35">
            {error ||
              "The support ticket could not be found."}
          </p>

          <button
            type="button"
            onClick={
              loadTicket
            }
            className="mt-6 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }


  /*
   * ------------------------------------------------------
   * CLOSED STATE
   * ------------------------------------------------------
   */

  const isClosed =
    ticket.status ===
    "CLOSED";

  const isResolved =
    ticket.status ===
    "RESOLVED";


  /*
   * ------------------------------------------------------
   * RENDER
   * ------------------------------------------------------
   */

  return (
    <div className="space-y-6">

      {/* ==================================================
          BACK
          ================================================== */}

      <div className="flex items-center justify-between">

        <Link
          href="/support"
          className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
        >
          ← Back to Support
        </Link>

        {!isClosed && (
          <button
            type="button"
            disabled={
              closing
            }
            onClick={
              handleCloseTicket
            }
            className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/40 transition hover:border-red-400/20 hover:bg-red-400/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {closing
              ? "Closing..."
              : "Close Ticket"}
          </button>
        )}

      </div>


      {/* ==================================================
          TICKET HEADER
          ================================================== */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

          <div className="min-w-0">

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

            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              {
                ticket.subject
              }
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/35">

              <span>
                {
                  formatCategory(
                    ticket.category
                  )
                }
              </span>

              <span>
                Priority:
                {" "}
                <span
                  className={
                    priorityClass(
                      ticket.priority
                    )
                  }
                >
                  {
                    ticket.priority
                  }
                </span>
              </span>

              <span>
                Created{" "}
                {formatDateTime(
                  ticket.createdAt
                )}
              </span>

            </div>

          </div>


          {/* Assigned */}

          <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 lg:min-w-[190px]">

            <div className="text-[10px] uppercase tracking-[0.15em] text-white/25">
              Assigned To
            </div>

            <div className="mt-2 text-sm text-white/70">
              {ticket.assignedTo
                ?.name ||
                "Support Team"}
            </div>

            {ticket.assignedTo
              ?.email && (
              <div className="mt-1 truncate text-xs text-white/25">
                {
                  ticket
                    .assignedTo
                    .email
                }
              </div>
            )}

          </div>

        </div>

      </div>


      {/* ==================================================
          DESCRIPTION
          ================================================== */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

        <div className="text-xs uppercase tracking-[0.15em] text-white/25">
          Original Request
        </div>

        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/65">
          {
            ticket.description
          }
        </div>

      </div>


      {/* ==================================================
          CONVERSATION
          ================================================== */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

        <div className="border-b border-white/10 px-6 py-4">

          <div className="text-sm font-medium">
            Conversation
          </div>

          <div className="mt-1 text-xs text-white/30">
            Messages between you and the support team
          </div>

        </div>


        {/* Messages */}

        <div className="space-y-5 p-6">

          {messages.length ===
          0 ? (
            <div className="py-10 text-center">

              <div className="text-sm text-white/40">
                No messages yet
              </div>

              <p className="mt-1 text-xs text-white/25">
                Send a message to start the conversation.
              </p>

            </div>
          ) : (
            messages
              .filter(
                (
                  item
                ) =>
                  !item.internalNote
              )
              .map(
                (
                  item
                ) => {

                  const isUser =
                    item.senderType ===
                    "USER";

                  const isSystem =
                    item.senderType ===
                    "SYSTEM";

                  if (
                    isSystem
                  ) {
                    return (
                      <div
                        key={
                          item._id
                        }
                        className="flex justify-center"
                      >
                        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/35">
                          {
                            item.message
                          }
                        </div>
                      </div>
                    );
                  }

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
                        className={`max-w-[85%] sm:max-w-[75%] ${
                          isUser
                            ? "items-end"
                            : "items-start"
                        }`}
                      >

                        {/* Sender */}

                        <div
                          className={`mb-2 flex items-center gap-2 text-[11px] text-white/30 ${
                            isUser
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >

                          <span>
                            {isUser
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
                            {formatDateTime(
                              item.createdAt
                            )}
                          </span>

                        </div>


                        {/* Message */}

                        <div
                          className={`rounded-2xl border px-4 py-3 ${
                            isUser
                              ? "border-white/15 bg-white/[0.08]"
                              : "border-white/10 bg-black/20"
                          }`}
                        >

                          <div className="whitespace-pre-wrap text-sm leading-6 text-white/75">
                            {
                              item.message
                            }
                          </div>


                          {/* Attachments */}

                          {item.attachments &&
                            item.attachments
                              .length >
                              0 && (
                              <div className="mt-4 space-y-2 border-t border-white/10 pt-3">

                                {item.attachments.map(
                                  (
                                    attachment,
                                    index
                                  ) => (
                                    <a
                                      key={`${attachment.name}-${index}`}
                                      href={
                                        attachment.url
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                                    >

                                      <div className="min-w-0">

                                        <div className="truncate text-xs text-white/60">
                                          {
                                            attachment.name
                                          }
                                        </div>

                                        {attachment.size ? (
                                          <div className="mt-0.5 text-[10px] text-white/25">
                                            {
                                              formatFileSize(
                                                attachment.size
                                              )
                                            }
                                          </div>
                                        ) : null}

                                      </div>

                                      <span className="shrink-0 text-xs text-white/30">
                                        Open
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
              )
          )}

        </div>


        {/* ==================================================
            REPLY FORM
            ================================================== */}

        {!isClosed && (
          <div className="border-t border-white/10 p-6">

            {sendError && (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {
                  sendError
                }
              </div>
            )}

            {sendSuccess && (
              <div className="mb-4 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-300">
                {
                  sendSuccess
                }
              </div>
            )}

            <form
              onSubmit={
                handleSendMessage
              }
            >

              <textarea
                value={
                  message
                }
                onChange={(
                  event
                ) =>
                  setMessage(
                    event.target
                      .value
                  )
                }
                disabled={
                  sending
                }
                maxLength={
                  10000
                }
                rows={5}
                placeholder="Write a reply to the support team..."
                className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div className="text-[11px] text-white/20">
                  {
                    message.length
                  }
                  /10000
                </div>

                <button
                  type="submit"
                  disabled={
                    sending ||
                    !message.trim()
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                      Sending...
                    </>
                  ) : (
                    "Send Reply"
                  )}
                </button>

              </div>

            </form>

          </div>
        )}

        {/* Closed */}

        {isClosed && (
          <div className="border-t border-white/10 px-6 py-5 text-center">

            <div className="text-sm text-white/40">
              This ticket is closed.
            </div>

            <p className="mt-1 text-xs text-white/25">
              Create a new ticket if you need additional
              assistance.
            </p>

            <Link
              href="/support/new"
              className="mt-4 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
            >
              Create New Ticket
            </Link>

          </div>
        )}

      </div>


      {/* ==================================================
          RESOLVED NOTICE
          ================================================== */}

      {isResolved && (
        <div className="rounded-2xl border border-green-400/20 bg-green-400/5 p-5">

          <div className="text-sm font-medium text-green-300">
            Your ticket has been resolved
          </div>

          <p className="mt-1 text-xs leading-5 text-white/35">
            If the issue is not resolved, you can reply
            above and let the support team know.
          </p>

        </div>
      )}

    </div>
  );
}