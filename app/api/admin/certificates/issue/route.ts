import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import User from "@/models/User";
import Certificate from "@/models/Certificate";
import Course from "@/models/Course";
import UserCertificate from "@/models/UserCertificate";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function cleanString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidObjectId(value: unknown): boolean {
  return (
    typeof value === "string" &&
    mongoose.Types.ObjectId.isValid(value)
  );
}

/*
 * ============================================================
 * ADMIN AUTH
 * ============================================================
 */

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      status: 401,
      message: "Unauthorized.",
      user: null,
    };
  }

  const currentUser = user as any;

  const role = cleanString(
    currentUser?.role
  ).toUpperCase();

  const isAdmin =
    currentUser?.isAdmin === true ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN";

  if (!isAdmin) {
    return {
      ok: false,
      status: 403,
      message:
        "Forbidden. Admin access required.",
      user: null,
    };
  }

  return {
    ok: true,
    status: 200,
    message: "",
    user,
  };
}

/*
 * ============================================================
 * CERTIFICATE NUMBER
 * ============================================================
 *
 * Example:
 *
 * CLT-2026-000001
 *
 * ============================================================
 */

async function generateCertificateNumber() {
  const year =
    new Date().getFullYear();

  for (let attempt = 0; attempt < 10; attempt++) {
    const count =
      await UserCertificate.countDocuments({
        certificateNumber: {
          $regex: `^CLT-${year}-`,
        },
      });

    const sequence =
      count + 1 + attempt;

    const candidate =
      `CLT-${year}-${String(
        sequence
      ).padStart(6, "0")}`;

    const exists =
      await UserCertificate.exists({
        certificateNumber:
          candidate,
      });

    if (!exists) {
      return candidate;
    }
  }

  /*
   * Extremely unlikely fallback.
   */

  return `CLT-${year}-${Date.now()
    .toString()
    .slice(-6)}`;
}

/*
 * ============================================================
 * VERIFICATION CODE
 * ============================================================
 */

function generateVerificationCode(): string {
  return crypto
    .randomBytes(24)
    .toString("hex")
    .toUpperCase();
}

