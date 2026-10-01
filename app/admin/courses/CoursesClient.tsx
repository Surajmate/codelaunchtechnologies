"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Layers3,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";

import { useRouter } from "next/navigation";

/*
 * ======================================================
 * TYPES
 * ======================================================
 */

type CourseStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

type CourseLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "ALL_LEVELS";

interface Course {
  _id: string;

  title: string;

  slug?: string;

  shortDescription?: string;

  thumbnail?: string;

  bannerImage?: string;

  category?: string;

  subCategory?: string;

  level?: CourseLevel;

  language?: string;

  instructor?: string | null;

  instructorName?: string;

  status?: CourseStatus;

  featured?: boolean;

  isFree?: boolean;

  price?: number;

  discountPrice?: number;

  currency?: string;

  durationMinutes?: number;

  lessonCount?: number;

  moduleCount?: number;

  enrollmentCount?: number;

  completionCount?: number;

  certificateEnabled?: boolean;

  certificateName?: string;

  rating?: {
    average?: number;
    count?: number;
  };

  publishedAt?: string | null;

  createdAt?: string;

  updatedAt?: string;
}

interface Pagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

interface Stats {
  total: number;

  published: number;

  draft: number;

  archived: number;

  featured: number;

  free: number;

  paid: number;
}

interface CoursesResponse {
  success: boolean;

  courses?: Course[];

  pagination?: Pagination;

  stats?: Stats;

  message?: string;
}

/*
 * ======================================================
 * CONSTANTS
 * ======================================================
 */

const PAGE_SIZE = 12;

const STATUS_OPTIONS = [
  "ALL",
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];

const LEVEL_OPTIONS = [
  "ALL",
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
];

/*
 * ======================================================
 * HELPERS
 * ======================================================
 */

function formatDuration(
  minutes?: number
) {
  const value = Number(
    minutes || 0
  );

  if (value <= 0) {
    return "—";
  }

  const hours = Math.floor(
    value / 60
  );

  const mins = value % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

function formatPrice(
  course: Course
) {
  if (course.isFree) {
    return "Free";
  }

  const price =
    Number(
      course.discountPrice || 0
    ) > 0
      ? Number(
          course.discountPrice
        )
      : Number(
          course.price || 0
        );

  if (price <= 0) {
    return "Free";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency:
        course.currency ||
        "INR",
      maximumFractionDigits: 0,
    }
  ).format(price);
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getStatusClass(
  status?: CourseStatus
) {
  switch (status) {
    case "PUBLISHED":
      return "border-green-400/20 bg-green-400/10 text-green-400";

    case "ARCHIVED":
      return "border-white/10 bg-white/[0.04] text-white/40";

    case "DRAFT":
    default:
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-400";
  }
}

function getLevelLabel(
  level?: CourseLevel
) {
  switch (level) {
    case "BEGINNER":
      return "Beginner";

    case "INTERMEDIATE":
      return "Intermediate";

    case "ADVANCED":
      return "Advanced";

    case "ALL_LEVELS":
      return "All Levels";

    default:
      return "—";
  }
}

function formatFilterLabel(
  value: string
) {
  switch (value) {
    case "ALL":
      return "All";

    case "ALL_LEVELS":
      return "All Levels";

    case "DRAFT":
      return "Draft";

    case "PUBLISHED":
      return "Published";

    case "ARCHIVED":
      return "Archived";

    case "newest":
      return "Newest";

    case "oldest":
      return "Oldest";

    case "popular":
      return "Most Popular";

    case "rating":
      return "Highest Rated";

    default:
      return value
        .replace(
          /_/g,
          " "
        )
        .replace(
          /\b\w/g,
          (char) =>
            char.toUpperCase()
        );
  }
}

function getPageNumbers(
  currentPage: number,
  totalPages: number
): Array<number | "..."> {
  if (totalPages <= 1) {
    return [1];
  }

  if (totalPages <= 7) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) =>
        index + 1
    );
  }

  const pages: Array<
    number | "..."
  > = [];

  pages.push(1);

  if (currentPage > 4) {
    pages.push("...");
  }

  const start = Math.max(
    2,
    currentPage - 1
  );

  const end = Math.min(
    totalPages - 1,
    currentPage + 1
  );

  for (
    let page = start;
    page <= end;
    page++
  ) {
    pages.push(page);
  }

  if (
    currentPage <
    totalPages - 3
  ) {
    pages.push("...");
  }

  pages.push(totalPages);

  return pages;
}

