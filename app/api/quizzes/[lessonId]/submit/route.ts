import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Quiz from "@/models/Quiz";
import Lesson from "@/models/Lesson";
import Module from "@/models/Module";
import StudentProgress from "@/models/StudentProgress";

interface SubmittedAnswer {
  questionId: string;
  answer: string;
}

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

    const userId =
      user.id ?? user._id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID not found",
        },
        {
          status: 500,
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

    const answers =
      body.answers as
        | SubmittedAnswer[]
        | undefined;

    if (
      !Array.isArray(answers)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Answers must be an array",
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
     * VERIFY LESSON
     * ------------------------------------------------------
     */

    const lesson =
      await Lesson.findById(
        lessonId
      )
        .select(
          "_id title type published module"
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
            "This lesson is not a quiz",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * A quiz lesson should be published
     * before students can submit it.
     */

    if (!lesson.published) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This quiz lesson is not published",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * LOAD QUIZ
     * ------------------------------------------------------
     */

    const quiz =
      await Quiz.findOne({
        lesson: lessonId,
        published: true,
      }).lean();

    if (!quiz) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Quiz is not available yet",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !Array.isArray(
        quiz.questions
      ) ||
      quiz.questions.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This quiz has no questions",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * VALIDATE SUBMITTED ANSWERS
     * ------------------------------------------------------
     */

    const validQuestionIds =
      new Set(
        quiz.questions.map(
          (question) =>
            String(
              question._id
            )
        )
      );

    /*
     * Only accept answers belonging
     * to this quiz.
     */

    const validAnswers =
      answers.filter(
        (item) =>
          item &&
          validQuestionIds.has(
            String(
              item.questionId
            )
          )
      );

    /*
     * ------------------------------------------------------
     * CALCULATE SCORE
     * ------------------------------------------------------
     */

    let correctAnswers = 0;

    const answerMap =
      new Map<
        string,
        string
      >();

    for (
      const answer of validAnswers
    ) {
      answerMap.set(
        String(
          answer.questionId
        ),
        String(
          answer.answer
        )
      );
    }

    for (
      const question of quiz.questions
    ) {
      const questionId =
        String(
          question._id
        );

      const submittedAnswer =
        answerMap.get(
          questionId
        );

      if (
        submittedAnswer &&
        submittedAnswer ===
          question.correctAnswer
      ) {
        correctAnswers++;
      }
    }

    const totalQuestions =
      quiz.questions.length;

    const score =
      Math.round(
        (correctAnswers /
          totalQuestions) *
          100
      );

    const passed =
      score >=
      quiz.passingScore;

    /*
     * ------------------------------------------------------
     * FIND MODULE
     * ------------------------------------------------------
     */

    const module =
      await Module.findById(
        lesson.module
      )
        .select(
          "_id roadmap"
        )
        .lean();

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

    /*
     * ------------------------------------------------------
     * EXISTING PROGRESS
     * ------------------------------------------------------
     */

    const existingProgress =
      await StudentProgress.findOne(
        {
          user: userId,
          lesson: lessonId,
        }
      );

    const attempts =
      existingProgress
        ? existingProgress.attempts + 1
        : 1;

    /*
     * IMPORTANT:
     *
     * Once a quiz has been passed,
     * it must remain completed.
     *
     * A failed retry must never
     * turn it back to incomplete.
     */

    const completed =
      Boolean(
        existingProgress?.completed
      ) || passed;

    /*
     * Preserve the FIRST completion
     * timestamp.
     */

    const completedAt =
      completed
        ? existingProgress?.completedAt ||
          new Date()
        : undefined;

    /*
     * ------------------------------------------------------
     * UPDATE STUDENT PROGRESS
     * ------------------------------------------------------
     */

    const progress =
      await StudentProgress.findOneAndUpdate(
        {
          user: userId,
          lesson: lessonId,
        },
        {
          $set: {
            user: userId,

            roadmap:
              module.roadmap,

            module:
              module._id,

            lesson:
              lessonId,

            completed,

            completedAt,

            score,

            attempts,

            lastAccessedAt:
              new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert:
            true,
        }
      ).lean();

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      result: {
        score,

        correctAnswers,

        totalQuestions,

        passingScore:
          quiz.passingScore,

        passed,

        completed,

        attempts,

        progressId:
          progress?._id,
      },
    });
  } catch (error) {
    console.error(
      "[QUIZ SUBMIT API] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to submit quiz",

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