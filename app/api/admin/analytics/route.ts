import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";

import User from "@/models/User";
import Roadmap from "@/models/Roadmap";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import StudentProgress from "@/models/StudentProgress";
import Integration from "@/models/Integration";
import IntegrationLog from "@/models/IntegrationLog";

export async function GET(request: Request) {
  try {
    console.log(
      "[ADMIN ANALYTICS] GET started"
    );

    /*
     * ======================================================
     * ADMIN AUTHENTICATION
     * ======================================================
     */

    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ======================================================
     * QUERY PARAMETERS
     * ======================================================
     *
     * ?range=7
     * ?range=30
     * ?range=90
     * ?range=365
     *
     * Default = 30 days
     *
     * ======================================================
     */

    const { searchParams } =
      new URL(request.url);

    const rangeParam =
      Number(
        searchParams.get("range") || 30
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
        : 30;

    /*
     * ======================================================
     * DATE RANGE
     * ======================================================
     */

    const now = new Date();

    const startDate =
      new Date(now);

    startDate.setDate(
      startDate.getDate() - range
    );

    /*
     * ======================================================
     * DATABASE
     * ======================================================
     */

    await connectDB();

    /*
     * ======================================================
     * PARALLEL DATABASE QUERIES
     * ======================================================
     */

    const [
      totalUsers,
      activeUsers,
      totalRoadmaps,
      totalModules,
      totalLessons,
      completedLessons,
      quizAttempts,
      passedQuizzes,
      failedQuizzes,
      averageQuizScore,
      totalIntegrations,
      activeIntegrations,
      successfulIntegrationTests,
      failedIntegrationTests,
      recentUsers,
      recentProgress,
      recentIntegrationLogs,
    ] = await Promise.all([
      /*
       * TOTAL USERS
       */

      User.countDocuments({}),

      /*
       * ACTIVE USERS
       *
       * Users created / active during
       * selected period.
       *
       * Since we cannot assume a
       * lastLoginAt field exists,
       * registration activity is used.
       */

      User.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: now,
        },
      }),

      /*
       * ROADMAPS
       */

      Roadmap.countDocuments({}),

      /*
       * MODULES
       */

      Module.countDocuments({}),

      /*
       * LESSONS
       */

      Lesson.countDocuments({}),

      /*
       * COMPLETED LESSONS
       */

      StudentProgress.countDocuments({
        completed: true,

        updatedAt: {
          $gte: startDate,
          $lte: now,
        },
      }),

      /*
       * QUIZ ATTEMPTS
       */

      StudentProgress.countDocuments({
        attempts: {
          $gt: 0,
        },

        updatedAt: {
          $gte: startDate,
          $lte: now,
        },
      }),

      /*
       * PASSED QUIZZES
       */

      StudentProgress.countDocuments({
        completed: true,

        score: {
          $ne: null,
        },

        updatedAt: {
          $gte: startDate,
          $lte: now,
        },
      }),

      /*
       * FAILED QUIZZES
       *
       * Attempts that have a score but
       * are not completed.
       */

      StudentProgress.countDocuments({
        completed: false,

        score: {
          $ne: null,
        },

        updatedAt: {
          $gte: startDate,
          $lte: now,
        },
      }),

      /*
       * AVERAGE QUIZ SCORE
       */

      StudentProgress.aggregate([
        {
          $match: {
            score: {
              $ne: null,
            },

            updatedAt: {
              $gte: startDate,
              $lte: now,
            },
          },
        },

        {
          $group: {
            _id: null,

            average: {
              $avg: "$score",
            },
          },
        },
      ]),

      /*
       * TOTAL INTEGRATIONS
       */

      Integration.countDocuments({}),

      /*
       * ACTIVE INTEGRATIONS
       */

      Integration.countDocuments({
        status: "ACTIVE",
      }),

      /*
       * SUCCESSFUL TESTS
       */

      IntegrationLog.countDocuments({
        action: "TEST",

        result: "SUCCESS",

        createdAt: {
          $gte: startDate,
          $lte: now,
        },
      }),

      /*
       * FAILED TESTS
       */

      IntegrationLog.countDocuments({
        action: "TEST",

        result: "ERROR",

        createdAt: {
          $gte: startDate,
          $lte: now,
        },
      }),

      /*
       * RECENT USERS
       */

      User.find({})
        .select(
          "_id name email role createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean(),

      /*
       * RECENT PROGRESS
       */

      StudentProgress.find({
        updatedAt: {
          $gte: startDate,
          $lte: now,
        },
      })
        .select(
          "_id user lesson completed score attempts updatedAt"
        )
        .populate({
          path: "user",
          select: "_id name email",
        })
        .populate({
          path: "lesson",
          select: "_id title type",
        })
        .sort({
          updatedAt: -1,
        })
        .limit(10)
        .lean(),

      /*
       * RECENT INTEGRATION LOGS
       */

      IntegrationLog.find({
        createdAt: {
          $gte: startDate,
          $lte: now,
        },
      })
        .select(
          "_id integration action result method statusCode responseTime message createdAt performedBy"
        )
        .populate({
          path: "integration",
          select: "_id name provider",
        })
        .populate({
          path: "performedBy",
          select: "_id name email role",
        })
        .sort({
          createdAt: -1,
        })
        .limit(10)
        .lean(),
    ]);

    /*
     * ======================================================
     * CALCULATIONS
     * ======================================================
     */

    const averageScore =
      averageQuizScore?.[0]
        ?.average ?? 0;

    const completionRate =
      quizAttempts > 0
        ? Math.round(
            (passedQuizzes /
              quizAttempts) *
              100
          )
        : 0;

    const integrationTests =
      successfulIntegrationTests +
      failedIntegrationTests;

    const integrationSuccessRate =
      integrationTests > 0
        ? Math.round(
            (successfulIntegrationTests /
              integrationTests) *
              100
          )
        : 0;

    /*
     * ======================================================
     * SANITIZE RECENT USERS
     * ======================================================
     */

    const safeUsers =
      recentUsers.map(
        (user: any) => ({
          _id: String(
            user._id
          ),

          name:
            user.name || "",

          email:
            user.email || "",

          role:
            user.role || "",

          createdAt:
            user.createdAt,
        })
      );

    /*
     * ======================================================
     * SANITIZE PROGRESS
     * ======================================================
     */

    const safeProgress =
      recentProgress.map(
        (item: any) => ({
          _id: String(
            item._id
          ),

          user:
            item.user
              ? {
                  _id: String(
                    item.user._id
                  ),

                  name:
                    item.user.name ||
                    "",

                  email:
                    item.user.email ||
                    "",
                }
              : null,

          lesson:
            item.lesson
              ? {
                  _id: String(
                    item.lesson._id
                  ),

                  title:
                    item.lesson.title ||
                    "",

                  type:
                    item.lesson.type ||
                    "",
                }
              : null,

          completed:
            Boolean(
              item.completed
            ),

          score:
            item.score ?? null,

          attempts:
            item.attempts ?? 0,

          updatedAt:
            item.updatedAt,
        })
      );

    /*
     * ======================================================
     * SANITIZE INTEGRATION LOGS
     * ======================================================
     */

    const safeIntegrationLogs =
      recentIntegrationLogs.map(
        (log: any) => ({
          _id: String(
            log._id
          ),

          integration:
            log.integration
              ? {
                  _id: String(
                    log.integration
                      ._id
                  ),

                  name:
                    log.integration
                      .name || "",

                  provider:
                    log.integration
                      .provider || "",
                }
              : null,

          action:
            log.action,

          result:
            log.result,

          method:
            log.method || "",

          statusCode:
            log.statusCode ?? null,

          responseTime:
            log.responseTime ?? null,

          message:
            log.message || "",

          performedBy:
            log.performedBy
              ? {
                  _id: String(
                    log.performedBy
                      ._id
                  ),

                  name:
                    log.performedBy
                      .name || "",

                  email:
                    log.performedBy
                      .email || "",

                  role:
                    log.performedBy
                      .role || "",
                }
              : null,

          createdAt:
            log.createdAt,
        })
      );

    /*
     * ======================================================
     * RESPONSE
     * ======================================================
     */

    return NextResponse.json({
      success: true,

      range: {
        days: range,

        startDate,

        endDate: now,
      },

      overview: {
        totalUsers,

        activeUsers,

        totalRoadmaps,

        totalModules,

        totalLessons,

        completedLessons,
      },

      quizzes: {
        attempts:
          quizAttempts,

        passed:
          passedQuizzes,

        failed:
          failedQuizzes,

        averageScore:
          Math.round(
            averageScore * 100
          ) / 100,

        completionRate,
      },

      integrations: {
        total:
          totalIntegrations,

        active:
          activeIntegrations,

        successfulTests:
          successfulIntegrationTests,

        failedTests:
          failedIntegrationTests,

        successRate:
          integrationSuccessRate,
      },

      platform: {
        users:
          totalUsers,

        roadmaps:
          totalRoadmaps,

        modules:
          totalModules,

        lessons:
          totalLessons,

        quizAttempts:
          quizAttempts,

        completedLessons:
          completedLessons,
      },

      recent: {
        users:
          safeUsers,

        progress:
          safeProgress,

        integrations:
          safeIntegrationLogs,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN ANALYTICS] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load analytics",

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