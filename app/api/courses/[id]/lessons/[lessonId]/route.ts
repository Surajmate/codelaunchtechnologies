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
    lessonId: string;
  }>;
}

/*
 * ======================================================
 * GET LESSON
 * ======================================================
 *
 * GET
 * /api/courses/[id]/lessons/[lessonId]
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

    const {
      id,
      lessonId,
    } = await context.params;

    if (!id || !lessonId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course ID and lesson ID are required",
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
     * FIND LESSON
     * --------------------------------------------------
     */

    if (
      !isValidObjectId(
        lessonId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lesson ID",
        },
        {
          status: 400,
        }
      );
    }

    const lesson =
      await CourseLesson.findOne(
        {
          _id: lessonId,

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
          message: "Lesson not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------
     * FIND MODULE
     * --------------------------------------------------
     */

    const module =
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

    if (!module) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lesson module not found",
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

          course:
            course._id,
        }
      );

    const isEnrolled =
      Boolean(enrollment);

    const hasActiveEnrollment =
      Boolean(
        enrollment &&
          (
            enrollment.status ===
              "ACTIVE" ||
            enrollment.status ===
              "COMPLETED"
          )
      );

    /*
     * --------------------------------------------------
     * ACCESS CONTROL
     * --------------------------------------------------
     *
     * Preview lessons can be viewed without enrollment.
     *
     * Protected lessons require active enrollment.
     */

    const isPreview =
      Boolean(
        lesson.preview ||
          module.preview
      );

    const canAccess =
      isPreview ||
      hasActiveEnrollment;

    if (!canAccess) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You must enroll in this course to access this lesson",

          requiresEnrollment:
            true,

          preview:
            false,
        },
        {
          status: 403,
        }
      );
    }

    /*
     * --------------------------------------------------
     * COMPLETION STATUS
     * --------------------------------------------------
     */

    const completedLessonSet =
      new Set(
        (
          enrollment?.completedLessons ||
          []
        ).map(
          (lessonId: any) =>
            String(
              lessonId
            )
        )
      );

    const completed =
      completedLessonSet.has(
        String(
          lesson._id
        )
      );

    /*
     * --------------------------------------------------
     * UPDATE LAST ACCESSED
     * --------------------------------------------------
     *
     * Only update learning progress for enrolled users.
     *
     * Preview-only visitors should not receive an
     * enrollment record as a side effect.
     */

    if (
      enrollment &&
      hasActiveEnrollment
    ) {
      enrollment.lastAccessedLesson =
        lesson._id;

      enrollment.lastAccessedModule =
        module._id;

      enrollment.lastAccessedAt =
        new Date();

      if (
        !enrollment.startedAt
      ) {
        enrollment.startedAt =
          new Date();
      }

      await enrollment.save();
    }

    /*
     * --------------------------------------------------
     * PREVIOUS / NEXT LESSON
     * --------------------------------------------------
     */

    const allLessons =
      await CourseLesson.find(
        {
          course:
            course._id,

          status:
            "PUBLISHED",
        }
      )
        .select(
          "_id module title slug order preview durationMinutes"
        )
        .sort({
          order: 1,
        })
        .lean();

    const currentIndex =
      allLessons.findIndex(
        (item: any) =>
          String(
            item._id
          ) ===
          String(
            lesson._id
          )
      );

    const previousLesson =
      currentIndex > 0
        ? allLessons[
            currentIndex - 1
          ]
        : null;

    const nextLesson =
      currentIndex >= 0 &&
      currentIndex <
        allLessons.length - 1
        ? allLessons[
            currentIndex + 1
          ]
        : null;

    /*
     * --------------------------------------------------
     * LESSON RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      lesson: {
        _id: String(
          lesson._id
        ),

        course: String(
          lesson.course
        ),

        module: String(
          lesson.module
        ),

        title:
          lesson.title,

        slug:
          lesson.slug,

        shortDescription:
          lesson.shortDescription,

        type:
          lesson.type,

        durationMinutes:
          lesson.durationMinutes,

        order:
          lesson.order,

        preview:
          isPreview,

        required:
          lesson.required !==
          false,

        completed,

        canAccess,

        content:
          lesson.content ||
          "",

        video: {
          url:
            lesson.videoUrl ||
            "",

          provider:
            lesson.videoProvider ||
            "",

          id:
            lesson.videoId ||
            "",
        },

        document: {
          url:
            lesson.documentUrl ||
            "",

          name:
            lesson.documentName ||
            "",
        },

        externalUrl:
          lesson.externalUrl ||
          "",

        resources:
          lesson.resources ||
          [],

        learningObjectives:
          lesson.learningObjectives ||
          [],

        quiz:
          lesson.quiz
            ? String(
                lesson.quiz
              )
            : null,

        assignment:
          lesson.assignment
            ? String(
                lesson.assignment
              )
            : null,
      },

      module: {
        _id: String(
          module._id
        ),

        title:
          module.title,

        slug:
          module.slug,

        description:
          module.description,

        order:
          module.order,

        preview:
          Boolean(
            module.preview
          ),
      },

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

        thumbnail:
          course.thumbnail,

        certificateEnabled:
          Boolean(
            course.certificateEnabled
          ),
      },

      navigation: {
        currentIndex:
          currentIndex >= 0
            ? currentIndex + 1
            : 0,

        totalLessons:
          allLessons.length,

        previous:
          previousLesson
            ? {
                _id: String(
                  previousLesson._id
                ),

                title:
                  previousLesson.title,

                slug:
                  previousLesson.slug,

                module:
                  String(
                    previousLesson.module
                  ),

                preview:
                  Boolean(
                    previousLesson.preview
                  ),

                durationMinutes:
                  previousLesson.durationMinutes,
              }
            : null,

        next:
          nextLesson
            ? {
                _id: String(
                  nextLesson._id
                ),

                title:
                  nextLesson.title,

                slug:
                  nextLesson.slug,

                module:
                  String(
                    nextLesson.module
                  ),

                preview:
                  Boolean(
                    nextLesson.preview
                  ),

                durationMinutes:
                  nextLesson.durationMinutes,
              }
            : null,
      },

      enrollment:
        enrollment
          ? {
              enrolled:
                true,

              status:
                enrollment.status,

              progress:
                enrollment.progress ||
                0,

              completed,

              completedLessonCount:
                enrollment.completedLessonCount ||
                0,

              totalLessonCount:
                enrollment.totalLessonCount ||
                allLessons.length,

              lastAccessedAt:
                enrollment.lastAccessedAt,
            }
          : {
              enrolled:
                false,

              status:
                null,

              progress: 0,

              completed: false,

              completedLessonCount: 0,

              totalLessonCount:
                allLessons.length,

              lastAccessedAt:
                null,
            },
    });
  } catch (error) {
    console.error(
      "[USER COURSE LESSON] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load lesson",

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