"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";


/*
 * ======================================================
 * TYPES
 * ======================================================
 */

interface CreateTicketResponse {
  success: boolean;

  message?: string;

  ticket?: {
    _id: string;

    ticketNumber: string;

    subject: string;

    description: string;

    category: string;

    priority: string;

    status: string;

    createdAt: string;

    updatedAt: string;
  };
}


/*
 * ======================================================
 * OPTIONS
 * ======================================================
 */

const CATEGORY_OPTIONS = [
  {
    value: "ACCOUNT",
    label: "Account",
    description:
      "Login, profile, account access or settings",
  },

  {
    value: "TECHNICAL",
    label: "Technical",
    description:
      "Technical problems or platform issues",
  },

  {
    value: "COURSE",
    label: "Course",
    description:
      "Course content, access or progress",
  },

  {
    value: "QUIZ",
    label: "Quiz",
    description:
      "Quiz or assessment related issues",
  },

  {
    value: "INTEGRATION",
    label: "Integration",
    description:
      "API, integration or connection issues",
  },

  {
    value: "PAYMENT",
    label: "Payment",
    description:
      "Payment or billing related issues",
  },

  {
    value: "BUG",
    label: "Bug",
    description:
      "Something is not working as expected",
  },

  {
    value: "FEATURE_REQUEST",
    label: "Feature Request",
    description:
      "Suggest a new feature or improvement",
  },

  {
    value: "OTHER",
    label: "Other",
    description:
      "Anything that doesn't fit the above categories",
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "LOW",
    label: "Low",
    description:
      "General question or non-urgent request",
  },

  {
    value: "MEDIUM",
    label: "Medium",
    description:
      "Normal support request",
  },

  {
    value: "HIGH",
    label: "High",
    description:
      "Important issue affecting your work",
  },

  {
    value: "URGENT",
    label: "Urgent",
    description:
      "Critical issue requiring immediate attention",
  },
];


/*
 * ======================================================
 * COMPONENT
 * ======================================================
 */

