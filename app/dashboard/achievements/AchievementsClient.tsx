"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  Check,
  ChevronRight,
  Circle,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type AchievementType =
  | "COURSE"
  | "PROJECT"
  | "PRACTICE"
  | "ROADMAP"
  | "CERTIFICATE"
  | "CUSTOM";

type AchievementStatus =
  | "LOCKED"
  | "IN_PROGRESS"
  | "COMPLETED";

interface Achievement {
  _id: string;

  user?: string;

  title: string;

  description?: string;

  type: AchievementType;

  status: AchievementStatus;

  progress: number;

  icon?: string;

  color?: string;

  awardedAt?: string | null;

  createdAt?: string;

  updatedAt?: string;
}

interface AchievementStats {
  total: number;
  completed: number;
  inProgress: number;
  locked: number;
  completionPercentage: number;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;

  achievements?: Achievement[];

  stats?: {
    total?: number;
    completed?: number;
    earned?: number;
    inProgress?: number;
    locked?: number;
    completionPercentage?: number;
    totalXP?: number;
    totalPoints?: number;
  };
}

/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const TYPE_OPTIONS: Array<{
  value: "ALL" | AchievementType;
  label: string;
}> = [
  {
    value: "ALL",
    label: "All Types",
  },
  {
    value: "COURSE",
    label: "Courses",
  },
  {
    value: "PROJECT",
    label: "Projects",
  },
  {
    value: "PRACTICE",
    label: "Practice",
  },
  {
    value: "ROADMAP",
    label: "Roadmaps",
  },
  {
    value: "CERTIFICATE",
    label: "Certificates",
  },
  {
    value: "CUSTOM",
    label: "Custom",
  },
];

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

function getStatusLabel(
  status: AchievementStatus
) {
  switch (status) {
    case "COMPLETED":
      return "Completed";

    case "IN_PROGRESS":
      return "In Progress";

    case "LOCKED":
      return "Locked";

    default:
      return status;
  }
}

function getTypeLabel(
  type: AchievementType
) {
  switch (type) {
    case "COURSE":
      return "Course";

    case "PROJECT":
      return "Project";

    case "PRACTICE":
      return "Practice";

    case "ROADMAP":
      return "Roadmap";

    case "CERTIFICATE":
      return "Certificate";

    case "CUSTOM":
      return "Achievement";

    default:
      return type;
  }
}

function getTypeIcon(
  type: AchievementType
) {
  switch (type) {
    case "COURSE":
      return "📚";

    case "PROJECT":
      return "🚀";

    case "PRACTICE":
      return "💻";

    case "ROADMAP":
      return "🗺️";

    case "CERTIFICATE":
      return "🎓";

    case "CUSTOM":
      return "🏆";

    default:
      return "🏆";
  }
}

function getStatusClass(
  status: AchievementStatus
) {
  switch (status) {
    case "COMPLETED":
      return {
        badge:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
        icon:
          "border-emerald-400/20 bg-emerald-400/10",
        progress:
          "bg-emerald-400",
      };

    case "IN_PROGRESS":
      return {
        badge:
          "border-blue-400/20 bg-blue-400/10 text-blue-300",
        icon:
          "border-blue-400/20 bg-blue-400/10",
        progress:
          "bg-blue-400",
      };

    case "LOCKED":
      return {
        badge:
          "border-white/10 bg-white/5 text-white/35",
        icon:
          "border-white/10 bg-white/[0.04]",
        progress:
          "bg-white/30",
      };

    default:
      return {
        badge:
          "border-white/10 bg-white/5 text-white/40",
        icon:
          "border-white/10 bg-white/[0.04]",
        progress:
          "bg-white/30",
      };
  }
}

function normalizeProgress(
  value: unknown
) {
  const progress = Number(value ?? 0);

  if (Number.isNaN(progress)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(progress)
    )
  );
}

/*
 * ============================================================
 * SKELETON
 * ============================================================
 */

function AchievementSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex gap-4">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/[0.06]" />

        <div className="min-w-0 flex-1">
          <div className="h-4 w-2/3 rounded bg-white/[0.06]" />

          <div className="mt-3 h-3 w-1/3 rounded bg-white/[0.05]" />

          <div className="mt-5 h-2 w-full rounded-full bg-white/[0.05]" />
        </div>
      </div>

      <div className="mt-5 h-3 w-3/4 rounded bg-white/[0.04]" />
    </div>
  );
}

/*
 * ============================================================
 * STAT CARD
 * ============================================================
 */

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
            {label}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-white/30">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/60">
          {icon}
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * ACHIEVEMENT CARD
 * ============================================================
 */

