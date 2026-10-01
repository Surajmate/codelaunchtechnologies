import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import UserAchievement from "@/models/UserAchievement";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
 * ============================================================
 * GET SINGLE ACHIEVEMENT
 * ============================================================
 *
 * GET
 * /api/achievements/[id]
 *
 * Returns one achievement belonging to the logged-in user.
 *
 * ============================================================
 */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Achievement ID is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const achievement =
      await UserAchievement.findOne({
        _id: id,
        user: user.id,
      }).lean();

    if (!achievement) {
      return NextResponse.json(
        {
          success: false,
          message: "Achievement not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    console.error(
      "[ACHIEVEMENTS] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load achievement",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/*
 * ============================================================
 * UPDATE ACHIEVEMENT
 * ============================================================
 *
 * PATCH
 * /api/achievements/[id]
 *
 * Example body:
 *
 * {
 *   "progress": 80,
 *   "status": "IN_PROGRESS"
 * }
 *
 * Supported fields depend on UserAchievement schema.
 *
 * ============================================================
 */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Achievement ID is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const existingAchievement =
      await UserAchievement.findOne({
        _id: id,
        user: user.id,
      });

    if (!existingAchievement) {
      return NextResponse.json(
        {
          success: false,
          message: "Achievement not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    /*
     * --------------------------------------------------------
     * Allowed fields
     * --------------------------------------------------------
     *
     * Only update fields that are actually provided.
     */

    const allowedFields = [
      "progress",
      "status",
      "completedAt",
      "metadata",
    ];

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      ) {
        (existingAchievement as any)[field] =
          body[field];
      }
    }

    /*
     * --------------------------------------------------------
     * Progress validation
     * --------------------------------------------------------
     */

    if (
      body.progress !== undefined
    ) {
      const progress =
        Number(body.progress);

      if (
        Number.isNaN(progress) ||
        progress < 0 ||
        progress > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Progress must be between 0 and 100",
          },
          { status: 400 }
        );
      }

      existingAchievement.progress =
        progress;
    }

    /*
     * --------------------------------------------------------
     * Status validation
     * --------------------------------------------------------
     */

    if (
      body.status !== undefined
    ) {
      const allowedStatuses = [
        "LOCKED",
        "IN_PROGRESS",
        "COMPLETED",
      ];

      if (
        !allowedStatuses.includes(
          body.status
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid achievement status",
          },
          { status: 400 }
        );
      }

      existingAchievement.status =
        body.status;
    }

    /*
     * --------------------------------------------------------
     * Automatically complete achievement
     * --------------------------------------------------------
     */

    if (
      existingAchievement.progress >= 100
    ) {
      existingAchievement.progress = 100;
      existingAchievement.status =
        "COMPLETED";

      if (
        !(existingAchievement as any)
          .completedAt
      ) {
        existingAchievement.completedAt =
          new Date();
      }
    }

    /*
     * If progress is greater than 0
     * and status wasn't explicitly locked,
     * move it to IN_PROGRESS.
     */

    if (
      existingAchievement.progress > 0 &&
      existingAchievement.progress < 100 &&
      body.status === undefined
    ) {
      existingAchievement.status =
        "IN_PROGRESS";
    }

    await existingAchievement.save();

    return NextResponse.json({
      success: true,
      message:
        "Achievement updated successfully",
      data: existingAchievement,
    });
  } catch (error) {
    console.error(
      "[ACHIEVEMENTS] PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update achievement",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/*
 * ============================================================
 * DELETE ACHIEVEMENT
 * ============================================================
 *
 * DELETE
 * /api/achievements/[id]
 *
 * Removes the achievement belonging to
 * the logged-in user.
 *
 * ============================================================
 */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Achievement ID is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const achievement =
      await UserAchievement.findOne({
        _id: id,
        user: user.id,
      });

    if (!achievement) {
      return NextResponse.json(
        {
          success: false,
          message: "Achievement not found",
        },
        { status: 404 }
      );
    }

    await UserAchievement.deleteOne({
      _id: id,
      user: user.id,
    });

    return NextResponse.json({
      success: true,
      message:
        "Achievement deleted successfully",
    });
  } catch (error) {
    console.error(
      "[ACHIEVEMENTS] DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete achievement",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}