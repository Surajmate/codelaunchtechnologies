import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Roadmap from "@/models/Roadmap";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import StudentProgress from "@/models/StudentProgress";

export async function GET() {
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

    await connectDB();

    /*
     * ------------------------------------------------------
     * LOAD PUBLISHED ROADMAPS
     * ------------------------------------------------------
     */

    const roadmaps = await Roadmap.find({
      published: true,
    })
      .sort({
        featured: -1,
        createdAt: -1,
      })
      .lean();

    /*
     * ------------------------------------------------------
     * LOAD MODULES
     * ------------------------------------------------------
     */

    const roadmapIds = roadmaps.map(
      (roadmap) => roadmap._id
    );

    const modules =
      roadmapIds.length > 0
        ? await Module.find({
            roadmap: {
              $in: roadmapIds,
            },
            published: true,
          })
            .sort({
              order: 1,
            })
            .lean()
        : [];

    /*
     * ------------------------------------------------------
     * LOAD LESSONS
     * ------------------------------------------------------
     */

    const moduleIds = modules.map(
      (module) => module._id
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
              order: 1,
            })
            .lean()
        : [];

    /*
     * ------------------------------------------------------
     * LOAD STUDENT PROGRESS
     * ------------------------------------------------------
     */

    const progress =
      lessons.length > 0
        ? await StudentProgress.find({
            user: userId,
            lesson: {
              $in: lessons.map(
                (lesson) => lesson._id
              ),
            },
          })
            .sort({
              updatedAt: -1,
            })
            .lean()
        : [];

    /*
     * ------------------------------------------------------
     * LOOKUP MAPS
     * ------------------------------------------------------
     */

    const moduleMap = new Map(
      modules.map((module) => [
        String(module._id),
        module,
      ])
    );

    const lessonMap = new Map(
      lessons.map((lesson) => [
        String(lesson._id),
        lesson,
      ])
    );

    const progressMap = new Map(
      progress.map((item) => [
        String(item.lesson),
        item,
      ])
    );

    /*
     * ------------------------------------------------------
     * ROADMAP DATA
     * ------------------------------------------------------
     */

    const roadmapData = roadmaps.map(
      (roadmap) => {
        const roadmapModules =
          modules.filter(
            (module) =>
              String(module.roadmap) ===
              String(roadmap._id)
          );

        const roadmapLessons =
          lessons.filter((lesson) => {
            const module =
              moduleMap.get(
                String(lesson.module)
              );

            return (
              module &&
              String(module.roadmap) ===
                String(roadmap._id)
            );
          });

        const completedLessons =
          roadmapLessons.filter(
            (lesson) =>
              progressMap.get(
                String(lesson._id)
              )?.completed === true
          ).length;

        const totalLessons =
          roadmapLessons.length;

        const roadmapProgress =
          totalLessons > 0
            ? Math.round(
                (completedLessons /
                  totalLessons) *
                  100
              )
            : 0;

        /*
         * First incomplete lesson.
         */

        const nextLesson =
          roadmapLessons.find(
            (lesson) =>
              !progressMap.get(
                String(lesson._id)
              )?.completed
          );

        const nextModule =
          nextLesson
            ? moduleMap.get(
                String(
                  nextLesson.module
                )
              )
            : null;

        return {
          _id: roadmap._id,
          title: roadmap.title,
          slug: roadmap.slug,
          description:
            roadmap.description,
          level: roadmap.level,
          duration: roadmap.duration,
          technologies:
            roadmap.technologies,
          icon: roadmap.icon,
          featured:
            roadmap.featured,

          totalModules:
            roadmapModules.length,

          totalLessons,

          completedLessons,

          progress:
            roadmapProgress,

          nextLesson: nextLesson
            ? {
                _id: nextLesson._id,
                title:
                  nextLesson.title,
                slug:
                  nextLesson.slug,
                type:
                  nextLesson.type,
                duration:
                  nextLesson.duration,
                moduleId:
                  nextModule?._id,
                moduleTitle:
                  nextModule?.title,
              }
            : null,
        };
      }
    );

    /*
     * ------------------------------------------------------
     * OVERALL STATISTICS
     * ------------------------------------------------------
     */

    const totalLessons =
      lessons.length;

    const completedLessons =
      progress.filter(
        (item) =>
          item.completed === true
      ).length;

    const totalModules =
      modules.length;

    const activeRoadmaps =
      roadmapData.filter(
        (roadmap) =>
          roadmap.progress > 0 &&
          roadmap.progress < 100
      ).length;

    const completedRoadmaps =
      roadmapData.filter(
        (roadmap) =>
          roadmap.progress === 100
      ).length;

    const overallProgress =
      totalLessons > 0
        ? Math.round(
            (completedLessons /
              totalLessons) *
              100
          )
        : 0;

    /*
     * ------------------------------------------------------
     * CONTINUE LEARNING
     * ------------------------------------------------------
     *
     * Prefer the most recently accessed
     * incomplete lesson.
     */

    const incompleteProgress =
      progress
        .filter(
          (item) =>
            !item.completed
        )
        .sort((a, b) => {
          const aTime = a.lastAccessedAt
            ? new Date(
                a.lastAccessedAt
              ).getTime()
            : 0;

          const bTime = b.lastAccessedAt
            ? new Date(
                b.lastAccessedAt
              ).getTime()
            : 0;

          return bTime - aTime;
        });

    let continueLesson = null;

    if (
      incompleteProgress.length > 0
    ) {
      const progressItem =
        incompleteProgress[0];

      const lesson =
        lessonMap.get(
          String(
            progressItem.lesson
          )
        );

      if (lesson) {
        const module =
          moduleMap.get(
            String(lesson.module)
          );

        const roadmap =
          module
            ? roadmaps.find(
                (item) =>
                  String(
                    item._id
                  ) ===
                  String(
                    module.roadmap
                  )
              )
            : null;

        if (module && roadmap) {
          continueLesson = {
            lessonId:
              lesson._id,
            lessonTitle:
              lesson.title,
            lessonSlug:
              lesson.slug,

            moduleId:
              module._id,
            moduleTitle:
              module.title,

            roadmapId:
              roadmap._id,
            roadmapTitle:
              roadmap.title,
            roadmapSlug:
              roadmap.slug,

            type:
              lesson.type,
            duration:
              lesson.duration,

            progress:
              roadmapData.find(
                (item) =>
                  String(
                    item._id
                  ) ===
                  String(
                    roadmap._id
                  )
              )?.progress ?? 0,
          };
        }
      }
    }

    /*
     * If the student has never started
     * anything, start with the first
     * available lesson.
     */

    if (!continueLesson) {
        for (const roadmap of roadmaps) {
            const roadmapDataItem =
            roadmapData.find(
                (item) =>
                String(item._id) ===
                String(roadmap._id)
            );

            if (
            !roadmapDataItem ||
            roadmapDataItem.progress === 100
            ) {
            continue;
            }

            const roadmapModules =
            modules
                .filter(
                (module) =>
                    String(module.roadmap) ===
                    String(roadmap._id)
                )
                .sort(
                (a, b) =>
                    a.order - b.order
                );

            for (const module of roadmapModules) {
            const firstLesson =
                lessons
                .filter(
                    (lesson) =>
                    String(lesson.module) ===
                        String(module._id) &&
                    !progressMap.get(
                        String(lesson._id)
                    )?.completed
                )
                .sort(
                    (a, b) =>
                    a.order - b.order
                )[0];

            if (firstLesson) {
                continueLesson = {
                lessonId:
                    firstLesson._id,

                lessonTitle:
                    firstLesson.title,

                lessonSlug:
                    firstLesson.slug,

                moduleId:
                    module._id,

                moduleTitle:
                    module.title,

                roadmapId:
                    roadmap._id,

                roadmapTitle:
                    roadmap.title,

                roadmapSlug:
                    roadmap.slug,

                type:
                    firstLesson.type,

                duration:
                    firstLesson.duration,

                progress:
                    roadmapDataItem.progress,
                };

                break;
            }
            }

            if (continueLesson) {
            break;
            }
        }
        }

    /*
     * ------------------------------------------------------
     * RECENT ACTIVITY
     * ------------------------------------------------------
     */

    const recentActivity =
      progress
        .slice(0, 6)
        .map((item) => {
          const lesson =
            lessonMap.get(
              String(item.lesson)
            );

          if (!lesson) {
            return null;
          }

          const module =
            moduleMap.get(
              String(lesson.module)
            );

          const roadmap =
            module
              ? roadmaps.find(
                  (roadmap) =>
                    String(
                      roadmap._id
                    ) ===
                    String(
                      module.roadmap
                    )
                )
              : null;

          if (!module || !roadmap) {
            return null;
          }

          return {
            lessonId:
              lesson._id,
            lessonTitle:
              lesson.title,
            moduleTitle:
              module.title,
            roadmapTitle:
              roadmap.title,

            completed:
              item.completed,

            completedAt:
              item.completedAt,

            updatedAt:
              item.updatedAt,
          };
        })
        .filter(Boolean);

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      user: {
        name:
          user.name ||
          user.email ||
          "Student",
        email:
          user.email || "",
      },

      stats: {
        overallProgress,
        totalLessons,
        completedLessons,
        remainingLessons:
          Math.max(
            totalLessons -
              completedLessons,
            0
          ),

        totalModules,
        activeRoadmaps,
        completedRoadmaps,
      },

      continueLesson,

      roadmaps: roadmapData,

      recentActivity,
    });
  } catch (error) {
    console.error(
      "[DASHBOARD API] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load dashboard",
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