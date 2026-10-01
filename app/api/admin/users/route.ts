import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";

import User from "@/models/User";

export async function GET(
  request: Request
) {
  try {
    console.log(
      "[ADMIN USERS] Starting request"
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
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------------
     * QUERY PARAMETERS
     * ------------------------------------------------------
     */

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const role =
      searchParams
        .get("role")
        ?.trim() || "ALL";

    const status =
      searchParams
        .get("status")
        ?.trim() || "ALL";

    const pageParam =
      Number(
        searchParams.get("page") ||
          "1"
      );

    const limitParam =
      Number(
        searchParams.get("limit") ||
          "20"
      );

    /*
     * ------------------------------------------------------
     * PAGINATION VALIDATION
     * ------------------------------------------------------
     */

    const page =
      Number.isFinite(
        pageParam
      ) && pageParam > 0
        ? Math.floor(pageParam)
        : 1;

    const limit =
      Number.isFinite(
        limitParam
      ) &&
      limitParam > 0
        ? Math.min(
            Math.floor(
              limitParam
            ),
            100
          )
        : 20;

    const skip =
      (page - 1) * limit;

    /*
     * ------------------------------------------------------
     * BUILD FILTER
     * ------------------------------------------------------
     */

    const filter: Record<
      string,
      unknown
    > = {};

    /*
     * SEARCH
     *
     * Name OR email
     */

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },

        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /*
     * ROLE FILTER
     */

    if (
      role !== "ALL" &&
      [
        "USER",
        "ADMIN",
        "SUPER_ADMIN",
      ].includes(role)
    ) {
      filter.role = role;
    }

    /*
     * STATUS FILTER
     */

    if (
      status === "ACTIVE"
    ) {
      filter.isActive = true;
    }

    if (
      status === "INACTIVE"
    ) {
      filter.isActive = false;
    }

    /*
     * ------------------------------------------------------
     * LOAD USERS
     * ------------------------------------------------------
     *
     * NEVER return password.
     */

    const [
      users,
      totalUsers,
      totalActiveUsers,
      totalInactiveUsers,
      totalAdmins,
      totalRegularUsers,
    ] =
      await Promise.all([
        User.find(filter)
          .select(
            "_id name email role avatar isActive createdAt updatedAt"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        /*
         * Filtered total
         */

        User.countDocuments(
          filter
        ),

        /*
         * Global active users
         */

        User.countDocuments({
          isActive: true,
        }),

        /*
         * Global inactive users
         */

        User.countDocuments({
          isActive: false,
        }),

        /*
         * Admin users
         */

        User.countDocuments({
          role: {
            $in: [
              "ADMIN",
              "SUPER_ADMIN",
            ],
          },
        }),

        /*
         * Regular users
         */

        User.countDocuments({
          role: "USER",
        }),
      ]);

    /*
     * ------------------------------------------------------
     * PAGINATION
     * ------------------------------------------------------
     */

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          totalUsers / limit
        )
      );

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      users,

      pagination: {
        page,

        limit,

        total:
          totalUsers,

        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },

      stats: {
        total:
          totalUsers,

        active:
          totalActiveUsers,

        inactive:
          totalInactiveUsers,

        admins:
          totalAdmins,

        regularUsers:
          totalRegularUsers,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN USERS] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load users",

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