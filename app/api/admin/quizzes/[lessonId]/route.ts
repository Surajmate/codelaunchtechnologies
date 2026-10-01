import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";

/*
 * ==========================================================
 * GET
 * ==========================================================
 *
 * Get one quiz including all questions.
 *
 * URL:
 * /api/admin/quizzes/[lessonId]
 *
 */

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      lessonId: string;
    }>;
  }
) {
  try {
    console.log(
      "[ADMIN QUIZ GET] Starting request"
    );

    /*
     * ------------------------------------------------------
     * AUTHENTICATION
     * ------------------------------------------------------
     */

    const user = await getCurrentUser();

    if (!user) {
      console.error(
        "[ADMIN QUIZ GET] Unauthorized"
      );

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
     * ------------------------------------------------------
     * ADMIN AUTHORIZATION
     * ------------------------------------------------------
     */

    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      console.error(
        "[ADMIN QUIZ GET] Forbidden:",
        user.role
      );

      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * LESSON ID
     * ------------------------------------------------------
     */

    const { lessonId } =
      await context.params;

    console.log(
      "[ADMIN QUIZ GET] Lesson ID:",
      lessonId
    );

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          message: "Lesson ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------------
     * FIND LESSON
     * ------------------------------------------------------
     */

    const lesson =
      await Lesson.findById(
        lessonId
      )
        .select(
          "_id title slug description type duration order published module"
        )
        .lean();

    if (!lesson) {
      console.error(
        "[ADMIN QUIZ GET] Lesson not found:",
        lessonId
      );

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
     * ------------------------------------------------------
     * VERIFY QUIZ LESSON
     * ------------------------------------------------------
     */

    if (
      lesson.type !== "Quiz"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected lesson is not a Quiz lesson",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * FIND QUIZ
     * ------------------------------------------------------
     */

    const quiz =
      await Quiz.findOne({
        lesson: lessonId,
      }).lean();

    /*
     * ------------------------------------------------------
     * NO QUIZ YET
     * ------------------------------------------------------
     */

    if (!quiz) {
      console.log(
        "[ADMIN QUIZ GET] No quiz found for lesson"
      );

      return NextResponse.json({
        success: true,

        lesson: {
          _id: lesson._id,

          title:
            lesson.title,

          slug:
            lesson.slug,

          description:
            lesson.description,

          type:
            lesson.type,

          duration:
            lesson.duration,

          order:
            lesson.order,

          published:
            lesson.published,

          module:
            lesson.module,
        },

        quiz: null,
      });
    }

    /*
     * ------------------------------------------------------
     * QUESTIONS
     * ------------------------------------------------------
     */

    const questions =
      Array.isArray(
        quiz.questions
      )
        ? [...quiz.questions]
            .sort(
              (
                a: any,
                b: any
              ) =>
                Number(
                  a.order || 0
                ) -
                Number(
                  b.order || 0
                )
            )
            .map(
              (
                question: any,
                index: number
              ) => ({
                _id:
                  question._id,

                question:
                  question.question ||
                  "",

                options:
                  Array.isArray(
                    question.options
                  )
                    ? question.options.map(
                        (
                          option: any
                        ) => ({
                          text:
                            option.text ||
                            "",

                          value:
                            option.value ||
                            "",
                        })
                      )
                    : [],

                /*
                 * These are intentionally returned
                 * for ADMIN users because this endpoint
                 * is used by the quiz editor.
                 */

                correctAnswer:
                  question.correctAnswer ||
                  "",

                explanation:
                  question.explanation ||
                  "",

                order:
                  Number(
                    question.order ||
                      index + 1
                  ),
              })
            )
        : [];

    console.log(
      "[ADMIN QUIZ GET] Quiz found:",
      String(
        quiz._id
      )
    );

    console.log(
      "[ADMIN QUIZ GET] Questions:",
      questions.length
    );

    /*
     * ------------------------------------------------------
     * SUCCESS
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      lesson: {
        _id:
          lesson._id,

        title:
          lesson.title,

        slug:
          lesson.slug,

        description:
          lesson.description,

        type:
          lesson.type,

        duration:
          lesson.duration,

        order:
          lesson.order,

        published:
          lesson.published,

        module:
          lesson.module,
      },

      quiz: {
        _id:
          quiz._id,

        lesson:
          quiz.lesson,

        passingScore:
          quiz.passingScore,

        published:
          quiz.published,

        questions,

        questionCount:
          questions.length,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN QUIZ GET] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load quiz",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * ==========================================================
 * POST
 * ==========================================================
 *
 * Create or update a quiz.
 *
 * URL:
 * /api/admin/quizzes/[lessonId]
 *
 */

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      lessonId: string;
    }>;
  }
) {
  try {
    /*
     * ------------------------------------------------------
     * AUTHENTICATION
     * ------------------------------------------------------
     */

    const user = await getCurrentUser();

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
     * ------------------------------------------------------
     * ADMIN AUTHORIZATION
     * ------------------------------------------------------
     */

    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * LESSON ID
     * ------------------------------------------------------
     */

    const { lessonId } =
      await context.params;

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          message: "Lesson ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * REQUEST BODY
     * ------------------------------------------------------
     */

    const body =
      await request.json();

    const questions =
      Array.isArray(
        body.questions
      )
        ? body.questions
        : [];

    const passingScore =
      body.passingScore ?? 70;

    const published =
      body.published ?? false;

    /*
     * ------------------------------------------------------
     * VALIDATION
     * ------------------------------------------------------
     */

    if (
      questions.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least one question is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof passingScore !==
        "number" ||
      passingScore < 0 ||
      passingScore > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Passing score must be between 0 and 100",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * NORMALIZE QUESTIONS
     * ------------------------------------------------------
     */

    const normalizedQuestions =
      questions.map(
        (
          question: any,
          index: number
        ) => {
          const options =
            Array.isArray(
              question.options
            )
              ? question.options
              : [];

          return {
            question:
              String(
                question.question ||
                  ""
              ).trim(),

            options:
              options.map(
                (
                  option: any
                ) => ({
                  text:
                    String(
                      option.text ||
                        ""
                    ).trim(),

                  value:
                    String(
                      option.value ||
                        ""
                    ).trim(),
                })
              ),

            correctAnswer:
              String(
                question.correctAnswer ||
                  ""
              ).trim(),

            explanation:
              String(
                question.explanation ||
                  ""
              ).trim(),

            order:
              Number(
                question.order ||
                  index + 1
              ),
          };
        }
      );

    /*
     * ------------------------------------------------------
     * VALIDATE EACH QUESTION
     * ------------------------------------------------------
     */

    for (
      let index = 0;
      index <
      normalizedQuestions.length;
      index++
    ) {
      const question =
        normalizedQuestions[index];

      if (
        !question.question
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Question ${
              index + 1
            } is empty`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        question.options.length <
        2
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Question ${
              index + 1
            } must have at least 2 options`,
          },
          {
            status: 400,
          }
        );
      }

      const optionValues =
        question.options.map(
          (
            option: any
          ) =>
            option.value
        );

      if (
        new Set(
          optionValues
        ).size !==
        optionValues.length
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Question ${
              index + 1
            } has duplicate option values`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        !optionValues.includes(
          question.correctAnswer
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Correct answer for question ${
              index + 1
            } does not match any option`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------------
     * VERIFY LESSON
     * ------------------------------------------------------
     */

    const lesson =
      await Lesson.findById(
        lessonId
      )
        .select(
          "_id title type module published"
        )
        .lean();

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

    if (
      lesson.type !== "Quiz"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected lesson is not a Quiz lesson",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * CREATE / UPDATE QUIZ
     * ------------------------------------------------------
     */

    const quiz =
      await Quiz.findOneAndUpdate(
        {
          lesson: lessonId,
        },
        {
          $set: {
            lesson:
              lessonId,

            questions:
              normalizedQuestions,

            passingScore,

            published,
          },
        },
        {
          new: true,

          upsert: true,

          runValidators: true,

          setDefaultsOnInsert:
            true,
        }
      ).lean();

    if (!quiz) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to save quiz",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * SYNC LESSON PUBLISHED STATUS
     * ------------------------------------------------------
     *
     * Save Draft:
     *   Quiz.published  = false
     *   Lesson.published = false
     *
     * Publish:
     *   Quiz.published  = true
     *   Lesson.published = true
     *
     */

    const updatedLesson =
      await Lesson.findByIdAndUpdate(
        lessonId,
        {
          $set: {
            published,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (!updatedLesson) {
      console.error(
        "[ADMIN QUIZ POST] Unable to update lesson:",
        lessonId
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Quiz was saved but lesson publication status could not be updated",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * LOG
     * ------------------------------------------------------
     */

    console.log(
      "[ADMIN QUIZ POST] Quiz saved:",
      String(
        quiz._id
      )
    );

    console.log(
      "[ADMIN QUIZ POST] Questions saved:",
      quiz.questions?.length ??
        0
    );

    console.log(
      "[ADMIN QUIZ POST] Quiz published:",
      quiz.published
    );

    console.log(
      "[ADMIN QUIZ POST] Lesson published:",
      updatedLesson.published
    );

    /*
     * ------------------------------------------------------
     * SUCCESS
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        published
          ? "Quiz saved and published successfully"
          : "Quiz saved successfully",

      quiz: {
        _id:
          quiz._id,

        lesson:
          quiz.lesson,

        questionCount:
          quiz.questions?.length ??
          0,

        passingScore:
          quiz.passingScore,

        published:
          quiz.published,

        lessonPublished:
          updatedLesson.published,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN QUIZ POST] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to save quiz",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}