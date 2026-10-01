import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * Require the current user to be an ADMIN or SUPER_ADMIN.
 *
 * Used by all /api/admin/* routes.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();

  /**
   * User is not logged in
   */
  if (!user) {
    return {
      ok: false as const,

      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      ),
    };
  }

  /**
   * User is logged in but doesn't
   * have administrator permissions.
   */
  if (
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN"
  ) {
    return {
      ok: false as const,

      response: NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        {
          status: 403,
        }
      ),
    };
  }

  /**
   * Administrator authenticated successfully.
   */
  return {
    ok: true as const,
    user,
  };
}