/*
 * ============================================================
 * POST
 * ============================================================
 *
 * POST
 * /api/admin/certificates/issue
 *
 * Creates an issued UserCertificate.
 *
 * ============================================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    console.log(
      "=================================================="
    );

    console.log(
      "[ADMIN CERTIFICATE ISSUE] START"
    );

    console.log(
      "=================================================="
    );

    /*
     * --------------------------------------------------------
     * ADMIN AUTH
     * --------------------------------------------------------
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * DATABASE
     * --------------------------------------------------------
     */

    await connectDB();

    /*
     * --------------------------------------------------------
     * REQUEST BODY
     * --------------------------------------------------------
     */

    let body: any;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "[ADMIN CERTIFICATE ISSUE] PAYLOAD:",
      body
    );

    /*
     * --------------------------------------------------------
     * USER
     * --------------------------------------------------------
     *
     * Accept both:
     *
     * user
     * userId
     *
     * This prevents frontend/backend naming mismatch.
     * --------------------------------------------------------
     */

    const userId =
      cleanString(
        body?.user ||
          body?.userId
      );

    console.log(
      "[ADMIN CERTIFICATE ISSUE] USER ID:",
      userId
    );

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidObjectId(
        userId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * CERTIFICATE
     * --------------------------------------------------------
     *
     * Accept:
     *
     * certificate
     * certificateId
     *
     * --------------------------------------------------------
     */

    const certificateId =
      cleanString(
        body?.certificate ||
          body?.certificateId
      );

    console.log(
      "[ADMIN CERTIFICATE ISSUE] CERTIFICATE ID:",
      certificateId
    );

    if (!certificateId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidObjectId(
        certificateId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid certificate ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * LOAD USER
     * --------------------------------------------------------
     */

    const user =
      await User.findById(
        userId
      )
        .select(
          "_id name email role isActive"
        )
        .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected user was not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * ACTIVE USER CHECK
     * --------------------------------------------------------
     */

    if (
      user.isActive ===
      false
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected user is inactive.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * LOAD CERTIFICATE DEFINITION
     * --------------------------------------------------------
     */

    const certificate =
      await Certificate.findById(
        certificateId
      )
        .lean();

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate definition was not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * ACTIVE CERTIFICATE CHECK
     * --------------------------------------------------------
     */

    if (
      certificate.isActive ===
        false ||
      certificate.status !==
        "ACTIVE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This certificate is inactive and cannot be issued.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * COURSE
     * --------------------------------------------------------
     */

    const courseId =
      certificate.course;

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate is not associated with a course.",
        },
        {
          status: 400,
        }
      );
    }

    const course =
      await Course.findById(
        courseId
      )
        .select(
          "_id title slug status isActive"
        )
        .lean();

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate course was not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * EXISTING CERTIFICATE
     * --------------------------------------------------------
     *
     * The UserCertificate model intentionally has a unique
     * index on:
     *
     * user + certificate
     *
     * So a user should not receive the same certificate
     * definition twice.
     * --------------------------------------------------------
     */

    const existing =
      await UserCertificate.findOne({
        user:
          new mongoose.Types.ObjectId(
            userId
          ),

        certificate:
          new mongoose.Types.ObjectId(
            certificateId
          ),
      })
        .select(
          "_id certificateNumber verificationCode status"
        )
        .lean();

    if (existing) {
      return NextResponse.json(
        {
          success: false,

          message:
            "This certificate has already been issued to this user.",

          certificate: {
            _id: String(
              existing._id
            ),

            certificateNumber:
              existing.certificateNumber,

            verificationCode:
              existing.verificationCode,

            status:
              existing.status,
          },
        },
        {
          status: 409,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * COMPLETION
     * --------------------------------------------------------
     *
     * Manual admin issuance means the admin is explicitly
     * issuing the certificate.
     *
     * Therefore:
     *
     * completionPercentage = 100
     *
     * If a future workflow requires checking actual course
     * progress, this should be changed to read enrollment
     * progress instead.
     * --------------------------------------------------------
     */

    const completionPercentage =
      100;

    /*
     * --------------------------------------------------------
     * FINAL SCORE
     * --------------------------------------------------------
     *
     * Optional.
     *
     * If supplied, validate it.
     * --------------------------------------------------------
     */

    let finalScore:
      | number
      | null =
      null;

    if (
      body?.finalScore !==
        undefined &&
      body?.finalScore !==
        null &&
      body?.finalScore !==
        ""
    ) {
      const parsedScore =
        Number(
          body.finalScore
        );

      if (
        !Number.isFinite(
          parsedScore
        ) ||
        parsedScore < 0 ||
        parsedScore > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Final score must be between 0 and 100.",
          },
          {
            status: 400,
          }
        );
      }

      finalScore =
        parsedScore;
    }

    /*
     * --------------------------------------------------------
     * ISSUE DATE
     * --------------------------------------------------------
     */

    const issuedAt =
      new Date();

    /*
     * --------------------------------------------------------
     * EXPIRY
     * --------------------------------------------------------
     */

    let expiresAt:
      | Date
      | null =
      null;

    if (
      certificate.validity ===
      "LIMITED"
    ) {
      const validityDays =
        Number(
          certificate.validityDays
        );

      if (
        !Number.isFinite(
          validityDays
        ) ||
        validityDays < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Certificate has invalid validity configuration.",
          },
          {
            status: 400,
          }
        );
      }

      expiresAt =
        new Date(
          issuedAt.getTime() +
            validityDays *
              24 *
              60 *
              60 *
              1000
        );
    }

    /*
     * --------------------------------------------------------
     * CERTIFICATE NUMBER
     * --------------------------------------------------------
     */

    const certificateNumber =
      await generateCertificateNumber();

    /*
     * --------------------------------------------------------
     * VERIFICATION CODE
     * --------------------------------------------------------
     */

    const verificationCode =
      generateVerificationCode();

    /*
     * --------------------------------------------------------
     * NOTES
     * --------------------------------------------------------
     *
     * The current UserCertificate model doesn't have a notes
     * field, so notes are intentionally not stored here.
     *
     * If you want permanent admin issuance notes later,
     * we can add:
     *
     * issuanceNote
     *
     * to UserCertificate.
     * --------------------------------------------------------
     */

    /*
     * --------------------------------------------------------
     * CREATE USER CERTIFICATE
     * --------------------------------------------------------
     */

    console.log(
      "[ADMIN CERTIFICATE ISSUE] CREATING..."
    );

    const userCertificate =
      await UserCertificate.create({
        user:
          new mongoose.Types.ObjectId(
            userId
          ),

        certificate:
          new mongoose.Types.ObjectId(
            certificateId
          ),

        course:
          new mongoose.Types.ObjectId(
            String(
              course._id
            )
          ),

        certificateNumber,

        verificationCode,

        status:
          "ISSUED",

        issuedAt,

        expiresAt,

        revokedAt:
          undefined,

        revokedReason:
          undefined,

        finalScore,

        completionPercentage,

        pdfUrl:
          "",

        metadata: {
          userName:
            user.name ||
            "",

          userEmail:
            user.email ||
            "",

          courseTitle:
            course.title ||
            "",

          certificateTitle:
            certificate.title ||
            "",

          issuerName:
            certificate.issuerName ||
            certificate.issuer ||
            "",
        },
      });

    console.log(
      "[ADMIN CERTIFICATE ISSUE] CREATED:",
      String(
        userCertificate._id
      )
    );

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Certificate issued successfully.",

        certificate: {
          _id: String(
            userCertificate._id
          ),

          certificateNumber,

          verificationCode,

          status:
            userCertificate.status,

          issuedAt:
            userCertificate.issuedAt,

          expiresAt:
            userCertificate.expiresAt,

          pdfUrl:
            userCertificate.pdfUrl ||
            "",

          user: {
            _id: String(
              user._id
            ),

            name:
              user.name,

            email:
              user.email,
          },

          course: {
            _id: String(
              course._id
            ),

            title:
              course.title,

            slug:
              course.slug,
          },

          certificateDefinition: {
            _id: String(
              certificate._id
            ),

            title:
              certificate.title,

            issuer:
              certificate.issuer,

            issuerName:
              certificate.issuerName ||
              certificate.issuer,

            validity:
              certificate.validity,

            validityDays:
              certificate.validityDays ||
              null,
          },
        },
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "=================================================="
    );

    console.error(
      "[ADMIN CERTIFICATE ISSUE] ERROR"
    );

    console.error(
      "=================================================="
    );

    console.error(
      error
    );

    /*
     * --------------------------------------------------------
     * MONGOOSE VALIDATION ERROR
     * --------------------------------------------------------
     */

    if (
      error?.name ===
      "ValidationError"
    ) {
      const errors: Record<
        string,
        string
      > = {};

      for (
        const [
          field,
          fieldError,
        ] of Object.entries(
          error.errors || {}
        )
      ) {
        errors[field] =
          (fieldError as any)
            ?.message ||
          "Invalid value.";
      }

      return NextResponse.json(
        {
          success: false,

          message:
            "Certificate issuance validation failed.",

          errors,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * DUPLICATE KEY
     * --------------------------------------------------------
     */

    if (
      error?.code ===
      11000
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "This certificate has already been issued to this user, or a certificate number/verification code collision occurred.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * CAST ERROR
     * --------------------------------------------------------
     */

    if (
      error?.name ===
      "CastError"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `Invalid ${error.path || "certificate"} value.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * GENERAL ERROR
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: false,

        message:
          process.env.NODE_ENV ===
          "development"
            ? error?.message ||
              "Unable to issue certificate."
            : "Unable to issue certificate.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? {
                name:
                  error?.name,

                message:
                  error?.message,

                code:
                  error?.code,
              }
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}