export default function NewSupportTicketClient() {
  const router =
    useRouter();

  /*
   * ------------------------------------------------------
   * FORM STATE
   * ------------------------------------------------------
   */

  const [
    subject,
    setSubject,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState(
    "OTHER"
  );

  const [
    priority,
    setPriority,
  ] = useState(
    "MEDIUM"
  );

  const [
    description,
    setDescription,
  ] = useState("");

  /*
   * ------------------------------------------------------
   * UI STATE
   * ------------------------------------------------------
   */

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");


  /*
   * ------------------------------------------------------
   * SUBMIT
   * ------------------------------------------------------
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Client-side validation
     */

    const cleanSubject =
      subject.trim();

    const cleanDescription =
      description.trim();

    if (!cleanSubject) {
      setError(
        "Please enter a subject."
      );

      return;
    }

    if (
      cleanSubject.length >
      200
    ) {
      setError(
        "Subject cannot exceed 200 characters."
      );

      return;
    }

    if (!cleanDescription) {
      setError(
        "Please describe your issue."
      );

      return;
    }

    if (
      cleanDescription.length >
      10000
    ) {
      setError(
        "Description cannot exceed 10,000 characters."
      );

      return;
    }

    try {
      setSubmitting(true);

      /*
       * --------------------------------------------------
       * API
       * --------------------------------------------------
       */

      const response =
        await fetch(
          "/api/support",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify({
              subject:
                cleanSubject,

              description:
                cleanDescription,

              category,

              priority,
            }),
          }
        );

      const data: CreateTicketResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to create support ticket."
        );
      }

      /*
       * --------------------------------------------------
       * SUCCESS
       * --------------------------------------------------
       */

      if (
        data.ticket?._id
      ) {
        setSuccess(
          `Ticket ${data.ticket.ticketNumber} created successfully.`
        );

        /*
         * Navigate to ticket after a short delay.
         */

        setTimeout(() => {
          router.push(
            `/support/${data.ticket?._id}`
          );

          router.refresh();
        }, 700);

        return;
      }

      setSuccess(
        "Support ticket created successfully."
      );
    } catch (
      submitError
    ) {
      console.error(
        "[NEW SUPPORT TICKET] ERROR:",
        submitError
      );

      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to create support ticket."
      );
    } finally {
      setSubmitting(false);
    }
  }


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

      <Link
        href="/support"
        className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
      >
        <span>
          ←
        </span>

        Back to Support
      </Link>


      {/* ==================================================
          FORM
          ================================================== */}

      <form
        onSubmit={
          handleSubmit
        }
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
      >

        {/* ==================================================
            ERROR
            ================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}


        {/* ==================================================
            SUCCESS
            ================================================== */}

        {success && (
          <div className="mb-6 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-300">
            {success}
          </div>
        )}


        {/* ==================================================
            SUBJECT
            ================================================== */}

        <div>

          <label
            htmlFor="subject"
            className="text-sm font-medium text-white"
          >
            Subject
          </label>

          <p className="mt-1 text-xs text-white/30">
            Briefly describe what you need help with.
          </p>

          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(event) =>
              setSubject(
                event.target
                  .value
              )
            }
            maxLength={200}
            placeholder="e.g. Unable to access my course"
            disabled={
              submitting
            }
            className="mt-3 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="mt-1 text-right text-[11px] text-white/20">
            {
              subject.length
            }
            /200
          </div>

        </div>


        {/* ==================================================
            CATEGORY
            ================================================== */}

        <div className="mt-7">

          <label className="text-sm font-medium text-white">
            Category
          </label>

          <p className="mt-1 text-xs text-white/30">
            Select the category that best describes your
            issue.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            {CATEGORY_OPTIONS.map(
              (option) => {
                const selected =
                  category ===
                  option.value;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    disabled={
                      submitting
                    }
                    onClick={() =>
                      setCategory(
                        option.value
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-white/30 bg-white/[0.08]"
                        : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.04]"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          selected
                            ? "border-white"
                            : "border-white/20"
                        }`}
                      >
                        {selected && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>

                      <span className="text-sm font-medium text-white">
                        {
                          option.label
                        }
                      </span>

                    </div>

                    <p className="mt-2 pl-7 text-xs leading-5 text-white/30">
                      {
                        option.description
                      }
                    </p>

                  </button>
                );
              }
            )}

          </div>

        </div>


        {/* ==================================================
            PRIORITY
            ================================================== */}

        <div className="mt-7">

          <label className="text-sm font-medium text-white">
            Priority
          </label>

          <p className="mt-1 text-xs text-white/30">
            How urgent is this issue?
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            {PRIORITY_OPTIONS.map(
              (option) => {
                const selected =
                  priority ===
                  option.value;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    disabled={
                      submitting
                    }
                    onClick={() =>
                      setPriority(
                        option.value
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-white/30 bg-white/[0.08]"
                        : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.04]"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >

                    <div className="flex items-center gap-3">

                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          selected
                            ? "border-white"
                            : "border-white/20"
                        }`}
                      >
                        {selected && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>

                      <span className="text-sm font-medium text-white">
                        {
                          option.label
                        }
                      </span>

                    </div>

                    <p className="mt-2 pl-7 text-xs leading-5 text-white/30">
                      {
                        option.description
                      }
                    </p>

                  </button>
                );
              }
            )}

          </div>

        </div>


        {/* ==================================================
            DESCRIPTION
            ================================================== */}

        <div className="mt-7">

          <label
            htmlFor="description"
            className="text-sm font-medium text-white"
          >
            Describe your issue
          </label>

          <p className="mt-1 text-xs text-white/30">
            Provide as much detail as possible so our
            support team can help you faster.
          </p>

          <textarea
            id="description"
            value={
              description
            }
            onChange={(event) =>
              setDescription(
                event.target
                  .value
              )
            }
            maxLength={10000}
            rows={8}
            placeholder="Describe what happened, what you expected, and any relevant details..."
            disabled={
              submitting
            }
            className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <div className="mt-1 text-right text-[11px] text-white/20">
            {
              description.length
            }
            /10000
          </div>

        </div>


        {/* ==================================================
            ACTIONS
            ================================================== */}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-end">

          <Link
            href="/support"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              submitting
            }
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                Creating Ticket...
              </>
            ) : (
              "Create Ticket"
            )}
          </button>

        </div>

      </form>


      {/* ==================================================
          INFO
          ================================================== */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

        <div className="text-sm font-medium text-white">
          What happens next?
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">

          <div>
            <div className="text-xs font-medium text-white/60">
              1. Ticket created
            </div>

            <p className="mt-1 text-xs leading-5 text-white/30">
              Your request is assigned a unique ticket
              number.
            </p>
          </div>

          <div>
            <div className="text-xs font-medium text-white/60">
              2. Support reviews
            </div>

            <p className="mt-1 text-xs leading-5 text-white/30">
              Our support team reviews your request and
              responds.
            </p>
          </div>

          <div>
            <div className="text-xs font-medium text-white/60">
              3. Stay updated
            </div>

            <p className="mt-1 text-xs leading-5 text-white/30">
              Continue the conversation from your ticket
              page.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}