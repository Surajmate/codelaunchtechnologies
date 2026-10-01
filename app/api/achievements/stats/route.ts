import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Achievement from "@/models/Achievement";
import UserAchievement from "@/models/UserAchievement";

/*
 * ======================================================
 * GET ACHIEVEMENT STATS
 * ======================================================
 *
 * GET
 * /api/achievements/stats
 *
 * Returns:
 *
 * - Total active achievements
 * - Earned achievements
 * - Locked achievements
 * - Completion percentage
 * - Total XP earned
 * - Total points earned
 * - Recent achievements
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
        { status: 401 }
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
     * FETCH ACTIVE ACHIEVEMENTS
     * --------------------------------------------------
     */

    const totalAchievements =
      await Achievement.countDocuments({
        isActive: true,
      });

    /*
     * --------------------------------------------------
     * FETCH EARNED ACHIEVEMENTS
     * --------------------------------------------------
     */

    const earnedAchievements =
      await UserAchievement.find({
        user: user.id,
        earned: true,
      })
        .sort({
          earnedAt: -1,
        })
        .limit(5)
        .populate({
          path: "achievement",
          match: {
            isActive: true,
          },
          select:
            "_id name slug description icon image category rarity xpReward pointsReward",
        })
        .lean();

    /*
     * --------------------------------------------------
     * COUNT USER EARNED ACHIEVEMENTS
     * --------------------------------------------------
     */

    const earnedCount =
      await UserAchievement.countDocuments({
        user: user.id,
        earned: true,
      });

    /*
     * --------------------------------------------------
     * LOCKED
     * --------------------------------------------------
     */

    const lockedCount = Math.max(
      0,
      totalAchievements -
        earnedCount
    );

    /*
     * --------------------------------------------------
     * COMPLETION
     * --------------------------------------------------
     */

    const completionPercentage =
      totalAchievements > 0
        ? Math.round(
            (Math.min(
              earnedCount,
              totalAchievements
            ) /
              totalAchievements) *
              100
          )
        : 0;

    /*
     * --------------------------------------------------
     * TOTAL XP
     * --------------------------------------------------
     *
     * Calculate from the achievement definitions rather
     * than trusting a cached value.
     *
     * --------------------------------------------------
     */

    const earnedAchievementIds =
      await UserAchievement.find({
        user: user.id,
        earned: true,
      }).distinct("achievement");

    const rewardSummary =
      await Achievement.aggregate([
        {
          $match: {
            _id: {
              $in: earnedAchievementIds,
            },
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,

            totalXP: {
              $sum: {
                $ifNull: [
                  "$xpReward",
                  0,
                ],
              },
            },

            totalPoints: {
              $sum: {
                $ifNull: [
                  "$pointsReward",
                  0,
                ],
              },
            },
          },
        },
      ]);

    const totalXP = Number(
      rewardSummary[0]?.totalXP || 0
    );

    const totalPoints = Number(
      rewardSummary[0]?.totalPoints || 0
    );

    /*
     * --------------------------------------------------
     * RECENT ACHIEVEMENTS
     * --------------------------------------------------
     */

    const recentAchievements =
      earnedAchievements
        .filter(
          (item: any) =>
            item.achievement
        )
        .map(
          (item: any) => ({
            _id: String(
              item._id
            ),

            achievement: {
              _id: String(
                item.achievement._id
              ),

              name:
                item.achievement.name,

              slug:
                item.achievement.slug,

              description:
                item.achievement
                  .description,

              icon:
                item.achievement.icon,

              image:
                item.achievement.image,

              category:
                item.achievement
                  .category,

              rarity:
                item.achievement
                  .rarity,

              xpReward:
                item.achievement
                  .xpReward,

              pointsReward:
                item.achievement
                  .pointsReward,
            },

            progress:
              item.progress ?? 0,

            progressPercentage:
              item.progressPercentage ??
              100,

            earned:
              item.earned === true,

            earnedAt:
              item.earnedAt ?? null,
          })
        );

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      stats: {
        total: totalAchievements,

        earned: earnedCount,

        locked: lockedCount,

        completionPercentage,

        totalXP,

        totalPoints,
      },

      recentAchievements,
    });
  } catch (error) {
    console.error(
      "[ACHIEVEMENTS STATS] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load achievement statistics",
      },
      { status: 500 }
    );
  }
}