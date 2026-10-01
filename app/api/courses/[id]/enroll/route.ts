import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Course from "@/models/Course";
import CourseLesson from "@/models/CourseLesson";
import CourseEnrollment from "@/models/CourseEnrollment";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
 * ======================================================
 * ENROLL IN COURSE
 * ======================================================
 *
 * POST
 * /api/courses/[id]/enroll
 *
 * Supported [id]:
 *
 * - MongoDB Course ObjectId
 * - Course slug
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

    /*
     * --------------------------------------------------
     * PARAMETER
     * --------------------------------------------------
     */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Course ID is required",
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

    let course: any = null;

    if (
      isValidObjectId(id)
    ) {
      course =
        await Course.findOne({
          _id: id,
          status: "PUBLISHED",
        }).lean();
    }

    /*
     * Try slug if ObjectId lookup didn't find
     * anything.
     */

    if (!course) {
      course =
        await Course.findOne({
          slug: id
            .trim()
            .toLowerCase(),
          status: "PUBLISHED",
        }).lean();
    }

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
     * CHECK EXISTING ENROLLMENT
     * --------------------------------------------------
     */

    const existingEnrollment =
      await CourseEnrollment.findOne(
        {
          user: user.id,
          course: course._id,
        }
      );

    /*
     * --------------------------------------------------
     * EXISTING ACTIVE ENROLLMENT
     * --------------------------------------------------
     */

    if (
      existingEnrollment &&
      (
        existingEnrollment.status ===
          "ACTIVE" ||
        existingEnrollment.status ===
          "COMPLETED"
      )
    ) {
      return NextResponse.json({
        success: true,

        message:
          existingEnrollment.status ===
          "COMPLETED"
            ? "Course already completed"
            : "Already enrolled in this course",

        alreadyEnrolled: true,

        enrollment: formatEnrollment(
          existingEnrollment
        ),
      });
    }

    /*
     * --------------------------------------------------
     * CHECK COURSE PRICE
     * --------------------------------------------------
     */

    const isFree =
      Boolean(course.isFree) ||
      Number(course.price || 0) <= 0;

    /*
     * --------------------------------------------------
     * PAID COURSE
     * --------------------------------------------------
     *
     * We are not processing payment yet.
     *
     * The payment module can later create a payment
     * order before the enrollment is activated.
     * --------------------------------------------------
     */

    if (!isFree) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Payment is required before enrolling in this course",

          requiresPayment: true,

          course: {
            _id: String(
              course._id
            ),

            title:
              course.title,

            price:
              course.price,

            discountPrice:
              course.discountPrice,

            currency:
              course.currency,
          },
        },
        {
          status: 402,
        }
      );
    }

    /*
     * --------------------------------------------------
     * COUNT LESSONS
     * --------------------------------------------------
     *
     * Only published lessons count toward course
     * completion.
     */

    const totalLessonCount =
      await CourseLesson.countDocuments(
        {
          course:
            course._id,

          status:
            "PUBLISHED",
        }
      );

    /*
     * --------------------------------------------------
     * ENROLLMENT DATA
     * --------------------------------------------------
     */

    const enrollmentData: any = {
      user:
        user.id,

      course:
        course._id,

      status:
        "ACTIVE",

      progress:
        0,

      completedLessons:
        [],

      completedLessonCount:
        0,

      totalLessonCount,

      lastAccessedLesson:
        null,

      lastAccessedModule:
        null,

      lastAccessedAt:
        null,

      startedAt:
        null,

      completedAt:
        null,

      enrolledAt:
        new Date(),

      expiresAt:
        null,

      timeSpentSeconds:
        0,

      lastSessionSeconds:
        0,

      certificate: {
        issued:
          false,

        certificateId:
          "",

        issuedAt:
          null,

        url:
          "",
      },

      payment: {
        status:
          "NOT_REQUIRED",

        amount:
          0,

        currency:
          course.currency ||
          "INR",

        transactionId:
          "",

        paidAt:
          null,
      },

      enrollmentSource:
        "SELF",

      createdBy:
        user.id,

      updatedBy:
        user.id,
    };

    /*
     * --------------------------------------------------
     * CREATE / REACTIVATE ENROLLMENT
     * --------------------------------------------------
     */

    let enrollment:
      | any
      | null = null;

    if (
      existingEnrollment
    ) {
      /*
       * Reactivate a previously cancelled/expired
       * enrollment.
       *
       * We reset progress so the enrollment starts
       * cleanly.
       */

      existingEnrollment.status =
        "ACTIVE";

      existingEnrollment.progress =
        0;

      existingEnrollment.completedLessons =
        [];

      existingEnrollment.completedLessonCount =
        0;

      existingEnrollment.totalLessonCount =
        totalLessonCount;

      existingEnrollment.lastAccessedLesson =
        null;

      existingEnrollment.lastAccessedModule =
        null;

      existingEnrollment.lastAccessedAt =
        null;

      existingEnrollment.startedAt =
        null;

      existingEnrollment.completedAt =
        null;

      existingEnrollment.enrolledAt =
        new Date();

      existingEnrollment.expiresAt =
        null;

      existingEnrollment.timeSpentSeconds =
        0;

      existingEnrollment.lastSessionSeconds =
        0;

      existingEnrollment.certificate = {
        issued:
          false,

        certificateId:
          "",

        issuedAt:
          null,

        url:
          "",
      };

      existingEnrollment.payment = {
        status:
          "NOT_REQUIRED",

        amount:
          0,

        currency:
          course.currency ||
          "INR",

        transactionId:
          "",

        paidAt:
          null,
      };

      existingEnrollment.enrollmentSource =
        "SELF";

      existingEnrollment.updatedBy =
        user.id;

      enrollment =
        await existingEnrollment.save();
    } else {
      enrollment =
        await CourseEnrollment.create(
          enrollmentData
        );
    }

    /*
     * --------------------------------------------------
     * UPDATE COURSE ENROLLMENT COUNT
     * --------------------------------------------------
     *
     * Increment only when this is a new enrollment
     * or a reactivation.
     */

    await Course.updateOne(
      {
        _id: course._id,
      },
      {
        $inc: {
          enrollmentCount:
            1,
        },
      }
    );

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Successfully enrolled in course",

        alreadyEnrolled:
          false,

        enrollment:
          formatEnrollment(
            enrollment
          ),

        course: {
          _id: String(
            course._id
          ),

          title:
            course.title,

          slug:
            course.slug,

          totalLessonCount,

          durationMinutes:
            course.durationMinutes ||
            0,

          certificateEnabled:
            Boolean(
              course.certificateEnabled
            ),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[USER COURSES] ENROLL ERROR:",
      error
    );

    /*
     * --------------------------------------------------
     * DUPLICATE KEY
     * --------------------------------------------------
     *
     * Protect against two simultaneous enrollment
     * requests.
     */

    if (
      isDuplicateKeyError(
        error
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You are already enrolled in this course",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to enroll in course",

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
 * FORMAT ENROLLMENT
 * ======================================================
 */

function formatEnrollment(
  enrollment: any
) {
  return {
    _id: String(
      enrollment._id
    ),

    user: String(
      enrollment.user
    ),

    course: String(
      enrollment.course
    ),

    status:
      enrollment.status,

    progress:
      enrollment.progress || 0,

    completedLessonCount:
      enrollment.completedLessonCount ||
      0,

    totalLessonCount:
      enrollment.totalLessonCount ||
      0,

    completedLessons:
      (
        enrollment.completedLessons ||
        []
      ).map(
        (lessonId: any) =>
          String(
            lessonId
          )
      ),

    lastAccessedLesson:
      enrollment.lastAccessedLesson
        ? String(
            enrollment.lastAccessedLesson
          )
        : null,

    lastAccessedModule:
      enrollment.lastAccessedModule
        ? String(
            enrollment.lastAccessedModule
          )
        : null,

    lastAccessedAt:
      enrollment.lastAccessedAt,

    startedAt:
      enrollment.startedAt,

    completedAt:
      enrollment.completedAt,

    enrolledAt:
      enrollment.enrolledAt,

    expiresAt:
      enrollment.expiresAt,

    timeSpentSeconds:
      enrollment.timeSpentSeconds ||
      0,

    lastSessionSeconds:
      enrollment.lastSessionSeconds ||
      0,

    certificate:
      enrollment.certificate || {
        issued:
          false,

        certificateId:
          "",

        issuedAt:
          null,

        url:
          "",
      },

    payment:
      enrollment.payment || {
        status:
          "NOT_REQUIRED",

        amount:
          0,

        currency:
          "INR",

        transactionId:
          "",

        paidAt:
          null,
      },

    enrollmentSource:
      enrollment.enrollmentSource,
  };
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

/*
 * ======================================================
 * DUPLICATE KEY DETECTION
 * ======================================================
 */

function isDuplicateKeyError(
  error: unknown
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as any).code ===
      11000
  );
}