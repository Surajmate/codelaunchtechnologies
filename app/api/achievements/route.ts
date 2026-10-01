import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import UserAchievement from "@/models/UserAchievement";

/*
 * ======================================================
 * GET USER ACHIEVEMENTS
 * ======================================================
 *
 * GET
 * /api/achievements
 *
 * Returns achievements assigned to the currently
 * logged-in user.
 *
 * Data comes directly from UserAchievement.
 *
 * ======================================================
 */

export async function GET() {
  try {
    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const user = await getCurrentUser();

    if (!user) {
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

    /*
     * --------------------------------------------------
     * USER ID
     * --------------------------------------------------
     *
     * Support both:
     *
     * user.id
     * user._id
     *
     * depending on your auth implementation.
     */

    const userId = String(
      user.id ?? user._id ?? ""
    );

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to determine current user",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * --------------------------------------------------
     * VALIDATE USER ID
     * --------------------------------------------------
     */

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      console.error(
        "[ACHIEVEMENTS] Invalid user ID:",
        userId
      );

      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID",
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

    const userObjectId =
      new mongoose.Types.ObjectId(
        userId
      );

    /*
     * --------------------------------------------------
     * FETCH USER ACHIEVEMENTS
     * --------------------------------------------------
     *
     * IMPORTANT:
     *
     * We DO NOT populate "achievement".
     *
     * UserAchievement does not contain an
     * achievement field.
     *
     * --------------------------------------------------
     */

    const achievements =
      await UserAchievement.find({
        user: userObjectId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    /*
     * --------------------------------------------------
     * DEBUG
     * --------------------------------------------------
     */

    console.log(
      `[ACHIEVEMENTS] User ${userId} has ${achievements.length} achievements`
    );

    /*
     * --------------------------------------------------
     * BUILD RESPONSE
     * --------------------------------------------------
     */

    const result = achievements.map(
      (achievement: any) => {
        /*
         * ------------------------------------------------
         * PROGRESS
         * ------------------------------------------------
         *
         * Your model stores progress directly as
         * a percentage from 0 to 100.
         *
         * ------------------------------------------------
         */

        const progress = Math.max(
          0,
          Math.min(
            100,
            Number(
              achievement.progress ?? 0
            )
          )
        );

        /*
         * ------------------------------------------------
         * STATUS
         * ------------------------------------------------
         */

        const status =
          achievement.status ||
          (progress >= 100
            ? "COMPLETED"
            : progress > 0
            ? "IN_PROGRESS"
            : "LOCKED");

        /*
         * ------------------------------------------------
         * EARNED
         * ------------------------------------------------
         *
         * In your schema, COMPLETED means earned.
         *
         * ------------------------------------------------
         */

        const earned =
          status === "COMPLETED" ||
          progress >= 100;

        /*
         * ------------------------------------------------
         * RESPONSE
         * ------------------------------------------------
         *
         * "name" is also returned as an alias of
         * "title" so the existing frontend can work
         * even if it expects name.
         * ------------------------------------------------
         */

        return {
          _id: String(
            achievement._id
          ),

          user: String(
            achievement.user
          ),

          /*
           * Main achievement information
           */

          title:
            achievement.title || "",

          name:
            achievement.title || "",

          description:
            achievement.description || "",

          type:
            achievement.type || "CUSTOM",

          /*
           * Status
           */

          status,

          earned,

          /*
           * Progress
           */

          progress,

          progressPercentage:
            progress,

          /*
           * Visual information
           */

          icon:
            achievement.icon || "🏆",

          color:
            achievement.color || "",

          /*
           * Dates
           */

          awardedAt:
            achievement.awardedAt ??
            null,

          earnedAt:
            earned
              ? achievement.awardedAt ??
                null
              : null,

          createdAt:
            achievement.createdAt,

          updatedAt:
            achievement.updatedAt,
        };
      }
    );

    /*
     * --------------------------------------------------
     * STATISTICS
     * --------------------------------------------------
     */

    const total =
      result.length;

    const completed =
      result.filter(
        (item) =>
          item.status ===
          "COMPLETED"
      ).length;

    const inProgress =
      result.filter(
        (item) =>
          item.status ===
          "IN_PROGRESS"
      ).length;

    const locked =
      result.filter(
        (item) =>
          item.status ===
          "LOCKED"
      ).length;

    /*
     * --------------------------------------------------
     * AVERAGE PROGRESS
     * --------------------------------------------------
     */

    const averageProgress =
      total > 0
        ? Math.round(
            result.reduce(
              (
                sum,
                item
              ) =>
                sum +
                Number(
                  item.progress || 0
                ),
              0
            ) / total
          )
        : 0;

    /*
     * --------------------------------------------------
     * COMPLETION PERCENTAGE
     * --------------------------------------------------
     */

    const completionPercentage =
      total > 0
        ? Math.round(
            (completed /
              total) *
              100
          )
        : 0;

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      achievements:
        result,

      stats: {
        total,

        completed,

        earned:
          completed,

        inProgress,

        locked,

        averageProgress,

        completionPercentage,
      },
    });
  } catch (error: any) {
    /*
     * --------------------------------------------------
     * ERROR HANDLING
     * --------------------------------------------------
     */

    console.error(
      "[ACHIEVEMENTS] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load achievements",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error?.message ||
              String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}