import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { createToken, getAuthCookieName } from "@/lib/auth";

const signupSchema = z.object({
  // ============================================================
  // PERSONAL DETAILS
  // ============================================================

  name: z
    .string()
    .min(2, "Name must contain at least 2 characters")
    .max(100)
    .trim(),

  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(100),

  phone: z
    .string()
    .min(7, "Please enter a valid mobile number")
    .max(20)
    .trim(),

  dateOfBirth: z
    .string()
    .optional()
    .default(""),

  gender: z
    .enum([
      "",
      "MALE",
      "FEMALE",
      "OTHER",
      "PREFER_NOT_TO_SAY",
    ])
    .optional()
    .default(""),

  // ============================================================
  // ADDRESS / CONTACT
  // ============================================================

  address: z
    .string()
    .max(300)
    .optional()
    .default(""),

  city: z
    .string()
    .max(100)
    .optional()
    .default(""),

  state: z
    .string()
    .max(100)
    .optional()
    .default(""),

  country: z
    .string()
    .max(100)
    .optional()
    .default("India"),

  pincode: z
    .string()
    .max(20)
    .optional()
    .default(""),

  // ============================================================
  // EDUCATION
  // ============================================================

  highestQualification: z.enum([
    "10TH",
    "12TH",
    "DIPLOMA",
    "BACHELOR",
    "MASTER",
    "DOCTORATE",
    "OTHER",
  ]),

  specialization: z
    .string()
    .max(150)
    .optional()
    .default(""),

  college: z
    .string()
    .max(200)
    .optional()
    .default(""),

  university: z
    .string()
    .max(200)
    .optional()
    .default(""),

  graduationYear: z
    .string()
    .max(4)
    .optional()
    .default(""),

  // ============================================================
  // PROFESSIONAL
  // ============================================================

  employmentStatus: z
    .enum([
      "",
      "STUDENT",
      "EMPLOYED",
      "SELF_EMPLOYED",
      "FREELANCER",
      "JOB_SEEKER",
      "OTHER",
    ])
    .optional()
    .default(""),

  company: z
    .string()
    .max(200)
    .optional()
    .default(""),

  designation: z
    .string()
    .max(150)
    .optional()
    .default(""),

  experience: z
    .string()
    .max(50)
    .optional()
    .default(""),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ============================================================
    // VALIDATION
    // ============================================================

    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    await connectDB();

    // ============================================================
    // CHECK EXISTING USER
    // ============================================================

    const existingUser = await User.findOne({
      email: data.email,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // ============================================================
    // HASH PASSWORD
    // ============================================================

    const hashedPassword = await bcrypt.hash(
      data.password,
      12
    );

    // ============================================================
    // CREATE USER
    // ============================================================

    const user = await User.create({
      // Personal
      name: data.name,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,

      // Address
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,

      // Education
      highestQualification:
        data.highestQualification,
      specialization: data.specialization,
      college: data.college,
      university: data.university,
      graduationYear: data.graduationYear,

      // Professional
      employmentStatus:
        data.employmentStatus,
      company: data.company,
      designation: data.designation,
      experience: data.experience,

      // Account
      password: hashedPassword,
      role: "USER",
      avatar: "",
      isActive: true,
    });

    // ============================================================
    // AUTH USER
    // ============================================================

    const authUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    // ============================================================
    // CREATE JWT
    // ============================================================

    const token = createToken(authUser);

    // ============================================================
    // RESPONSE
    // ============================================================

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: authUser,
    });

    // ============================================================
    // AUTH COOKIE
    // ============================================================

    response.cookies.set({
      name: getAuthCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create account.",
      },
      { status: 500 }
    );
  }
}