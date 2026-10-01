import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Roadmap from "@/models/Roadmap";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import StudentProgress from "@/models/StudentProgress";

export async function GET() {
  try {
    console.log(
      "[ROADMAPS] Starting roadmap request"
    );

    /*
     * ------------------------------------------------------
     * AUTHENTICATION
     * ------------------------------------------------------
     */

    const user = await getCurrentUser();

    if (!user) {
      console.error(
        "[ROADMAPS] No authenticated user"
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
     * Some auth implementations expose
     * `id`, while others expose `_id`.
     *
     * Support both.
     */

    const userId =
      user.id ??
      user._id;

    if (!userId) {
      console.error(
        "[ROADMAPS] User ID missing:",
        user
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

    console.log(
      "[ROADMAPS] User:",
      String(userId)
    );

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    console.log(
      "[ROADMAPS] Database connected"
    );

    /*
     * ------------------------------------------------------
     * ROADMAPS
     * ------------------------------------------------------
     */

    const roadmaps =
      await Roadmap.find({
        published: true,
      })
        .sort({
          featured: -1,
          createdAt: -1,
        })
        .lean();

    console.log(
      "[ROADMAPS] Roadmaps found:",
      roadmaps.length
    );

    /*
     * ------------------------------------------------------
     * BUILD RESPONSE
     * ------------------------------------------------------
     */

    const result = await Promise.all(
      roadmaps.map(
        async (roadmap) => {
          /*
           * ------------------------------------------------
           * MODULES
           * ------------------------------------------------
           */

          const modules =
            await Module.find({
              roadmap:
                roadmap._id,
              published: true,
            })
              .sort({
                order: 1,
              })
              .lean();

          /*
           * ------------------------------------------------
           * LESSONS
           * ------------------------------------------------
           */

          const moduleIds =
            modules.map(
              (item) =>
                item._id
            );

          const lessons =
            moduleIds.length > 0
              ? await Lesson.find({
                  module: {
                    $in: moduleIds,
                  },
                  published: true,
                })
                  .lean()
              : [];

          /*
          * ------------------------------------------------
          * ORDER LESSONS BY MODULE ORDER + LESSON ORDER
          * ------------------------------------------------
          */

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

          /*
           * ------------------------------------------------
           * STUDENT PROGRESS
           * ------------------------------------------------
           */

          const lessonIds =
            lessons.map(
              (lesson) =>
                lesson._id
            );

          const progress =
            lessonIds.length > 0
              ? await StudentProgress.find(
                  {
                    user: userId,
                    lesson: {
                      $in: lessonIds,
                    },
                    completed: true,
                  }
                )
                  .select(
                    "lesson completed completedAt score"
                  )
                  .lean()
              : [];

          /*
           * ------------------------------------------------
           * COMPLETED LESSON IDS
           * ------------------------------------------------
           */

          const completedLessonIds =
            new Set(
              progress.map(
                (item) =>
                  String(
                    item.lesson
                  )
              )
            );

          /*
          * ------------------------------------------------
          * NEXT INCOMPLETE LESSON
          * ------------------------------------------------
          *
          * Lessons are already sorted by order.
          * Find the first lesson that the
          * student has not completed.
          */

          const nextLesson =
            lessons.find(
              (lesson) =>
                !completedLessonIds.has(
                  String(lesson._id)
                )
            ) || null;

          const nextLessonModule =
            nextLesson
              ? modules.find(
                  (module) =>
                    String(module._id) ===
                    String(nextLesson.module)
                )
              : null;

          /*
           * ------------------------------------------------
           * MODULE RESULTS
           * ------------------------------------------------
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

                const completed =
                  moduleLessons.filter(
                    (lesson) =>
                      completedLessonIds.has(
                        String(
                          lesson._id
                        )
                      )
                  ).length;

                const total =
                  moduleLessons.length;

                const moduleProgress =
                  total > 0
                    ? Math.round(
                        (completed /
                          total) *
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

                  totalLessons:
                    total,

                  completedLessons:
                    completed,

                  progress:
                    moduleProgress,
                };
              }
            );

          /*
           * ------------------------------------------------
           * ROADMAP PROGRESS
           * ------------------------------------------------
           */

          const totalLessons =
            lessons.length;

          const completedLessons =
            lessons.filter(
              (lesson) =>
                completedLessonIds.has(
                  String(
                    lesson._id
                  )
                )
            ).length;

          const roadmapProgress =
            totalLessons > 0
              ? Math.round(
                  (completedLessons /
                    totalLessons) *
                    100
                )
              : 0;

          return {
            _id: roadmap._id,

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

            totalModules:
              modules.length,

            totalLessons,

            completedLessons,

            progress:
              roadmapProgress,

            /*
            * First incomplete lesson.
            *
            * Used by the student Roadmaps page
            * to continue from the correct point.
            */
            nextLesson:
              nextLesson
                ? {
                    _id:
                      nextLesson._id,

                    title:
                      nextLesson.title,

                    slug:
                      nextLesson.slug,

                    type:
                      nextLesson.type,

                    duration:
                      nextLesson.duration,

                    moduleId:
                      nextLessonModule?._id,

                    moduleTitle:
                      nextLessonModule?.title,
                  }
                : null,

            modules:
              moduleResults,
          };
        }
      )
    );

    /*
     * ------------------------------------------------------
     * SUCCESS
     * ------------------------------------------------------
     */

    console.log(
      "[ROADMAPS] Successfully built response:",
      result.length
    );

    return NextResponse.json({
      success: true,
      roadmaps: result,
    });
  } catch (error) {
    console.error(
      "[ROADMAPS] ERROR:",
      error
    );

    /*
     * Return the actual development
     * error so we can diagnose it.
     */

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to fetch roadmaps",
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