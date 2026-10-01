import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Quiz from "@/models/Quiz";
import Lesson from "@/models/Lesson";
import StudentProgress from "@/models/StudentProgress";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      lessonId: string;
    }>;
  }
) {
  try {
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

    const userId = user.id ?? user._id;

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

    const { lessonId } = await context.params;

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

    await connectDB();

    /*
     * ------------------------------------------------------
     * VERIFY LESSON
     * ------------------------------------------------------
     */

    const lesson = await Lesson.findById(lessonId)
      .select("_id title type published")
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

    if (lesson.type !== "Quiz") {
      return NextResponse.json(
        {
          success: false,
          message: "This lesson is not a quiz",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * LOAD QUIZ
     * ------------------------------------------------------
     */

    const quiz = await Quiz.findOne({
      lesson: lessonId,
      published: true,
    }).lean();

    if (!quiz) {
      return NextResponse.json(
        {
          success: false,
          message: "Quiz is not available yet",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * NEVER SEND CORRECT ANSWERS
     * ------------------------------------------------------
     */

    const questions = [...quiz.questions]
      .sort((a, b) => a.order - b.order)
      .map((question) => ({
        _id: question._id,
        question: question.question,
        options: question.options,
        order: question.order,
      }));

    /*
     * ------------------------------------------------------
     * LOAD CURRENT USER'S QUIZ PROGRESS
     * ------------------------------------------------------
     *
     * This is what makes the result survive a browser refresh.
     * The submit API stores the latest score/attempt count in
     * StudentProgress. We return only the student's own progress.
     */

    const progress = await StudentProgress.findOne({
      user: userId,
      lesson: lessonId,
    })
      .select("score attempts completed completedAt")
      .lean();

    /*
     * `completed` means the lesson has been passed at least once.
     * `passed` represents the LATEST attempt. This distinction is
     * important when a completed quiz is attempted again and failed.
     */
    const latestScore = Number(progress?.score ?? 0);
    const latestPassed =
      !!progress &&
      latestScore >= Number(quiz.passingScore);

    return NextResponse.json({
      success: true,

      quiz: {
        _id: quiz._id,
        lesson: quiz.lesson,
        questions,
        passingScore: quiz.passingScore,
      },

      progress: progress
        ? {
            score: Number(progress.score ?? 0),
            attempts: Number(progress.attempts ?? 0),
            completed: Boolean(progress.completed),
            completedAt:
              progress.completedAt ?? null,
            passed: latestPassed,
          }
        : null,
    });
  } catch (error) {
    console.error("[QUIZ API] ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load quiz",
        error:
          process.env.NODE_ENV === "development"
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
