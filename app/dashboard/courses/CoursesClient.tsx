"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

/*
 * ======================================================
 * TYPES
 * ======================================================
 */

interface Instructor {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface Enrollment {
  enrolled: boolean;
  progress: number;
  status?: string;
  completedAt?: string | null;
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
  publishedAt?: string;
  enrollment?: Enrollment | null;
}

interface CoursesResponse {
  success: boolean;
  courses?: Course[];
  message?: string;
}

/*
 * ======================================================
 * COMPONENT
 * ======================================================
 */

export default function CoursesClient() {
  const [courses, setCourses] =
    useState<Course[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("ALL");

  const [level, setLevel] =
    useState("ALL");

  const [sort, setSort] =
    useState("LATEST");

  /*
   * ----------------------------------------------------
   * LOAD COURSES
   * ----------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function loadCourses() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/courses",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data: CoursesResponse =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load courses"
          );
        }

        if (mounted) {
          setCourses(
            Array.isArray(
              data.courses
            )
              ? data.courses
              : []
          );
        }
      } catch (err) {
        console.error(
          "[COURSES] LOAD ERROR:",
          err
        );

        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load courses"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ----------------------------------------------------
   * CATEGORIES
   * ----------------------------------------------------
   */

  const categories = useMemo(() => {
    const values =
      courses
        .map(
          (course) =>
            course.category
        )
        .filter(Boolean) as string[];

    return [
      "ALL",
      ...Array.from(
        new Set(values)
      ),
    ];
  }, [courses]);

  /*
   * ----------------------------------------------------
   * LEVELS
   * ----------------------------------------------------
   */

  const levels = useMemo(() => {
    const values =
      courses
        .map(
          (course) =>
            course.level
        )
        .filter(Boolean) as string[];

    return [
      "ALL",
      ...Array.from(
        new Set(values)
      ),
    ];
  }, [courses]);

  /*
   * ----------------------------------------------------
   * FILTER + SORT
   * ----------------------------------------------------
   */

  const filteredCourses =
    useMemo(() => {
      let result =
        courses.filter(
          (course) => {
            /*
             * Search
             */

            const query =
              search
                .trim()
                .toLowerCase();

            const matchesSearch =
              !query ||
              course.title
                ?.toLowerCase()
                .includes(query) ||
              course.description
                ?.toLowerCase()
                .includes(query) ||
              course.category
                ?.toLowerCase()
                .includes(query) ||
              course.instructor?.name
                ?.toLowerCase()
                .includes(query);

            /*
             * Category
             */

            const matchesCategory =
              category === "ALL" ||
              course.category ===
                category;

            /*
             * Level
             */

            const matchesLevel =
              level === "ALL" ||
              course.level === level;

            return (
              matchesSearch &&
              matchesCategory &&
              matchesLevel
            );
          }
        );

      /*
       * Sort
       */

      result = [...result].sort(
        (a, b) => {
          if (
            sort === "TITLE"
          ) {
            return (
              a.title.localeCompare(
                b.title
              )
            );
          }

          if (
            sort === "PROGRESS"
          ) {
            return (
              getProgress(b) -
              getProgress(a)
            );
          }

          if (
            sort === "POPULAR"
          ) {
            /*
             * If popularity is not
             * available in the API,
             * preserve API order.
             */
            return 0;
          }

          /*
           * Latest
           *
           * Prefer publishedAt.
           */

          const aDate =
            a.publishedAt
              ? new Date(
                  a.publishedAt
                ).getTime()
              : 0;

          const bDate =
            b.publishedAt
              ? new Date(
                  b.publishedAt
                ).getTime()
              : 0;

          return bDate - aDate;
        }
      );

      return result;
    }, [
      courses,
      search,
      category,
      level,
      sort,
    ]);

  /*
   * ----------------------------------------------------
   * RESET FILTERS
   * ----------------------------------------------------
   */

  function resetFilters() {
    setSearch("");
    setCategory("ALL");
    setLevel("ALL");
    setSort("LATEST");
  }

  /*
   * ----------------------------------------------------
   * LOADING
   * ----------------------------------------------------
   */

  if (loading) {
    return (
      <div className="space-y-6">
        <CatalogueSkeleton />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <CourseSkeleton
              key={index}
            />
          ))}
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------
   * ERROR
   * ----------------------------------------------------
   */

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
          !
        </div>

        <h2 className="mt-4 text-lg font-semibold">
          Unable to load courses
        </h2>

        <p className="mt-2 text-sm text-white/40">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
        >
          Try Again
        </button>
      </div>
    );
  }

  /*
   * ----------------------------------------------------
   * MAIN
   * ----------------------------------------------------
   */

  return (
    <div className="space-y-6">
      {/* ==================================================
          SEARCH + FILTERS
      ================================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          {/* Search */}

          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search courses..."
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
          </div>

          {/* Category */}

          <Select
            value={category}
            onChange={setCategory}
            options={categories}
          />

          {/* Level */}

          <Select
            value={level}
            onChange={setLevel}
            options={levels}
          />

          {/* Sort */}

          <Select
            value={sort}
            onChange={setSort}
            options={[
              "LATEST",
              "TITLE",
              "PROGRESS",
              "POPULAR",
            ]}
            labels={{
              LATEST: "Latest",
              TITLE: "Title",
              PROGRESS: "Progress",
              POPULAR: "Popular",
            }}
          />
        </div>

        {/* Active filter summary */}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
          <p className="text-xs text-white/35">
            Showing{" "}
            <span className="font-medium text-white/60">
              {filteredCourses.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-white/60">
              {courses.length}
            </span>{" "}
            courses
          </p>

          {(search ||
            category !== "ALL" ||
            level !== "ALL") && (
            <button
              type="button"
              onClick={
                resetFilters
              }
              className="text-xs font-medium text-white/50 transition hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* ==================================================
          EMPTY STATE
      ================================================== */}

      {filteredCourses.length ===
        0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <svg
              className="h-6 w-6 text-white/30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            No courses found
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Try changing your search or
            filters.
          </p>

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ==================================================
          COURSE GRID
      ================================================== */}

      {filteredCourses.length >
        0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map(
            (course) => (
              <CourseCard
                key={course._id}
                course={course}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/*
 * ======================================================
 * COURSE CARD
 * ======================================================
 */

function CourseCard({
  course,
}: {
  course: Course;
}) {
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

  const courseUrl =
    `/courses/${course.slug || course._id}`;

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04]">
      {/* ==================================================
          THUMBNAIL
      ================================================== */}

      <Link
        href={courseUrl}
        className="block"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
              <div className="text-4xl font-bold text-white/10">
                CL
              </div>
            </div>
          )}

          {/* Category */}

          {course.category && (
            <div className="absolute left-3 top-3 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur">
              {formatLabel(
                course.category
              )}
            </div>
          )}

          {/* Completion */}

          {completed && (
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-black">
                ✓
              </span>
              Completed
            </div>
          )}
        </div>
      </Link>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="p-5">
        {/* Level */}

        {course.level && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
            {formatLabel(
              course.level
            )}
          </div>
        )}

        {/* Title */}

        <Link href={courseUrl}>
          <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 transition group-hover:text-white/90">
            {course.title}
          </h2>
        </Link>

        {/* Description */}

        {course.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/40">
            {course.description}
          </p>
        )}

        {/* ==================================================
            INSTRUCTOR
        ================================================== */}

        {course.instructor && (
          <div className="mt-4 flex items-center gap-2.5">
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
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold">
                {getInitials(
                  course
                    .instructor
                    .name
                )}
              </div>
            )}

            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-white/60">
                {course.instructor
                  .name ||
                  "Instructor"}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            META
        ================================================== */}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-4 text-xs text-white/35">
          <MetaItem
            icon="lesson"
            value={`${getLessonCount(course)} lessons`}
          />

          <MetaItem
            icon="clock"
            value={formatDuration(
              course
                .durationMinutes ??
                course.duration
            )}
          />
        </div>

        {/* ==================================================
            PROGRESS
        ================================================== */}

        {enrolled && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-white/35">
                Progress
              </span>

              <span className="font-medium text-white/60">
                {progress}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ==================================================
            ACTION
        ================================================== */}

        <div className="mt-5">
          <Link
            href={courseUrl}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium transition hover:bg-white/10"
          >
            {completed
              ? "View Course"
              : enrolled
              ? "Continue Learning"
              : "View Course"}

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
          </Link>
        </div>
      </div>
    </article>
  );
}

