import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import SupportTicket from "@/models/SupportTicket";

const ALLOWED_CATEGORIES = [
  "ACCOUNT",
  "TECHNICAL",
  "COURSE",
  "QUIZ",
  "INTEGRATION",
  "PAYMENT",
  "BUG",
  "FEATURE_REQUEST",
  "OTHER",
] as const;

const ALLOWED_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

/*
 * ======================================================
 * GENERATE TICKET NUMBER
 * ======================================================
 *
 * Example:
 *
 * SUP-2026-000001
 * SUP-2026-000002
 *
 * ======================================================
 */

async function generateTicketNumber() {
  const year = new Date()
    .getFullYear();

  const prefix =
    `SUP-${year}-`;

  /*
   * Find the latest ticket for
   * the current year.
   */

  const latestTicket =
    await SupportTicket.findOne({
      ticketNumber: {
        $regex: `^${prefix}`,
      },
    })
      .sort({
        ticketNumber: -1,
      })
      .select("ticketNumber")
      .lean();

  let nextNumber = 1;

  if (
    latestTicket?.ticketNumber
  ) {
    const lastNumber =
      Number(
        latestTicket.ticketNumber
          .split("-")
          .pop()
      );

    if (
      Number.isFinite(
        lastNumber
      )
    ) {
      nextNumber =
        lastNumber + 1;
    }
  }

  return (
    `${prefix}` +
    String(nextNumber)
      .padStart(6, "0")
  );
}

/*
 * ======================================================
 * CREATE SUPPORT TICKET
 * ======================================================
 *
 * POST
 * /api/support/tickets
 *
 * Body:
 *
 * {
 *   "subject": "...",
 *   "description": "...",
 *   "category": "TECHNICAL",
 *   "priority": "MEDIUM"
 * }
 *
 * ======================================================
 */

export async function POST(
  request: Request
) {
  try {
    console.log(
      "[SUPPORT TICKET] CREATE started"
    );

    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * --------------------------------------------------
     * REQUEST BODY
     * --------------------------------------------------
     */

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body",
        },
        {
          status: 400,
        }
      );
    }

    const subject =
      typeof body.subject === "string"
        ? body.subject.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const category =
      typeof body.category === "string"
        ? body.category
            .trim()
            .toUpperCase()
        : "OTHER";

    const priority =
      typeof body.priority === "string"
        ? body.priority
            .trim()
            .toUpperCase()
        : "MEDIUM";

    /*
     * --------------------------------------------------
     * VALIDATION
     * --------------------------------------------------
     */

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Subject is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      subject.length >
      200
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Subject cannot exceed 200 characters",
        },
        {
          status: 400,
        }
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Description is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      description.length >
      10000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Description cannot exceed 10000 characters",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !ALLOWED_CATEGORIES.includes(
        category as any
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid support category",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !ALLOWED_PRIORITIES.includes(
        priority as any
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid support priority",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * DATABASE
     * --------------------------------------------------
     */

    await connectDB();

    /*
     * --------------------------------------------------
     * GENERATE TICKET NUMBER
     * --------------------------------------------------
     */

    const ticketNumber =
      await generateTicketNumber();

    /*
     * --------------------------------------------------
     * CREATE TICKET
     * --------------------------------------------------
     */

    const ticket =
      await SupportTicket.create({
        ticketNumber,

        user: user.id,

        subject,

        description,

        category,

        priority,

        status: "OPEN",

        assignedTo: null,

        lastRepliedBy: null,

        lastRepliedAt: null,

        resolvedAt: null,

        closedAt: null,
      });

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    console.log(
      "[SUPPORT TICKET] CREATED:",
      ticket.ticketNumber
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Support ticket created successfully",

        ticket: {
          _id:
            String(ticket._id),

          ticketNumber:
            ticket.ticketNumber,

          subject:
            ticket.subject,

          description:
            ticket.description,

          category:
            ticket.category,

          priority:
            ticket.priority,

          status:
            ticket.status,

          assignedTo:
            ticket.assignedTo
              ? String(
                  ticket.assignedTo
                )
              : null,

          createdAt:
            ticket.createdAt,

          updatedAt:
            ticket.updatedAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[SUPPORT TICKET] CREATE ERROR:",
      error
    );

    /*
     * Handle duplicate
     * ticket number.
     */

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as any).code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to generate a unique ticket number. Please try again.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to create support ticket",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}