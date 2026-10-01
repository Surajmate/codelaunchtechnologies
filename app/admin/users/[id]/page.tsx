"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Shield,
  Target,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface ProgressItem {
  _id: string;

  roadmap?: string;
  module?: string;
  lesson?: string;

  completed: boolean;

  completedAt?: string | null;

  score?: number;

  attempts?: number;

  lastAccessedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

interface RoadmapSummary {
  roadmapId: string;

  totalLessons: number;

  completedLessons: number;

  incompleteLessons: number;

  completionRate: number;

  attempts: number;

  averageScore: number;
}

interface UserSummary {
  trackedLessons: number;

  completedLessons: number;

  incompleteLessons: number;

  completionRate: number;

  totalAttempts: number;

  averageScore: number;

  highestScore: number;

  lastAccessedAt?: string | null;
}

interface UserDetailResponse {
  success: boolean;

  message?: string;

  user: UserData;

  summary: UserSummary;

  roadmapSummary: RoadmapSummary[];

  progress: ProgressItem[];
}

/*
 * ------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------
 */

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Never";
  }

  return new Date(
    value
  ).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getInitials(
  name?: string
) {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}

function formatRole(
  role: string
) {
  if (role === "SUPER_ADMIN") {
    return "Super Admin";
  }

  if (role === "ADMIN") {
    return "Admin";
  }

  return "User";
}

/*
 * ------------------------------------------------------
 * PAGE
 * ------------------------------------------------------
 */

