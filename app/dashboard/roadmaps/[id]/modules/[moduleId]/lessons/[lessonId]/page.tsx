"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  FileText,
  Play,
  Terminal,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import VideoPlayer from "@/components/layout/VideoPlayer";

interface CodeExample {
  title: string;
  language: string;
  code: string;
}

interface ApiLesson {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: "Lesson" | "Practice" | "Quiz";
  duration: string;
  order: number;
  content: string;
  videoUrl?: string;
  codeExamples: CodeExample[];

  completed: boolean;
  completedAt?: string | null;
  score?: number | null;
  attempts?: number;
  lastAccessedAt?: string | null;
}

interface ApiModule {
  _id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lessons: ApiLesson[];
}

interface ApiRoadmap {
  _id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  duration: string;
  technologies: string[];
  icon?: string;
  featured: boolean;
  published: boolean;

  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  progress: number;

  modules: ApiModule[];

  nextLesson?: {
    lessonId: string;
    moduleId: string;
    moduleSlug: string;
    title: string;
    slug: string;
    type: "Lesson" | "Practice" | "Quiz";
    duration: string;
    completed: boolean;
    lastAccessedAt?: string | null;
  } | null;
}

interface RoadmapResponse {
  success: boolean;
  message?: string;
  roadmap?: ApiRoadmap;
}

interface CompleteResponse {
  success: boolean;
  message?: string;
  progress?: {
    lesson?: string;
    module?: string;
    roadmap?: string;
    completed?: boolean;
    completedAt?: string;
  };
}

interface QuizOption {
  text: string;
  value: string;
}

interface QuizQuestion {
  _id: string;
  question: string;
  options: QuizOption[];
  order: number;
}

interface QuizData {
  _id: string;
  lesson: string;
  questions: QuizQuestion[];
  passingScore: number;
}

interface QuizProgress {
  score: number;
  attempts: number;
  completed: boolean;
  completedAt?: string | null;
  passed: boolean;
}

interface QuizResponse {
  success: boolean;
  message?: string;
  quiz?: QuizData;
  progress?: QuizProgress | null;
}

interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  completed: boolean;
  attempts: number;
}

