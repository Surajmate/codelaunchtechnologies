import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Roadmap from "@/models/Roadmap";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import StudentProgress from "@/models/StudentProgress";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      moduleId: string;
      lessonId: string;
    }>;
  }
) {
  try {
    console.log(
      "[LESSON COMPLETE] Starting request"
    );

    /*
     * ------------------------------------------------------
     * AUTHENTICATION
     * ------------------------------------------------------
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

    const userId =
      user.id ?? 
      user._id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authenticated user ID not found",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * PARAMETERS
     * ------------------------------------------------------
     */

    const {
      id,
      moduleId,
      lessonId,
    } = await params;

    if (
      !id ||
      !moduleId ||
      !lessonId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Roadmap, module and lesson are required",
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
     * FIND ROADMAP
     * ------------------------------------------------------
     */

    const roadmap =
      await Roadmap.findOne({
        $or: [
          {
            slug: id,
          },
          ...(mongoose.Types.ObjectId.isValid(
            id
          )
            ? [
                {
                  _id: id,
                },
              ]
            : []),
        ],
        published: true,
      }).lean();

    if (!roadmap) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Roadmap not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * FIND MODULE
     * ------------------------------------------------------
     */

    const module =
      await Module.findOne({
        _id: moduleId,
        roadmap:
          roadmap._id,
        published: true,
      }).lean();

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
     * FIND LESSON
     * ------------------------------------------------------
     */

    const lesson =
      await Lesson.findOne({
        _id: lessonId,
        module:
          module._id,
        published: true,
      }).lean();

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

    /*
     * ------------------------------------------------------
     * CREATE / UPDATE PROGRESS
     * ------------------------------------------------------
     *
     * There is a unique index on:
     *
     * user + lesson
     *
     * So one student can only have one
     * progress record for a lesson.
     */

    const moduleLessons =
        await Lesson.find({
            module: module._id,
            published: true,
        })
            .sort({
            order: 1,
            })
            .lean();
    
    const currentIndex =
        moduleLessons.findIndex(
            (item) =>
            String(item._id) ===
            String(lesson._id)
        );

    if (currentIndex > 0) {
        const previousLesson =
            moduleLessons[
            currentIndex - 1
            ];

        const previousProgress =
            await StudentProgress.findOne({
            user: userId,
            lesson:
                previousLesson._id,
            completed: true,
            }).lean();

        if (!previousProgress) {
            return NextResponse.json(
            {
                success: false,
                message:
                "Complete the previous lesson first",
            },
            {
                status: 400,
            }
            );
        }
        }

    const progress =
      await StudentProgress.findOneAndUpdate(
        {
          user: userId,
          lesson: lesson._id,
        },
        {
          $set: {
            roadmap:
              roadmap._id,
            module:
              module._id,
            completed: true,
            completedAt:
              new Date(),
            lastAccessedAt:
              new Date(),
          },

          $setOnInsert: {
            attempts: 0,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      ).lean();

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    console.log(
      "[LESSON COMPLETE] Completed:",
      String(lesson._id)
    );

    return NextResponse.json({
      success: true,
      message:
        "Lesson marked as complete",
      progress: {
        lesson:
          progress?.lesson,
        module:
          progress?.module,
        roadmap:
          progress?.roadmap,
        completed:
          progress?.completed,
        completedAt:
          progress?.completedAt,
      },
    });
  } catch (error) {
    console.error(
      "[LESSON COMPLETE] ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to mark lesson as complete",
        error:
          process.env.NODE_ENV ===
          "development"
            ? message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}