export default function UserDetailPage() {
  const params =
    useParams();

  const id =
    typeof params.id ===
    "string"
      ? params.id
      : "";

  const [data, setData] =
    useState<UserDetailResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState("");

  /*
   * ----------------------------------------------------
   * LOAD USER
   * ----------------------------------------------------
   */

  async function loadUser() {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setActionMessage("");

      const response =
        await fetch(
          `/api/admin/users/${id}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to load user"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to load user"
        );
      }

      setData(result);
    } catch (err) {
      console.error(
        "[ADMIN USER DETAIL PAGE]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load user"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, [id]);

  /*
   * ----------------------------------------------------
   * UPDATE USER
   * ----------------------------------------------------
   */

  async function updateUser(
    changes: {
      isActive?: boolean;
      role?: string;
    }
  ) {
    if (!data) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setActionMessage("");

      const response =
        await fetch(
          `/api/admin/users/${id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              changes
            ),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to update user"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to update user"
        );
      }

      setActionMessage(
        result.message ||
          "User updated successfully"
      );

      /*
       * Reload complete user data
       * so all statistics remain fresh.
       */

      await loadUser();
    } catch (err) {
      console.error(
        "[ADMIN USER UPDATE]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ----------------------------------------------------
   * LOADING
   * ----------------------------------------------------
   */

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"
        >
          <ArrowLeft
            size={15}
          />

          Back to Users
        </Link>

        <div className="mt-8 animate-pulse">
          <div className="h-6 w-48 rounded bg-white/5" />

          <div className="mt-3 h-4 w-72 rounded bg-white/5" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-2xl border border-white/10 bg-white/[0.025]"
                />
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------
   * ERROR
   * ----------------------------------------------------
   */

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"
        >
          <ArrowLeft
            size={15}
          />

          Back to Users
        </Link>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-8">
          <div className="text-sm text-white/50">
            Unable to load user.
          </div>

          <div className="mt-2 text-sm text-white/30">
            {error}
          </div>

          <button
            onClick={
              loadUser
            }
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const {
    user,
    summary,
    roadmapSummary,
    progress,
  } = data;

  /*
   * ----------------------------------------------------
   * PAGE
   * ----------------------------------------------------
   */

  return (
    <div className="mx-auto max-w-7xl pb-20">
      {/* ==================================================
          BACK
          ================================================== */}

      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
      >
        <ArrowLeft
          size={15}
        />

        Back to Users
      </Link>

      {/* ==================================================
          USER HEADER
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white/60">
                {getInitials(
                  user.name
                )}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {user.name}
                </h1>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-wide text-white/40">
                  {formatRole(
                    user.role
                  )}
                </span>

                <span className="flex items-center gap-2 text-xs text-white/40">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      user.isActive
                        ? "bg-white"
                        : "bg-white/20"
                    }`}
                  />

                  {user.isActive
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <div className="mt-2 text-sm text-white/35">
                {user.email}
              </div>

              <div className="mt-1 text-xs text-white/20">
                Joined{" "}
                {formatDate(
                  user.createdAt
                )}
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={saving}
              onClick={() =>
                updateUser({
                  isActive:
                    !user.isActive,
                })
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/50 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {user.isActive ? (
                <UserX
                  size={15}
                />
              ) : (
                <UserCheck
                  size={15}
                />
              )}

              {user.isActive
                ? "Deactivate"
                : "Activate"}
            </button>

            <button
              disabled={saving}
              onClick={() =>
                loadUser()
              }
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          MESSAGES
          ================================================== */}

      {actionMessage && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/50">
          {actionMessage}
        </div>
      )}

      {error && data && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/50">
          {error}
        </div>
      )}

      {/* ==================================================
          STATISTICS
          ================================================== */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <BookOpen
              size={14}
            />

            Tracked Lessons
          </div>

          <div className="mt-3 text-2xl font-bold">
            {summary.trackedLessons}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <CheckCircle2
              size={14}
            />

            Completed
          </div>

          <div className="mt-3 text-2xl font-bold">
            {summary.completedLessons}
          </div>

          <div className="mt-1 text-xs text-white/25">
            {summary.completionRate}%
            completion rate
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Target
              size={14}
            />

            Average Score
          </div>

          <div className="mt-3 text-2xl font-bold">
            {summary.averageScore}%
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <GraduationCap
              size={14}
            />

            Attempts
          </div>

          <div className="mt-3 text-2xl font-bold">
            {summary.totalAttempts}
          </div>

          <div className="mt-1 text-xs text-white/25">
            Highest score{" "}
            {summary.highestScore}%
          </div>
        </div>
      </div>

      {/* ==================================================
          ACCOUNT + ACTIVITY
          ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ACCOUNT */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center gap-2">
            <Shield
              size={17}
              className="text-white/30"
            />

            <h2 className="font-semibold">
              Account
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-white/35">
                Role
              </span>

              <span className="text-sm text-white/60">
                {formatRole(
                  user.role
                )}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-white/35">
                Status
              </span>

              <span className="text-sm text-white/60">
                {user.isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-sm text-white/35">
                Joined
              </span>

              <span className="text-sm text-white/60">
                {formatDate(
                  user.createdAt
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-white/35">
                Last Activity
              </span>

              <span className="text-sm text-white/60">
                {formatDate(
                  summary.lastAccessedAt
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ROLE MANAGEMENT */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center gap-2">
            <Shield
              size={17}
              className="text-white/30"
            />

            <h2 className="font-semibold">
              Role Management
            </h2>
          </div>

          <p className="mt-2 text-xs text-white/30">
            Change the access level for
            this account.
          </p>

          <div className="mt-6 grid gap-2">
            {[
              {
                value: "USER",
                label: "User",
                description:
                  "Standard platform access",
              },
              {
                value: "ADMIN",
                label: "Admin",
                description:
                  "Administration access",
              },
              {
                value: "SUPER_ADMIN",
                label: "Super Admin",
                description:
                  "Full administrative access",
              },
            ].map(
              (item) => (
                <button
                  key={
                    item.value
                  }
                  disabled={
                    saving ||
                    user.role ===
                      item.value
                  }
                  onClick={() =>
                    updateUser({
                      role:
                        item.value,
                    })
                  }
                  className={`
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    px-4
                    py-3
                    text-left
                    transition
                    ${
                      user.role ===
                      item.value
                        ? "border-white/20 bg-white/5"
                        : "border-white/10 hover:bg-white/5"
                    }
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  `}
                >
                  <div>
                    <div className="text-sm text-white/60">
                      {
                        item.label
                      }
                    </div>

                    <div className="mt-1 text-xs text-white/25">
                      {
                        item.description
                      }
                    </div>
                  </div>

                  {user.role ===
                    item.value && (
                    <CheckCircle2
                      size={16}
                      className="text-white/50"
                    />
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          ROADMAP PROGRESS
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex items-center gap-2">
          <GraduationCap
            size={17}
            className="text-white/30"
          />

          <h2 className="font-semibold">
            Roadmap Progress
          </h2>
        </div>

        <p className="mt-1 text-xs text-white/30">
          Learning progress grouped by
          roadmap.
        </p>

        {roadmapSummary.length ===
        0 ? (
          <div className="py-10 text-center text-sm text-white/30">
            No roadmap progress found.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {roadmapSummary.map(
              (roadmap) => (
                <div
                  key={
                    roadmap.roadmapId
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">
                      Roadmap
                    </span>

                    <span className="text-xs text-white/30">
                      {
                        roadmap.completionRate
                      }
                      %
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-white/60 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            roadmap.completionRate
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-lg font-semibold">
                        {
                          roadmap.completedLessons
                        }
                      </div>

                      <div className="text-[10px] text-white/25">
                        Completed
                      </div>
                    </div>

                    <div>
                      <div className="text-lg font-semibold">
                        {
                          roadmap.incompleteLessons
                        }
                      </div>

                      <div className="text-[10px] text-white/25">
                        Remaining
                      </div>
                    </div>

                    <div>
                      <div className="text-lg font-semibold">
                        {
                          roadmap.averageScore
                        }
                        %
                      </div>

                      <div className="text-[10px] text-white/25">
                        Avg. Score
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ==================================================
          LEARNING ACTIVITY
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex items-center gap-2">
          <Clock3
            size={17}
            className="text-white/30"
          />

          <h2 className="font-semibold">
            Learning Activity
          </h2>
        </div>

        <p className="mt-1 text-xs text-white/30">
          Individual lesson progress and
          activity.
        </p>

        <div className="mt-6 overflow-x-auto">
          {progress.length ===
          0 ? (
            <div className="py-10 text-center text-sm text-white/30">
              No learning activity found.
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-white/25">
                    Lesson
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-white/25">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-white/25">
                    Score
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-white/25">
                    Attempts
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-white/25">
                    Last Accessed
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {progress.map(
                  (item) => (
                    <tr
                      key={
                        item._id
                      }
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm text-white/60">
                          Lesson
                        </div>

                        <div className="mt-1 text-[10px] text-white/20">
                          {item.lesson
                            ? String(
                                item.lesson
                              )
                            : "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="flex items-center gap-2 text-xs text-white/40">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              item.completed
                                ? "bg-white"
                                : "bg-white/20"
                            }`}
                          />

                          {item.completed
                            ? "Completed"
                            : "In Progress"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-white/50">
                        {typeof item.score ===
                        "number"
                          ? `${item.score}%`
                          : "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-white/40">
                        {item.attempts ??
                          0}
                      </td>

                      <td className="px-4 py-4 text-xs text-white/30">
                        {formatDate(
                          item.lastAccessedAt ||
                            item.updatedAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}