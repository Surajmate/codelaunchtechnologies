"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  Database,
  GitBranch,
  Globe,
  Layers3,
  Lock,
  PlayCircle,
  Server,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface ApiLesson {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  type: "Lesson" | "Practice" | "Quiz";
  duration: string;
  order: number;
  completed: boolean;
}

interface ApiModule {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  order: number;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lessons?: ApiLesson[];
}

interface ApiRoadmap {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  level?: string;
  duration?: string;
  technologies?: string[];
  icon?: string;
  featured?: boolean;

  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  progress: number;

  modules: ApiModule[];
}

interface RoadmapResponse {
  success: boolean;
  message?: string;
  roadmap?: ApiRoadmap;
}

/*
|--------------------------------------------------------------------------
| ICON HELPER
|--------------------------------------------------------------------------
*/

function getRoadmapIcon(
  icon?: string
) {
  switch (icon) {
    case "Server":
      return Server;

    case "Database":
      return Database;

    case "Globe":
      return Globe;

    case "GitBranch":
      return GitBranch;

    case "Code2":
      return Code2;

    case "Sparkles":
      return Sparkles;

    case "Lock":
      return Lock;

    case "Trophy":
      return Trophy;

    default:
      return Layers3;
  }
}

function getModuleIcon(
  title: string
) {
  const value =
    title.toLowerCase();

  if (
    value.includes("database") ||
    value.includes("mongo") ||
    value.includes("sql")
  ) {
    return Database;
  }

  if (
    value.includes("git") ||
    value.includes("github")
  ) {
    return GitBranch;
  }

  if (
    value.includes("web") ||
    value.includes("html") ||
    value.includes("frontend")
  ) {
    return Globe;
  }

  if (
    value.includes("backend") ||
    value.includes("node") ||
    value.includes("server") ||
    value.includes("api")
  ) {
    return Server;
  }

  if (
    value.includes("security") ||
    value.includes("authentication") ||
    value.includes("auth")
  ) {
    return Lock;
  }

  return Code2;
}

