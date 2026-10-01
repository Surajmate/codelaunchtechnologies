import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name is too long")
    .trim(),

  phone: z
    .string()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),

  alternatePhone: z
    .string()
    .max(20, "Alternate phone number is too long")
    .optional()
    .or(z.literal("")),

  dateOfBirth: z
    .string()
    .optional()
    .or(z.literal("")),

  gender: z
    .string()
    .max(30)
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(300, "Address is too long")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),

  state: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),

  country: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),

  pincode: z
    .string()
    .max(20)
    .optional()
    .or(z.literal("")),

  qualification: z
    .string()
    .max(150)
    .optional()
    .or(z.literal("")),

  course: z
    .string()
    .max(150)
    .optional()
    .or(z.literal("")),

  specialization: z
    .string()
    .max(150)
    .optional()
    .or(z.literal("")),

  college: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),

  university: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),

  graduationYear: z
    .string()
    .max(10)
    .optional()
    .or(z.literal("")),

  educationStatus: z
    .string()
    .max(50)
    .optional()
    .or(z.literal("")),
});

/**
 * GET
 * Returns the currently logged-in user's profile.
 */
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
      .select("-password")
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

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",

        phone: user.phone || "",
        alternatePhone: user.alternatePhone || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",

        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "India",
        pincode: user.pincode || "",

        education: {
          qualification:
            user.education?.qualification || "",
          course: user.education?.course || "",
          specialization:
            user.education?.specialization || "",
          college: user.education?.college || "",
          university:
            user.education?.university || "",
          graduationYear:
            user.education?.graduationYear || "",
          status:
            user.education?.status || "",
        },

        approvalStatus:
          user.approvalStatus || "PENDING",

        isActive: user.isActive,

        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load profile.",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT
 * Updates the currently logged-in user's profile.
 */
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

    const validation = profileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.error.issues[0]?.message ||
            "Invalid profile information.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(currentUser.id);

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

    const data = validation.data;

    /*
     * We intentionally do NOT allow users to change:
     *
     * - email
     * - role
     * - approvalStatus
     * - isActive
     * - password
     * - batch
     * - assigned courses
     *
     * Those fields must be controlled by the appropriate
     * authentication/admin APIs.
     */

    user.name = data.name;

    user.phone = data.phone || "";
    user.alternatePhone = data.alternatePhone || "";
    user.dateOfBirth = data.dateOfBirth || "";
    user.gender = data.gender || "";

    user.address = data.address || "";
    user.city = data.city || "";
    user.state = data.state || "";
    user.country = data.country || "India";
    user.pincode = data.pincode || "";

    user.education = {
      qualification: data.qualification || "",
      course: data.course || "",
      specialization: data.specialization || "",
      college: data.college || "",
      university: data.university || "",
      graduationYear: data.graduationYear || "",
      status: data.educationStatus || "",
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",

        phone: user.phone || "",
        alternatePhone: user.alternatePhone || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",

        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "India",
        pincode: user.pincode || "",

        education: {
          qualification:
            user.education?.qualification || "",
          course:
            user.education?.course || "",
          specialization:
            user.education?.specialization || "",
          college:
            user.education?.college || "",
          university:
            user.education?.university || "",
          graduationYear:
            user.education?.graduationYear || "",
          status:
            user.education?.status || "",
        },

        approvalStatus:
          user.approvalStatus || "PENDING",

        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update profile.",
      },
      { status: 500 }
    );
  }
}