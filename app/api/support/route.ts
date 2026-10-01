import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import SupportTicket from "@/models/SupportTicket";
import SupportMessage from "@/models/SupportMessage";

/*
 * ======================================================
 * SUPPORT API
 * ======================================================
 *
 * USER SIDE
 *
 * GET
 * /api/support
 *
 * Returns support tickets belonging to the
 * currently authenticated user.
 *
 *
 * POST
 * /api/support
 *
 * Creates a new support ticket.
 *
 * ======================================================
 */

const allowedStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
] as const;

const allowedPriorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

const allowedCategories = [
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

/*
 * ======================================================
 * GET SUPPORT TICKETS
 * ======================================================
 */

export async function GET(
  request: Request
) {
  try {
    console.log(
      "[SUPPORT] GET tickets started"
    );

    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "[SUPPORT] User:",
      currentUser.id,
      currentUser.email
    );

    /*
     * --------------------------------------------------
     * VALIDATE USER ID
     * --------------------------------------------------
     */

    if (
      !mongoose.Types.ObjectId.isValid(
        currentUser.id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid authenticated user",
        },
        {
          status: 401,
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
     * QUERY PARAMETERS
     * --------------------------------------------------
     */

    const {
      searchParams,
    } = new URL(request.url);

    const pageParam = Number(
      searchParams.get("page") || "1"
    );

    const limitParam = Number(
      searchParams.get("limit") || "15"
    );

    const page =
      Number.isFinite(pageParam) &&
      pageParam > 0
        ? Math.floor(pageParam)
        : 1;

    const limit =
      Number.isFinite(limitParam) &&
      limitParam > 0
        ? Math.min(
            Math.floor(limitParam),
            100
          )
        : 15;

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim()
        .toUpperCase() || "";

    const priority =
      searchParams
        .get("priority")
        ?.trim()
        .toUpperCase() || "";

    const category =
      searchParams
        .get("category")
        ?.trim()
        .toUpperCase() || "";

    /*
     * --------------------------------------------------
     * VALIDATE STATUS
     * --------------------------------------------------
     */

    if (
      status &&
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid status filter",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * VALIDATE PRIORITY
     * --------------------------------------------------
     */

    if (
      priority &&
      !allowedPriorities.includes(
        priority as (typeof allowedPriorities)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid priority filter",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * VALIDATE CATEGORY
     * --------------------------------------------------
     */

    if (
      category &&
      !allowedCategories.includes(
        category as (typeof allowedCategories)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid category filter",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * BUILD FILTER
     * --------------------------------------------------
     *
     * IMPORTANT:
     *
     * We intentionally DO NOT populate User here.
     *
     * The authenticated user ID is enough to retrieve
     * the user's tickets.
     *
     * This prevents the route from depending on the
     * User mongoose model being registered.
     *
     * --------------------------------------------------
     */

    const userId =
      new mongoose.Types.ObjectId(
        currentUser.id
      );

    const filter: Record<
      string,
      unknown
    > = {
      user: userId,
    };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (category) {
      filter.category = category;
    }

    /*
     * --------------------------------------------------
     * SEARCH
     * --------------------------------------------------
     */

    if (search) {
      filter.$or = [
        {
          ticketNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          subject: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /*
     * --------------------------------------------------
     * PAGINATION
     * --------------------------------------------------
     */

    const skip =
      (page - 1) * limit;

    /*
     * --------------------------------------------------
     * LOAD TICKETS
     * --------------------------------------------------
     *
     * NO User populate.
     *
     * This is intentional.
     *
     * --------------------------------------------------
     */

    const [
      tickets,
      total,
    ] = await Promise.all([
      SupportTicket.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      SupportTicket.countDocuments(
        filter
      ),
    ]);

    /*
     * --------------------------------------------------
     * MESSAGE COUNTS
     * --------------------------------------------------
     */

    const ticketIds =
      tickets.map(
        (ticket: any) =>
          ticket._id
      );

    const messageCounts =
      ticketIds.length
        ? await SupportMessage.aggregate([
            {
              $match: {
                ticket: {
                  $in: ticketIds,
                },

                /*
                 * Internal admin notes should not
                 * count as user conversation messages.
                 */
                internalNote: false,
              },
            },

            {
              $group: {
                _id: "$ticket",

                count: {
                  $sum: 1,
                },
              },
            },
          ])
        : [];

    /*
     * --------------------------------------------------
     * MESSAGE COUNT MAP
     * --------------------------------------------------
     */

    const messageCountMap =
      new Map<
        string,
        number
      >();

    messageCounts.forEach(
      (item: any) => {
        messageCountMap.set(
          String(item._id),
          item.count
        );
      }
    );

    /*
     * --------------------------------------------------
     * SANITIZE TICKETS
     * --------------------------------------------------
     */

    const safeTickets =
      tickets.map(
        (ticket: any) => ({
          ...ticket,

          _id: String(
            ticket._id
          ),

          user: String(
            ticket.user
          ),

          assignedTo:
            ticket.assignedTo
              ? String(
                  ticket.assignedTo
                )
              : null,

          lastRepliedBy:
            ticket.lastRepliedBy
              ? String(
                  ticket.lastRepliedBy
                )
              : null,

          messageCount:
            messageCountMap.get(
              String(ticket._id)
            ) || 0,
        })
      );

    /*
     * --------------------------------------------------
     * PAGINATION
     * --------------------------------------------------
     */

    const totalPages =
      Math.ceil(
        total / limit
      );

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      tickets:
        safeTickets,

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },

      filters: {
        search,
        status,
        priority,
        category,
      },
    });
  } catch (error) {
    console.error(
      "[SUPPORT] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load support tickets",

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

/*
 * ======================================================
 * CREATE SUPPORT TICKET
 * ======================================================
 */

export async function POST(
  request: Request
) {
  try {
    console.log(
      "[SUPPORT] POST ticket started"
    );

    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "[SUPPORT] Creating ticket for:",
      currentUser.id,
      currentUser.email
    );

    /*
     * --------------------------------------------------
     * VALIDATE USER ID
     * --------------------------------------------------
     */

    if (
      !mongoose.Types.ObjectId.isValid(
        currentUser.id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid authenticated user",
        },
        {
          status: 401,
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

    /*
     * --------------------------------------------------
     * READ BODY
     * --------------------------------------------------
     */

    const subject =
      typeof body.subject ===
      "string"
        ? body.subject.trim()
        : "";

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    const category =
      typeof body.category ===
      "string"
        ? body.category
            .trim()
            .toUpperCase()
        : "OTHER";

    const priority =
      typeof body.priority ===
      "string"
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
      subject.length > 200
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

    if (
      description.length > 10000
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
      !allowedCategories.includes(
        category as (typeof allowedCategories)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid category",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !allowedPriorities.includes(
        priority as (typeof allowedPriorities)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid priority",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * USER OBJECT ID
     * --------------------------------------------------
     */

    const userId =
      new mongoose.Types.ObjectId(
        currentUser.id
      );

    /*
     * --------------------------------------------------
     * GENERATE TICKET NUMBER
     * --------------------------------------------------
     */

    const year =
      new Date().getFullYear();

    const ticketCount =
      await SupportTicket.countDocuments(
        {
          ticketNumber: {
            $regex:
              `^SUP-${year}-`,
          },
        }
      );

    const ticketNumber =
      `SUP-${year}-${String(
        ticketCount + 1
      ).padStart(6, "0")}`;

    /*
     * --------------------------------------------------
     * CREATE TICKET
     * --------------------------------------------------
     */

    const ticket =
      await SupportTicket.create({
        ticketNumber,

        user: userId,

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

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      });

    console.log(
      "[SUPPORT] Ticket created:",
      ticket.ticketNumber
    );

    /*
     * --------------------------------------------------
     * CREATE FIRST MESSAGE
     * --------------------------------------------------
     *
     * The initial ticket description is also saved
     * as the first conversation message.
     *
     * --------------------------------------------------
     */

    await SupportMessage.create({
      ticket: ticket._id,

      sender: userId,

      senderType: "USER",

      message: description,

      attachments: [],

      internalNote: false,

      readByUser: true,

      readByAdmin: false,

      createdAt:
        new Date(),
    });

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     *
     * No User populate here either.
     *
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Support ticket created successfully",

        ticket: {
          _id: String(
            ticket._id
          ),

          ticketNumber:
            ticket.ticketNumber,

          user: String(
            ticket.user
          ),

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

          assignedTo: null,

          lastRepliedBy: null,

          lastRepliedAt: null,

          resolvedAt: null,

          closedAt: null,

          createdAt:
            ticket.createdAt,

          updatedAt:
            ticket.updatedAt,

          messageCount: 1,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[SUPPORT] POST ERROR:",
      error
    );

    /*
     * --------------------------------------------------
     * DUPLICATE TICKET NUMBER
     * --------------------------------------------------
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