function AchievementCard({
  achievement,
  onClick,
}: {
  achievement: Achievement;
  onClick: () => void;
}) {
  const progress =
    normalizeProgress(
      achievement.progress
    );

  const statusClass =
    getStatusClass(
      achievement.status
    );

  const completed =
    achievement.status ===
    "COMPLETED";

  const locked =
    achievement.status ===
    "LOCKED";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition",
        completed
          ? "border-emerald-400/10 bg-white/[0.035] hover:border-emerald-400/20 hover:bg-white/[0.05]"
          : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.035]",
      ].join(" ")}
    >
      {/* TOP STATUS */}

      <div className="absolute right-4 top-4">
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
            statusClass.badge,
          ].join(" ")}
        >
          {completed ? (
            <Check className="h-3 w-3" />
          ) : locked ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Circle className="h-2.5 w-2.5 fill-current" />
          )}

          {getStatusLabel(
            achievement.status
          )}
        </span>
      </div>

      {/* HEADER */}

      <div className="flex gap-4 pr-24">
        <div
          className={[
            "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-2xl",
            statusClass.icon,
            locked
              ? "grayscale opacity-50"
              : "",
          ].join(" ")}
          style={
            achievement.color
              ? {
                  borderColor:
                    achievement.color,
                }
              : undefined
          }
        >
          {achievement.icon ? (
            <span>{achievement.icon}</span>
          ) : (
            <span>
              {getTypeIcon(
                achievement.type
              )}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-white">
            {achievement.title ||
              "Untitled Achievement"}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40">
              {getTypeLabel(
                achievement.type
              )}
            </span>

            {completed &&
              achievement.awardedAt && (
                <span className="text-[10px] text-white/25">
                  {formatDate(
                    achievement.awardedAt
                  )}
                </span>
              )}
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}

      <p className="mt-5 min-h-[40px] text-xs leading-5 text-white/35">
        {achievement.description ||
          "Keep learning and building to unlock this achievement."}
      </p>

      {/* PROGRESS */}

      <div className="mt-5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/30">
            Progress
          </span>

          <span className="font-medium text-white/60">
            {progress}%
          </span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className={[
              "h-full rounded-full transition-all duration-500",
              statusClass.progress,
            ].join(" ")}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* FOOTER */}

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <span className="text-[10px] text-white/25">
          {progress === 100
            ? "Achievement completed"
            : progress > 0
            ? "Keep going"
            : "Not started"}
        </span>

        <ChevronRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/50" />
      </div>
    </button>
  );
}

/*
 * ============================================================
 * DETAILS DRAWER
 * ============================================================
 */

