import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Roadmap from "@/models/Roadmap";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(
  request: Request
) {
  try {
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
     * REQUEST BODY
     * ------------------------------------------------------
     */

    const body = await request.json();

    const roadmapId =
      String(
        body.roadmapId || ""
      ).trim();

    const moduleId =
      String(
        body.moduleId || ""
      ).trim();

    const title =
      String(
        body.title || ""
      ).trim();

    const description =
      String(
        body.description || ""
      ).trim();

    const duration =
      String(
        body.duration || ""
      ).trim();

    /*
     * ------------------------------------------------------
     * VALIDATION
     * ------------------------------------------------------
     */

    if (!roadmapId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Roadmap ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!moduleId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Module ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Quiz title is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * SLUG
     * ------------------------------------------------------
     */

    const slug =
      createSlug(title);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create a valid quiz slug",
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
     * VERIFY ROADMAP
     * ------------------------------------------------------
     */

    const roadmap =
      await Roadmap.findById(
        roadmapId
      )
        .select("_id title")
        .lean();

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
     * VERIFY MODULE
     * ------------------------------------------------------
     */

    const module =
      await Module.findOne({
        _id: moduleId,
        roadmap: roadmapId,
      })
        .select(
          "_id title roadmap"
        )
        .lean();

    if (!module) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Module not found for the selected roadmap",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * CHECK DUPLICATE SLUG
     * ------------------------------------------------------
     */

    const existingLesson =
      await Lesson.findOne({
        module: moduleId,
        slug,
      })
        .select("_id title")
        .lean();

    if (existingLesson) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A lesson with this title already exists in this module",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * FIND NEXT LESSON ORDER
     * ------------------------------------------------------
     */

    const lastLesson =
      await Lesson.findOne({
        module: moduleId,
      })
        .sort({
          order: -1,
        })
        .select("order")
        .lean();

    const nextOrder =
      lastLesson?.order
        ? lastLesson.order + 1
        : 1;

    /*
     * ------------------------------------------------------
     * CREATE QUIZ LESSON
     * ------------------------------------------------------
     */

    const lesson =
      await Lesson.create({
        module: moduleId,

        title,

        slug,

        description,

        type: "Quiz",

        duration,

        order: nextOrder,

        content: "",

        videoUrl: "",

        codeExamples: [],

        /*
         * Keep the lesson unpublished
         * until the admin publishes the quiz.
         */
        published: false,
      });

    /*
     * ------------------------------------------------------
     * SUCCESS
     * ------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Quiz lesson created successfully",

        lesson: {
          _id: lesson._id,

          module:
            lesson.module,

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
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ADMIN QUIZ LESSON CREATE] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to create quiz lesson",

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