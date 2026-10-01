import { NextResponse } from "next/server";
import crypto from "crypto";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Course from "@/models/Course";
import CourseEnrollment from "@/models/CourseEnrollment";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
 * ======================================================
 * GET CERTIFICATE
 * ======================================================
 *
 * GET
 * /api/courses/[id]/certificate
 *
 * Returns the user's certificate if it has already
 * been issued.
 *
 * ======================================================
 */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const user =
      await getCurrentUser();

    if (!user) {
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
     * --------------------------------------------------
     * DATABASE
     * --------------------------------------------------
     */

    await connectDB();

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * FIND COURSE
     * --------------------------------------------------
     */

    const course =
      await findCourse(id);

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message: "Course not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------
     * FIND ENROLLMENT
     * --------------------------------------------------
     */

    const enrollment =
      await CourseEnrollment.findOne(
        {
          user: user.id,
          course: course._id,
        }
      ).lean();

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not enrolled in this course",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * --------------------------------------------------
     * CHECK COMPLETION
     * --------------------------------------------------
     */

    const completed =
      enrollment.status ===
        "COMPLETED" ||
      Number(
        enrollment.progress || 0
      ) >= 100;

    if (!completed) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Complete the course to receive your certificate",

          eligible: false,

          progress:
            enrollment.progress || 0,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * CHECK CERTIFICATE
     * --------------------------------------------------
     */

    const certificate =
      enrollment.certificate;

    if (
      certificate &&
      certificate.issued
    ) {
      return NextResponse.json({
        success: true,

        issued: true,

        certificate: {
          certificateId:
            certificate.certificateId,

          issuedAt:
            certificate.issuedAt,

          url:
            certificate.url ||
            "",

          course: {
            _id: String(
              course._id
            ),

            title:
              course.title,

            slug:
              course.slug,
          },

          user: {
            id:
              user.id,

            name:
              user.name,

            email:
              user.email,
          },
        },
      });
    }

    /*
     * --------------------------------------------------
     * CERTIFICATE DISABLED
     * --------------------------------------------------
     */

    if (
      course.certificateEnabled ===
      false
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Certificates are not enabled for this course",

          eligible: false,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * NOT YET GENERATED
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      issued: false,

      eligible: true,

      message:
        "Certificate is ready to be generated",

      certificate: null,
    });
  } catch (error) {
    console.error(
      "[USER CERTIFICATE] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load certificate",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ======================================================
 * GENERATE CERTIFICATE
 * ======================================================
 *
 * POST
 * /api/courses/[id]/certificate
 *
 * ======================================================
 */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const user =
      await getCurrentUser();

    if (!user) {
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
     * --------------------------------------------------
     * DATABASE
     * --------------------------------------------------
     */

    await connectDB();

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * COURSE
     * --------------------------------------------------
     */

    const course =
      await findCourse(id);

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message: "Course not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------
     * CERTIFICATE ENABLED
     * --------------------------------------------------
     */

    if (
      course.certificateEnabled ===
      false
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Certificates are not enabled for this course",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * ENROLLMENT
     * --------------------------------------------------
     */

    const enrollment =
      await CourseEnrollment.findOne(
        {
          user: user.id,
          course: course._id,
        }
      );

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You are not enrolled in this course",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * --------------------------------------------------
     * COMPLETION
     * --------------------------------------------------
     */

    const completed =
      enrollment.status ===
        "COMPLETED" ||
      Number(
        enrollment.progress || 0
      ) >= 100;

    if (!completed) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Complete the course before generating the certificate",

          eligible: false,

          progress:
            enrollment.progress || 0,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * ALREADY ISSUED
     * --------------------------------------------------
     */

    if (
      enrollment.certificate &&
      enrollment.certificate
        .issued
    ) {
      return NextResponse.json({
        success: true,

        message:
          "Certificate already issued",

        alreadyIssued:
          true,

        certificate: {
          certificateId:
            enrollment.certificate
              .certificateId,

          issuedAt:
            enrollment.certificate
              .issuedAt,

          url:
            enrollment.certificate
              .url ||
            "",

          course: {
            _id: String(
              course._id
            ),

            title:
              course.title,

            slug:
              course.slug,
          },

          user: {
            id:
              user.id,

            name:
              user.name,

            email:
              user.email,
          },
        },
      });
    }

    /*
     * --------------------------------------------------
     * GENERATE CERTIFICATE ID
     * --------------------------------------------------
     *
     * Example:
     *
     * CLT-2026-8F42A91C
     *
     * --------------------------------------------------
     */

    const certificateId =
      generateCertificateId();

    const issuedAt =
      new Date();

    /*
     * --------------------------------------------------
     * CERTIFICATE URL
     * --------------------------------------------------
     *
     * This is the public verification/view route.
     *
     * The actual PDF can be generated later.
     * --------------------------------------------------
     */

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "";

    const certificateUrl =
      baseUrl
        ? `${baseUrl}/certificate/${certificateId}`
        : `/certificate/${certificateId}`;

    /*
     * --------------------------------------------------
     * SAVE CERTIFICATE
     * --------------------------------------------------
     */

    enrollment.certificate = {
      issued: true,

      certificateId,

      issuedAt,

      url:
        certificateUrl,
    };

    enrollment.completedAt =
      enrollment.completedAt ||
      issuedAt;

    enrollment.status =
      "COMPLETED";

    enrollment.progress =
      100;

    await enrollment.save();

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Certificate generated successfully",

        alreadyIssued:
          false,

        certificate: {
          certificateId,

          issuedAt,

          url:
            certificateUrl,

          course: {
            _id: String(
              course._id
            ),

            title:
              course.title,

            slug:
              course.slug,

            category:
              course.category,

            level:
              course.level,
          },

          user: {
            id:
              user.id,

            name:
              user.name,

            email:
              user.email,
          },

          completion: {
            progress:
              100,

            completedAt:
              enrollment.completedAt,
          },
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[USER CERTIFICATE] POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to generate certificate",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ======================================================
 * FIND COURSE
 * ======================================================
 */

async function findCourse(
  id: string
) {
  let course: any = null;

  /*
   * ObjectId lookup.
   */

  if (
    isValidObjectId(id)
  ) {
    course =
      await Course.findOne({
        _id: id,

        status:
          "PUBLISHED",
      }).lean();
  }

  /*
   * Slug lookup.
   */

  if (!course) {
    course =
      await Course.findOne({
        slug: id
          .trim()
          .toLowerCase(),

        status:
          "PUBLISHED",
      }).lean();
  }

  return course;
}

/*
 * ======================================================
 * GENERATE CERTIFICATE ID
 * ======================================================
 */

function generateCertificateId() {
  const year =
    new Date()
      .getFullYear();

  const random =
    crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

  return `CLT-${year}-${random}`;
}

/*
 * ======================================================
 * OBJECT ID VALIDATION
 * ======================================================
 */

function isValidObjectId(
  value: string
) {
  return /^[a-fA-F0-9]{24}$/.test(
    value
  );
}