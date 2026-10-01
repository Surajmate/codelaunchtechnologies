import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

const preferencesSchema = z.object({
  courseUpdates: z.boolean(),
  assignmentUpdates: z.boolean(),
  certificateUpdates: z.boolean(),
  announcements: z.boolean(),
  emailNotifications: z.boolean(),
});

export async function GET() {
  try {
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

    await connectDB();

    const user = await User.findById(currentUser.id)
      .select("preferences isActive")
      .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been disabled.",
        },
        { status: 403 }
      );
    }

    const preferences = {
      courseUpdates:
        user.preferences?.courseUpdates ?? true,

      assignmentUpdates:
        user.preferences?.assignmentUpdates ?? true,

      certificateUpdates:
        user.preferences?.certificateUpdates ?? true,

      announcements:
        user.preferences?.announcements ?? true,

      emailNotifications:
        user.preferences?.emailNotifications ?? true,
    };

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error(
      "Get preferences error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load notification preferences.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
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

    const body = await request.json();

    const validation =
      preferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.error.issues[0]?.message ||
            "Invalid notification preferences.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(
      currentUser.id
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been disabled.",
        },
        { status: 403 }
      );
    }

    user.preferences = validation.data;

    await user.save();

    return NextResponse.json({
      success: true,
      message:
        "Notification preferences updated successfully.",
      preferences: {
        courseUpdates:
          user.preferences?.courseUpdates ?? true,

        assignmentUpdates:
          user.preferences?.assignmentUpdates ?? true,

        certificateUpdates:
          user.preferences?.certificateUpdates ?? true,

        announcements:
          user.preferences?.announcements ?? true,

        emailNotifications:
          user.preferences?.emailNotifications ?? true,
      },
    });
  } catch (error) {
    console.error(
      "Update preferences error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update notification preferences.",
      },
      { status: 500 }
    );
  }
}