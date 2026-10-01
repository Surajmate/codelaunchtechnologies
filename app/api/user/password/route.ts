import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "New password must contain at least 8 characters")
      .max(100, "New password is too long"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "New password and confirmation do not match",
      path: ["confirmPassword"],
    }
  );

export async function PUT(request: Request) {
  try {
    /*
     * Get authenticated user from the JWT cookie.
     */
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 }
      );
    }

    /*
     * Read request body.
     */
    const body = await request.json();

    /*
     * Validate request.
     */
    const validation = passwordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.error.issues[0]?.message ||
            "Invalid password information.",
        },
        { status: 400 }
      );
    }

    const {
      currentPassword,
      newPassword,
    } = validation.data;

    /*
     * Do not allow the same password.
     */
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    /*
     * Fetch user including password because password
     * is excluded from most user queries.
     */
    const user = await User.findById(
      currentUser.id
    ).select("+password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Disabled accounts cannot change password.
     */
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been disabled.",
        },
        { status: 403 }
      );
    }

    /*
     * Verify current password.
     */
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect.",
        },
        { status: 400 }
      );
    }

    /*
     * Hash the new password.
     */
    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    user.password = hashedPassword;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(
      "Update password error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update password.",
      },
      { status: 500 }
    );
  }
}