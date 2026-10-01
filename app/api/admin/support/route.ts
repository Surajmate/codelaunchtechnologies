import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";

import SupportTicket from "@/models/SupportTicket";

/*
 * ======================================================
 * ADMIN SUPPORT TICKETS API
 * ======================================================
 *
 * GET
 * /api/admin/support
 *
 * Query parameters:
 *
 * page
 * limit
 * search
 * status
 * priority
 * category
 *
 * Examples:
 *
 * /api/admin/support
 *
 * /api/admin/support?page=1&limit=20
 *
 * /api/admin/support?status=OPEN
 *
 * /api/admin/support?priority=URGENT
 *
 * /api/admin/support?category=TECHNICAL
 *
 * /api/admin/support?search=login
 *
 * ======================================================
 */

export async function GET(
  request: Request
) {
  try {
    console.log(
      "[ADMIN SUPPORT] GET started"
    );

    /*
     * ======================================================
     * ADMIN AUTHENTICATION
     * ======================================================
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ======================================================
     * QUERY PARAMETERS
     * ======================================================
     */

    const { searchParams } =
      new URL(request.url);

    /*
     * ------------------------------------------------------
     * PAGE
     * ------------------------------------------------------
     */

    const pageParam =
      Number(
        searchParams.get(
          "page"
        ) || 1
      );

    const page =
      Number.isFinite(
        pageParam
      ) &&
      pageParam > 0
        ? Math.floor(
            pageParam
          )
        : 1;

    /*
     * ------------------------------------------------------
     * LIMIT
     * ------------------------------------------------------
     */

    const limitParam =
      Number(
        searchParams.get(
          "limit"
        ) || 20
      );

    const limit =
      Number.isFinite(
        limitParam
      ) &&
      limitParam > 0
        ? Math.min(
            Math.floor(
              limitParam
            ),
            100
          )
        : 20;

    /*
     * ------------------------------------------------------
     * SEARCH
     * ------------------------------------------------------
     */

    const search =
      searchParams
        .get("search")
        ?.trim();

    /*
     * ------------------------------------------------------
     * FILTERS
     * ------------------------------------------------------
     */

    const status =
      searchParams
        .get("status")
        ?.trim()
        .toUpperCase();

    const priority =
      searchParams
        .get("priority")
        ?.trim()
        .toUpperCase();

    const category =
      searchParams
        .get("category")
        ?.trim()
        .toUpperCase();

    /*
     * ======================================================
     * VALIDATION
     * ======================================================
     */

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "WAITING_FOR_USER",
      "RESOLVED",
      "CLOSED",
    ];

    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

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
    ];

    /*
     * ------------------------------------------------------
     * STATUS VALIDATION
     * ------------------------------------------------------
     */

    if (
      status &&
      !allowedStatuses.includes(
        status
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
     * ------------------------------------------------------
     * PRIORITY VALIDATION
     * ------------------------------------------------------
     */

    if (
      priority &&
      !allowedPriorities.includes(
        priority
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
     * ------------------------------------------------------
     * CATEGORY VALIDATION
     * ------------------------------------------------------
     */

    if (
      category &&
      !allowedCategories.includes(
        category
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
     * ======================================================
     * DATABASE
     * ======================================================
     */

    await connectDB();

    /*
     * ======================================================
     * BUILD FILTER
     * ======================================================
     */

    const filter: Record<
      string,
      unknown
    > = {};

    /*
     * ------------------------------------------------------
     * STATUS
     * ------------------------------------------------------
     */

    if (status) {
      filter.status =
        status;
    }

    /*
     * ------------------------------------------------------
     * PRIORITY
     * ------------------------------------------------------
     */

    if (priority) {
      filter.priority =
        priority;
    }

    /*
     * ------------------------------------------------------
     * CATEGORY
     * ------------------------------------------------------
     */

    if (category) {
      filter.category =
        category;
    }

    /*
     * ------------------------------------------------------
     * SEARCH
     * ------------------------------------------------------
     *
     * Search:
     *
     * ticket number
     * subject
     * description
     *
     * ------------------------------------------------------
     */

    if (search) {
      const escapedSearch =
        search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const regex =
        new RegExp(
          escapedSearch,
          "i"
        );

      filter.$or = [
        {
          ticketNumber:
            regex,
        },
        {
          subject:
            regex,
        },
        {
          description:
            regex,
        },
      ];
    }

    /*
     * ======================================================
     * PAGINATION
     * ======================================================
     */

    const skip =
      (page - 1) *
      limit;

    /*
     * ======================================================
     * LOAD TICKETS
     * ======================================================
     */

    const [
      tickets,
      total,
    ] =
      await Promise.all([
        SupportTicket.find(
          filter
        )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)

          /*
           * User information
           */

          .populate({
            path: "user",
            select:
              "_id name email role",
          })

          /*
           * Assigned admin
           */

          .populate({
            path: "assignedTo",
            select:
              "_id name email role",
          })

          /*
           * Last person who replied
           */

          .populate({
            path:
              "lastRepliedBy",
            select:
              "_id name email role",
          })

          .lean(),

        SupportTicket.countDocuments(
          filter
        ),
      ]);

    /*
     * ======================================================
     * SANITIZE TICKETS
     * ======================================================
     */

    const safeTickets =
      tickets.map(
        (ticket: any) => {
          return {
            _id:
              String(
                ticket._id
              ),

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

            user:
              ticket.user
                ? {
                    _id:
                      String(
                        ticket
                          .user
                          ._id
                      ),

                    name:
                      ticket
                        .user
                        .name ||
                      "",

                    email:
                      ticket
                        .user
                        .email ||
                      "",

                    role:
                      ticket
                        .user
                        .role ||
                      "",
                  }
                : null,

            assignedTo:
              ticket.assignedTo
                ? {
                    _id:
                      String(
                        ticket
                          .assignedTo
                          ._id
                      ),

                    name:
                      ticket
                        .assignedTo
                        .name ||
                      "",

                    email:
                      ticket
                        .assignedTo
                        .email ||
                      "",

                    role:
                      ticket
                        .assignedTo
                        .role ||
                      "",
                  }
                : null,

            lastRepliedBy:
              ticket
                .lastRepliedBy
                ? {
                    _id:
                      String(
                        ticket
                          .lastRepliedBy
                          ._id
                      ),

                    name:
                      ticket
                        .lastRepliedBy
                        .name ||
                      "",

                    email:
                      ticket
                        .lastRepliedBy
                        .email ||
                      "",

                    role:
                      ticket
                        .lastRepliedBy
                        .role ||
                      "",
                  }
                : null,

            lastRepliedAt:
              ticket.lastRepliedAt ||
              null,

            resolvedAt:
              ticket.resolvedAt ||
              null,

            closedAt:
              ticket.closedAt ||
              null,

            createdAt:
              ticket.createdAt,

            updatedAt:
              ticket.updatedAt,
          };
        }
      );

    /*
     * ======================================================
     * PAGINATION
     * ======================================================
     */

    const totalPages =
      Math.ceil(
        total / limit
      );

    /*
     * ======================================================
     * RESPONSE
     * ======================================================
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
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },

      filters: {
        search:
          search || "",

        status:
          status || "",

        priority:
          priority || "",

        category:
          category || "",
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN SUPPORT] ERROR:",
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