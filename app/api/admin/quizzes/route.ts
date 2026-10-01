import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Roadmap from "@/models/Roadmap";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";

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

    await connectDB();

    const roadmaps =
      await Roadmap.find({})
        .sort({
          createdAt: -1,
        })
        .lean();

    const result =
      await Promise.all(
        roadmaps.map(
          async (roadmap) => {
            const modules =
              await Module.find({
                roadmap:
                  roadmap._id,
              })
                .sort({
                  order: 1,
                })
                .lean();

            const moduleResults =
              await Promise.all(
                modules.map(
                  async (module) => {
                    const lessons =
                      await Lesson.find({
                        module:
                          module._id,
                        type: "Quiz",
                      })
                        .sort({
                          order: 1,
                        })
                        .lean();

                    const quizLessons =
                      await Promise.all(
                        lessons.map(
                          async (
                            lesson
                          ) => {
                            const quiz =
                              await Quiz.findOne(
                                {
                                  lesson:
                                    lesson._id,
                                }
                              )
                                .select(
                                  "_id passingScore published questions"
                                )
                                .lean();

                            return {
                              _id:
                                lesson._id,

                              title:
                                lesson.title,

                              slug:
                                lesson.slug,

                              order:
                                lesson.order,

                              published:
                                lesson.published,

                              quiz: quiz
                                ? {
                                    _id:
                                      quiz._id,

                                    passingScore:
                                      quiz.passingScore,

                                    published:
                                      quiz.published,

                                    questionCount:
                                      quiz
                                        .questions
                                        .length,
                                  }
                                : null,
                            };
                          }
                        )
                      );

                    return {
                      _id:
                        module._id,

                      title:
                        module.title,

                      order:
                        module.order,

                      lessons:
                        quizLessons,
                    };
                  }
                )
              );

            return {
              _id:
                roadmap._id,

              title:
                roadmap.title,

              slug:
                roadmap.slug,

              modules:
                moduleResults,
            };
          }
        )
      );

    return NextResponse.json({
      success: true,
      roadmaps: result,
    });
  } catch (error) {
    console.error(
      "[ADMIN QUIZZES] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load quizzes",
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