function AchievementDrawer({
  achievement,
  onClose,
}: {
  achievement: Achievement | null;
  onClose: () => void;
}) {
  if (!achievement) {
    return null;
  }

  const progress =
    normalizeProgress(
      achievement.progress
    );

  const completed =
    achievement.status ===
    "COMPLETED";

  const statusClass =
    getStatusClass(
      achievement.status
    );

  return (
    <div className="fixed inset-0 z-[100]">
      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close achievement details"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* DRAWER */}

      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#080b14] shadow-2xl">
        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#080b14]/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
              Achievement
            </p>

            <h2 className="mt-1 text-lg font-semibold">
              Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {/* ICON */}

          <div className="flex items-center gap-4">
            <div
              className={[
                "flex h-20 w-20 items-center justify-center rounded-3xl border text-4xl",
                statusClass.icon,
              ].join(" ")}
            >
              {achievement.icon ||
                getTypeIcon(
                  achievement.type
                )}
            </div>

            <div className="min-w-0">
              <h3 className="text-xl font-bold text-white">
                {achievement.title}
              </h3>

              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={[
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                    statusClass.badge,
                  ].join(" ")}
                >
                  {getStatusLabel(
                    achievement.status
                  )}
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/40">
                  {getTypeLabel(
                    achievement.type
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}

          <section className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">
              Description
            </p>

            <p className="mt-3 text-sm leading-6 text-white/50">
              {achievement.description ||
                "No description available for this achievement."}
            </p>
          </section>

          {/* PROGRESS */}

          <section className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">
                  Your Progress
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {progress}%
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                {completed ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Trophy className="h-5 w-5 text-white/50" />
                )}
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={[
                  "h-full rounded-full transition-all duration-500",
                  statusClass.progress,
                ].join(" ")}
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p className="mt-2 text-[10px] text-white/25">
              {progress === 100
                ? "Completed"
                : `${progress}% completed`}
            </p>
          </section>

          {/* AWARDED */}

          {completed &&
            achievement.awardedAt && (
              <section className="mt-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.04] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                    <Award className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-emerald-300">
                      Achievement Unlocked
                    </p>

                    <p className="mt-1 text-[10px] text-white/30">
                      Awarded on{" "}
                      {formatDate(
                        achievement.awardedAt
                      )}
                    </p>
                  </div>
                </div>
              </section>
            )}

          {/* CREATED */}

          {achievement.createdAt && (
            <div className="mt-6 text-[10px] text-white/20">
              Achievement created{" "}
              {formatDate(
                achievement.createdAt
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/*
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

export default function AchievementsClient() {
  const [
    achievements,
    setAchievements,
  ] = useState<Achievement[]>([]);

  const [stats, setStats] =
    useState<AchievementStats>({
      total: 0,
      completed: 0,
      inProgress: 0,
      locked: 0,
      completionPercentage: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<
      "ALL" | "COMPLETED" | "IN_PROGRESS" | "LOCKED"
    >("ALL");

  const [typeFilter, setTypeFilter] =
    useState<
      "ALL" | AchievementType
    >("ALL");

  const [
    selectedAchievement,
    setSelectedAchievement,
  ] =
    useState<Achievement | null>(
      null
    );

  /*
   * ============================================================
   * LOAD
   * ============================================================
   */

  const loadAchievements =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/achievements",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data: ApiResponse =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          data.success === false
        ) {
          throw new Error(
            data.message ||
              data.error ||
              `Unable to load achievements (${response.status})`
          );
        }

        const list =
          Array.isArray(
            data.achievements
          )
            ? data.achievements
            : [];

        setAchievements(list);

        /*
         * API stats are optional.
         * We calculate them from the returned
         * records as a fallback.
         */

        const completed =
          list.filter(
            (item) =>
              item.status ===
              "COMPLETED"
          ).length;

        const inProgress =
          list.filter(
            (item) =>
              item.status ===
              "IN_PROGRESS"
          ).length;

        const locked =
          list.filter(
            (item) =>
              item.status ===
              "LOCKED"
          ).length;

        const completionPercentage =
          list.length > 0
            ? Math.round(
                (completed /
                  list.length) *
                  100
              )
            : 0;

        setStats({
          total:
            Number(
              data.stats?.total ??
                list.length
            ),

          completed:
            Number(
              data.stats?.completed ??
                data.stats?.earned ??
                completed
            ),

          inProgress:
            Number(
              data.stats?.inProgress ??
                inProgress
            ),

          locked:
            Number(
              data.stats?.locked ??
                locked
            ),

          completionPercentage:
            Number(
              data.stats
                ?.completionPercentage ??
                completionPercentage
            ),
        });
      } catch (err) {
        console.error(
          "[USER ACHIEVEMENTS] LOAD ERROR:",
          err
        );

        setAchievements([]);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load achievements"
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  /*
   * ============================================================
   * FILTERED DATA
   * ============================================================
   */

  const filteredAchievements =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return achievements.filter(
        (achievement) => {
          /*
           * STATUS
           */

          if (
            activeTab !== "ALL" &&
            achievement.status !==
              activeTab
          ) {
            return false;
          }

          /*
           * TYPE
           */

          if (
            typeFilter !== "ALL" &&
            achievement.type !==
              typeFilter
          ) {
            return false;
          }

          /*
           * SEARCH
           */

          if (
            normalizedSearch
          ) {
            const searchable =
              [
                achievement.title,
                achievement.description,
                achievement.type,
                achievement.status,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            if (
              !searchable.includes(
                normalizedSearch
              )
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      achievements,
      activeTab,
      typeFilter,
      search,
    ]);

  /*
   * ============================================================
   * RESET FILTERS
   * ============================================================
   */

  function resetFilters() {
    setSearch("");
    setActiveTab("ALL");
    setTypeFilter("ALL");
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl pb-12">
        {/* HEADER */}

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Progress
          </p>

          <div className="mt-3 h-8 w-64 animate-pulse rounded-lg bg-white/[0.05]" />

          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-white/[0.04]" />
        </div>

        {/* STATS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.02]"
              />
            )
          )}
        </div>

        {/* CARDS */}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <AchievementSkeleton
              key={index}
            />
          ))}
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MAIN UI
   * ============================================================
   */

  return (
    <div className="mx-auto max-w-7xl pb-12">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Achievements
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Your achievements
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/40">
            Track your learning milestones,
            completed challenges, and progress
            across your learning journey.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAchievements}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
        >
          <RefreshCw
            className={[
              "h-4 w-4",
              loading
                ? "animate-spin"
                : "",
            ].join(" ")}
          />

          Refresh
        </button>
      </div>

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-red-400">
                Unable to load achievements
              </p>

              <p className="mt-1 text-xs leading-5 text-red-300/60">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={loadAchievements}
              className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/10"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* STATS */}
      {/* ====================================================== */}

      {!error && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total"
              value={stats.total}
              description="Achievements available"
              icon={
                <Trophy className="h-5 w-5" />
              }
            />

            <StatCard
              label="Completed"
              value={stats.completed}
              description="Achievements unlocked"
              icon={
                <Check className="h-5 w-5" />
              }
            />

            <StatCard
              label="In Progress"
              value={stats.inProgress}
              description="Currently being worked on"
              icon={
                <Sparkles className="h-5 w-5" />
              }
            />

            <StatCard
              label="Completion"
              value={`${stats.completionPercentage}%`}
              description="Overall achievement progress"
              icon={
                <Award className="h-5 w-5" />
              }
            />
          </div>

          {/* ================================================== */}
          {/* OVERALL PROGRESS */}
          {/* ================================================== */}

          {stats.total > 0 && (
            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/60">
                    Achievement completion
                  </p>

                  <p className="mt-1 text-[10px] text-white/25">
                    {stats.completed} of{" "}
                    {stats.total} completed
                  </p>
                </div>

                <span className="text-sm font-semibold text-white/70">
                  {
                    stats.completionPercentage
                  }
                  %
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-white/60 transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        stats.completionPercentage
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* FILTERS */}
          {/* ================================================== */}

          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* SEARCH */}

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search achievements..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
                />
              </div>

              {/* TYPE */}

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value as
                      | "ALL"
                      | AchievementType
                  )
                }
                className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-white/20"
              >
                {TYPE_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#080b14]"
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* STATUS TABS */}

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {[
                {
                  value: "ALL",
                  label: "All",
                },
                {
                  value:
                    "COMPLETED",
                  label: "Completed",
                },
                {
                  value:
                    "IN_PROGRESS",
                  label: "In Progress",
                },
                {
                  value: "LOCKED",
                  label: "Locked",
                },
              ].map((tab) => {
                const active =
                  activeTab ===
                  tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.value as
                          | "ALL"
                          | "COMPLETED"
                          | "IN_PROGRESS"
                          | "LOCKED"
                      )
                    }
                    className={[
                      "shrink-0 rounded-xl border px-4 py-2 text-xs font-medium transition",
                      active
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/35 hover:bg-white/[0.05] hover:text-white/60",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================== */}
          {/* RESULTS */}
          {/* ================================================== */}

          <div className="mt-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Achievements
              </p>

              <p className="mt-1 text-xs text-white/25">
                {
                  filteredAchievements.length
                }{" "}
                result
                {filteredAchievements.length ===
                1
                  ? ""
                  : "s"}
              </p>
            </div>

            {(search ||
              activeTab !==
                "ALL" ||
              typeFilter !==
                "ALL") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-white/35 transition hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* ================================================== */}
          {/* EMPTY */}
          {/* ================================================== */}

          {filteredAchievements.length ===
          0 ? (
            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                {achievements.length ===
                0 ? (
                  <Trophy className="h-6 w-6 text-white/25" />
                ) : (
                  <Search className="h-6 w-6 text-white/25" />
                )}
              </div>

              <h3 className="mt-5 text-sm font-semibold text-white">
                {achievements.length ===
                0
                  ? "No achievements yet"
                  : "No matching achievements"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/30">
                {achievements.length ===
                0
                  ? "Keep learning, completing courses, building projects, and practicing to earn achievements."
                  : "Try changing your search or filters to find other achievements."}
              </p>

              {achievements.length >
                0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            /* ================================================== */
            /* GRID */
            /* ================================================== */

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAchievements.map(
                (achievement) => (
                  <AchievementCard
                    key={
                      achievement._id
                    }
                    achievement={
                      achievement
                    }
                    onClick={() =>
                      setSelectedAchievement(
                        achievement
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </>
      )}

      {/* ====================================================== */}
      {/* DRAWER */}
      {/* ====================================================== */}

      <AchievementDrawer
        achievement={
          selectedAchievement
        }
        onClose={() =>
          setSelectedAchievement(
            null
          )
        }
      />
    </div>
  );
}