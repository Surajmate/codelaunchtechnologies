"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Database,
  Globe,
  Layers3,
  PlayCircle,
  Server,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface Roadmap {
  _id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  duration: string;
  technologies: string[];
  icon?: string;
  featured: boolean;

  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  nextLesson?: {
    _id: string;
    title: string;
    slug: string;
    type: "Lesson" | "Practice" | "Quiz";
    duration: string;
    moduleId?: string;
    moduleTitle?: string;
  } | null;

  modules?: {
    _id: string;
    title: string;
    slug: string;
    description: string;
    order: number;
    totalLessons: number;
    completedLessons: number;
    progress: number;
  }[];
}

/*
|--------------------------------------------------------------------------
| ICON MAP
|--------------------------------------------------------------------------
*/

const iconMap = {
  Layers3,
  Server,
  Globe,
  Code2,
  Zap,
  Database,
};

/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

const categories = [
  "All",
  "Web Development",
  "Backend",
  "Programming",
  "Data & AI",
];

/*
|--------------------------------------------------------------------------
| CATEGORY MATCHING
|--------------------------------------------------------------------------
*/

function getRoadmapCategory(
  roadmap: Roadmap
) {
  const technologies =
    roadmap.technologies.map((item) =>
      item.toLowerCase()
    );

  const title =
    roadmap.title.toLowerCase();

  /*
   * Data & AI
   */

  if (
    title.includes("data") ||
    title.includes("ai") ||
    technologies.some((technology) =>
      [
        "python",
        "pandas",
        "ml",
        "machine learning",
        "ai",
        "llms",
      ].includes(technology)
    )
  ) {
    return "Data & AI";
  }

  /*
   * Backend
   */

  if (
    title.includes("backend") ||
    technologies.some((technology) =>
      [
        "node.js",
        "express",
        "rest api",
        "rest",
        "spring boot",
        "jpa",
        "mysql",
        "postgresql",
        "fastapi",
        "django",
      ].includes(technology)
    )
  ) {
    /*
     * Full Stack should remain Web Development
     * because it covers both frontend and backend.
     */
    if (!title.includes("full stack")) {
      return "Backend";
    }
  }

  /*
   * Programming
   */

  if (
    title.includes("java") ||
    title.includes("python") ||
    technologies.some((technology) =>
      [
        "java",
        "python",
      ].includes(technology)
    )
  ) {
    return "Programming";
  }

  /*
   * Default web category
   */

  return "Web Development";
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] =
    useState<Roadmap[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  /*
   * ------------------------------------------------------
   * LOAD ROADMAPS
   * ------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadRoadmaps() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch("/api/roadmaps", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load roadmaps"
          );
        }

        if (!data.success) {
          throw new Error(
            data?.message ||
              "Unable to load roadmaps"
          );
        }

        if (!cancelled) {
          setRoadmaps(
            Array.isArray(data.roadmaps)
              ? data.roadmaps
              : []
          );
        }
      } catch (err) {
        console.error(
          "Load roadmaps error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load roadmaps"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRoadmaps();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ------------------------------------------------------
   * FILTER ROADMAPS
   * ------------------------------------------------------
   */

  const filteredRoadmaps =
    useMemo(() => {
      if (
        selectedCategory ===
        "All"
      ) {
        return roadmaps;
      }

      return roadmaps.filter(
        (roadmap) =>
          getRoadmapCategory(
            roadmap
          ) === selectedCategory
      );
    }, [
      roadmaps,
      selectedCategory,
    ]);

  /*
   * ------------------------------------------------------
   * FEATURED ROADMAP
   * ------------------------------------------------------
   */

  const featuredRoadmap =
    filteredRoadmaps.find(
      (roadmap) =>
        roadmap.featured
    );

  /*
   * ------------------------------------------------------
   * OTHER ROADMAPS
   * ------------------------------------------------------
   */

  const otherRoadmaps =
    filteredRoadmaps.filter(
      (roadmap) =>
        roadmap._id !==
        featuredRoadmap?._id
    );

  /*
   |--------------------------------------------------------------------------
   | LOADING STATE
   |--------------------------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl pb-12">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Learning
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Choose your learning path
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Follow structured roadmaps designed to take you from
              fundamentals to real-world development skills.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
            <Trophy
              size={16}
              className="text-white/50"
            />

            <div>
              <p className="text-xs font-medium">
                Learning Progress
              </p>

              <p className="mt-0.5 text-[10px] text-white/30">
                Keep building every day
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
          {categories.map(
            (category) => (
              <div
                key={category}
                className="h-9 w-28 shrink-0 animate-pulse rounded-xl border border-white/10 bg-white/[0.025]"
              />
            )
          )}
        </div>

        <div className="mt-6 h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.025]" />

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
            />
          ))}
        </div>
      </div>
    );
  }

  /*
   |--------------------------------------------------------------------------
   | ERROR STATE
   |--------------------------------------------------------------------------
   */

  if (error) {
    return (
      <div className="mx-auto max-w-7xl pb-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Learning
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            Unable to load roadmaps
          </h1>

          <p className="mt-3 text-sm text-white/40">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
   |--------------------------------------------------------------------------
   | MAIN UI
   |--------------------------------------------------------------------------
   */

  return (
    <div className="mx-auto max-w-7xl pb-12">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div className="max-w-3xl">

          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Learning
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your learning path
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
            Follow structured roadmaps designed to take you from
            fundamentals to real-world development skills.
          </p>

        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">

          <Trophy
            size={16}
            className="text-white/50"
          />

          <div>
            <p className="text-xs font-medium">
              Learning Progress
            </p>

            <p className="mt-0.5 text-[10px] text-white/30">
              Keep building every day
            </p>
          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* CATEGORIES */}
      {/* ================================================= */}

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">

        {categories.map(
          (category) => (
            <button
              type="button"
              key={category}
              onClick={() =>
                setSelectedCategory(
                  category
                )
              }
              className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-xs font-medium transition ${
                selectedCategory ===
                category
                  ? "border-white/20 bg-white text-black"
                  : "border-white/10 bg-white/[0.025] text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              {category}
            </button>
          )
        )}

      </div>

      {/* ================================================= */}
      {/* EMPTY STATE */}
      {/* ================================================= */}

      {filteredRoadmaps.length ===
        0 && (
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-10 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <BookOpen
              size={22}
              className="text-white/50"
            />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            No roadmaps available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
            There are no published learning paths in this category yet.
          </p>

          {selectedCategory !==
            "All" && (
            <button
              type="button"
              onClick={() =>
                setSelectedCategory(
                  "All"
                )
              }
              className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-white/10"
            >
              View all roadmaps
            </button>
          )}

        </section>
      )}

      {/* ================================================= */}
      {/* FEATURED ROADMAP */}
      {/* ================================================= */}

      {featuredRoadmap && (
        <section
          className="relative mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]"
        >

          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.035] blur-3xl" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_340px] lg:p-10">

            {/* LEFT */}

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Recommended
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/35">
                  {
                    featuredRoadmap.level
                  }
                </span>

              </div>

              <div className="mt-6 flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  {(() => {
                    const Icon =
                      iconMap[
                        featuredRoadmap
                          .icon as keyof typeof iconMap
                      ] ||
                      Layers3;

                    return (
                      <Icon size={22} />
                    );
                  })()}
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {
                      featuredRoadmap.title
                    }
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                    {
                      featuredRoadmap.description
                    }
                  </p>
                </div>

              </div>

              {/* TECHNOLOGIES */}

              <div className="mt-6 flex flex-wrap gap-2">

                {featuredRoadmap.technologies.map(
                  (technology) => (
                    <span
                      key={
                        technology
                      }
                      className="rounded-lg border border-white/10 bg-black/10 px-2.5 py-1.5 text-[10px] text-white/40"
                    >
                      {technology}
                    </span>
                  )
                )}

              </div>

              {/* META */}

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/30">

                <span className="flex items-center gap-2">
                  <Layers3 size={13} />

                  {
                    featuredRoadmap.totalModules
                  }{" "}
                  modules
                </span>

                <span className="flex items-center gap-2">
                  <BookOpen size={13} />

                  {
                    featuredRoadmap.totalLessons
                  }{" "}
                  lessons
                </span>

                <span className="flex items-center gap-2">
                  <Trophy size={13} />

                  {
                    featuredRoadmap.duration
                  }
                </span>

              </div>

              <Link
                href={
                  featuredRoadmap.progress === 100
                    ? `/dashboard/roadmaps/${featuredRoadmap.slug}`
                    : featuredRoadmap.nextLesson?.moduleId &&
                        featuredRoadmap.nextLesson?._id
                      ? `/dashboard/roadmaps/${featuredRoadmap.slug}/modules/${featuredRoadmap.nextLesson.moduleId}/lessons/${featuredRoadmap.nextLesson._id}`
                      : `/dashboard/roadmaps/${featuredRoadmap.slug}`
                }
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                {featuredRoadmap.progress === 100
                  ? "View Roadmap"
                  : featuredRoadmap.progress > 0
                    ? "Continue Learning"
                    : "Start Learning"}

                <ArrowRight size={15} />
              </Link>

            </div>

            {/* PROGRESS */}

            <div className="flex items-center">

              <div className="w-full rounded-2xl border border-white/10 bg-black/20 p-5">

                <div className="flex items-center justify-between">

                  <span className="text-xs text-white/35">
                    Your Progress
                  </span>

                  <span className="text-lg font-bold">
                    {
                      featuredRoadmap.progress
                    }
                    %
                  </span>

                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">

                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          featuredRoadmap.progress
                        )
                      )}%`,
                    }}
                  />

                </div>

                <div className="mt-4 flex items-center justify-between text-[10px] text-white/25">

                  <span>
                    {
                      featuredRoadmap.completedLessons
                    }{" "}
                    completed
                  </span>

                  <span>
                    {
                      featuredRoadmap.totalLessons
                    }{" "}
                    total lessons
                  </span>

                </div>

                <div className="mt-6 border-t border-white/10 pt-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                      <Sparkles
                        size={15}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-medium">
                        {featuredRoadmap.progress >
                        0
                          ? "Keep going"
                          : "Start learning"}
                      </p>

                      <p className="mt-0.5 text-[10px] text-white/25">
                        Consistency beats intensity.
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>
      )}

      {/* ================================================= */}
      {/* ALL ROADMAPS */}
      {/* ================================================= */}

      {otherRoadmaps.length >
        0 && (
        <section className="mt-10">

          <div className="flex items-end justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                Explore Roadmaps
              </h2>

              <p className="mt-1 text-sm text-white/35">
                Find the path that matches your career goals.
              </p>
            </div>

            <span className="hidden text-xs text-white/25 sm:block">
              {
                filteredRoadmaps.length
              }{" "}
              learning paths
            </span>

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            {otherRoadmaps.map(
              (roadmap) => {
                const Icon =
                  iconMap[
                    roadmap.icon as keyof typeof iconMap
                  ] ||
                  Layers3;

                return (
                  <Link
                    key={
                      roadmap._id
                    }
                    href={
                      roadmap.progress === 100
                        ? `/dashboard/roadmaps/${roadmap.slug}`
                        : roadmap.nextLesson?.moduleId &&
                            roadmap.nextLesson?._id
                          ? `/dashboard/roadmaps/${roadmap.slug}/modules/${roadmap.nextLesson.moduleId}/lessons/${roadmap.nextLesson._id}`
                          : `/dashboard/roadmaps/${roadmap.slug}`
                    }
                    className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <Icon
                          size={18}
                        />
                      </div>

                      <ChevronRight
                        size={16}
                        className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/60"
                      />

                    </div>

                    <h3 className="mt-5 text-sm font-semibold">
                      {
                        roadmap.title
                      }
                    </h3>

                    <p className="mt-2 min-h-[48px] text-xs leading-5 text-white/30">
                      {
                        roadmap.description
                      }
                    </p>

                    {/* META */}

                    <div className="mt-5 flex items-center gap-4 text-[10px] text-white/25">

                      <span>
                        {
                          roadmap.totalModules
                        }{" "}
                        modules
                      </span>

                      <span>
                        {
                          roadmap.totalLessons
                        }{" "}
                        lessons
                      </span>

                      <span>
                        {
                          roadmap.duration
                        }
                      </span>

                    </div>

                    {/* PROGRESS */}

                    <div className="mt-5">

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-[10px] text-white/25">
                          {roadmap.progress >
                          0
                            ? "Your progress"
                            : "Not started"}
                        </span>

                        <span className="text-[10px] text-white/35">
                          {
                            roadmap.progress
                          }
                          %
                        </span>

                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">

                        <div
                          className="h-full rounded-full bg-white transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                roadmap.progress
                              )
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* TECHNOLOGIES */}

                    <div className="mt-5 flex flex-wrap gap-1.5">

                      {roadmap.technologies
                        .slice(0, 4)
                        .map(
                          (
                            technology
                          ) => (
                            <span
                              key={
                                technology
                              }
                              className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/30"
                            >
                              {
                                technology
                              }
                            </span>
                          )
                        )}

                      {roadmap
                        .technologies
                        .length >
                        4 && (
                        <span className="rounded-md bg-white/5 px-2 py-1 text-[9px] text-white/20">
                          +
                          {roadmap
                            .technologies
                            .length -
                            4}
                        </span>
                      )}

                    </div>

                    {/* ACTION */}

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">

                      <span className="text-[10px] text-white/25">
                        {roadmap.progress === 100
                          ? "Completed"
                          : roadmap.progress > 0
                            ? "Continue learning"
                            : "Start learning"}
                      </span>

                      <ArrowRight
                        size={14}
                        className="text-white/25 transition group-hover:translate-x-1 group-hover:text-white"
                      />

                    </div>

                  </Link>
                );
              }
            )}

          </div>

        </section>
      )}

      {/* ================================================= */}
      {/* LEARNING PHILOSOPHY */}
      {/* ================================================= */}

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">

        <div className="grid gap-6 md:grid-cols-3">

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <BookOpen
                size={17}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Learn
              </h3>

              <p className="mt-1 text-xs leading-5 text-white/30">
                Understand concepts through structured lessons and examples.
              </p>
            </div>

          </div>

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <PlayCircle
                size={17}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Practice
              </h3>

              <p className="mt-1 text-xs leading-5 text-white/30">
                Apply what you learn through coding exercises and challenges.
              </p>
            </div>

          </div>

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <CheckCircle2
                size={17}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Build
              </h3>

              <p className="mt-1 text-xs leading-5 text-white/30">
                Turn your knowledge into real-world projects you can showcase.
              </p>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}