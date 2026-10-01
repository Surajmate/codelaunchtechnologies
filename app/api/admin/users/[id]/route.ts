import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";

import User from "@/models/User";
import StudentProgress from "@/models/StudentProgress";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    console.log(
      "[ADMIN USER DETAIL] Starting GET request"
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

    /*
     * ------------------------------------------------------
     * USER ID
     * ------------------------------------------------------
     */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------------
     * LOAD USER
     * ------------------------------------------------------
     *
     * IMPORTANT:
     * Password is never selected.
     */

    const user =
      await User.findById(id)
        .select(
          "_id name email role avatar isActive createdAt updatedAt"
        )
        .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * LOAD STUDENT PROGRESS
     * ------------------------------------------------------
     */

    const progress =
      await StudentProgress.find({
        user: id,
      })
        .select(
          "_id roadmap module lesson completed completedAt score attempts lastAccessedAt createdAt updatedAt"
        )
        .sort({
          lastAccessedAt: -1,
          updatedAt: -1,
        })
        .lean();

    /*
     * ------------------------------------------------------
     * PROGRESS CALCULATIONS
     * ------------------------------------------------------
     */

    const trackedLessons =
      progress.length;

    const completedLessons =
      progress.filter(
        (item: any) =>
          item.completed === true
      ).length;

    const incompleteLessons =
      trackedLessons -
      completedLessons;

    const totalAttempts =
      progress.reduce(
        (
          total: number,
          item: any
        ) =>
          total +
          Number(
            item.attempts || 0
          ),
        0
      );

    /*
     * ------------------------------------------------------
     * SCORES
     * ------------------------------------------------------
     */

    const scores =
      progress
        .map(
          (item: any) =>
            Number(
              item.score
            )
        )
        .filter(
          (score: number) =>
            Number.isFinite(
              score
            )
        );

    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce(
              (
                total,
                score
              ) =>
                total +
                score,
              0
            ) /
              scores.length
          )
        : 0;

    const highestScore =
      scores.length > 0
        ? Math.max(
            ...scores
          )
        : 0;

    /*
     * ------------------------------------------------------
     * COMPLETION RATE
     * ------------------------------------------------------
     */

    const completionRate =
      trackedLessons > 0
        ? Math.round(
            (completedLessons /
              trackedLessons) *
              100
          )
        : 0;

    /*
     * ------------------------------------------------------
     * LAST ACTIVITY
     * ------------------------------------------------------
     */

    const lastProgress =
      progress.length > 0
        ? progress[0]
        : null;

    const lastAccessedAt =
      lastProgress?.lastAccessedAt ||
      lastProgress?.updatedAt ||
      null;

    /*
     * ------------------------------------------------------
     * ROADMAP SUMMARY
     * ------------------------------------------------------
     *
     * Count progress records by roadmap.
     */

    const roadmapMap =
      new Map<
        string,
        {
          total: number;
          completed: number;
          attempts: number;
          scores: number[];
        }
      >();

    for (
      const item of progress as any[]
    ) {
      const roadmapId =
        item.roadmap
          ? String(
              item.roadmap
            )
          : "unknown";

      if (
        !roadmapMap.has(
          roadmapId
        )
      ) {
        roadmapMap.set(
          roadmapId,
          {
            total: 0,
            completed: 0,
            attempts: 0,
            scores: [],
          }
        );
      }

      const roadmap =
        roadmapMap.get(
          roadmapId
        )!;

      roadmap.total += 1;

      if (
        item.completed ===
        true
      ) {
        roadmap.completed +=
          1;
      }

      roadmap.attempts +=
        Number(
          item.attempts || 0
        );

      const score =
        Number(
          item.score
        );

      if (
        Number.isFinite(
          score
        )
      ) {
        roadmap.scores.push(
          score
        );
      }
    }

    const roadmapSummary =
      Array.from(
        roadmapMap.entries()
      ).map(
        ([
          roadmapId,
          roadmap,
        ]) => ({
          roadmapId,

          totalLessons:
            roadmap.total,

          completedLessons:
            roadmap.completed,

          incompleteLessons:
            roadmap.total -
            roadmap.completed,

          completionRate:
            roadmap.total > 0
              ? Math.round(
                  (roadmap.completed /
                    roadmap.total) *
                    100
                )
              : 0,

          attempts:
            roadmap.attempts,

          averageScore:
            roadmap.scores
              .length > 0
              ? Math.round(
                  roadmap.scores.reduce(
                    (
                      total,
                      score
                    ) =>
                      total +
                      score,
                    0
                  ) /
                    roadmap.scores
                      .length
                )
              : 0,
        })
      );

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      user,

      summary: {
        trackedLessons,

        completedLessons,

        incompleteLessons,

        completionRate,

        totalAttempts,

        averageScore,

        highestScore,

        lastAccessedAt,
      },

      roadmapSummary,

      progress,
    });
  } catch (error) {
    console.error(
      "[ADMIN USER DETAIL] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load user details",

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
 * PATCH
 * ======================================================
 *
 * Update:
 *
 * - role
 * - isActive
 *
 * ======================================================
 */

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    console.log(
      "[ADMIN USER DETAIL] Starting PATCH request"
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

    /*
     * ------------------------------------------------------
     * USER ID
     * ------------------------------------------------------
 */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * REQUEST BODY
     * ------------------------------------------------------
     */

    const body =
      await request.json();

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------------
     * FIND TARGET USER
     * ------------------------------------------------------
     */

    const targetUser =
      await User.findById(
        id
      );

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * UPDATE OBJECT
     * ------------------------------------------------------
     */

    const update: Record<
      string,
      unknown
    > = {};

    /*
     * ------------------------------------------------------
     * ACTIVE / INACTIVE
     * ------------------------------------------------------
     */

    if (
      typeof body.isActive ===
      "boolean"
    ) {
      /*
       * Don't allow an administrator
       * to deactivate their own account.
       */

      if (
        String(
          targetUser._id
        ) ===
          String(
            auth.user.id
          ) &&
        body.isActive ===
          false
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You cannot deactivate your own account",
          },
          {
            status: 400,
          }
        );
      }

      update.isActive =
        body.isActive;
    }

    /*
     * ------------------------------------------------------
     * ROLE
     * ------------------------------------------------------
     */

    if (
      body.role !==
      undefined
    ) {
      const allowedRoles = [
        "USER",
        "ADMIN",
        "SUPER_ADMIN",
      ];

      if (
        !allowedRoles.includes(
          body.role
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid role",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Only SUPER_ADMIN can
       * assign SUPER_ADMIN.
       */

      if (
        body.role ===
          "SUPER_ADMIN" &&
        auth.user.role !==
          "SUPER_ADMIN"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only SUPER_ADMIN can assign SUPER_ADMIN",
          },
          {
            status: 403,
          }
        );
      }

      /*
       * Only SUPER_ADMIN should be
       * able to modify another SUPER_ADMIN.
       */

      if (
        targetUser.role ===
          "SUPER_ADMIN" &&
        auth.user.role !==
          "SUPER_ADMIN"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only SUPER_ADMIN can modify a SUPER_ADMIN",
          },
          {
            status: 403,
          }
        );
      }

      /*
       * Don't allow an administrator
       * to remove their own admin role.
       */

      if (
        String(
          targetUser._id
        ) ===
          String(
            auth.user.id
          ) &&
        body.role !==
          targetUser.role
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You cannot change your own administrator role",
          },
          {
            status: 400,
          }
        );
      }

      update.role =
        body.role;
    }

    /*
     * ------------------------------------------------------
     * NOTHING TO UPDATE
     * ------------------------------------------------------
     */

    if (
      Object.keys(
        update
      ).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid changes supplied",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * UPDATE USER
     * ------------------------------------------------------
 */

    const updatedUser =
      await User.findByIdAndUpdate(
        id,
        {
          $set: update,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .select(
          "_id name email role avatar isActive createdAt updatedAt"
        )
        .lean();

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to update user",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * SUCCESS
     * ------------------------------------------------------
     */

    console.log(
      "[ADMIN USER DETAIL] User updated:",
      String(
        updatedUser._id
      )
    );

    return NextResponse.json({
      success: true,

      message:
        "User updated successfully",

      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "[ADMIN USER DETAIL] PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update user",

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