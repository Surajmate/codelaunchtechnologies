"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  Play,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardRoadmap {
  _id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  duration: string;
  technologies: string[];
  progress: number;
  totalLessons: number;
  completedLessons: number;
  totalModules: number;

  nextLesson?: {
    _id: string;
    title: string;
    slug: string;
    type: "Lesson" | "Practice" | "Quiz";
    duration: string;
    moduleId?: string;
    moduleTitle?: string;
  } | null;
}

interface DashboardData {
  success: boolean;

  user: {
    name: string;
    email: string;
  };

  stats: {
    overallProgress: number;
    totalLessons: number;
    completedLessons: number;
    remainingLessons: number;
    totalModules: number;
    activeRoadmaps: number;
    completedRoadmaps: number;
  };

  continueLesson: {
    lessonId: string;
    lessonTitle: string;
    moduleId: string;
    moduleTitle: string;
    roadmapId: string;
    roadmapTitle: string;
    roadmapSlug: string;
    type: "Lesson" | "Practice" | "Quiz";
    duration: string;
    progress: number;
  } | null;

  roadmaps: DashboardRoadmap[];

  recentActivity: {
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    roadmapTitle: string;
    completed: boolean;
    completedAt?: string;
    updatedAt: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/dashboard",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load dashboard"
          );
        }

        if (!result.success) {
          throw new Error(
            result.message ||
              "Unable to load dashboard"
          );
        }

        setData(result);
      } catch (err) {
        console.error(
          "[DASHBOARD] ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    // Initial dashboard load
    loadDashboard();

    // Reload when the dashboard becomes visible
    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadDashboard();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  if (loading) {
    return (
      <DashboardSkeleton />
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8">
          <p className="text-sm text-white/60">
            {error ||
              "Unable to load dashboard"}
          </p>
        </div>
      </div>
    );
  }

  const {
    user,
    stats,
    continueLesson,
    roadmaps,
    recentActivity,
  } = data;

  const displayName =
    user.name || "Student";

  const featuredRoadmaps =
    roadmaps.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl pb-12">

      {/* ================================================= */}
      {/* WELCOME */}
      {/* ================================================= */}

      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">

        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

          <div>

            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Student Dashboard
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back,{" "}
              {displayName}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Continue your learning
              journey, track your progress
              and build your skills.
            </p>

          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <GraduationCap
              size={27}
              className="text-white/60"
            />
          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* OVERALL PROGRESS + STATS */}
      {/* ================================================= */}

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">

        {/* Overall Progress */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Target size={17} />
              </div>

              <div>
                <p className="text-xs text-white/35">
                  Overall Progress
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.overallProgress}%
                </p>
              </div>

            </div>

          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">

            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{
                width: `${stats.overallProgress}%`,
              }}
            />

          </div>

          <p className="mt-3 text-[10px] text-white/25">
            {stats.completedLessons} of{" "}
            {stats.totalLessons} lessons
            completed
          </p>

        </div>

        {/* Completed Lessons */}

        <DashboardStat
          icon={CheckCircle2}
          label="Completed Lessons"
          value={
            stats.completedLessons
          }
          description="Lessons completed"
        />

        {/* Active Roadmaps */}

        <DashboardStat
          icon={Layers3}
          label="Active Roadmaps"
          value={
            stats.activeRoadmaps
          }
          description="Roadmaps in progress"
        />

        {/* Remaining */}

        <DashboardStat
          icon={BookOpen}
          label="Remaining"
          value={
            stats.remainingLessons
          }
          description="Lessons to complete"
        />

      </section>

      {/* ================================================= */}
      {/* CONTINUE LEARNING */}
      {/* ================================================= */}

      {continueLesson && (
        <section className="mt-8">

          <SectionHeading
            eyebrow="Pick up where you left off"
            title="Continue Learning"
          />

          <Link
            href={`/dashboard/roadmaps/${continueLesson.roadmapSlug}/modules/${continueLesson.moduleId}/lessons/${continueLesson.lessonId}`}
            className="group mt-4 block rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-white/20 hover:bg-white/[0.04] sm:p-8"
          >

            <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">

              <div className="flex min-w-0 gap-5">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">

                  <Play
                    size={19}
                    fill="currentColor"
                    className="ml-0.5"
                  />

                </div>

                <div className="min-w-0">

                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                    {
                      continueLesson.roadmapTitle
                    }
                  </p>

                  <h3 className="mt-2 truncate text-xl font-semibold">
                    {
                      continueLesson.lessonTitle
                    }
                  </h3>

                  <p className="mt-2 text-xs text-white/35">
                    {
                      continueLesson.moduleTitle
                    }
                    {" · "}
                    {
                      continueLesson.type
                    }
                    {" · "}
                    {
                      continueLesson.duration
                    }
                  </p>

                </div>

              </div>

              <div className="w-full shrink-0 lg:w-64">

                <div className="flex items-center justify-between">

                  <span className="text-[10px] text-white/25">
                    Roadmap Progress
                  </span>

                  <span className="text-xs font-semibold">
                    {
                      continueLesson.progress
                    }%
                  </span>

                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">

                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${continueLesson.progress}%`,
                    }}
                  />

                </div>

                <div className="mt-3 flex items-center justify-between">

                  <span className="text-xs text-white/30">
                    Continue
                  </span>

                  <ArrowRight
                    size={16}
                    className="text-white/30 transition group-hover:translate-x-1 group-hover:text-white"
                  />

                </div>

              </div>

            </div>

          </Link>

        </section>
      )}

      {/* ================================================= */}
      {/* MY ROADMAPS */}
      {/* ================================================= */}

      <section className="mt-10">

        <div className="flex items-end justify-between gap-4">

          <SectionHeading
            eyebrow="Your learning paths"
            title="My Roadmaps"
          />

          <Link
            href="/dashboard/roadmaps"
            className="hidden items-center gap-1 text-xs text-white/30 transition hover:text-white sm:flex"
          >
            View all
            <ArrowRight size={13} />
          </Link>

        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {featuredRoadmaps.map(
            (roadmap) => (
              <RoadmapCard
                key={roadmap._id}
                roadmap={roadmap}
              />
            )
          )}

        </div>

        <Link
          href="/dashboard/roadmaps"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-white/35 transition hover:bg-white/5 hover:text-white sm:hidden"
        >
          View all roadmaps
          <ArrowRight size={13} />
        </Link>

      </section>

      {/* ================================================= */}
      {/* RECENT ACTIVITY */}
      {/* ================================================= */}

      {recentActivity.length > 0 && (
        <section className="mt-10">

          <SectionHeading
            eyebrow="Your learning history"
            title="Recent Activity"
          />

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">

            {recentActivity.map(
              (activity, index) => (
                <div
                  key={`${activity.lessonId}-${index}`}
                  className="flex items-center justify-between gap-4 border-b border-white/5 p-4 last:border-0 sm:p-5"
                >

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">

                      {activity.completed ? (
                        <CheckCircle2
                          size={15}
                        />
                      ) : (
                        <Clock3
                          size={15}
                        />
                      )}

                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-xs font-medium text-white/65">
                        {
                          activity.lessonTitle
                        }
                      </p>

                      <p className="mt-1 truncate text-[10px] text-white/25">
                        {
                          activity.moduleTitle
                        }
                        {" · "}
                        {
                          activity.roadmapTitle
                        }
                      </p>

                    </div>

                  </div>

                  <span className="shrink-0 text-[9px] text-white/20">
                    {activity.completed
                      ? "Completed"
                      : "In progress"}
                  </span>

                </div>
              )
            )}

          </div>

        </section>
      )}

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SECTION HEADING
|--------------------------------------------------------------------------
*/

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>

      <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-semibold">
        {title}
      </h2>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function DashboardStat({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <Icon size={17} />
      </div>

      <p className="mt-5 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-white/40">
        {label}
      </p>

      <p className="mt-1 text-[10px] text-white/20">
        {description}
      </p>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ROADMAP CARD
|--------------------------------------------------------------------------
*/

function RoadmapCard({
  roadmap,
}: {
  roadmap: DashboardRoadmap;
}) {
  return (
    <Link
      href={`/dashboard/roadmaps/${roadmap.slug}`}
      className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
    >

      <div className="flex items-start justify-between gap-4">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <BookOpen size={17} />
        </div>

        <ArrowRight
          size={15}
          className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/60"
        />

      </div>

      <h3 className="mt-5 text-sm font-semibold">
        {roadmap.title}
      </h3>

      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/30">
        {roadmap.description}
      </p>

      <div className="mt-5 flex items-center gap-3 text-[9px] text-white/20">

        <span>
          {roadmap.totalModules} modules
        </span>

        <span>·</span>

        <span>
          {roadmap.totalLessons} lessons
        </span>

        <span>·</span>

        <span>
          {roadmap.progress}%
        </span>

      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">

        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{
            width: `${roadmap.progress}%`,
          }}
        />

      </div>

      <div className="mt-4 flex items-center justify-between">

        <span className="text-[9px] text-white/20">
          {roadmap.progress === 100
            ? "Completed"
            : roadmap.progress > 0
              ? "In progress"
              : "Not started"}
        </span>

        {roadmap.level && (
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[8px] uppercase text-white/20">
            {roadmap.level}
          </span>
        )}

      </div>

    </Link>
  );
}

/*
|--------------------------------------------------------------------------
| SKELETON
|--------------------------------------------------------------------------
*/

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl pb-12">

      <div className="h-44 animate-pulse rounded-3xl border border-white/10 bg-white/[0.025]" />

      <div className="mt-6 grid gap-4 lg:grid-cols-4">

        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
          />
        ))}

      </div>

      <div className="mt-8 h-48 animate-pulse rounded-3xl border border-white/10 bg-white/[0.025]" />

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
          />
        ))}

      </div>

    </div>
  );
}