/*
 * ======================================================
 * SELECT
 * ======================================================
 */

function Select({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  options: string[];
  labels?: Record<
    string,
    string
  >;
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-11 min-w-[145px] rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white/70 outline-none focus:border-white/20"
    >
      {options.map(
        (option) => (
          <option
            key={option}
            value={option}
            className="bg-[#111111]"
          >
            {labels?.[option] ||
              (option === "ALL"
                ? "All"
                : formatLabel(
                    option
                  ))}
          </option>
        )
      )}
    </select>
  );
}

/*
 * ======================================================
 * META ITEM
 * ======================================================
 */

function MetaItem({
  icon,
  value,
}: {
  icon: "lesson" | "clock";
  value: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {icon === "lesson" ? (
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
          <path d="M4 5.5v16" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
        </svg>
      ) : (
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle
            cx="12"
            cy="12"
            r="8.5"
          />
          <path d="M12 7v5l3 2" />
        </svg>
      )}

      {value}
    </span>
  );
}

/*
 * ======================================================
 * SKELETONS
 * ======================================================
 */

function CatalogueSkeleton() {
  return (
    <div className="h-[125px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
  );
}

function CourseSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="aspect-[16/9] animate-pulse bg-white/5" />

      <div className="space-y-3 p-5">
        <div className="h-2.5 w-20 animate-pulse rounded bg-white/5" />

        <div className="h-5 w-4/5 animate-pulse rounded bg-white/5" />

        <div className="h-4 w-full animate-pulse rounded bg-white/5" />

        <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />

        <div className="mt-5 h-10 w-full animate-pulse rounded-xl bg-white/5" />
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

  if (!Number.isFinite(progress)) {
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
  return (
    course.lessonCount ??
    course.totalLessons ??
    0
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