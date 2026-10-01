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
 */

export async function GET(
  request: Request,
  context: RouteContext
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

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Achievement ID is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const achievement =
      await UserAchievement.findById(id)
        .populate({
          path: "user",
          select:
            "_id name email role",
        })
        .lean();

    if (!achievement) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Achievement not found",
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
      "[ADMIN ACHIEVEMENTS] GET DETAIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load achievement",
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
 * PATCH
 * ============================================================
 */

export async function PATCH(
  request: Request,
  context: RouteContext
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

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Achievement ID is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const achievement =
      await UserAchievement.findById(id);

    if (!achievement) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Achievement not found",
        },
        { status: 404 }
      );
    }

    const body =
      await request.json();

    /*
     * --------------------------------------------------------
     * BASIC FIELDS
     * --------------------------------------------------------
     */

    if (
      body.title !== undefined
    ) {
      if (
        typeof body.title !==
          "string" ||
        !body.title.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid achievement title",
          },
          { status: 400 }
        );
      }

      achievement.title =
        body.title.trim();
    }

    if (
      body.description !==
      undefined
    ) {
      achievement.description =
        typeof body.description ===
        "string"
          ? body.description.trim()
          : "";
    }

    if (
      body.type !== undefined
    ) {
      if (
        typeof body.type !==
          "string" ||
        !body.type.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid achievement type",
          },
          { status: 400 }
        );
      }

      achievement.type =
        body.type.trim();
    }

    /*
     * --------------------------------------------------------
     * PROGRESS
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

      achievement.progress =
        progress;
    }

    /*
     * --------------------------------------------------------
     * STATUS
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

      achievement.status =
        body.status;
    }

    /*
     * --------------------------------------------------------
     * AUTO STATUS
     * --------------------------------------------------------
     */

    if (
      achievement.progress >=
      100
    ) {
      achievement.progress = 100;

      achievement.status =
        "COMPLETED";

      if (
        !achievement.completedAt
      ) {
        achievement.completedAt =
          new Date();
      }
    } else if (
      achievement.progress > 0 &&
      achievement.progress < 100 &&
      body.status === undefined
    ) {
      achievement.status =
        "IN_PROGRESS";
    }

    /*
     * --------------------------------------------------------
     * COMPLETED AT
     * --------------------------------------------------------
     */

    if (
      body.completedAt !==
      undefined
    ) {
      achievement.completedAt =
        body.completedAt
          ? new Date(
              body.completedAt
            )
          : null;
    }

    /*
     * --------------------------------------------------------
     * METADATA
     * --------------------------------------------------------
     */

    if (
      body.metadata !==
      undefined
    ) {
      achievement.metadata =
        body.metadata;
    }

    await achievement.save();

    const updated =
      await UserAchievement.findById(
        achievement._id
      )
        .populate({
          path: "user",
          select:
            "_id name email role",
        })
        .lean();

    return NextResponse.json({
      success: true,

      message:
        "Achievement updated successfully",

      data: updated,
    });
  } catch (error) {
    console.error(
      "[ADMIN ACHIEVEMENTS] PATCH ERROR:",
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
 * DELETE
 * ============================================================
 */

export async function DELETE(
  request: Request,
  context: RouteContext
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

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Achievement ID is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const achievement =
      await UserAchievement.findById(id);

    if (!achievement) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Achievement not found",
        },
        { status: 404 }
      );
    }

    await UserAchievement.deleteOne({
      _id: id,
    });

    return NextResponse.json({
      success: true,
      message:
        "Achievement deleted successfully",
    });
  } catch (error) {
    console.error(
      "[ADMIN ACHIEVEMENTS] DELETE ERROR:",
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