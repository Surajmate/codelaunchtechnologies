import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";

import User from "@/models/User";
import Roadmap from "@/models/Roadmap";
import Lesson from "@/models/Lesson";
import Integration from "@/models/Integration";
import SupportTicket from "@/models/SupportTicket";

export async function GET() {
  try {
    console.log(
      "[ADMIN DASHBOARD] Starting request"
    );

    /*
     * ------------------------------------------------------
     * ADMIN AUTHENTICATION
     * ------------------------------------------------------
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    console.log(
      "[ADMIN DASHBOARD] Admin:",
      auth.user.email
    );

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    console.log(
      "[ADMIN DASHBOARD] Database connected"
    );

    /*
     * ------------------------------------------------------
     * PLATFORM COUNTS
     * ------------------------------------------------------
     */

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,

      totalRoadmaps,
      publishedRoadmaps,

      totalLessons,
      publishedLessons,

      totalIntegrations,
      activeIntegrations,
      inactiveIntegrations,
      integrationErrors,

      totalSupportTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
    ] = await Promise.all([
      /*
       * USERS
       */

      User.countDocuments({}),

      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        isActive: false,
      }),

      /*
       * ROADMAPS
       */

      Roadmap.countDocuments({}),

      Roadmap.countDocuments({
        published: true,
      }),

      /*
       * LESSONS
       */

      Lesson.countDocuments({}),

      Lesson.countDocuments({
        published: true,
      }),

      /*
       * INTEGRATIONS
       */

      Integration.countDocuments({}),

      Integration.countDocuments({
        status: "ACTIVE",
      }),

      Integration.countDocuments({
        status: "INACTIVE",
      }),

      Integration.countDocuments({
        status: "ERROR",
      }),

      /*
       * SUPPORT
       */

      SupportTicket.countDocuments({}),

      SupportTicket.countDocuments({
        status: "OPEN",
      }),

      SupportTicket.countDocuments({
        status: "IN_PROGRESS",
      }),

      SupportTicket.countDocuments({
        status: "RESOLVED",
      }),

      SupportTicket.countDocuments({
        status: "CLOSED",
      }),
    ]);

    /*
     * ------------------------------------------------------
     * RECENT USERS
     * ------------------------------------------------------
     */

    const recentUsers =
      await User.find({})
        .select(
          "_id name email role avatar isActive createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean();

    /*
     * ------------------------------------------------------
     * RECENT INTEGRATIONS
     * ------------------------------------------------------
     *
     * IMPORTANT:
     *
     * secret is deliberately NOT selected.
     */

    const recentIntegrations =
      await Integration.find({})
        .select(
          "_id name provider category status baseUrl lastCheckedAt lastError createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean();

    /*
     * ------------------------------------------------------
     * RECENT SUPPORT TICKETS
     * ------------------------------------------------------
     */

    const recentTickets =
      await SupportTicket.find({})
        .populate(
          "user",
          "_id name email"
        )
        .select(
          "_id ticketNumber subject category priority status user createdAt updatedAt"
        )
        .sort({
          updatedAt: -1,
        })
        .limit(10)
        .lean();

    /*
     * ------------------------------------------------------
     * USER ROLE BREAKDOWN
     * ------------------------------------------------------
     */

    const userRoles =
      await User.aggregate([
        {
          $group: {
            _id: "$role",

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
     * ------------------------------------------------------
     * LESSON TYPE BREAKDOWN
     * ------------------------------------------------------
     */

    const lessonTypes =
      await Lesson.aggregate([
        {
          $group: {
            _id: "$type",

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
     * ------------------------------------------------------
     * SUPPORT SUMMARY
     * ------------------------------------------------------
     */

    const supportSummary = {
      total:
        totalSupportTickets,

      open:
        openTickets,

      inProgress:
        inProgressTickets,

      resolved:
        resolvedTickets,

      closed:
        closedTickets,
    };

    /*
     * ------------------------------------------------------
     * INTEGRATION SUMMARY
     * ------------------------------------------------------
     */

    const integrationSummary = {
      total:
        totalIntegrations,

      active:
        activeIntegrations,

      inactive:
        inactiveIntegrations,

      errors:
        integrationErrors,
    };

    /*
     * ------------------------------------------------------
     * DASHBOARD STATS
     * ------------------------------------------------------
     */

    const stats = {
      /*
       * Users
       */

      totalUsers,

      activeUsers,

      inactiveUsers,

      /*
       * Roadmaps
       */

      totalRoadmaps,

      publishedRoadmaps,

      /*
       * Lessons
       */

      totalLessons,

      publishedLessons,

      /*
       * Integrations
       */

      totalIntegrations,

      activeIntegrations,

      inactiveIntegrations,

      integrationErrors,

      /*
       * Support
       */

      totalSupportTickets,

      openTickets,

      inProgressTickets,

      resolvedTickets,

      closedTickets,
    };

    /*
     * ------------------------------------------------------
     * LOG SUMMARY
     * ------------------------------------------------------
     */

    console.log(
      "[ADMIN DASHBOARD] Stats:",
      {
        totalUsers,
        activeUsers,
        totalRoadmaps,
        totalLessons,
        totalIntegrations,
        totalSupportTickets,
      }
    );

    /*
     * ------------------------------------------------------
     * SUCCESS RESPONSE
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      stats,

      supportSummary,

      integrationSummary,

      recentUsers,

      recentIntegrations,

      recentTickets,

      userRoles,

      lessonTypes,
    });
  } catch (error) {
    /*
     * ------------------------------------------------------
     * ERROR
     * ------------------------------------------------------
     */

    console.error(
      "[ADMIN DASHBOARD] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load admin dashboard",

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