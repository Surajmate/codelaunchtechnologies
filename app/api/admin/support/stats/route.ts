import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";

import SupportTicket from "@/models/SupportTicket";

/*
 * ======================================================
 * ADMIN SUPPORT STATISTICS API
 * ======================================================
 *
 * GET
 * /api/admin/support/stats
 *
 * Returns:
 *
 * - total tickets
 * - open tickets
 * - in progress
 * - waiting for user
 * - resolved
 * - closed
 * - urgent tickets
 * - unassigned tickets
 *
 * ======================================================
 */

export async function GET(
  request: Request
) {
  try {
    console.log(
      "[ADMIN SUPPORT STATS] GET started"
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
     * DATABASE
     * ======================================================
     */

    await connectDB();

    /*
     * ======================================================
     * OPTIONAL DATE FILTER
     * ======================================================
     *
     * Supported:
     *
     * ?range=7
     * ?range=30
     * ?range=90
     *
     * If range is not provided, statistics are
     * calculated for all tickets.
     *
     * ======================================================
     */

    const { searchParams } =
      new URL(request.url);

    const rangeParam =
      Number(
        searchParams.get(
          "range"
        ) || 0
      );

    const allowedRanges = [
      7,
      30,
      90,
      365,
    ];

    const range =
      allowedRanges.includes(
        rangeParam
      )
        ? rangeParam
        : 0;

    /*
     * ======================================================
     * BUILD DATE FILTER
     * ======================================================
     */

    const dateFilter: Record<
      string,
      unknown
    > = {};

    if (range > 0) {
      const startDate =
        new Date();

      startDate.setDate(
        startDate.getDate() -
          (range - 1)
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      dateFilter.createdAt = {
        $gte:
          startDate,
      };
    }

    /*
     * ======================================================
     * TOTAL
     * ======================================================
     */

    const total =
      await SupportTicket.countDocuments(
        dateFilter
      );

    /*
     * ======================================================
     * STATUS COUNTS
     * ======================================================
     */

    const [
      open,
      inProgress,
      waitingForUser,
      resolved,
      closed,
      urgent,
      unassigned,
    ] =
      await Promise.all([
        /*
         * OPEN
         */

        SupportTicket.countDocuments({
          ...dateFilter,

          status:
            "OPEN",
        }),

        /*
         * IN PROGRESS
         */

        SupportTicket.countDocuments({
          ...dateFilter,

          status:
            "IN_PROGRESS",
        }),

        /*
         * WAITING FOR USER
         */

        SupportTicket.countDocuments({
          ...dateFilter,

          status:
            "WAITING_FOR_USER",
        }),

        /*
         * RESOLVED
         */

        SupportTicket.countDocuments({
          ...dateFilter,

          status:
            "RESOLVED",
        }),

        /*
         * CLOSED
         */

        SupportTicket.countDocuments({
          ...dateFilter,

          status:
            "CLOSED",
        }),

        /*
         * URGENT
         */

        SupportTicket.countDocuments({
          ...dateFilter,

          priority:
            "URGENT",

          status: {
            $nin: [
              "RESOLVED",
              "CLOSED",
            ],
          },
        }),

        /*
         * UNASSIGNED
         */

        SupportTicket.countDocuments({
          ...dateFilter,

          assignedTo:
            null,

          status: {
            $nin: [
              "RESOLVED",
              "CLOSED",
            ],
          },
        }),
      ]);

    /*
     * ======================================================
     * PRIORITY BREAKDOWN
     * ======================================================
     */

    const priorityBreakdown =
      await SupportTicket.aggregate([
        {
          $match:
            dateFilter,
        },

        {
          $group: {
            _id:
              "$priority",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);

    /*
     * ======================================================
     * CATEGORY BREAKDOWN
     * ======================================================
     */

    const categoryBreakdown =
      await SupportTicket.aggregate([
        {
          $match:
            dateFilter,
        },

        {
          $group: {
            _id:
              "$category",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);

    /*
     * ======================================================
     * STATUS BREAKDOWN
     * ======================================================
     */

    const statusBreakdown =
      await SupportTicket.aggregate([
        {
          $match:
            dateFilter,
        },

        {
          $group: {
            _id:
              "$status",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);

    /*
     * ======================================================
     * DAILY TICKET TREND
     * ======================================================
     *
     * Useful for the Support analytics chart.
     *
     * Always return the selected date range,
     * including days with zero tickets.
     *
     * ======================================================
     */

    const trendStartDate =
      new Date();

    const trendDays =
      range > 0
        ? range
        : 30;

    trendStartDate.setDate(
      trendStartDate.getDate() -
        (trendDays - 1)
    );

    trendStartDate.setHours(
      0,
      0,
      0,
      0
    );

    const trendEndDate =
      new Date();

    trendEndDate.setHours(
      23,
      59,
      59,
      999
    );

    const dailyTickets =
      await SupportTicket.aggregate([
        {
          $match: {
            createdAt: {
              $gte:
                trendStartDate,

              $lte:
                trendEndDate,
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format:
                  "%Y-%m-%d",

                date:
                  "$createdAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    /*
     * ======================================================
     * CREATE DATE SERIES
     * ======================================================
     */

    const dates: string[] =
      [];

    const cursor =
      new Date(
        trendStartDate
      );

    while (
      cursor <=
      trendEndDate
    ) {
      dates.push(
        cursor
          .toISOString()
          .split("T")[0]
      );

      cursor.setDate(
        cursor.getDate() +
          1
      );
    }

    /*
     * ======================================================
     * DAILY MAP
     * ======================================================
     */

    const dailyMap =
      new Map<
        string,
        number
      >();

    for (
      const item of dailyTickets
    ) {
      dailyMap.set(
        String(
          item._id
        ),
        Number(
          item.count || 0
        )
      );
    }

    /*
     * ======================================================
     * FINAL TREND
     * ======================================================
     */

    const trend =
      dates.map(
        (date) => ({
          date,

          tickets:
            dailyMap.get(
              date
            ) || 0,
        })
      );

    /*
     * ======================================================
     * RESPONSE
     * ======================================================
     */

    return NextResponse.json({
      success: true,

      range:
        range > 0
          ? range
          : "all",

      stats: {
        total,

        open,

        inProgress,

        waitingForUser,

        resolved,

        closed,

        urgent,

        unassigned,
      },

      breakdown: {
        priority:
          priorityBreakdown.map(
            (item) => ({
              name:
                item._id,

              count:
                Number(
                  item.count ||
                    0
                ),
            })
          ),

        category:
          categoryBreakdown.map(
            (item) => ({
              name:
                item._id,

              count:
                Number(
                  item.count ||
                    0
                ),
            })
          ),

        status:
          statusBreakdown.map(
            (item) => ({
              name:
                item._id,

              count:
                Number(
                  item.count ||
                    0
                ),
            })
          ),
      },

      trend,
    });
  } catch (error) {
    console.error(
      "[ADMIN SUPPORT STATS] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load support statistics",

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