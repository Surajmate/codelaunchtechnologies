import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";

import User from "@/models/User";
import StudentProgress from "@/models/StudentProgress";
import IntegrationLog from "@/models/IntegrationLog";

export async function GET(
  request: Request
) {
  try {
    console.log(
      "[ADMIN ANALYTICS TRENDS] GET started"
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
     * RANGE
     * ======================================================
     */

    const { searchParams } =
      new URL(request.url);

    const rangeParam =
      Number(
        searchParams.get(
          "range"
        ) || 30
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
     * DATABASE
     * ======================================================
     */

    await connectDB();

    /*
     * ======================================================
     * DATE RANGE
     * ======================================================
     */

    const now =
      new Date();

    const startDate =
      new Date(now);

    startDate.setDate(
      startDate.getDate() -
        (range - 1)
    );

    const startOfDay =
      new Date(
        startDate
      );

    startOfDay.setHours(
      0,
      0,
      0,
      0
    );

    const endOfDay =
      new Date(
        now
      );

    endOfDay.setHours(
      23,
      59,
      59,
      999
    );

    console.log(
      "[ADMIN ANALYTICS TRENDS] Range:",
      {
        range,
        startOfDay,
        endOfDay,
      }
    );

    /*
     * ======================================================
     * USER TRENDS
     * ======================================================
     */

    const userTrends =
      await User.aggregate([
        {
          $match: {
            createdAt: {
              $gte:
                startOfDay,
              $lte:
                endOfDay,
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

    console.log(
      "[ADMIN ANALYTICS TRENDS] User records:",
      userTrends
    );

    /*
     * ======================================================
     * QUIZ / STUDENT PROGRESS
     * ======================================================
     *
     * Do NOT restrict by attempts here.
     *
     * Some progress records may have:
     *
     * attempts = 0
     * completed = true
     *
     * or score without attempts.
     *
     * ======================================================
     */

    const quizTrends =
      await StudentProgress.aggregate([
        {
          $match: {
            updatedAt: {
              $gte:
                startOfDay,
              $lte:
                endOfDay,
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
                  "$updatedAt",
              },
            },

            attempts: {
              $sum: {
                $ifNull: [
                  "$attempts",
                  0,
                ],
              },
            },

            completed: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$completed",
                      true,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            averageScore: {
              $avg: "$score",
            },

            scoreCount: {
              $sum: {
                $cond: [
                  {
                    $ne: [
                      "$score",
                      null,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    console.log(
      "[ADMIN ANALYTICS TRENDS] Quiz records:",
      quizTrends
    );

    /*
     * ======================================================
     * PROGRESS TRENDS
     * ======================================================
     */

    const progressTrends =
      await StudentProgress.aggregate([
        {
          $match: {
            updatedAt: {
              $gte:
                startOfDay,
              $lte:
                endOfDay,
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
                  "$updatedAt",
              },
            },

            completed: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$completed",
                      true,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            records: {
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

    console.log(
      "[ADMIN ANALYTICS TRENDS] Progress records:",
      progressTrends
    );

    /*
     * ======================================================
     * INTEGRATION TRENDS
     * ======================================================
     *
     * Calculate:
     *
     * success count
     * error count
     * total response time
     * response count
     *
     * Then calculate the REAL daily average.
     *
     * ======================================================
     */

    const integrationTrends =
      await IntegrationLog.aggregate([
        {
          $match: {
            createdAt: {
              $gte:
                startOfDay,
              $lte:
                endOfDay,
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

            success: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$result",
                      "SUCCESS",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            error: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$result",
                      "ERROR",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            totalResponseTime: {
              $sum: {
                $ifNull: [
                  "$responseTime",
                  0,
                ],
              },
            },

            responseCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $ne: [
                          "$responseTime",
                          null,
                        ],
                      },
                      {
                        $gte: [
                          "$responseTime",
                          0,
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    console.log(
      "[ADMIN ANALYTICS TRENDS] Integration records:",
      integrationTrends
    );

    /*
     * ======================================================
     * CREATE COMPLETE DATE SERIES
     * ======================================================
     */

    const dates: string[] =
      [];

    const cursor =
      new Date(
        startOfDay
      );

    while (
      cursor <=
      endOfDay
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
     * USER MAP
     * ======================================================
     */

    const userMap =
      new Map<
        string,
        number
      >();

    for (
      const item of userTrends
    ) {
      userMap.set(
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
     * QUIZ MAP
     * ======================================================
     */

    const quizMap =
      new Map<
        string,
        {
          attempts: number;
          completed: number;
          averageScore: number;
        }
      >();

    for (
      const item of quizTrends
    ) {
      const averageScore =
        Number(
          item.averageScore
        );

      quizMap.set(
        String(
          item._id
        ),
        {
          attempts:
            Number(
              item.attempts ||
                0
            ),

          completed:
            Number(
              item.completed ||
                0
            ),

          averageScore:
            Number.isFinite(
              averageScore
            )
              ? Math.round(
                  averageScore *
                    100
                ) / 100
              : 0,
        }
      );
    }

    /*
     * ======================================================
     * PROGRESS MAP
     * ======================================================
     */

    const progressMap =
      new Map<
        string,
        {
          completed: number;
          records: number;
        }
      >();

    for (
      const item of progressTrends
    ) {
      progressMap.set(
        String(
          item._id
        ),
        {
          completed:
            Number(
              item.completed ||
                0
            ),

          records:
            Number(
              item.records ||
                0
            ),
        }
      );
    }

    /*
     * ======================================================
     * INTEGRATION MAP
     * ======================================================
     */

    const integrationMap =
      new Map<
        string,
        {
          success: number;
          error: number;
          averageResponseTime: number;
        }
      >();

    for (
      const item of integrationTrends
    ) {
      const responseCount =
        Number(
          item.responseCount ||
            0
        );

      const totalResponseTime =
        Number(
          item.totalResponseTime ||
            0
        );

      const averageResponseTime =
        responseCount >
        0
          ? totalResponseTime /
            responseCount
          : 0;

      integrationMap.set(
        String(
          item._id
        ),
        {
          success:
            Number(
              item.success ||
                0
            ),

          error:
            Number(
              item.error ||
                0
            ),

          averageResponseTime:
            Math.round(
              averageResponseTime
            ),
        }
      );
    }

    /*
     * ======================================================
     * BUILD DAILY TRENDS
     * ======================================================
     */

    const trends =
      dates.map(
        (date) => {
          const quiz =
            quizMap.get(
              date
            );

          const progress =
            progressMap.get(
              date
            );

          const integration =
            integrationMap.get(
              date
            );

          return {
            date,

            users:
              userMap.get(
                date
              ) || 0,

            quizAttempts:
              quiz?.attempts ||
              0,

            quizzesCompleted:
              quiz?.completed ||
              0,

            averageQuizScore:
              quiz?.averageScore ||
              0,

            completedLessons:
              progress?.completed ||
              0,

            progressRecords:
              progress?.records ||
              0,

            integrationSuccess:
              integration?.success ||
              0,

            integrationErrors:
              integration?.error ||
              0,

            integrationAverageResponseTime:
              integration?.averageResponseTime ||
              0,
          };
        }
      );

    /*
     * ======================================================
     * SUMMARY
     * ======================================================
     */

    const summary =
      trends.reduce(
        (
          accumulator,
          item
        ) => {
          accumulator.users +=
            item.users;

          accumulator.quizAttempts +=
            item.quizAttempts;

          accumulator.quizzesCompleted +=
            item.quizzesCompleted;

          accumulator.completedLessons +=
            item.completedLessons;

          accumulator.integrationSuccess +=
            item.integrationSuccess;

          accumulator.integrationErrors +=
            item.integrationErrors;

          return accumulator;
        },
        {
          users: 0,
          quizAttempts: 0,
          quizzesCompleted: 0,
          completedLessons: 0,
          integrationSuccess: 0,
          integrationErrors: 0,
        }
      );

    /*
     * ======================================================
     * DEBUG INFORMATION
     * ======================================================
     *
     * Useful during development.
     *
     * This tells us exactly how many
     * records were found.
     *
     * ======================================================
     */

    const debug = {
      userRecords:
        userTrends.length,

      quizRecords:
        quizTrends.length,

      progressRecords:
        progressTrends.length,

      integrationRecords:
        integrationTrends.length,

      daysReturned:
        trends.length,

      nonZeroUserDays:
        trends.filter(
          (item) =>
            item.users > 0
        ).length,

      nonZeroQuizDays:
        trends.filter(
          (item) =>
            item.quizAttempts >
            0
        ).length,

      nonZeroLessonDays:
        trends.filter(
          (item) =>
            item.completedLessons >
            0
        ).length,

      nonZeroIntegrationDays:
        trends.filter(
          (item) =>
            item.integrationSuccess >
              0 ||
            item.integrationErrors >
              0
        ).length,
    };

    console.log(
      "[ADMIN ANALYTICS TRENDS] DEBUG:",
      debug
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

        startDate:
          startOfDay,

        endDate:
          endOfDay,
      },

      summary,

      trends,

      /*
       * Keep debug information
       * only in development.
       */

      ...(process.env.NODE_ENV ===
      "development"
        ? {
            debug,
          }
        : {}),
    });
  } catch (error) {
    console.error(
      "[ADMIN ANALYTICS TRENDS] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load analytics trends",

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