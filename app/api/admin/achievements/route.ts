import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import UserAchievement from "@/models/UserAchievement";
import User from "@/models/User";

/*
 * ============================================================
 * GET
 * /api/admin/achievements
 *
 * List achievements
 * ============================================================
 */

export async function GET(
  request: NextRequest
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
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
     * Adjust this according to your actual
     * role values.
     */

    if (
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const page = Math.max(
      1,
      Number(
        searchParams.get("page") || "1"
      )
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(
          searchParams.get("limit") || "20"
        )
      )
    );

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "";

    const type =
      searchParams
        .get("type")
        ?.trim() || "";

    const filter: Record<
      string,
      any
    > = {};

    /*
     * Search
     */

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /*
     * Status filter
     */

    if (
      [
        "LOCKED",
        "IN_PROGRESS",
        "COMPLETED",
      ].includes(status)
    ) {
      filter.status = status;
    }

    /*
     * Type filter
     */

    if (
      [
        "COURSE",
        "PROJECT",
        "PRACTICE",
        "ROADMAP",
        "CERTIFICATE",
        "CUSTOM",
      ].includes(type)
    ) {
      filter.type = type;
    }

    const skip =
      (page - 1) * limit;

    const [
      achievements,
      total,
    ] = await Promise.all([
      UserAchievement.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "user",
          select:
            "_id name email role",
        })
        .lean(),

      UserAchievement.countDocuments(
        filter
      ),
    ]);

    const formatted =
      achievements.map(
        (achievement: any) => ({
          _id: String(
            achievement._id
          ),

          title:
            achievement.title,

          description:
            achievement.description ||
            "",

          type:
            achievement.type,

          status:
            achievement.status,

          progress:
            achievement.progress ?? 0,

          icon:
            achievement.icon ||
            "🏆",

          color:
            achievement.color ||
            "",

          awardedAt:
            achievement.awardedAt,

          createdAt:
            achievement.createdAt,

          updatedAt:
            achievement.updatedAt,

          user:
            achievement.user
              ? {
                  _id: String(
                    achievement
                      .user
                      ._id
                  ),

                  name:
                    achievement
                      .user
                      .name ||
                    "",

                  email:
                    achievement
                      .user
                      .email ||
                    "",

                  role:
                    achievement
                      .user
                      .role ||
                    "",
                }
              : null,
        })
      );

    return NextResponse.json({
      success: true,

      data: formatted,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    });
  } catch (error: any) {
    console.error(
      "[ADMIN ACHIEVEMENTS] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load achievements",

        error:
          error?.message ||
          "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * POST
 * /api/admin/achievements
 *
 * Create / assign achievement
 * ============================================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
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
     * Admin authorization
     */

    if (
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    await connectDB();

    const body =
      await request.json();

    const userId =
      typeof body.userId === "string"
        ? body.userId.trim()
        : "";

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    const type =
      typeof body.type === "string"
        ? body.type.trim().toUpperCase()
        : "CUSTOM";

    const progress =
      body.progress === undefined ||
      body.progress === null ||
      body.progress === ""
        ? 0
        : Number(body.progress);

    const icon =
      typeof body.icon === "string"
        ? body.icon.trim()
        : "🏆";

    const color =
      typeof body.color === "string"
        ? body.color.trim()
        : "";

    /*
     * ========================================================
     * VALIDATION
     * ========================================================
     */

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Achievement title is required",
        },
        {
          status: 400,
        }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Achievement title cannot exceed 200 characters",
        },
        {
          status: 400,
        }
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Description cannot exceed 1000 characters",
        },
        {
          status: 400,
        }
      );
    }

    const allowedTypes = [
      "COURSE",
      "PROJECT",
      "PRACTICE",
      "ROADMAP",
      "CERTIFICATE",
      "CUSTOM",
    ];

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid achievement type",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Progress must be between 0 and 100",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ========================================================
     * VERIFY USER
     * ========================================================
     */

    const user =
      await User.findById(userId)
        .select(
          "_id name email role"
        )
        .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ========================================================
     * CREATE ACHIEVEMENT
     * ========================================================
     */

    const achievement =
      new UserAchievement({
        user: user._id,

        title,

        description,

        type,

        progress,

        icon,

        color,
      });

    await achievement.save();

    /*
     * ========================================================
     * RESPONSE
     * ========================================================
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Achievement created successfully",

        data: {
          _id: String(
            achievement._id
          ),

          user: {
            _id: String(
              user._id
            ),

            name:
              user.name || "",

            email:
              user.email || "",

            role:
              user.role || "",
          },

          title:
            achievement.title,

          description:
            achievement.description ||
            "",

          type:
            achievement.type,

          status:
            achievement.status,

          progress:
            achievement.progress,

          icon:
            achievement.icon ||
            "🏆",

          color:
            achievement.color ||
            "",

          awardedAt:
            achievement.awardedAt,

          createdAt:
            achievement.createdAt,

          updatedAt:
            achievement.updatedAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "[ADMIN ACHIEVEMENTS] CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to create achievement",

        error:
          error?.message ||
          "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}