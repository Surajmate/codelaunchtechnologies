import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import UserAchievement from "@/models/UserAchievement";

export async function GET(
  request: Request
) {
  try {
    const admin =
      await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (
      admin.role !== "ADMIN" &&
      admin.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        { status: 403 }
      );
    }

    await connectDB();

    /*
     * --------------------------------------------------------
     * TOTAL
     * --------------------------------------------------------
     */

    const total =
      await UserAchievement.countDocuments();

    const completed =
      await UserAchievement.countDocuments({
        status: "COMPLETED",
      });

    const inProgress =
      await UserAchievement.countDocuments({
        status: "IN_PROGRESS",
      });

    const locked =
      await UserAchievement.countDocuments({
        status: "LOCKED",
      });

    /*
     * --------------------------------------------------------
     * UNIQUE USERS
     * --------------------------------------------------------
     */

    const uniqueUsers =
      await UserAchievement.distinct(
        "user"
      );

    /*
     * --------------------------------------------------------
     * COMPLETION RATE
     * --------------------------------------------------------
     */

    const completionRate =
      total > 0
        ? Number(
            (
              (completed / total) *
              100
            ).toFixed(2)
          )
        : 0;

    /*
     * --------------------------------------------------------
     * TYPE STATISTICS
     * --------------------------------------------------------
     */

    const typeStats =
      await UserAchievement.aggregate([
        {
          $group: {
            _id: "$type",
            count: {
              $sum: 1,
            },
            completed: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "COMPLETED",
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
            count: -1,
          },
        },
      ]);

    /*
     * --------------------------------------------------------
     * STATUS STATISTICS
     * --------------------------------------------------------
     */

    const statusStats =
      await UserAchievement.aggregate([
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    return NextResponse.json({
      success: true,

      data: {
        total,
        completed,
        inProgress,
        locked,

        uniqueUsers:
          uniqueUsers.length,

        completionRate,

        typeStats,

        statusStats,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN ACHIEVEMENTS] STATS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load achievement statistics",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}