function splitContent(content?: string) {
  if (!content) {
    return [];
  }

  return content
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatContentBlock(content: string) {
  return content
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

export default function LessonPage() {
  const params = useParams();

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const moduleId =
    typeof params.moduleId === "string"
      ? params.moduleId
      : Array.isArray(params.moduleId)
        ? params.moduleId[0]
        : "";

  const lessonId =
    typeof params.lessonId === "string"
      ? params.lessonId
      : Array.isArray(params.lessonId)
        ? params.lessonId[0]
        : "";

  const [roadmap, setRoadmap] =
    useState<ApiRoadmap | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [mobileLessonsOpen, setMobileLessonsOpen] =
    useState(false);

  const [localCompleted, setLocalCompleted] =
    useState(false);

  const [completing, setCompleting] =
    useState(false);

  const [completeError, setCompleteError] =
    useState("");

  const [quiz, setQuiz] =
  useState<QuizData | null>(null);

  const [quizAnswers, setQuizAnswers] =
    useState<Record<string, string>>({});

  const [quizLoading, setQuizLoading] =
    useState(false);

  const [quizSubmitting, setQuizSubmitting] =
    useState(false);

  const [quizError, setQuizError] =
    useState("");

  const [quizResult, setQuizResult] =
    useState<QuizResult | null>(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD ROADMAP
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    async function loadRoadmap() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/roadmaps/${encodeURIComponent(id)}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data: RoadmapResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load roadmap"
          );
        }

        if (
          !data.success ||
          !data.roadmap
        ) {
          throw new Error(
            data.message ||
              "Roadmap not found"
          );
        }

        if (!cancelled) {
          setRoadmap(data.roadmap);
        }
      } catch (err) {
        console.error(
          "[LESSON PAGE] Load error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load lesson"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRoadmap();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | CURRENT MODULE
  |--------------------------------------------------------------------------
  */

  const currentModule = useMemo(() => {
    if (!roadmap) {
      return null;
    }

    return (
      roadmap.modules.find(
        (module) =>
          String(module._id) ===
          String(moduleId)
      ) || null
    );
  }, [roadmap, moduleId]);

  /*
  |--------------------------------------------------------------------------
  | CURRENT LESSON
  |--------------------------------------------------------------------------
  */

  const currentLesson = useMemo(() => {
    if (!currentModule) {
      return null;
    }

    return (
      currentModule.lessons.find(
        (lesson) =>
          String(lesson._id) ===
            String(lessonId) ||
          lesson.slug === lessonId
      ) || null
    );
  }, [
    currentModule,
    lessonId,
  ]);

  /*
   * Keep a stable lesson identifier for effects.
   *
   * The roadmap state is updated after a quiz is passed. That creates a
   * new currentLesson object even though the user is still on the same
   * lesson. The quiz-loading effect must NOT treat that object change as
   * a new lesson, otherwise it clears the quiz result immediately after
   * submission.
   */
  const currentLessonId = currentLesson
    ? String(currentLesson._id)
    : "";

  /*
  |--------------------------------------------------------------------------
  | SYNC COMPLETION STATE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (currentLesson) {
      setLocalCompleted(
        currentLesson.completed
      );

      setCompleteError("");
    }
  }, [currentLesson]);

  useEffect(() => {
    if (
      !currentLessonId ||
      !currentLesson ||
      currentLesson.type !== "Quiz"
    ) {
      setQuiz(null);
      setQuizResult(null);
      setQuizAnswers({});
      setQuizError("");
      setQuizLoading(false);
      return;
    }

    const lessonIdForQuiz = currentLessonId;
    let cancelled = false;

    async function loadQuiz() {
      try {
        setQuizLoading(true);
        setQuizError("");
        setQuizResult(null);
        setQuizAnswers({});
        setQuiz(null);

        const response =
          await fetch(
            `/api/quizzes/${encodeURIComponent(
              lessonIdForQuiz
            )}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data: QuizResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load quiz"
          );
        }

        if (
          !data.success ||
          !data.quiz
        ) {
          throw new Error(
            data.message ||
              "Quiz not found"
          );
        }

        if (!cancelled) {
          setQuiz(data.quiz);

          /*
           * Restore the latest quiz attempt after a browser refresh.
           *
           * StudentProgress stores the latest score/attempt count, while
           * `completed` tells us whether the lesson has ever been passed.
           * The API also returns `passed` for the latest attempt, so a
           * previously completed quiz that was failed again will still
           * correctly show the failed result screen.
           */
          if (data.progress && data.progress.attempts > 0) {
            setQuizResult({
              score: data.progress.score,
              correctAnswers: Math.round(
                (data.progress.score / 100) *
                  data.quiz.questions.length
              ),
              totalQuestions:
                data.quiz.questions.length,
              passingScore:
                data.quiz.passingScore,
              passed: data.progress.passed,
              completed: data.progress.completed,
              attempts: data.progress.attempts,
            });
          } else {
            setQuizResult(null);
          }
        }
      } catch (err) {
        console.error(
          "[QUIZ LOAD] Error:",
          err
        );

        if (!cancelled) {
          setQuizError(
            err instanceof Error
              ? err.message
              : "Unable to load quiz"
          );
        }
      } finally {
        if (!cancelled) {
          setQuizLoading(false);
        }
      }
    }

    loadQuiz();

    return () => {
      cancelled = true;
    };
  }, [currentLessonId, currentLesson?.type]);

  /*
  |--------------------------------------------------------------------------
  | LESSON NAVIGATION
  |--------------------------------------------------------------------------
  */

  const lessons =
    currentModule?.lessons || [];

  const currentIndex =
    currentLesson
      ? lessons.findIndex(
          (item) =>
            String(item._id) ===
            String(
              currentLesson._id
            )
        )
      : -1;

  const previousLesson =
    currentIndex > 0
      ? lessons[currentIndex - 1]
      : null;

  const nextLesson =
    currentIndex >= 0 &&
    currentIndex <
      lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  const canGoNext =
    !!nextLesson &&
    localCompleted;

  /*
  |--------------------------------------------------------------------------
  | PROGRESS
  |--------------------------------------------------------------------------
  */

  const completedCount =
    lessons.filter(
      (item) =>
        item.completed
    ).length;

  const effectiveCompletedCount =
    localCompleted &&
    currentLesson &&
    !currentLesson.completed
      ? completedCount + 1
      : completedCount;

  const moduleProgress =
    lessons.length > 0
      ? Math.round(
          (effectiveCompletedCount /
            lessons.length) *
            100
        )
      : currentModule?.progress || 0;

  /*
  |--------------------------------------------------------------------------
  | CONTENT
  |--------------------------------------------------------------------------
  */

  const contentBlocks =
    splitContent(
      currentLesson?.content
    );

  /*
  |--------------------------------------------------------------------------
  | URL HELPER
  |--------------------------------------------------------------------------
  */

  const lessonUrl = (
    targetLesson: ApiLesson
  ) =>
    `/dashboard/roadmaps/${id}/modules/${moduleId}/lessons/${targetLesson._id}`;

  /*
  |--------------------------------------------------------------------------
  | MARK COMPLETE
  |--------------------------------------------------------------------------
  */

  async function handleMarkComplete() {
    if (
      !currentLesson ||
      !currentModule ||
      completing
    ) {
      return;
    }

    /*
     * Quiz lessons are completed by passing the quiz.
     * Never allow the generic Mark Complete action to bypass it.
     */
    if (currentLesson.type === "Quiz") {
      setCompleteError(
        "Pass the quiz to complete this lesson."
      );
      return;
    }

    /*
     * If already completed, there is
     * nothing else to send to the API.
     */

    if (localCompleted) {
      return;
    }

    try {
      setCompleting(true);
      setCompleteError("");

      const response =
        await fetch(
          `/api/roadmaps/${encodeURIComponent(
            id
          )}/modules/${encodeURIComponent(
            moduleId
          )}/lessons/${encodeURIComponent(
            String(
              currentLesson._id
            )
          )}/complete`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({}),
          }
        );

      const data: CompleteResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to mark lesson as complete"
        );
      }

      if (!data.success) {
        throw new Error(
          data.message ||
            "Unable to mark lesson as complete"
        );
      }

      /*
       * Update UI immediately.
       */

      setLocalCompleted(true);

      /*
       * Update the local roadmap data too,
       * so if the student stays on this page,
       * the lesson navigation reflects completion.
       */

      setRoadmap((currentRoadmap) => {
        if (!currentRoadmap) {
          return currentRoadmap;
        }

        const updatedModules =
          currentRoadmap.modules.map(
            (module) => {
              if (
                String(module._id) !==
                String(moduleId)
              ) {
                return module;
              }

              const updatedLessons =
                module.lessons.map(
                  (lesson) => {
                    if (
                      String(
                        lesson._id
                      ) !==
                      String(
                        currentLesson._id
                      )
                    ) {
                      return lesson;
                    }

                    return {
                      ...lesson,
                      completed: true,
                      completedAt:
                        data.progress
                          ?.completedAt ||
                        new Date().toISOString(),
                    };
                  }
                );

              const completedLessons =
                updatedLessons.filter(
                  (lesson) =>
                    lesson.completed
                ).length;

              const progress =
                updatedLessons.length >
                0
                  ? Math.round(
                      (completedLessons /
                        updatedLessons.length) *
                        100
                    )
                  : 0;

              return {
                ...module,
                lessons:
                  updatedLessons,
                completedLessons,
                progress,
              };
            }
          );

        const totalLessons =
          updatedModules.reduce(
            (
              total,
              module
            ) =>
              total +
              module.lessons.length,
            0
          );

        const completedLessons =
          updatedModules.reduce(
            (
              total,
              module
            ) =>
              total +
              module.lessons.filter(
                (lesson) =>
                  lesson.completed
              ).length,
            0
          );

        const roadmapProgress =
          totalLessons > 0
            ? Math.round(
                (completedLessons /
                  totalLessons) *
                  100
              )
            : 0;

        return {
          ...currentRoadmap,
          modules:
            updatedModules,
          completedLessons,
          progress:
            roadmapProgress,
        };
      });
    } catch (err) {
      console.error(
        "[LESSON COMPLETE] Error:",
        err
      );

      setCompleteError(
        err instanceof Error
          ? err.message
          : "Unable to mark lesson as complete"
      );
    } finally {
      setCompleting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | QUIZ SUBMISSION
  |--------------------------------------------------------------------------
  */

  async function handleQuizSubmit() {
    if (
      !currentLesson ||
      currentLesson.type !== "Quiz" ||
      !quiz ||
      quizSubmitting
    ) {
      return;
    }

    setQuizError("");

    /*
     * ------------------------------------------------------
     * VALIDATE ANSWERS
     * ------------------------------------------------------
     */

    const unanswered =
      quiz.questions.filter(
        (question) =>
          !quizAnswers[String(question._id)]
      );

    if (unanswered.length > 0) {
      setQuizError(
        `Please answer all ${quiz.questions.length} questions before submitting.`
      );
      return;
    }

    try {
      setQuizSubmitting(true);

      const answers =
        quiz.questions.map((question) => ({
          questionId: String(question._id),
          answer:
            quizAnswers[String(question._id)],
        }));

      const response =
        await fetch(
          `/api/quizzes/${encodeURIComponent(
            String(currentLesson._id)
          )}/submit`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ answers }),
          }
        );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to submit quiz"
        );
      }

      if (!data.success || !data.result) {
        throw new Error(
          data.message ||
            "Unable to submit quiz"
        );
      }

      /*
       * IMPORTANT: Always display the result of THIS attempt.
       *
       * `completed` means the lesson may have been completed by a
       * previous attempt. It does NOT mean this attempt passed.
       * Therefore the current attempt must be controlled by `passed`.
       */
      setQuizResult(data.result);

      if (data.result.passed) {
        setLocalCompleted(true);

        /*
         * Update the roadmap in memory so navigation immediately knows
         * that this lesson is complete. The quiz-loading effect uses the
         * stable currentLessonId dependency, so this state update will NOT
         * clear the result we just displayed.
         */
        setRoadmap((currentRoadmap) => {
          if (!currentRoadmap) {
            return currentRoadmap;
          }

          const updatedModules =
            currentRoadmap.modules.map((module) => {
              if (
                String(module._id) !==
                String(moduleId)
              ) {
                return module;
              }

              const updatedLessons =
                module.lessons.map((lesson) => {
                  if (
                    String(lesson._id) !==
                    String(currentLesson._id)
                  ) {
                    return lesson;
                  }

                  return {
                    ...lesson,
                    completed: true,
                    completedAt:
                      data.result.completedAt ||
                      new Date().toISOString(),
                    score: data.result.score,
                    attempts: data.result.attempts,
                  };
                });

              const completedLessons =
                updatedLessons.filter(
                  (lesson) => lesson.completed
                ).length;

              const progress =
                updatedLessons.length > 0
                  ? Math.round(
                      (completedLessons /
                        updatedLessons.length) *
                        100
                    )
                  : 0;

              return {
                ...module,
                lessons: updatedLessons,
                completedLessons,
                progress,
              };
            });

          const totalLessons =
            updatedModules.reduce(
              (total, module) =>
                total + module.lessons.length,
              0
            );

          const completedLessons =
            updatedModules.reduce(
              (total, module) =>
                total +
                module.lessons.filter(
                  (lesson) => lesson.completed
                ).length,
              0
            );

          const progress =
            totalLessons > 0
              ? Math.round(
                  (completedLessons /
                    totalLessons) *
                    100
                )
              : 0;

          return {
            ...currentRoadmap,
            modules: updatedModules,
            completedLessons,
            progress,
          };
        });
      } else {
        /*
         * FAILED ATTEMPT
         *
         * Do not modify roadmap completion here. This is especially
         * important when a student had already passed the quiz before.
         * The API can correctly return completed=true in that situation,
         * while the CURRENT attempt still has passed=false.
         */
        console.log(
          "[QUIZ SUBMIT] Current attempt failed:",
          {
            score: data.result.score,
            attempts: data.result.attempts,
            previouslyCompleted:
              data.result.completed,
          }
        );
      }
    } catch (err) {
      console.error(
        "[QUIZ SUBMIT] Error:",
        err
      );

      setQuizError(
        err instanceof Error
          ? err.message
          : "Unable to submit quiz"
      );
    } finally {
      setQuizSubmitting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl pb-12">

        <div className="h-4 w-32 animate-pulse rounded bg-white/5" />

        <div className="mt-6 h-48 animate-pulse rounded-3xl border border-white/10 bg-white/[0.025]" />

        <div className="mt-6 grid gap-6 lg:grid-cols-[230px_1fr]">

          <div className="hidden h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025] lg:block" />

          <div className="space-y-5">

            <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />

            <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />

          </div>

        </div>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR / NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    !roadmap ||
    !currentModule ||
    !currentLesson
  ) {
    return (
      <div className="mx-auto max-w-7xl pb-12">

        <Link
          href={
            id
              ? `/dashboard/roadmaps/${id}`
              : "/dashboard/roadmaps"
          }
          className="inline-flex items-center gap-2 text-xs text-white/35 transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to Roadmap
        </Link>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-10 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <BookOpen
              size={22}
              className="text-white/35"
            />
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            {error ||
              "Lesson not found"}
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
            We couldn't find the requested
            lesson in this roadmap.
          </p>

          <Link
            href={
              id
                ? `/dashboard/roadmaps/${id}`
                : "/dashboard/roadmaps"
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Back to Roadmap
            <ArrowRight size={15} />
          </Link>

        </div>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-7xl pb-12">

      {/* ================================================= */}
      {/* TOP NAVIGATION */}
      {/* ================================================= */}

      <div className="flex flex-wrap items-center justify-between gap-3">

        <Link
          href={`/dashboard/roadmaps/${id}`}
          className="inline-flex items-center gap-2 text-xs text-white/35 transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to Roadmap
        </Link>

        <div className="flex items-center gap-2 text-xs text-white/25">

          <span>
            {currentModule.title}
          </span>

          <ChevronRight size={12} />

          <span>
            {currentLesson.title}
          </span>

        </div>

      </div>

      {/* ================================================= */}
      {/* LESSON HEADER */}
      {/* ================================================= */}

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

          <div className="max-w-3xl">

            <div className="flex flex-wrap items-center gap-2">

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/40">
                {currentLesson.type}
              </span>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/30">
                {currentModule.title}
              </span>

              {currentLesson.duration && (
                <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/30">
                  <Clock3 size={11} />
                  {currentLesson.duration}
                </span>
              )}

              {localCompleted && (
                <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/40">
                  <Check size={11} />
                  Completed
                </span>
              )}

            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              {currentLesson.title}
            </h1>

            {currentLesson.description && (
              <p className="mt-3 text-sm leading-6 text-white/40">
                {currentLesson.description}
              </p>
            )}

          </div>

          {/* MODULE PROGRESS */}

          <div className="w-full shrink-0 lg:w-64">

            <div className="flex items-center justify-between">

              <span className="text-xs text-white/30">
                Module Progress
              </span>

              <span className="text-sm font-semibold">
                {moduleProgress}%
              </span>

            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">

              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{
                  width: `${moduleProgress}%`,
                }}
              />

            </div>

            <p className="mt-2 text-[10px] text-white/25">
              {effectiveCompletedCount} of{" "}
              {lessons.length} lessons
              completed
            </p>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* MOBILE LESSON SELECTOR */}
      {/* ================================================= */}

      <button
        type="button"
        onClick={() =>
          setMobileLessonsOpen(
            !mobileLessonsOpen
          )
        }
        className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left lg:hidden"
      >

        <div className="flex items-center gap-3">

          <BookOpen size={16} />

          <div>

            <p className="text-xs font-medium">
              Lesson Navigation
            </p>

            <p className="mt-1 text-[10px] text-white/25">
              {currentIndex + 1} of{" "}
              {lessons.length}
            </p>

          </div>

        </div>

        {mobileLessonsOpen ? (
          <ChevronLeft size={16} />
        ) : (
          <ChevronRight size={16} />
        )}

      </button>

      {mobileLessonsOpen && (
        <div className="mt-2 rounded-xl border border-white/10 bg-[#090d1b] p-3 lg:hidden">

          <LessonNavigation
            lessons={lessons}
            lessonId={String(
              currentLesson._id
            )}
            lessonUrl={lessonUrl}
          />

        </div>
      )}

      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <div className="mt-6 grid gap-6 lg:grid-cols-[230px_1fr]">

        {/* ================================================= */}
        {/* DESKTOP LESSON SIDEBAR */}
        {/* ================================================= */}

        <aside className="hidden lg:block">

          <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.025] p-4">

            <div className="mb-4 flex items-center gap-2 px-2">

              <BookOpen size={15} />

              <div>

                <p className="text-xs font-semibold">
                  {currentModule.title}
                </p>

                <p className="mt-0.5 text-[10px] text-white/25">
                  {lessons.length} lessons
                </p>

              </div>

            </div>

            <LessonNavigation
              lessons={lessons}
              lessonId={String(
                currentLesson._id
              )}
              lessonUrl={lessonUrl}
            />

          </div>

        </aside>

        {/* ================================================= */}
        {/* LESSON CONTENT */}
        {/* ================================================= */}

        <main className="min-w-0">

          {/* VIDEO */}

          {currentLesson.videoUrl ? (
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">

              <div className="aspect-video bg-black">

                {/* <video
                  className="h-full w-full"
                  controls
                  src={
                    currentLesson.videoUrl
                  }
                >
                  Your browser does not
                  support video playback.
                </video> */}

                <VideoPlayer
                  videoUrl={currentLesson.videoUrl}
                  title={currentLesson.title}
                />

              </div>

            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">

              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-white/[0.04] to-transparent">

                <div className="text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10">

                    <Play
                      size={22}
                      className="ml-1"
                      fill="currentColor"
                    />

                  </div>

                  <p className="mt-4 text-sm font-medium">
                    Lesson Content
                  </p>

                  <p className="mt-1 text-xs text-white/25">
                    Video content will be
                    available here
                  </p>

                </div>

              </div>

            </section>
          )}

          {/* LESSON OVERVIEW */}

          <section className="mt-8">

            <div className="flex items-center gap-2">

              <FileText size={17} />

              <h2 className="text-xl font-semibold">
                Lesson Overview
              </h2>

            </div>

            {currentLesson.description && (
              <p className="mt-4 text-sm leading-7 text-white/45">
                {
                  currentLesson.description
                }
              </p>
            )}

          </section>

          {/* LESSON CONTENT */}

          {contentBlocks.length > 0 ? (
            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">

              <div className="flex items-center gap-2">

                <BookOpen size={17} />

                <h2 className="text-xl font-semibold">
                  Lesson Content
                </h2>

              </div>

              <div className="mt-6 space-y-6">

                {contentBlocks.map(
                  (
                    block,
                    index
                  ) => (
                    <div
                      key={`${index}-${block.slice(
                        0,
                        30
                      )}`}
                    >

                      <div className="flex items-start gap-3">

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] text-white/40">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">

                          <p className="whitespace-pre-line text-sm leading-7 text-white/45">
                            {formatContentBlock(
                              block
                            )}
                          </p>

                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

            </section>
          ) : (
            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center">

              <FileText
                size={20}
                className="mx-auto text-white/20"
              />

              <p className="mt-4 text-sm text-white/35">
                Lesson content is coming soon.
              </p>

            </section>
          )}

          {/* CODE EXAMPLES */}

          {currentLesson.codeExamples &&
            currentLesson.codeExamples
              .length > 0 && (
              <section className="mt-10">

                <div className="flex items-center gap-2">

                  <Code2 size={17} />

                  <h2 className="text-xl font-semibold">
                    Code Examples
                  </h2>

                </div>

                <div className="mt-5 space-y-5">

                  {currentLesson.codeExamples.map(
                    (
                      example,
                      index
                    ) => (
                      <div
                        key={`${example.title}-${index}`}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-[#05070d]"
                      >

                        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">

                          <div className="flex min-w-0 items-center gap-2">

                            <Terminal
                              size={13}
                            />

                            <span className="truncate text-xs text-white/45">
                              {
                                example.title
                              }
                            </span>

                          </div>

                          <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] uppercase text-white/25">
                            {
                              example.language
                            }
                          </span>

                        </div>

                        <pre className="overflow-x-auto p-5 text-xs leading-6 text-white/60">
                          <code>
                            {
                              example.code
                            }
                          </code>
                        </pre>

                      </div>
                    )
                  )}

                </div>

              </section>
            )}

          {/* ================================================= */}
          {/* PRACTICE / QUIZ */}
          {/* ================================================= */}

          {currentLesson.type ===
            "Practice" && (
            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Code2 size={17} />
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                    Practice
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    Practice Exercise
                  </h2>
                </div>

              </div>

              <p className="mt-4 text-sm leading-6 text-white/40">
                Complete the practice activity
                described above, then mark this
                lesson as complete.
              </p>

            </section>
          )}

          {currentLesson.type ===
            "Quiz" && (
            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Trophy size={17} />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                      Quiz
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                      Test Your Knowledge
                    </h2>
                  </div>

                </div>

                {quiz && (
                  <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/35">
                    Pass: {quiz.passingScore}%
                  </span>
                )}

              </div>

              {quizLoading && (
                <div className="mt-8 space-y-4">

                  {Array.from({
                    length: 3,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/5"
                    />
                  ))}

                </div>
              )}

              {quizError && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-white/50">
                    {quizError}
                  </p>
                </div>
              )}

              {quiz &&
                !quizLoading &&
                !quizResult && (
                  <div className="mt-8 space-y-6">

                    {quiz.questions.map(
                      (question, index) => (
                        <div
                          key={String(
                            question._id
                          )}
                          className="rounded-2xl border border-white/10 bg-black/10 p-5"
                        >

                          <div className="flex gap-4">

                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/40">
                              {index + 1}
                            </span>

                            <div className="min-w-0 flex-1">

                              <h3 className="text-sm font-medium leading-6">
                                {
                                  question.question
                                }
                              </h3>

                              <div className="mt-4 space-y-2">

                                {question.options.map(
                                  (option) => {
                                    const selected =
                                      quizAnswers[
                                        String(
                                          question._id
                                        )
                                      ] ===
                                      option.value;

                                    return (
                                      <button
                                        key={
                                          option.value
                                        }
                                        type="button"
                                        onClick={() =>
                                          setQuizAnswers(
                                            (
                                              current
                                            ) => ({
                                              ...current,
                                              [String(
                                                question._id
                                              )]:
                                                option.value,
                                            })
                                          )
                                        }
                                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                                          selected
                                            ? "border-white/30 bg-white/10 text-white"
                                            : "border-white/10 bg-white/[0.02] text-white/40 hover:bg-white/5 hover:text-white/70"
                                        }`}
                                      >

                                        <span
                                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                            selected
                                              ? "border-white bg-white"
                                              : "border-white/20"
                                          }`}
                                        >
                                          {selected && (
                                            <span className="h-2 w-2 rounded-full bg-black" />
                                          )}
                                        </span>

                                        <span className="text-xs">
                                          {
                                            option.text
                                          }
                                        </span>

                                      </button>
                                    );
                                  }
                                )}

                              </div>

                            </div>

                          </div>

                        </div>
                      )
                    )}

                    <div className="flex flex-col justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">

                      <p className="text-xs text-white/25">
                        {
                          Object.keys(
                            quizAnswers
                          ).length
                        }{" "}
                        of{" "}
                        {
                          quiz.questions.length
                        }{" "}
                        answered
                      </p>

                      <button
                        type="button"
                        onClick={
                          handleQuizSubmit
                        }
                        disabled={
                          quizSubmitting
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        {quizSubmitting ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Check size={15} />
                            Submit Quiz
                          </>
                        )}

                      </button>

                    </div>

                  </div>
                )}

              {quizResult && (
                <div className="mt-8">

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-6 text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      {quizResult.passed ? (
                        <CheckCircle2
                          size={28}
                        />
                      ) : (
                        <Trophy
                          size={25}
                        />
                      )}
                    </div>

                    <p className="mt-5 text-xs uppercase tracking-[0.15em] text-white/25">
                      {quizResult.passed
                        ? "Quiz Passed"
                        : "Quiz Failed"}
                    </p>

                    <p className="mt-2 text-4xl font-bold">
                      {quizResult.score}%
                    </p>

                    <p className="mt-2 text-xs text-white/30">
                      {quizResult.correctAnswers}{" "}
                      of{" "}
                      {quizResult.totalQuestions}{" "}
                      answers correct
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">

                      <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-white/35">
                        Passing:{" "}
                        {quizResult.passingScore}%
                      </span>

                      <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-white/35">
                        Attempt:{" "}
                        {quizResult.attempts}
                      </span>

                    </div>

                    {quizResult.passed ? (
                      <p className="mt-6 text-xs text-white/45">
                        Excellent work! This quiz
                        is complete and the lesson
                        has been marked as completed.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setQuizResult(null);
                          setQuizAnswers({});
                          setQuizError("");
                        }}
                        className="mt-6 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
                      >
                        Try Again
                      </button>
                    )}

                  </div>

                </div>
              )}

            </section>
          )}

          {/* ================================================= */}
          {/* COMPLETE LESSON */}
          {/* ================================================= */}

          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-6">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div className="flex items-center gap-4">

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                    localCompleted
                      ? "border-white/20 bg-white text-black"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  {localCompleted ? (
                    <Check size={18} />
                  ) : (
                    <Trophy size={18} />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    {localCompleted
                      ? "Lesson completed!"
                      : currentLesson.type === "Quiz"
                        ? "Pass the quiz to complete this lesson"
                        : "Finished this lesson?"}
                  </h3>

                  <p className="mt-1 text-xs text-white/30">
                    {localCompleted
                      ? "Your progress has been saved. Continue to the next lesson."
                      : currentLesson.type === "Quiz"
                        ? `You need at least ${quiz?.passingScore ?? 70}% to complete this lesson.`
                        : "Mark this lesson as complete when you're ready."}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={
                  localCompleted ||
                  completing ||
                  currentLesson.type === "Quiz"
                }
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-semibold transition ${
                  localCompleted
                    ? "cursor-default border border-white/10 bg-white/5 text-white/60"
                    : currentLesson.type === "Quiz"
                      ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/25"
                      : "bg-white text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                }`}
              >

                {completing ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Saving...
                  </>
                ) : localCompleted ? (
                  <>
                    <CheckCircle2 size={15} />
                    Completed
                  </>
                ) : currentLesson.type === "Quiz" ? (
                  <>
                    <Trophy size={15} />
                    Pass Quiz First
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    Mark Complete
                  </>
                )}

              </button>

            </div>

            {completeError && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">

                <p className="text-xs text-white/50">
                  {completeError}
                </p>

                {currentLesson.type !== "Quiz" && (
                  <button
                    type="button"
                    onClick={handleMarkComplete}
                    disabled={completing}
                    className="mt-2 text-[10px] font-medium text-white underline underline-offset-4 hover:text-white/70"
                  >
                    Try again
                  </button>
                )}

              </div>
            )}

          </section>

          {/* ================================================= */}
          {/* PREVIOUS / NEXT */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">

            {previousLesson ? (
              <Link
                href={lessonUrl(
                  previousLesson
                )}
                className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:bg-white/[0.04]"
              >

                <ChevronLeft
                  size={17}
                  className="text-white/25 transition group-hover:-translate-x-1 group-hover:text-white"
                />

                <div className="min-w-0">

                  <p className="text-[9px] uppercase tracking-wider text-white/25">
                    Previous Lesson
                  </p>

                  <p className="mt-1 truncate text-xs font-medium text-white/50 group-hover:text-white">
                    {
                      previousLesson.title
                    }
                  </p>

                </div>

              </Link>
            ) : (
              <div />
            )}

            {canGoNext ? (
              <Link
                href={lessonUrl(nextLesson)}
                className="group flex items-center justify-end gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-right transition hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-wider text-white/25">
                    Next Lesson
                  </p>

                  <p className="mt-1 truncate text-xs font-medium text-white/50 group-hover:text-white">
                    {nextLesson.title}
                  </p>
                </div>

                <ChevronRight
                  size={17}
                  className="text-white/25 transition group-hover:translate-x-1 group-hover:text-white"
                />
              </Link>
            ) : nextLesson ? (
              <div className="flex items-center justify-end gap-3 rounded-2xl border border-white/10 bg-white/[0.015] p-4 text-right opacity-40">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/20">
                    Complete Current Lesson
                  </p>

                  <p className="mt-1 truncate text-xs font-medium text-white/30">
                    {nextLesson.title}
                  </p>
                </div>

                <span className="text-sm">
                  🔒
                </span>
              </div>
            ) : (
              <Link
                href={`/dashboard/roadmaps/${id}`}
                className="group flex items-center justify-end gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-right transition hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/25">
                    Roadmap
                  </p>

                  <p className="mt-1 text-xs font-medium text-white/50 group-hover:text-white">
                    Back to Roadmap
                  </p>
                </div>

                <ArrowRight size={16} />
              </Link>
            )}

          </div>

        </main>

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| LESSON NAVIGATION
|--------------------------------------------------------------------------
*/

function LessonNavigation({
  lessons,
  lessonId,
  lessonUrl,
}: {
  lessons: ApiLesson[];
  lessonId: string;
  lessonUrl: (
    lesson: ApiLesson
  ) => string;
}) {
  return (
    <div className="space-y-1">

      {lessons.map((item, index) => {
        const locked =
          index > 0 &&
          !lessons[index - 1].completed;

        const active =
          String(item._id) ===
          String(lessonId);

        const content = (
          <div
            className={`group flex items-center gap-3 rounded-xl p-2.5 transition ${
              active
                ? "bg-white text-black"
                : locked
                  ? "cursor-not-allowed text-white/15"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                active
                  ? "bg-black/10"
                  : locked
                    ? "bg-white/[0.02]"
                    : "bg-white/5"
              }`}
            >
              {locked ? (
                <span className="text-[11px]">
                  🔒
                </span>
              ) : item.completed ? (
                <Check size={12} />
              ) : (
                <span className="text-[9px]">
                  {index + 1}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium">
                {item.title}
              </p>

              <p
                className={`mt-0.5 text-[8px] ${
                  active
                    ? "text-black/40"
                    : locked
                      ? "text-white/10"
                      : "text-white/20"
                }`}
              >
                {locked
                  ? "Locked"
                  : item.type}

                {!locked &&
                  item.duration
                  ? ` · ${item.duration}`
                  : ""}
              </p>
            </div>

            {item.completed &&
              !active && (
                <CheckCircle2
                  size={12}
                  className="shrink-0 text-white/20"
                />
              )}
          </div>
        );

        if (locked) {
          return (
            <div key={item._id}>
              {content}
            </div>
          );
        }

        return (
          <Link
            key={item._id}
            href={lessonUrl(item)}
          >
            {content}
          </Link>
        );
      })}

    </div>
  );
}