/*
 * ======================================================
 * COMPONENT
 * ======================================================
 */

export default function CoursesClient() {
  const router =
    useRouter();

  /*
   * --------------------------------------------------
   * STATE
   * --------------------------------------------------
   */

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [stats, setStats] =
    useState<Stats>({
      total: 0,
      published: 0,
      draft: 0,
      archived: 0,
      featured: 0,
      free: 0,
      paid: 0,
    });

  const [search, setSearch] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [status, setStatus] =
    useState("ALL");

  const [level, setLevel] =
    useState("ALL");

  const [
    featured,
    setFeatured,
  ] = useState("ALL");

  const [
    pricing,
    setPricing,
  ] = useState("ALL");

  const [sort, setSort] =
    useState("newest");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null
  );

  const [
    actionId,
    setActionId,
  ] = useState<string | null>(
    null
  );

  /*
   * ======================================================
   * FETCH COURSES
   * ======================================================
   */

  const fetchCourses =
    useCallback(
      async (
        requestedPage = pagination.page
      ) => {
        try {
          setLoading(true);
          setError("");

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(requestedPage)
          );

          params.set(
            "limit",
            String(PAGE_SIZE)
          );

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (
            status !== "ALL"
          ) {
            params.set(
              "status",
              status
            );
          }

          if (
            level !== "ALL"
          ) {
            params.set(
              "level",
              level
            );
          }

          if (
            featured !== "ALL"
          ) {
            params.set(
              "featured",
              featured ===
                "TRUE"
                ? "true"
                : "false"
            );
          }

          if (
            pricing !== "ALL"
          ) {
            params.set(
              "isFree",
              pricing ===
                "FREE"
                ? "true"
                : "false"
            );
          }

          params.set(
            "sort",
            sort
          );

          const response =
            await fetch(
              `/api/admin/courses?${params.toString()}`,
              {
                method: "GET",
                credentials:
                  "include",
                cache: "no-store",
              }
            );

          const data: CoursesResponse =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Unable to load courses"
            );
          }

          const loadedCourses =
            data.courses ||
            [];

          setCourses(
            loadedCourses
          );

          if (
            data.pagination
          ) {
            setPagination(
              data.pagination
            );
          } else {
            setPagination(
              (current) => ({
                ...current,
                page:
                  requestedPage,
                total:
                  loadedCourses.length,
                totalPages:
                  loadedCourses.length >
                  0
                    ? 1
                    : 0,
              })
            );
          }

          if (data.stats) {
            setStats(
              data.stats
            );
          } else {
            setStats(
              calculateStats(
                loadedCourses
              )
            );
          }
        } catch (err) {
          console.error(
            "[ADMIN COURSES] FETCH ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load courses"
          );

          setCourses([]);
        } finally {
          setLoading(false);
        }
      },
      [
        pagination.page,
        search,
        status,
        level,
        featured,
        pricing,
        sort,
      ]
    );

  /*
   * ======================================================
   * INITIAL LOAD / FILTER CHANGE
   * ======================================================
   */

  useEffect(() => {
    fetchCourses(
      pagination.page
    );
  }, [
    search,
    status,
    level,
    featured,
    pricing,
    sort,
  ]);

  /*
   * ======================================================
   * CALCULATE STATS
   * ======================================================
   */

  function calculateStats(
    items: Course[]
  ): Stats {
    return {
      total: items.length,

      published:
        items.filter(
          (item) =>
            item.status ===
            "PUBLISHED"
        ).length,

      draft:
        items.filter(
          (item) =>
            item.status ===
            "DRAFT"
        ).length,

      archived:
        items.filter(
          (item) =>
            item.status ===
            "ARCHIVED"
        ).length,

      featured:
        items.filter(
          (item) =>
            item.featured
        ).length,

      free:
        items.filter(
          (item) =>
            item.isFree
        ).length,

      paid:
        items.filter(
          (item) =>
            !item.isFree
        ).length,
    };
  }

  /*
   * ======================================================
   * SEARCH
   * ======================================================
   */

  function handleSearch(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setPagination(
      (current) => ({
        ...current,
        page: 1,
      })
    );

    setSearch(
      searchInput.trim()
    );
  }

  /*
   * ======================================================
   * CLEAR FILTERS
   * ======================================================
   */

  function clearFilters() {
    setSearch("");

    setSearchInput("");

    setStatus("ALL");

    setLevel("ALL");

    setFeatured("ALL");

    setPricing("ALL");

    setSort("newest");

    setPagination(
      (current) => ({
        ...current,
        page: 1,
      })
    );
  }

  /*
   * ======================================================
   * DELETE COURSE
   * ======================================================
   */

  async function handleDelete(
    course: Course
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${course.title}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        course._id
      );

      setError("");

      const response =
        await fetch(
          `/api/admin/courses/${course._id}`,
          {
            method: "DELETE",
            credentials:
              "include",
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
            "Unable to delete course"
        );
      }

      setCourses(
        (current) =>
          current.filter(
            (item) =>
              item._id !==
              course._id
          )
      );

      await fetchCourses(
        pagination.page
      );
    } catch (err) {
      console.error(
        "[ADMIN COURSES] DELETE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete course"
      );
    } finally {
      setDeletingId(null);
    }
  }

  /*
   * ======================================================
   * STATUS CHANGE
   * ======================================================
   */

  async function handleStatusChange(
    course: Course,
    newStatus: CourseStatus
  ) {
    try {
      setActionId(
        course._id
      );

      setError("");

      const response =
        await fetch(
          `/api/admin/courses/${course._id}`,
          {
            method: "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status:
                newStatus,
            }),
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
            "Unable to update course"
        );
      }

      await fetchCourses(
        pagination.page
      );
    } catch (err) {
      console.error(
        "[ADMIN COURSES] STATUS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update course"
      );
    } finally {
      setActionId(null);
    }
  }

  /*
   * ======================================================
   * FEATURED TOGGLE
   * ======================================================
   */

  async function toggleFeatured(
    course: Course
  ) {
    try {
      setActionId(
        course._id
      );

      setError("");

      const response =
        await fetch(
          `/api/admin/courses/${course._id}`,
          {
            method: "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              featured:
                !course.featured,
            }),
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
            "Unable to update featured status"
        );
      }

      await fetchCourses(
        pagination.page
      );
    } catch (err) {
      console.error(
        "[ADMIN COURSES] FEATURED ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update featured status"
      );
    } finally {
      setActionId(null);
    }
  }

  /*
   * ======================================================
   * FILTER STATE
   * ======================================================
   */

  const hasFilters =
    Boolean(search) ||
    status !== "ALL" ||
    level !== "ALL" ||
    featured !== "ALL" ||
    pricing !== "ALL";

  const resultText =
    pagination.total === 1
      ? "1 course"
      : `${pagination.total} courses`;

  /*
   * ======================================================
   * RENDER
   * ======================================================
   */

  return (
    <div className="mx-auto max-w-7xl pb-20">
      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/30">
            Administration
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Courses
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Create, manage and publish your
            learning courses.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/courses/create"
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          <Plus size={16} />

          Create Course
        </button>
      </div>

      {/* ==================================================
          ERROR
          ================================================== */}

      {error && (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
          <div>
            <div className="text-xs font-semibold text-red-300">
              Something went wrong
            </div>

            <div className="mt-1 text-xs leading-5 text-red-300/60">
              {error}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="text-red-300/50 transition hover:text-red-300"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ==================================================
          STATISTICS
          ================================================== */}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard
          label="Total"
          value={stats.total}
          icon="📚"
        />

        <StatCard
          label="Published"
          value={stats.published}
          icon="✅"
        />

        <StatCard
          label="Draft"
          value={stats.draft}
          icon="📝"
        />

        <StatCard
          label="Archived"
          value={stats.archived}
          icon="📦"
        />

        <StatCard
          label="Featured"
          value={stats.featured}
          icon="⭐"
        />

        <StatCard
          label="Free"
          value={stats.free}
          icon="🎁"
        />

        <StatCard
          label="Paid"
          value={stats.paid}
          icon="💳"
        />
      </div>

      {/* ==================================================
          SEARCH + FILTERS
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        {/* SEARCH */}

        <form
          onSubmit={
            handleSearch
          }
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              type="text"
              value={
                searchInput
              }
              onChange={(
                event
              ) =>
                setSearchInput(
                  event.target
                    .value
                )
              }
              placeholder="Search courses by title, category, instructor..."
              className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-white/20 focus:bg-black/30"
            />
          </div>

          <button
            type="submit"
            className="h-11 rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Search
          </button>
        </form>

        {/* FILTERS */}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect
            label="Status"
            value={status}
            options={
              STATUS_OPTIONS
            }
            onChange={(
              value
            ) => {
              setStatus(
                value
              );

              setPagination(
                (current) => ({
                  ...current,
                  page: 1,
                })
              );
            }}
          />

          <FilterSelect
            label="Level"
            value={level}
            options={
              LEVEL_OPTIONS
            }
            onChange={(
              value
            ) => {
              setLevel(
                value
              );

              setPagination(
                (current) => ({
                  ...current,
                  page: 1,
                })
              );
            }}
          />

          <FilterSelect
            label="Featured"
            value={featured}
            options={[
              "ALL",
              "TRUE",
              "FALSE",
            ]}
            labels={[
              "All",
              "Featured",
              "Not Featured",
            ]}
            onChange={(
              value
            ) => {
              setFeatured(
                value
              );

              setPagination(
                (current) => ({
                  ...current,
                  page: 1,
                })
              );
            }}
          />

          <FilterSelect
            label="Pricing"
            value={pricing}
            options={[
              "ALL",
              "FREE",
              "PAID",
            ]}
            labels={[
              "All",
              "Free",
              "Paid",
            ]}
            onChange={(
              value
            ) => {
              setPricing(
                value
              );

              setPagination(
                (current) => ({
                  ...current,
                  page: 1,
                })
              );
            }}
          />

          <FilterSelect
            label="Sort"
            value={sort}
            options={[
              "newest",
              "oldest",
              "popular",
              "rating",
            ]}
            labels={[
              "Newest",
              "Oldest",
              "Most Popular",
              "Highest Rated",
            ]}
            onChange={(
              value
            ) => {
              setSort(
                value
              );

              setPagination(
                (current) => ({
                  ...current,
                  page: 1,
                })
              );
            }}
          />
        </div>

        {/* ACTIVE FILTERS */}

        {hasFilters && (
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <span className="text-xs text-white/30">
              Active filters applied
            </span>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-xs font-medium text-white/50 transition hover:text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ==================================================
          RESULT COUNT
          ================================================== */}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-white/40">
          {loading
            ? "Loading courses..."
            : resultText}
        </p>

        {!loading &&
          pagination.total >
            0 && (
            <p className="text-xs text-white/25">
              Page{" "}
              <span className="text-white/50">
                {
                  pagination.page
                }
              </span>{" "}
              of{" "}
              <span className="text-white/50">
                {
                  pagination.totalPages
                }
              </span>
            </p>
          )}
      </div>

      {/* ==================================================
          LOADING
          ================================================== */}

      {loading && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({
            length: 6,
          }).map(
            (_, index) => (
              <CourseSkeleton
                key={index}
              />
            )
          )}
        </div>
      )}

      {/* ==================================================
          EMPTY
          ================================================== */}

      {!loading &&
        courses.length ===
          0 && (
          <div className="mt-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <BookOpen
                size={28}
                className="text-white/30"
              />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-white/80">
              {hasFilters
                ? "No courses found"
                : "No courses yet"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/30">
              {hasFilters
                ? "Try changing your search or filters."
                : "Create your first course to start building your learning platform."}
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {hasFilters && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.025] px-5 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Clear Filters
                </button>
              )}

              {!hasFilters && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/admin/courses/create"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  <Plus size={15} />

                  Create Course
                </button>
              )}
            </div>
          </div>
        )}

      {/* ==================================================
          COURSE GRID
          ================================================== */}

      {!loading &&
        courses.length >
          0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map(
              (course) => (
                <CourseCard
                  key={
                    course._id
                  }
                  course={
                    course
                  }
                  actionId={
                    actionId
                  }
                  deletingId={
                    deletingId
                  }
                  onView={() =>
                    router.push(
                      `/admin/courses/${course._id}`
                    )
                  }
                  onEdit={() =>
                    router.push(
                      `/admin/courses/${course._id}`
                    )
                  }
                  onDelete={() =>
                    handleDelete(
                      course
                    )
                  }
                  onStatusChange={(
                    newStatus
                  ) =>
                    handleStatusChange(
                      course,
                      newStatus
                    )
                  }
                  onToggleFeatured={() =>
                    toggleFeatured(
                      course
                    )
                  }
                />
              )
            )}
          </div>
        )}

      {/* ==================================================
          PAGINATION
          ================================================== */}

      {!loading &&
        pagination.totalPages >
          1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={
                !pagination.hasPreviousPage
              }
              onClick={() => {
                const nextPage =
                  Math.max(
                    pagination.page -
                      1,
                    1
                  );

                setPagination(
                  (current) => ({
                    ...current,
                    page: nextPage,
                  })
                );

                fetchCourses(
                  nextPage
                );
              }}
              className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 text-xs font-medium text-white/40 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
            >
              <ChevronLeft
                size={14}
              />

              Previous
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers(
                pagination.page,
                pagination.totalPages
              ).map(
                (
                  pageNumber,
                  index
                ) =>
                  pageNumber ===
                  "..." ? (
                    <span
                      key={`${pageNumber}-${index}`}
                      className="px-2 text-xs text-white/20"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={
                        pageNumber
                      }
                      type="button"
                      onClick={() => {
                        setPagination(
                          (current) => ({
                            ...current,
                            page:
                              Number(
                                pageNumber
                              ),
                          })
                        );

                        fetchCourses(
                          Number(
                            pageNumber
                          )
                        );
                      }}
                      className={`h-9 min-w-9 rounded-xl px-3 text-xs font-medium transition ${
                        Number(
                          pageNumber
                        ) ===
                        pagination.page
                          ? "bg-white text-black"
                          : "border border-white/10 bg-white/[0.025] text-white/40 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {
                        pageNumber
                      }
                    </button>
                  )
              )}
            </div>

            <button
              type="button"
              disabled={
                !pagination.hasNextPage
              }
              onClick={() => {
                const nextPage =
                  pagination.page +
                  1;

                setPagination(
                  (current) => ({
                    ...current,
                    page: nextPage,
                  })
                );

                fetchCourses(
                  nextPage
                );
              }}
              className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 text-xs font-medium text-white/40 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
            >
              Next

              <ChevronRight
                size={14}
              />
            </button>
          </div>
        )}
    </div>
  );
}

/*
 * ======================================================
 * STAT CARD
 * ======================================================
 */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg">
          {icon}
        </span>

        <span className="text-xl font-bold text-white/80">
          {value}
        </span>
      </div>

      <p className="mt-2 text-xs font-medium text-white/35">
        {label}
      </p>
    </div>
  );
}

/*
 * ======================================================
 * FILTER SELECT
 * ======================================================
 */

function FilterSelect({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;

  value: string;

  options: string[];

  labels?: string[];

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-white/30">
        {label}
      </span>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white/65 outline-none transition focus:border-white/20 focus:bg-black/30"
      >
        {options.map(
          (
            option,
            index
          ) => (
            <option
              key={option}
              value={option}
              className="bg-[#090909] text-white"
            >
              {labels?.[
                index
              ] ||
                formatFilterLabel(
                  option
                )}
            </option>
          )
        )}
      </select>
    </label>
  );
}

/*
 * ======================================================
 * COURSE CARD
 * ======================================================
 */

function CourseCard({
  course,
  actionId,
  deletingId,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleFeatured,
}: {
  course: Course;

  actionId: string | null;

  deletingId: string | null;

  onView: () => void;

  onEdit: () => void;

  onDelete: () => void;

  onStatusChange: (
    status: CourseStatus
  ) => void;

  onToggleFeatured: () => void;
}) {
  const isActionLoading =
    actionId ===
    course._id;

  const isDeleting =
    deletingId ===
    course._id;

  const progress =
    course.enrollmentCount &&
    course.enrollmentCount >
      0
      ? Math.min(
          100,
          Math.round(
            (Number(
              course.completionCount ||
                0
            ) /
              Number(
                course.enrollmentCount
              )) *
              100
          )
        )
      : 0;

  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition hover:border-white/15 hover:bg-white/[0.035]">
      {/* ==================================================
          IMAGE
          ================================================== */}

      <div className="relative aspect-[16/9] overflow-hidden bg-black/30">
        {course.thumbnail ? (
          <img
            src={
              course.thumbnail
            }
            alt={
              course.title
            }
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.025]">
            <BookOpen
              size={42}
              className="text-white/15"
            />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* STATUS */}

        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusClass(
              course.status
            )}`}
          >
            {course.status ===
              "PUBLISHED" && (
              <CheckCircle2
                size={10}
              />
            )}

            {course.status ||
              "DRAFT"}
          </span>
        </div>

        {/* FEATURED */}

        <button
          type="button"
          onClick={
            onToggleFeatured
          }
          disabled={
            isActionLoading ||
            isDeleting
          }
          title={
            course.featured
              ? "Remove from featured"
              : "Mark as featured"
          }
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
            course.featured
              ? "border-yellow-400/30 bg-yellow-400/15 text-yellow-300"
              : "border-white/10 bg-black/30 text-white/40 hover:bg-white/10 hover:text-white"
          }`}
        >
          {isActionLoading ? (
            <Loader2
              size={14}
              className="animate-spin"
            />
          ) : (
            <Star
              size={14}
              fill={
                course.featured
                  ? "currentColor"
                  : "none"
              }
            />
          )}
        </button>

        {/* PRICE */}

        <div className="absolute bottom-3 right-3">
          <span className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm">
            {formatPrice(
              course
            )}
          </span>
        </div>
      </div>

      {/* ==================================================
          CONTENT
          ================================================== */}

      <div className="p-5">
        {/* CATEGORY */}

        <div className="flex items-center gap-2">
          {course.category && (
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/25">
              {
                course.category
              }
            </span>
          )}

          {course.level && (
            <>
              <span className="text-white/15">
                •
              </span>

              <span className="text-[10px] text-white/25">
                {getLevelLabel(
                  course.level
                )}
              </span>
            </>
          )}
        </div>

        {/* TITLE */}

        <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-white/85">
          {
            course.title
          }
        </h2>

        {/* DESCRIPTION */}

        <p className="mt-2 line-clamp-2 min-h-[40px] text-xs leading-5 text-white/30">
          {course.shortDescription ||
            "No course description available."}
        </p>

        {/* META */}

        <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/[0.06] py-3">
          <MetaItem
            icon={
              <Layers3
                size={13}
              />
            }
            value={
              course.moduleCount ??
              0
            }
            label="Modules"
          />

          <MetaItem
            icon={
              <BookOpen
                size={13}
              />
            }
            value={
              course.lessonCount ??
              0
            }
            label="Lessons"
          />

          <MetaItem
            icon={
              <Clock3
                size={13}
              />
            }
            value={formatDuration(
              course.durationMinutes
            )}
            label="Duration"
          />
        </div>

        {/* ENROLLMENT */}

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <Users
                size={12}
              />

              <span>
                {Number(
                  course.enrollmentCount ||
                    0
                ).toLocaleString(
                  "en-IN"
                )}{" "}
                enrolled
              </span>
            </div>

            <span className="text-[11px] text-white/25">
              {progress}% completed
            </span>
          </div>

          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-white/30 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* INSTRUCTOR */}

        {course.instructorName && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-white/20">
              Instructor
            </span>

            <span className="max-w-[180px] truncate text-xs text-white/40">
              {
                course.instructorName
              }
            </span>
          </div>
        )}

        {/* CERTIFICATE */}

        {course.certificateEnabled && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <Zap
              size={13}
              className="text-white/40"
            />

            <span className="text-[10px] text-white/35">
              Certificate enabled
            </span>

            {course.certificateName && (
              <span className="ml-auto max-w-[130px] truncate text-[10px] text-white/20">
                {
                  course.certificateName
                }
              </span>
            )}
          </div>
        )}

        {/* ACTIONS */}

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={
              onView
            }
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] text-xs font-medium text-white/50 transition hover:bg-white/[0.05] hover:text-white"
          >
            <Eye
              size={14}
            />

            View
          </button>

          <button
            type="button"
            onClick={
              onEdit
            }
            className="flex h-9 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-white/40 transition hover:bg-white/[0.05] hover:text-white"
            title="Edit course"
          >
            <Edit3
              size={14}
            />
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            disabled={
              isDeleting ||
              isActionLoading
            }
            className="flex h-9 w-10 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[0.03] text-red-300/40 transition hover:border-red-400/20 hover:bg-red-400/[0.08] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
            title="Delete course"
          >
            {isDeleting ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Trash2
                size={14}
              />
            )}
          </button>

          <CourseStatusMenu
            course={
              course
            }
            disabled={
              isActionLoading ||
              isDeleting
            }
            onStatusChange={
              onStatusChange
            }
          />
        </div>

        {/* CREATED */}

        <div className="mt-4 text-[10px] text-white/15">
          Created{" "}
          {formatDate(
            course.createdAt
          )}
        </div>
      </div>
    </div>
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
  label,
}: {
  icon: React.ReactNode;

  value: string | number;

  label: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-white/30">
        {icon}

        <span className="text-xs font-medium text-white/50">
          {value}
        </span>
      </div>

      <div className="mt-1 text-[9px] uppercase tracking-wide text-white/15">
        {label}
      </div>
    </div>
  );
}

/*
 * ======================================================
 * STATUS MENU
 * ======================================================
 */

function CourseStatusMenu({
  course,
  disabled,
  onStatusChange,
}: {
  course: Course;

  disabled: boolean;

  onStatusChange: (
    status: CourseStatus
  ) => void;
}) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const options: CourseStatus[] =
    [
      "DRAFT",
      "PUBLISHED",
      "ARCHIVED",
    ];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={
          disabled
        }
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className="flex h-9 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-white/40 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        title="Change status"
      >
        <MoreVertical
          size={15}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close status menu"
            onClick={() =>
              setOpen(false)
            }
            className="fixed inset-0 z-10 cursor-default"
          />

          <div className="absolute bottom-11 right-0 z-20 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d] p-1 shadow-2xl">
            <div className="px-3 py-2 text-[9px] uppercase tracking-[0.15em] text-white/20">
              Change status
            </div>

            {options.map(
              (option) => {
                const active =
                  course.status ===
                  option;

                return (
                  <button
                    key={
                      option
                    }
                    type="button"
                    disabled={
                      active
                    }
                    onClick={() => {
                      onStatusChange(
                        option
                      );

                      setOpen(
                        false
                      );
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                      active
                        ? "bg-white/[0.05] text-white/25"
                        : "text-white/50 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span>
                      {formatFilterLabel(
                        option
                      )}
                    </span>

                    {active && (
                      <CheckCircle2
                        size={
                          12
                        }
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
}

/*
 * ======================================================
 * SKELETON
 * ======================================================
 */

function CourseSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="aspect-[16/9] animate-pulse bg-white/[0.04]" />

      <div className="p-5">
        <div className="h-2.5 w-20 animate-pulse rounded bg-white/[0.05]" />

        <div className="mt-3 h-5 w-4/5 animate-pulse rounded bg-white/[0.06]" />

        <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/[0.04]" />

        <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-white/[0.04]" />

        <div className="mt-5 grid grid-cols-3 gap-2 border-y border-white/[0.06] py-4">
          <div className="h-7 animate-pulse rounded bg-white/[0.04]" />

          <div className="h-7 animate-pulse rounded bg-white/[0.04]" />

          <div className="h-7 animate-pulse rounded bg-white/[0.04]" />
        </div>

        <div className="mt-5 h-9 animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}