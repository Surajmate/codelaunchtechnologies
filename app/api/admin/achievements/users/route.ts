import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";
import User from "@/models/User";

/*
 * ============================================================
 * GET ACTIVE USERS
 * ============================================================
 *
 * GET
 * /api/admin/achievements/users
 *
 * Returns users that can receive achievements.
 *
 * ============================================================
 */

export async function GET() {
  try {
    console.log(
      "[ADMIN ACHIEVEMENTS USERS] GET started"
    );

    /*
     * --------------------------------------------------------
     * ADMIN AUTHENTICATION
     * --------------------------------------------------------
     */

    const auth = await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * --------------------------------------------------------
     * DATABASE
     * --------------------------------------------------------
     */

    await connectDB();

    /*
     * --------------------------------------------------------
     * LOAD ACTIVE USERS
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * Adjust this condition only if your User model uses
     * a different field for account activation.
     *
     * Current expected field:
     *
     * isActive: true
     *
     * --------------------------------------------------------
     */

    const users = await User.find({
      isActive: true,
    })
      .select("_id name email role")
      .sort({
        name: 1,
        email: 1,
      })
      .lean();

    /*
     * --------------------------------------------------------
     * SANITIZE RESPONSE
     * --------------------------------------------------------
     */

    const safeUsers = users.map(
      (user: any) => ({
        _id: String(user._id),

        name:
          user.name || "",

        email:
          user.email || "",

        role:
          user.role || "",
      })
    );

    console.log(
      "[ADMIN ACHIEVEMENTS USERS] Active users:",
      safeUsers.length
    );

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      users: safeUsers,

      total:
        safeUsers.length,
    });
  } catch (error) {
    console.error(
      "[ADMIN ACHIEVEMENTS USERS] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load active users",

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