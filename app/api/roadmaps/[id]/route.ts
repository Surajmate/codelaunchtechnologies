import { NextResponse } from "next/server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Roadmap from "@/models/Roadmap";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import StudentProgress from "@/models/StudentProgress";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    console.log(
      "[ROADMAP DETAIL] Starting request"
    );

    /*
     * ------------------------------------------------------
     * AUTHENTICATION
     * ------------------------------------------------------
     */

    const user =
      await getCurrentUser();

    if (!user) {
      console.error(
        "[ROADMAP DETAIL] No authenticated user"
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
     * Support both `id` and `_id`
     * depending on the auth implementation.
     */

    const userId =
      user.id ??
      user._id;

    if (!userId) {
      console.error(
        "[ROADMAP DETAIL] User ID missing"
      );

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
     * PARAMETER
     * ------------------------------------------------------
     */

    const { id } =
      await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Roadmap identifier is required",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "[ROADMAP DETAIL] Identifier:",
      id
    );

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    console.log(
      "[ROADMAP DETAIL] Database connected"
    );

    /*
     * ------------------------------------------------------
     * FIND ROADMAP
     * ------------------------------------------------------
     *
     * We support:
     *
     * /api/roadmaps/full-stack
     *
     * and:
     *
     * /api/roadmaps/665....
     *
     */

    let roadmap = null;

    /*
     * First try slug.
     *
     * This is the normal student-facing URL.
     */

    roadmap =
      await Roadmap.findOne({
        slug: id,
        published: true,
      }).lean();

    /*
     * If no slug matched, try MongoDB ObjectId.
     */

    if (
      !roadmap &&
      mongoose.Types.ObjectId.isValid(id)
    ) {
      roadmap =
        await Roadmap.findOne({
          _id: id,
          published: true,
        }).lean();
    }

    if (!roadmap) {
      console.error(
        "[ROADMAP DETAIL] Roadmap not found:",
        id
      );

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

    console.log(
      "[ROADMAP DETAIL] Roadmap found:",
      String(roadmap._id)
    );

    /*
     * ------------------------------------------------------
     * MODULES
     * ------------------------------------------------------
     */

    const modules =
      await Module.find({
        roadmap: roadmap._id,
        published: true,
      })
        .sort({
          order: 1,
        })
        .lean();

    console.log(
      "[ROADMAP DETAIL] Modules:",
      modules.length
    );

    /*
     * ------------------------------------------------------
     * LESSONS
     * ------------------------------------------------------
     */

    const moduleIds =
      modules.map(
        (module) =>
          module._id
      );

    const lessons =
      moduleIds.length > 0
        ? await Lesson.find({
            module: {
              $in: moduleIds,
            },
            published: true,
          })
            .sort({
              module: 1,
              order: 1,
            })
            .lean()
        : [];
    
        lessons.sort((a, b) => {
            const moduleA =
                modules.find(
                (module) =>
                    String(module._id) ===
                    String(a.module)
                );

            const moduleB =
                modules.find(
                (module) =>
                    String(module._id) ===
                    String(b.module)
                );

            const moduleOrderA =
                moduleA?.order ?? 0;

            const moduleOrderB =
                moduleB?.order ?? 0;

            if (
                moduleOrderA !==
                moduleOrderB
            ) {
                return (
                moduleOrderA -
                moduleOrderB
                );
            }

            return (
                a.order -
                b.order
            );
        });

    console.log(
      "[ROADMAP DETAIL] Lessons:",
      lessons.length
    );

    /*
     * ------------------------------------------------------
     * STUDENT PROGRESS
     * ------------------------------------------------------
     */

    const lessonIds =
      lessons.map(
        (lesson) =>
          lesson._id
      );

    const progressRecords =
      lessonIds.length > 0
        ? await StudentProgress.find(
            {
              user: userId,
              roadmap:
                roadmap._id,
              lesson: {
                $in: lessonIds,
              },
            }
          )
            .select(
              "lesson module completed completedAt score attempts lastAccessedAt"
            )
            .lean()
        : [];

    console.log(
      "[ROADMAP DETAIL] Progress records:",
      progressRecords.length
    );

    /*
     * ------------------------------------------------------
     * PROGRESS MAPS
     * ------------------------------------------------------
     */

    const progressByLesson =
      new Map(
        progressRecords.map(
          (item) => [
            String(
              item.lesson
            ),
            item,
          ]
        )
      );

    /*
     * ------------------------------------------------------
     * BUILD MODULE RESPONSE
     * ------------------------------------------------------
     */

    const moduleResults =
      modules.map(
        (module) => {
          const moduleLessons =
            lessons.filter(
              (lesson) =>
                String(
                  lesson.module
                ) ===
                String(
                  module._id
                )
            );

          /*
           * Attach student progress
           * to each lesson.
           */

          const lessonResults =
            moduleLessons.map(
              (lesson) => {
                const progress =
                  progressByLesson.get(
                    String(
                      lesson._id
                    )
                  );

                return {
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

                  content:
                    lesson.content,

                  videoUrl:
                    lesson.videoUrl,

                  codeExamples:
                    lesson.codeExamples,

                  completed:
                    progress?.completed ??
                    false,

                  completedAt:
                    progress?.completedAt ??
                    null,

                  score:
                    progress?.score ??
                    null,

                  attempts:
                    progress?.attempts ??
                    0,

                  lastAccessedAt:
                    progress?.lastAccessedAt ??
                    null,
                };
              }
            );

          const totalLessons =
            lessonResults.length;

          const completedLessons =
            lessonResults.filter(
              (lesson) =>
                lesson.completed
            ).length;

          const moduleProgress =
            totalLessons > 0
              ? Math.round(
                  (completedLessons /
                    totalLessons) *
                    100
                )
              : 0;

          return {
            _id:
              module._id,

            title:
              module.title,

            slug:
              module.slug,

            description:
              module.description,

            order:
              module.order,

            totalLessons,

            completedLessons,

            progress:
              moduleProgress,

            lessons:
              lessonResults,
          };
        }
      );

    /*
     * ------------------------------------------------------
     * ROADMAP PROGRESS
     * ------------------------------------------------------
     */

    const totalLessons =
      lessons.length;

    const completedLessons =
      progressRecords.filter(
        (item) =>
          item.completed
      ).length;

    const roadmapProgress =
      totalLessons > 0
        ? Math.round(
            (completedLessons /
              totalLessons) *
              100
          )
        : 0;

    /*
     * ------------------------------------------------------
     * FIND CURRENT LESSON
     * ------------------------------------------------------
     *
     * Prefer the most recently accessed
     * incomplete lesson.
     *
     * Otherwise use the first incomplete
     * lesson.
     */

    const incompleteLessons =
      moduleResults
        .flatMap(
          (module) =>
            module.lessons.map(
              (lesson) => ({
                ...lesson,
                moduleId:
                  module._id,
                moduleSlug:
                  module.slug,
              })
            )
        )
        .filter(
          (lesson) =>
            !lesson.completed
        );

    const recentlyAccessed =
      incompleteLessons
        .filter(
          (lesson) =>
            lesson.lastAccessedAt
        )
        .sort(
          (a, b) =>
            new Date(
              b.lastAccessedAt!
            ).getTime() -
            new Date(
              a.lastAccessedAt!
            ).getTime()
        )[0];

    const nextLesson =
      recentlyAccessed ||
      incompleteLessons[0] ||
      null;

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    const result = {
      _id:
        roadmap._id,

      title:
        roadmap.title,

      slug:
        roadmap.slug,

      description:
        roadmap.description,

      level:
        roadmap.level,

      duration:
        roadmap.duration,

      technologies:
        roadmap.technologies,

      icon:
        roadmap.icon,

      featured:
        roadmap.featured,

      published:
        roadmap.published,

      totalModules:
        moduleResults.length,

      totalLessons,

      completedLessons,

      progress:
        roadmapProgress,

      modules:
        moduleResults,

      nextLesson: nextLesson
        ? {
            lessonId:
              nextLesson._id,

            moduleId:
              nextLesson.moduleId,

            moduleSlug:
              nextLesson.moduleSlug,

            title:
              nextLesson.title,

            slug:
              nextLesson.slug,

            type:
              nextLesson.type,

            duration:
              nextLesson.duration,

            completed:
              nextLesson.completed,

            lastAccessedAt:
              nextLesson.lastAccessedAt,
          }
        : null,
    };

    console.log(
      "[ROADMAP DETAIL] Successfully built response"
    );

    return NextResponse.json({
      success: true,
      roadmap: result,
    });
  } catch (error) {
    console.error(
      "[ROADMAP DETAIL] ERROR:",
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
          "Unable to fetch roadmap",
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