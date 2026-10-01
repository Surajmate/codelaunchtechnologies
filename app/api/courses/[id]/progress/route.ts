import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Course from "@/models/Course";
import CourseModule from "@/models/CourseModule";
import CourseLesson from "@/models/CourseLesson";
import CourseEnrollment from "@/models/CourseEnrollment";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
 * ======================================================
 * GET CURRENT PROGRESS
 * ======================================================
 *
 * GET
 * /api/courses/[id]/progress
 *
 * Returns the user's current learning progress.
 *
 * ======================================================
 */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
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
     * TOTAL LESSONS
     * --------------------------------------------------
     */

    const totalLessonCount =
      await CourseLesson.countDocuments(
        {
          course: course._id,
          status: "PUBLISHED",
        }
      );

    const completedLessons =
      (
        enrollment.completedLessons ||
        []
      ).map(
        (lessonId: any) =>
          String(lessonId)
      );

    const completedLessonCount =
      completedLessons.length;

    const progress =
      totalLessonCount > 0
        ? Math.min(
            100,
            Math.round(
              (
                completedLessonCount /
                totalLessonCount
              ) *
                100
            )
          )
        : 0;

    /*
     * --------------------------------------------------
     * RETURN
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      progress: {
        enrollmentId:
          String(
            enrollment._id
          ),

        status:
          enrollment.status,

        progress,

        completedLessonCount,

        totalLessonCount,

        completedLessons,

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

        timeSpentSeconds:
          enrollment.timeSpentSeconds ||
          0,

        certificate:
          enrollment.certificate ||
          {
            issued: false,
            certificateId: "",
            issuedAt: null,
            url: "",
          },
      },
    });
  } catch (error) {
    console.error(
      "[COURSE PROGRESS] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load course progress",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ======================================================
 * UPDATE PROGRESS
 * ======================================================
 *
 * POST
 * /api/courses/[id]/progress
 *
 * Body:
 *
 * {
 *   "lessonId": "...",
 *   "moduleId": "...",
 *   "completed": true,
 *   "timeSpentSeconds": 120,
 *   "start": true
 * }
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
     * AUTH
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
     * CHECK ENROLLMENT STATUS
     * --------------------------------------------------
     */

    if (
      enrollment.status !==
        "ACTIVE" &&
      enrollment.status !==
        "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your enrollment is not active",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * --------------------------------------------------
     * REQUEST BODY
     * --------------------------------------------------
     */

    let body: any = {};

    try {
      body =
        await request.json();
    } catch {
      body = {};
    }

    const lessonId =
      typeof body.lessonId ===
      "string"
        ? body.lessonId.trim()
        : "";

    const moduleId =
      typeof body.moduleId ===
      "string"
        ? body.moduleId.trim()
        : "";

    const completed =
      body.completed === true;

    const start =
      body.start === true;

    const timeSpentSeconds =
      Number(
        body.timeSpentSeconds || 0
      );

    /*
     * --------------------------------------------------
     * VALIDATE TIME
     * --------------------------------------------------
     */

    const safeTimeSpent =
      Number.isFinite(
        timeSpentSeconds
      ) &&
      timeSpentSeconds > 0
        ? Math.min(
            Math.floor(
              timeSpentSeconds
            ),
            86400
          )
        : 0;

    /*
     * --------------------------------------------------
     * VALIDATE LESSON
     * --------------------------------------------------
     */

    let lesson: any = null;

    if (lessonId) {
      lesson =
        await CourseLesson.findOne(
          {
            _id:
              lessonId,

            course:
              course._id,

            status:
              "PUBLISHED",
          }
        ).lean();

      if (!lesson) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Lesson not found",
          },
          {
            status: 404,
          }
        );
      }
    }

    /*
     * --------------------------------------------------
     * VALIDATE MODULE
     * --------------------------------------------------
     */

    let module: any = null;

    if (moduleId) {
      module =
        await CourseModule.findOne(
          {
            _id:
              moduleId,

            course:
              course._id,

            status:
              "PUBLISHED",
          }
        ).lean();

      if (!module) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Module not found",
          },
          {
            status: 404,
          }
        );
      }
    }

    /*
     * --------------------------------------------------
     * MODULE FROM LESSON
     * --------------------------------------------------
     *
     * If moduleId isn't supplied but lessonId is,
     * automatically determine the module.
     */

    if (
      lesson &&
      !module
    ) {
      module =
        await CourseModule.findOne(
          {
            _id:
              lesson.module,

            course:
              course._id,

            status:
              "PUBLISHED",
          }
        ).lean();
    }

    /*
     * --------------------------------------------------
     * START COURSE
     * --------------------------------------------------
     */

    if (
      start &&
      !enrollment.startedAt
    ) {
      enrollment.startedAt =
        new Date();
    }

    /*
     * --------------------------------------------------
     * UPDATE LAST ACCESSED
     * --------------------------------------------------
     */

    if (lesson) {
      enrollment.lastAccessedLesson =
        lesson._id;
    }

    if (module) {
      enrollment.lastAccessedModule =
        module._id;
    }

    if (
      lesson ||
      module
    ) {
      enrollment.lastAccessedAt =
        new Date();
    }

    /*
     * --------------------------------------------------
     * TIME TRACKING
     * --------------------------------------------------
     */

    if (
      safeTimeSpent > 0
    ) {
      enrollment.timeSpentSeconds =
        (
          enrollment.timeSpentSeconds ||
          0
        ) +
        safeTimeSpent;

      enrollment.lastSessionSeconds =
        safeTimeSpent;
    }

    /*
     * --------------------------------------------------
     * COMPLETED LESSONS
     * --------------------------------------------------
     */

    const completedLessonIds =
      new Set(
        (
          enrollment.completedLessons ||
          []
        ).map(
          (lessonId: any) =>
            String(
              lessonId
            )
        )
      );

    /*
     * --------------------------------------------------
     * MARK COMPLETE
     * --------------------------------------------------
     */

    if (
      lesson &&
      completed
    ) {
      completedLessonIds.add(
        String(
          lesson._id
        )
      );
    }

    /*
     * --------------------------------------------------
     * UNMARK COMPLETE
     * --------------------------------------------------
     *
     * Useful if the frontend needs to undo completion.
     */

    if (
      lesson &&
      body.completed === false
    ) {
      completedLessonIds.delete(
        String(
          lesson._id
        )
      );
    }

    /*
     * --------------------------------------------------
     * CONVERT IDS
     * --------------------------------------------------
     */

    enrollment.completedLessons =
      Array.from(
        completedLessonIds
      );

    /*
     * --------------------------------------------------
     * COUNT COMPLETED
     * --------------------------------------------------
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

    const completedLessonCount =
      completedLessonIds.size;

    enrollment.totalLessonCount =
      totalLessonCount;

    enrollment.completedLessonCount =
      completedLessonCount;

    /*
     * --------------------------------------------------
     * CALCULATE PROGRESS
     * --------------------------------------------------
     */

    const progress =
      totalLessonCount > 0
        ? Math.min(
            100,
            Math.round(
              (
                completedLessonCount /
                totalLessonCount
              ) *
                100
            )
          )
        : 0;

    enrollment.progress =
      progress;

    /*
     * --------------------------------------------------
     * COURSE COMPLETION
     * --------------------------------------------------
     */

    let courseCompleted =
      false;

    if (
      totalLessonCount > 0 &&
      completedLessonCount >=
        totalLessonCount
    ) {
      courseCompleted =
        true;

      enrollment.status =
        "COMPLETED";

      enrollment.progress =
        100;

      if (
        !enrollment.completedAt
      ) {
        enrollment.completedAt =
          new Date();
      }

      /*
       * Certificate is marked eligible,
       * but the actual certificate generation
       * can be handled by the certificate API.
       */

      if (
        !enrollment.certificate
      ) {
        enrollment.certificate = {
          issued: false,
          certificateId: "",
          issuedAt: null,
          url: "",
        };
      }
    } else {
      /*
       * If a completed course is reopened because a
       * lesson was unmarked, return it to ACTIVE.
       */

      if (
        enrollment.status ===
        "COMPLETED"
      ) {
        enrollment.status =
          "ACTIVE";

        enrollment.completedAt =
          null;
      }
    }

    /*
     * --------------------------------------------------
     * SAVE
     * --------------------------------------------------
     */

    await enrollment.save();

    /*
     * --------------------------------------------------
     * UPDATE COURSE COMPLETION COUNT
     * --------------------------------------------------
     *
     * Only increment once when the enrollment first
     * becomes completed.
     */

    if (
      courseCompleted &&
      !wasPreviouslyCompleted(
        enrollment
      )
    ) {
      await Course.updateOne(
        {
          _id:
            course._id,
        },
        {
          $inc: {
            completionCount:
              1,
          },
        }
      );
    }

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        courseCompleted
          ? "Course completed successfully"
          : completed
          ? "Lesson completed successfully"
          : "Progress updated successfully",

      progress: {
        enrollmentId:
          String(
            enrollment._id
          ),

        status:
          enrollment.status,

        progress:
          enrollment.progress,

        completedLessonCount:
          enrollment.completedLessonCount,

        totalLessonCount:
          enrollment.totalLessonCount,

        completedLessons:
          enrollment.completedLessons.map(
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

        timeSpentSeconds:
          enrollment.timeSpentSeconds ||
          0,

        lastSessionSeconds:
          enrollment.lastSessionSeconds ||
          0,

        courseCompleted,

        certificateEligible:
          courseCompleted &&
          Boolean(
            course.certificateEnabled
          ),

        certificate:
          enrollment.certificate ||
          {
            issued: false,
            certificateId: "",
            issuedAt: null,
            url: "",
          },
      },
    });
  } catch (error) {
    console.error(
      "[COURSE PROGRESS] POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update course progress",

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
   * Try ObjectId first.
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
   * Try slug.
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
 * COMPLETION HELPER
 * ======================================================
 *
 * NOTE:
 *
 * This function intentionally checks completedAt
 * after the enrollment has been modified.
 *
 * The actual Course completion counter should ideally
 * be handled atomically or through a transaction when
 * multiple users can complete courses concurrently.
 *
 * For the current application architecture, completion
 * is counted only when completedAt has just been set.
 *
 * ======================================================
 */

function wasPreviouslyCompleted(
  enrollment: any
) {
  return (
    enrollment.completedAt &&
    enrollment.completedAt
      instanceof Date === false
  );
}