function getModuleStartLesson(
  module: ApiModule
) {
  if (
    !module.lessons ||
    module.lessons.length === 0
  ) {
    return null;
  }

  const incompleteLesson =
    module.lessons.find(
      (lesson) =>
        !lesson.completed
    );

  return (
    incompleteLesson ||
    module.lessons[0]
  );
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function RoadmapDetailPage() {
  const params = useParams();

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const [
    roadmap,
    setRoadmap,
  ] = useState<ApiRoadmap | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    expandedModules,
    setExpandedModules,
  ] = useState<string[]>([]);

  /*
  |--------------------------------------------------------------------------
  | LOAD ROADMAPS
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
              "Unable to fetch roadmap"
          );
        }

        if (
          !data.success ||
          !data.roadmap
        ) {
          throw new Error(
            data.message ||
              "Unable to fetch roadmap"
          );
        }

        const found =
          data.roadmap;

        if (!cancelled) {
          setRoadmap(found);

          /*
          * Automatically expand the
          * first module that has progress.
          *
          * If none has progress,
          * expand the first module.
          */

          const firstInProgress =
            found.modules?.find(
              (module) =>
                module.progress > 0 &&
                module.progress < 100
            );

          const firstModule =
            firstInProgress ||
            found.modules?.[0];

          if (firstModule) {
            setExpandedModules([
              firstModule._id,
            ]);
          }
        }
      } catch (err) {
        console.error(
          "[ROADMAP DETAIL PAGE] Load error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load roadmap"
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
  | TOGGLE MODULE
  |--------------------------------------------------------------------------
  */

  function toggleModule(
    moduleId: string
  ) {
    setExpandedModules(
      (current) =>
        current.includes(moduleId)
          ? current.filter(
              (value) =>
                value !== moduleId
            )
          : [
              ...current,
              moduleId,
            ]
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SORT MODULES
  |--------------------------------------------------------------------------
  */

  const modules = useMemo(() => {
    if (!roadmap) {
      return [];
    }

    return [...roadmap.modules].sort(
      (a, b) =>
        a.order - b.order
    );
  }, [roadmap]);

  /*
  |--------------------------------------------------------------------------
  | NEXT MODULE
  |--------------------------------------------------------------------------
  */

  const currentModule =
    useMemo(() => {
      return (
        modules.find(
          (module) =>
            module.progress > 0 &&
            module.progress < 100 &&
            module.totalLessons > 0
        ) || null
      );
    }, [modules]);

  const firstAvailableModule =
    modules.find(
      (module) =>
        module.totalLessons > 0
    ) || null;

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl pb-12">

        <div className="h-4 w-32 animate-pulse rounded bg-white/5" />

        <div className="mt-5 h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.025]" />

        <div className="mt-8 space-y-3">

          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
            />
          ))}

        </div>

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (!roadmap || error) {
    return (
      <div className="mx-auto max-w-7xl pb-12">

        <Link
          href="/dashboard/roadmaps"
          className="inline-flex items-center gap-2 text-xs text-white/35 transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to Roadmaps
        </Link>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-10 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <BookOpen
              size={22}
              className="text-white/40"
            />
          </div>

          <h1 className="mt-5 text-xl font-semibold">
            {error ||
              "Roadmap not found"}
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
            We couldn't load this roadmap.
            Please return to the roadmap
            list and try again.
          </p>

          <Link
            href="/dashboard/roadmaps"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            View Roadmaps
            <ArrowRight size={15} />
          </Link>

        </div>

      </div>
    );
  }

  const RoadmapIcon =
    getRoadmapIcon(
      roadmap.icon
    );

  const progress =
    Math.min(
      100,
      Math.max(
        0,
        roadmap.progress || 0
      )
    );

  /*
  |--------------------------------------------------------------------------
  | MAIN UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-7xl pb-12">

      {/* ================================================= */}
      {/* BACK */}
      {/* ================================================= */}

      <Link
        href="/dashboard/roadmaps"
        className="inline-flex items-center gap-2 text-xs text-white/35 transition hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to Roadmaps
      </Link>

      {/* ================================================= */}
      {/* HERO */}
      {/* ================================================= */}

      <section className="relative mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">

        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/[0.035] blur-3xl" />

        <div className="relative p-6 sm:p-8 lg:p-10">

          <div className="flex flex-col justify-between gap-8 lg:flex-row">

            {/* LEFT */}

            <div className="max-w-3xl">

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/45">
                  Learning Roadmap
                </span>

                {roadmap.level && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/35">
                    {roadmap.level}
                  </span>
                )}

                {roadmap.featured && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/40">
                    <Sparkles
                      size={11}
                    />
                    Recommended
                  </span>
                )}

              </div>

              <div className="mt-6 flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">

                  <RoadmapIcon
                    size={22}
                  />

                </div>

                <div>

                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {roadmap.title}
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                    {roadmap.description ||
                      "Follow this learning roadmap to build practical development skills."}
                  </p>

                </div>

              </div>

              {/* TECHNOLOGIES */}

              {roadmap.technologies &&
                roadmap.technologies.length >
                  0 && (
                  <div className="mt-6 flex flex-wrap gap-2">

                    {roadmap.technologies.map(
                      (
                        technology
                      ) => (
                        <span
                          key={
                            technology
                          }
                          className="rounded-lg border border-white/10 bg-black/10 px-2.5 py-1.5 text-[10px] text-white/40"
                        >
                          {
                            technology
                          }
                        </span>
                      )
                    )}

                  </div>
                )}

              {/* META */}

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/30">

                {roadmap.duration && (
                  <span className="flex items-center gap-2">
                    <Clock3
                      size={13}
                    />
                    {
                      roadmap.duration
                    }
                  </span>
                )}

                <span className="flex items-center gap-2">
                  <BookOpen
                    size={13}
                  />
                  {
                    roadmap.totalModules
                  }{" "}
                  modules
                </span>

                <span className="flex items-center gap-2">
                  <BookOpen
                    size={13}
                  />
                  {
                    roadmap.totalLessons
                  }{" "}
                  lessons
                </span>

              </div>

            </div>

            {/* RIGHT - PROGRESS */}

            <div className="w-full shrink-0 lg:w-80">

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

                <div className="flex items-center justify-between">

                  <span className="text-xs text-white/35">
                    Your Progress
                  </span>

                  <span className="text-2xl font-bold">
                    {progress}%
                  </span>

                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">

                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

                <div className="mt-3 flex justify-between text-[10px] text-white/25">

                  <span>
                    {
                      roadmap.completedLessons
                    }{" "}
                    completed
                  </span>

                  <span>
                    {
                      roadmap.totalLessons
                    }{" "}
                    lessons
                  </span>

                </div>

                {currentModule ? (
                  (() => {
                    const nextLesson =
                      getModuleStartLesson(
                        currentModule
                      );

                    return (
                      <Link
                        href={
                          nextLesson
                            ? `/dashboard/roadmaps/${id}/modules/${currentModule._id}/lessons/${nextLesson._id}`
                            : `/dashboard/roadmaps/${id}`
                        }
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black transition hover:bg-white/90"
                      >
                        <PlayCircle
                          size={15}
                        />

                        Continue Learning

                        <ArrowRight
                          size={14}
                        />
                      </Link>
                    );
                  })()
                ) : firstAvailableModule ? (
                  <Link
                    href={
                      firstAvailableModule.lessons &&
                      firstAvailableModule.lessons.length > 0
                        ? `/dashboard/roadmaps/${id}/modules/${firstAvailableModule._id}/lessons/${firstAvailableModule.lessons[0]._id}`
                        : `/dashboard/roadmaps/${id}`
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black transition hover:bg-white/90"
                  >
                    <PlayCircle
                      size={15}
                    />

                    Start Roadmap

                    <ArrowRight
                      size={14}
                    />
                  </Link>
                ) : (
                  <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/30">
                    <Clock3
                      size={14}
                    />
                    Content coming soon
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* MAIN GRID */}
      {/* ================================================= */}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">

        {/* ================================================= */}
        {/* MODULES */}
        {/* ================================================= */}

        <section>

          <div className="mb-4">

            <h2 className="text-lg font-semibold">
              Learning Path
            </h2>

            <p className="mt-1 text-sm text-white/35">
              Complete each module to progress
              through the roadmap.
            </p>

          </div>

          {modules.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Layers3
                  size={19}
                  className="text-white/35"
                />
              </div>

              <h3 className="mt-4 text-sm font-semibold">
                Modules coming soon
              </h3>

              <p className="mt-2 text-xs text-white/30">
                This roadmap has been published,
                but its learning modules haven't
                been added yet.
              </p>

            </div>
          ) : (
            <div className="space-y-3">

              {modules.map(
                (
                  module,
                  index
                ) => {
                  const ModuleIcon =
                    getModuleIcon(
                      module.title
                    );

                  const expanded =
                    expandedModules.includes(
                      module._id
                    );

                  const completed =
                    module.progress >=
                    100;

                  const hasLessons =
                    module.totalLessons >
                    0;

                  return (
                    <div
                      key={
                        module._id
                      }
                      className={`overflow-hidden rounded-2xl border transition ${
                        completed
                          ? "border-white/10 bg-white/[0.025]"
                          : module.progress >
                              0
                            ? "border-white/15 bg-white/[0.04]"
                            : "border-white/10 bg-white/[0.015]"
                      }`}
                    >

                      {/* MODULE HEADER */}

                      <button
                        type="button"
                        onClick={() =>
                          toggleModule(
                            module._id
                          )
                        }
                        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/[0.025]"
                      >

                        {/* STATUS */}

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                            completed
                              ? "border-white/20 bg-white text-black"
                              : module.progress >
                                  0
                                ? "border-white/20 bg-white/10 text-white"
                                : "border-white/10 bg-white/5 text-white/25"
                          }`}
                        >
                          {completed ? (
                            <Check
                              size={17}
                            />
                          ) : (
                            <ModuleIcon
                              size={18}
                            />
                          )}
                        </div>

                        {/* CONTENT */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="text-[10px] uppercase tracking-wider text-white/25">
                              Module{" "}
                              {index +
                                1}
                            </span>

                            {module.progress >
                              0 &&
                              module.progress <
                                100 && (
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/45">
                                  In Progress
                                </span>
                              )}

                            {completed && (
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/45">
                                Completed
                              </span>
                            )}

                          </div>

                          <h3 className="mt-1 text-sm font-semibold">
                            {
                              module.title
                            }
                          </h3>

                          <p className="mt-1 line-clamp-1 text-xs text-white/30">
                            {module.description ||
                              "Continue learning through this module."}
                          </p>

                        </div>

                        {/* PROGRESS */}

                        <div className="hidden w-32 shrink-0 sm:block">

                          <div className="mb-1.5 flex justify-between text-[9px] text-white/25">

                            <span>
                              {
                                module.completedLessons
                              }
                              /
                              {
                                module.totalLessons
                              }
                            </span>

                            <span>
                              {
                                module.progress
                              }
                              %
                            </span>

                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">

                            <div
                              className="h-full rounded-full bg-white transition-all"
                              style={{
                                width: `${module.progress}%`,
                              }}
                            />

                          </div>

                        </div>

                        {/* CHEVRON */}

                        {expanded ? (
                          <ChevronDown
                            size={
                              17
                            }
                            className="shrink-0 text-white/25"
                          />
                        ) : (
                          <ChevronRight
                            size={
                              17
                            }
                            className="shrink-0 text-white/25"
                          />
                        )}

                      </button>

                      {/* MOBILE PROGRESS */}

                      <div className="px-5 pb-3 sm:hidden">

                        <div className="mb-1.5 flex justify-between text-[9px] text-white/25">

                          <span>
                            {
                              module.completedLessons
                            }
                            /
                            {
                              module.totalLessons
                            }
                          </span>

                          <span>
                            {
                              module.progress
                            }
                            %
                          </span>

                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">

                          <div
                            className="h-full rounded-full bg-white"
                            style={{
                              width: `${module.progress}%`,
                            }}
                          />

                        </div>

                      </div>

                      {/* MODULE CONTENT */}

                      {expanded && (
                        <div className="border-t border-white/10 bg-black/10 px-5 py-4">

                          {hasLessons ? (
                            <>

                              <div className="flex items-center justify-between">

                                <div>

                                  <p className="text-xs font-medium text-white/60">
                                    Module progress
                                  </p>

                                  <p className="mt-1 text-[10px] text-white/25">
                                    {
                                      module.completedLessons
                                    }{" "}
                                    of{" "}
                                    {
                                      module.totalLessons
                                    }{" "}
                                    lessons completed
                                  </p>

                                </div>

                                <span className="text-xs font-semibold text-white/45">
                                  {
                                    module.progress
                                  }
                                  %
                                </span>

                              </div>

                              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">

                                <div
                                  className="h-full rounded-full bg-white transition-all"
                                  style={{
                                    width: `${module.progress}%`,
                                  }}
                                />

                              </div>

                              <Link
                                href={
                                  (() => {
                                    const nextLesson =
                                      getModuleStartLesson(
                                        module
                                      );

                                    return nextLesson
                                      ? `/dashboard/roadmaps/${id}/modules/${module._id}/lessons/${nextLesson._id}`
                                      : "#";
                                  })()
                                }
                                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-medium text-white/50 transition hover:bg-white/10 hover:text-white"
                              >
                                {module.progress >
                                0
                                  ? "Continue Module"
                                  : "Start Module"}

                                <ArrowRight
                                  size={
                                    13
                                  }
                                />
                              </Link>

                              <p className="mt-3 text-center text-[9px] leading-4 text-white/20">
                                Individual lessons are
                                loaded from the module
                                learning page.
                              </p>

                            </>
                          ) : (
                            <div className="py-4 text-center">

                              <Clock3
                                size={
                                  17
                                }
                                className="mx-auto text-white/20"
                              />

                              <p className="mt-3 text-xs text-white/35">
                                Lessons coming soon
                              </p>

                              <p className="mt-1 text-[10px] text-white/20">
                                This module has been
                                published but doesn't
                                contain lessons yet.
                              </p>

                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* SIDEBAR */}
        {/* ================================================= */}

        <aside className="space-y-4">

          {/* YOUR JOURNEY */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

            <div className="flex items-center gap-2">

              <Sparkles
                size={16}
              />

              <h3 className="text-sm font-semibold">
                Your Journey
              </h3>

            </div>

            <div className="mt-5 space-y-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                  <BookOpen
                    size={15}
                  />
                </div>

                <div>

                  <p className="text-xs font-medium">
                    Lessons
                  </p>

                  <p className="mt-0.5 text-[10px] text-white/25">
                    {
                      roadmap.completedLessons
                    }{" "}
                    /{" "}
                    {
                      roadmap.totalLessons
                    }
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                  <Trophy
                    size={15}
                  />
                </div>

                <div>

                  <p className="text-xs font-medium">
                    Modules
                  </p>

                  <p className="mt-0.5 text-[10px] text-white/25">

                    {
                      modules.filter(
                        (module) =>
                          module.progress >=
                          100
                      ).length
                    }{" "}
                    /{" "}
                    {
                      modules.length
                    }{" "}
                    completed

                  </p>

                </div>

              </div>

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                  <Sparkles
                    size={15}
                  />
                </div>

                <div>

                  <p className="text-xs font-medium">
                    Progress
                  </p>

                  <p className="mt-0.5 text-[10px] text-white/25">
                    {progress}%
                    complete
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* TECHNOLOGY STACK */}

          {roadmap.technologies &&
            roadmap.technologies.length >
              0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

                <div className="flex items-center gap-2">

                  <Code2
                    size={16}
                  />

                  <h3 className="text-sm font-semibold">
                    Technology Stack
                  </h3>

                </div>

                <div className="mt-4 flex flex-wrap gap-2">

                  {roadmap.technologies.map(
                    (
                      technology
                    ) => (
                      <span
                        key={
                          technology
                        }
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] text-white/35"
                      >
                        {
                          technology
                        }
                      </span>
                    )
                  )}

                </div>

              </div>
            )}

          {/* WHAT YOU'LL BUILD */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

            <div className="flex items-center gap-2">

              <Code2
                size={16}
              />

              <h3 className="text-sm font-semibold">
                What you'll build
              </h3>

            </div>

            <ul className="mt-4 space-y-3">

              {[
                "Practical development projects",
                "Production-ready applications",
                "APIs and backend services",
                "Database-driven applications",
                "Portfolio-ready projects",
              ].map(
                (item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs text-white/35"
                  >

                    <Check
                      size={13}
                      className="mt-0.5 shrink-0 text-white/40"
                    />

                    {item}

                  </li>
                )
              )}

            </ul>

          </div>

          {/* COMPLETION */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

            <div className="flex items-center gap-2">

              <Trophy
                size={16}
              />

              <h3 className="text-sm font-semibold">
                Complete the roadmap
              </h3>

            </div>

            <p className="mt-3 text-xs leading-5 text-white/30">
              Complete the lessons and modules
              in this roadmap to build your skills
              step by step.
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">

              <div
                className="h-full rounded-full bg-white transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <p className="mt-2 text-right text-[10px] text-white/25">
              {progress}% complete
            </p>

          </div>

        </aside>

      </div>

    </div>
  );
}