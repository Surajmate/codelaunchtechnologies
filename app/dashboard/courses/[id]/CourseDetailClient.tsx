"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

interface Instructor {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  duration?: number;
  order?: number;
  isPreview?: boolean;
  completed?: boolean;
  locked?: boolean;
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  order?: number;
  lessons?: Lesson[];
}

interface Enrollment {
  enrolled: boolean;
  progress?: number;
  status?: string;
  completedAt?: string | null;
  startedAt?: string | null;
  lastAccessedLesson?: string | null;
}

interface Course {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  level?: string;
  instructor?: Instructor | null;
  durationMinutes?: number;
  duration?: number;
  lessonCount?: number;
  totalLessons?: number;
  certificateEnabled?: boolean;
  modules?: Module[];
  enrollment?: Enrollment | null;
}

interface CourseResponse {
  success: boolean;
  course?: Course;
  message?: string;
}

interface CertificateResponse {
  success: boolean;
  issued?: boolean;
  eligible?: boolean;
  certificate?: {
    certificateId?: string;
    issuedAt?: string;
    url?: string;
  } | null;
  message?: string;
}

/*
 * ======================================================
 * COMPONENT
 * ======================================================
 */

export default function CourseDetailClient({
  courseId,
}: {
  courseId: string;
}) {
  const [course, setCourse] =
    useState<Course | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [enrolling, setEnrolling] =
    useState(false);

  const [certificate, setCertificate] =
    useState<
      CertificateResponse["certificate"]
    >(null);

  const [certificateLoading, setCertificateLoading] =
    useState(false);

  /*
   * ----------------------------------------------------
   * LOAD COURSE
   * ----------------------------------------------------
   */

  const loadCourse =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/courses/${encodeURIComponent(
              courseId
            )}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data: CourseResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success ||
          !data.course
        ) {
          throw new Error(
            data.message ||
              "Unable to load course"
          );
        }

        setCourse(data.course);
      } catch (err) {
        console.error(
          "[COURSE DETAIL] LOAD ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load course"
        );
      } finally {
        setLoading(false);
      }
    }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  /*
   * ----------------------------------------------------
   * LOAD CERTIFICATE
   * ----------------------------------------------------
   */

  const loadCertificate =
    useCallback(async () => {
      try {
        if (!course?.enrollment?.enrolled) {
          return;
        }

        setCertificateLoading(
          true
        );

        const response =
          await fetch(
            `/api/courses/${encodeURIComponent(
              courseId
            )}/certificate`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data: CertificateResponse =
          await response.json();

        if (
          response.ok &&
          data.success
        ) {
          setCertificate(
            data.certificate || null
          );
        }
      } catch (err) {
        console.error(
          "[COURSE DETAIL] CERTIFICATE ERROR:",
          err
        );
      } finally {
        setCertificateLoading(
          false
        );
      }
    }, [
      course?.enrollment?.enrolled,
      courseId,
    ]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  /*
   * ----------------------------------------------------
   * ENROLL
   * ----------------------------------------------------
   */

  async function handleEnroll() {
    try {
      setEnrolling(true);
      setError("");

      const response =
        await fetch(
          `/api/courses/${encodeURIComponent(
            courseId
          )}/enroll`,
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

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to enroll"
        );
      }

      await loadCourse();
    } catch (err) {
      console.error(
        "[COURSE DETAIL] ENROLL ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to enroll"
      );
    } finally {
      setEnrolling(false);
    }
  }

  /*
   * ----------------------------------------------------
   * LOADING
   * ----------------------------------------------------
   */

  if (loading) {
    return (
      <CourseDetailSkeleton />
    );
  }

  /*
   * ----------------------------------------------------
   * ERROR
   * ----------------------------------------------------
   */

  if (error || !course) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/40">
          !
        </div>

        <h1 className="mt-5 text-xl font-semibold">
          Unable to load course
        </h1>

        <p className="mt-2 text-sm text-white/40">
          {error ||
            "Course not found"}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={
              loadCourse
            }
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            Try Again
          </button>

          <Link
            href="/courses"
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            All Courses
          </Link>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------
   * DATA
   * ----------------------------------------------------
   */

  const progress =
    getProgress(course);

  const enrolled =
    Boolean(
      course.enrollment?.enrolled
    );

  const completed =
    course.enrollment?.status ===
      "COMPLETED" ||
    progress >= 100;

  const modules =
    [...(course.modules || [])].sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    );

  const lessons =
    modules.flatMap(
      (module) =>
        module.lessons || []
    );

  const completedLessons =
    lessons.filter(
      (lesson) =>
        lesson.completed
    ).length;

  const firstAvailableLesson =
    findFirstAvailableLesson(
      modules
    );

  const continueLesson =
    findContinueLesson(
      modules,
      course.enrollment
        ?.lastAccessedLesson
    );

  const learningLesson =
    continueLesson ||
    firstAvailableLesson;

  const learningUrl =
    learningLesson
      ? `/courses/${courseId}/learn/${learningLesson._id}`
      : `/courses/${courseId}/learn`;

  return (
    <div>
      {/* ==================================================
          BREADCRUMB
      ================================================== */}

      <div className="mb-6 flex items-center gap-2 text-xs text-white/35">
        <Link
          href="/courses"
          className="transition hover:text-white"
        >
          Courses
        </Link>

        <span>/</span>

        <span className="truncate text-white/50">
          {course.title}
        </span>
      </div>

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
          {/* LEFT */}

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              {course.category && (
                <Badge>
                  {formatLabel(
                    course.category
                  )}
                </Badge>
              )}

              {course.level && (
                <Badge>
                  {formatLabel(
                    course.level
                  )}
                </Badge>
              )}

              {course.certificateEnabled !==
                false && (
                <Badge>
                  Certificate
                </Badge>
              )}
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              {course.title}
            </h1>

            {course.description && (
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/45 sm:text-base">
                {course.description}
              </p>
            )}

            {/* Instructor */}

            {course.instructor && (
              <div className="mt-7 flex items-center gap-3">
                {course.instructor
                  .avatar ? (
                  <img
                    src={
                      course
                        .instructor
                        .avatar
                    }
                    alt={
                      course
                        .instructor
                        .name ||
                      "Instructor"
                    }
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                    {getInitials(
                      course
                        .instructor
                        .name
                    )}
                  </div>
                )}

                <div>
                  <div className="text-xs text-white/30">
                    Instructor
                  </div>

                  <div className="mt-0.5 text-sm font-medium">
                    {course.instructor
                      .name ||
                      "Instructor"}
                  </div>
                </div>
              </div>
            )}

            {/* Meta */}

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/5 pt-6 text-xs text-white/40">
              <Meta
                label="Lessons"
                value={`${getLessonCount(
                  course
                )}`}
              />

              <Meta
                label="Duration"
                value={formatDuration(
                  course.durationMinutes ??
                    course.duration
                )}
              />

              {enrolled && (
                <Meta
                  label="Progress"
                  value={`${progress}%`}
                />
              )}
            </div>
          </div>

          {/* RIGHT */}

          <div className="relative min-h-[280px] border-t border-white/10 lg:border-l lg:border-t-0">
            {course.thumbnail ? (
              <img
                src={
                  course.thumbnail
                }
                alt={course.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
                <span className="text-6xl font-bold text-white/10">
                  CL
                </span>
              </div>
            )}

            <div className="absolute inset-0 bg-black/30" />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur">
                {!enrolled ? (
                  <button
                    type="button"
                    onClick={
                      handleEnroll
                    }
                    disabled={
                      enrolling
                    }
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {enrolling
                      ? "Enrolling..."
                      : "Enroll in Course"}
                  </button>
                ) : completed ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Course completed
                      </span>

                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-black">
                        ✓
                      </span>
                    </div>

                    <Link
                      href={
                        learningUrl
                      }
                      className="flex h-10 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      Review Course
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-white/50">
                          Your progress
                        </span>

                        <span className="font-medium">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <Link
                      href={
                        learningUrl
                      }
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      {progress > 0
                        ? "Continue Learning"
                        : "Start Learning"}

                      <Arrow />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          CERTIFICATE
      ================================================== */}

      {enrolled &&
        completed &&
        course.certificateEnabled !==
          false && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Achievement
                </div>

                <h2 className="mt-2 text-lg font-semibold">
                  Your certificate is ready
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  You have successfully
                  completed this course.
                </p>

                {certificate
                  ?.certificateId && (
                  <div className="mt-3 font-mono text-xs text-white/30">
                    {
                      certificate.certificateId
                    }
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/certificate/${
                    certificate?.certificateId ||
                    ""
                  }`}
                  className={`rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/5 ${
                    !certificate
                      ?.certificateId
                      ? "pointer-events-none opacity-40"
                      : ""
                  }`}
                >
                  View Certificate
                </Link>

                {certificate
                  ?.certificateId && (
                  <a
                    href={`/api/courses/${courseId}/certificate/download`}
                    className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            </div>

            {certificateLoading && (
              <div className="mt-4 text-xs text-white/30">
                Checking certificate...
              </div>
            )}
          </section>
        )}

      {/* ==================================================
          CURRICULUM
      ================================================== */}

      <section className="mt-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/30">
              Curriculum
            </div>

            <h2 className="mt-2 text-2xl font-bold">
              Course Content
            </h2>
          </div>

          <div className="text-xs text-white/35">
            {completedLessons} of{" "}
            {lessons.length} lessons
            completed
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {modules.length ===
          0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-white/40">
              Course curriculum is
              not available yet.
            </div>
          ) : (
            modules.map(
              (
                module,
                moduleIndex
              ) => (
                <ModuleCard
                  key={
                    module._id
                  }
                  module={
                    module
                  }
                  moduleIndex={
                    moduleIndex
                  }
                  courseId={
                    courseId
                  }
                  enrolled={
                    enrolled
                  }
                />
              )
            )
          )}
        </div>
      </section>
    </div>
  );
}

/*
 * ======================================================
 * MODULE CARD
 * ======================================================
 */

function ModuleCard({
  module,
  moduleIndex,
  courseId,
  enrolled,
}: {
  module: Module;
  moduleIndex: number;
  courseId: string;
  enrolled: boolean;
}) {
  const [open, setOpen] =
    useState(
      moduleIndex === 0
    );

  const lessons =
    [...(module.lessons || [])].sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    );

  const completed =
    lessons.filter(
      (lesson) =>
        lesson.completed
    ).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <button
        type="button"
        onClick={() =>
          setOpen(
            (value) => !value
          )
        }
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/[0.02]"
      >
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
            Module{" "}
            {moduleIndex + 1}
          </div>

          <h3 className="mt-1 truncate text-sm font-semibold sm:text-base">
            {module.title}
          </h3>

          <div className="mt-1 text-xs text-white/30">
            {completed}/
            {lessons.length} lessons
          </div>
        </div>

        <svg
          className={`h-5 w-5 shrink-0 text-white/30 transition ${
            open
              ? "rotate-180"
              : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-white/5">
          {lessons.length ===
          0 ? (
            <div className="p-5 text-sm text-white/30">
              No lessons available.
            </div>
          ) : (
            lessons.map(
              (
                lesson,
                lessonIndex
              ) => {
                const locked =
                  lesson.locked ||
                  !enrolled;

                const href =
                  !locked
                    ? `/courses/${courseId}/learn/${lesson._id}`
                    : "#";

                return (
                  <Link
                    key={
                      lesson._id
                    }
                    href={href}
                    onClick={(
                      event
                    ) => {
                      if (
                        locked
                      ) {
                        event.preventDefault();
                      }
                    }}
                    className={`flex items-center gap-4 border-b border-white/5 px-5 py-4 last:border-b-0 ${
                      locked
                        ? "cursor-default opacity-45"
                        : "transition hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs text-white/40">
                      {lesson.completed
                        ? "✓"
                        : lessonIndex +
                          1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {lesson.title}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-white/30">
                        <span>
                          {formatDuration(
                            lesson.durationMinutes ??
                              lesson.duration
                          )}
                        </span>

                        {lesson.isPreview && (
                          <span>
                            Preview
                          </span>
                        )}
                      </div>
                    </div>

                    {lesson.completed ? (
                      <span className="text-xs text-white/50">
                        Completed
                      </span>
                    ) : locked ? (
                      <svg
                        className="h-4 w-4 text-white/20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect
                          x="5"
                          y="10"
                          width="14"
                          height="10"
                          rx="2"
                        />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    ) : (
                      <Arrow />
                    )}
                  </Link>
                );
              }
            )
          )}
        </div>
      )}
    </div>
  );
}

/*
 * ======================================================
 * BADGE
 * ======================================================
 */

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
      {children}
    </span>
  );
}

/*
 * ======================================================
 * META
 * ======================================================
 */

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/25">
        {label}
      </div>

      <div className="mt-1 font-medium text-white/60">
        {value}
      </div>
    </div>
  );
}

/*
 * ======================================================
 * ARROW
 * ======================================================
 */

function Arrow() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/*
 * ======================================================
 * SKELETON
 * ======================================================
 */

function CourseDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-48 animate-pulse rounded bg-white/5" />

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5 p-8 lg:p-10">
            <div className="h-5 w-40 animate-pulse rounded bg-white/5" />

            <div className="h-10 w-4/5 animate-pulse rounded bg-white/5" />

            <div className="h-4 w-full animate-pulse rounded bg-white/5" />

            <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
          </div>

          <div className="min-h-[280px] animate-pulse bg-white/5" />
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
          />
        ))}
      </div>
    </div>
  );
}

/*
 * ======================================================
 * HELPERS
 * ======================================================
 */

function getProgress(
  course: Course
) {
  const progress =
    Number(
      course.enrollment
        ?.progress || 0
    );

  if (
    !Number.isFinite(
      progress
    )
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(progress)
    )
  );
}

function getLessonCount(
  course: Course
) {
  if (
    course.lessonCount !==
      undefined
  ) {
    return course.lessonCount;
  }

  if (
    course.totalLessons !==
      undefined
  ) {
    return course.totalLessons;
  }

  return (
    course.modules?.reduce(
      (
        total,
        module
      ) =>
        total +
        (module.lessons
          ?.length || 0),
      0
    ) || 0
  );
}

function formatDuration(
  minutes?: number
) {
  if (
    !minutes ||
    minutes <= 0
  ) {
    return "Self-paced";
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const mins =
    minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours}h ${mins}m`;
}

function formatLabel(
  value?: string
) {
  if (!value) {
    return "";
  }

  return value
    .replace(
      /_/g,
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function getInitials(
  name?: string
) {
  if (!name) {
    return "I";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]
    )
    .join("")
    .toUpperCase();
}

function findFirstAvailableLesson(
  modules: Module[]
) {
  for (const module of modules) {
    for (const lesson of module.lessons ||
      []) {
      if (
        !lesson.locked
      ) {
        return lesson;
      }
    }
  }

  return null;
}

function findContinueLesson(
  modules: Module[],
  lastLessonId?: string | null
) {
  if (!lastLessonId) {
    return null;
  }

  for (const module of modules) {
    const lesson =
      module.lessons?.find(
        (item) =>
          item._id ===
          lastLessonId
      );

    if (lesson) {
      return lesson;
    }
  }

  return null;
}