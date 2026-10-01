"use client";

import { useEffect, useState } from "react";

import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Headphones,
  LayoutDashboard,
  Plug,
  Users,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;

  totalRoadmaps: number;
  publishedRoadmaps: number;

  totalLessons: number;
  publishedLessons: number;

  totalIntegrations: number;
  activeIntegrations: number;
  inactiveIntegrations: number;
  integrationErrors: number;

  totalSupportTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
}

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface RecentTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  user?: {
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface RecentIntegration {
  _id: string;
  name: string;
  provider: string;
  category: string;
  status: string;
  lastCheckedAt?: string | null;
}

interface DashboardResponse {
  success: boolean;
  message?: string;
  stats: DashboardStats;
  recentUsers: RecentUser[];
  recentTickets: RecentTicket[];
  recentIntegrations: RecentIntegration[];
}

/*
 * ------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------
 */

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(
    value
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString(
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
    .split(" ")
    .slice(0, 2)
    .map(
      (item) =>
        item.charAt(0).toUpperCase()
    )
    .join("");
}

/*
 * ------------------------------------------------------
 * PAGE
 * ------------------------------------------------------
 */

export default function AdminPage() {
  const [data, setData] =
    useState<DashboardResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ----------------------------------------------------
   * LOAD DASHBOARD
   * ----------------------------------------------------
   */

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          "/api/admin/dashboard",
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
        "[ADMIN DASHBOARD]",
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

  useEffect(() => {
    loadDashboard();
  }, []);

  /*
   * ----------------------------------------------------
   * LOADING
   * ----------------------------------------------------
   */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/30">
            Administration
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Platform Overview
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Loading platform metrics...
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.025] p-6"
            >
              <div className="h-10 w-10 rounded-xl bg-white/5" />

              <div className="mt-6 h-8 w-24 rounded bg-white/5" />

              <div className="mt-2 h-4 w-28 rounded bg-white/5" />
            </div>
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

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Administration
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Platform Overview
        </h1>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-8">
          <div className="text-sm text-white/50">
            Unable to load dashboard.
          </div>

          <div className="mt-2 text-sm text-white/30">
            {error ||
              "Something went wrong."}
          </div>

          <button
            onClick={
              loadDashboard
            }
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Users",
      value:
        data.stats.totalUsers,
      description: `${formatNumber(
        data.stats.activeUsers
      )} active`,
      icon: Users,
    },
    {
      label: "Roadmaps",
      value:
        data.stats.totalRoadmaps,
      description: `${formatNumber(
        data.stats.publishedRoadmaps
      )} published`,
      icon: LayoutDashboard,
    },
    {
      label: "Lessons",
      value:
        data.stats.totalLessons,
      description: `${formatNumber(
        data.stats.publishedLessons
      )} published`,
      icon: BookOpen,
    },
    {
      label: "Integrations",
      value:
        data.stats.totalIntegrations,
      description: `${formatNumber(
        data.stats.activeIntegrations
      )} active`,
      icon: Plug,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl pb-20">
      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/30">
            Administration
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Platform Overview
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Monitor and manage the
            Codelaunch platform.
          </p>
        </div>

        <button
          onClick={
            loadDashboard
          }
          className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <Activity
            size={15}
          />

          Refresh
        </button>
      </div>

      {/* ==================================================
          STATS
          ================================================== */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon =
            stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50">
                  <Icon
                    size={18}
                  />
                </div>

                <ArrowUpRight
                  size={15}
                  className="text-white/20"
                />
              </div>

              <div className="mt-6 text-3xl font-bold">
                {formatNumber(
                  stat.value
                )}
              </div>

              <div className="mt-1 text-sm text-white/40">
                {stat.label}
              </div>

              <div className="mt-4 text-xs text-white/30">
                {stat.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================
          PLATFORM HEALTH
          ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* SYSTEM STATUS */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Platform Status
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Current platform services
              </p>
            </div>

            <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50">
              <span className="h-2 w-2 rounded-full bg-white" />
              Operational
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {[
              {
                name: "Authentication",
                description:
                  "User authentication and authorization",
              },
              {
                name: "MongoDB",
                description:
                  "Application database",
              },
              {
                name: "Learning Platform",
                description:
                  "Roadmaps, modules and lessons",
              },
              {
                name: "Admin APIs",
                description:
                  "Administration services",
              },
            ].map(
              (service) => (
                <div
                  key={
                    service.name
                  }
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div>
                    <div className="text-sm text-white/70">
                      {
                        service.name
                      }
                    </div>

                    <div className="mt-1 text-xs text-white/30">
                      {
                        service.description
                      }
                    </div>
                  </div>

                  <span className="flex items-center gap-2 text-xs text-white/40">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    Operational
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* SUPPORT */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Support Overview
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Current support workload
              </p>
            </div>

            <Headphones
              size={18}
              className="text-white/30"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-2xl font-bold">
                {formatNumber(
                  data.stats
                    .openTickets
                )}
              </div>

              <div className="mt-1 text-xs text-white/40">
                Open
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-2xl font-bold">
                {formatNumber(
                  data.stats
                    .inProgressTickets
                )}
              </div>

              <div className="mt-1 text-xs text-white/40">
                In Progress
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-2xl font-bold">
                {formatNumber(
                  data.stats
                    .resolvedTickets
                )}
              </div>

              <div className="mt-1 text-xs text-white/40">
                Resolved
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-2xl font-bold">
                {formatNumber(
                  data.stats
                    .closedTickets
                )}
              </div>

              <div className="mt-1 text-xs text-white/40">
                Closed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          USERS + INTEGRATIONS
          ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* RECENT USERS */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Recent Users
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Latest registered users
              </p>
            </div>

            <Users
              size={18}
              className="text-white/30"
            />
          </div>

          <div className="mt-6 space-y-3">
            {data.recentUsers
              .length === 0 ? (
              <div className="py-8 text-center text-sm text-white/30">
                No users found.
              </div>
            ) : (
              data.recentUsers.map(
                (user) => (
                  <div
                    key={
                      user._id
                    }
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/70">
                      {getInitials(
                        user.name
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white/70">
                        {
                          user.name
                        }
                      </div>

                      <div className="truncate text-xs text-white/30">
                        {
                          user.email
                        }
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase text-white/30">
                        {
                          user.role
                        }
                      </div>

                      <div className="mt-1 text-[10px] text-white/20">
                        {formatDate(
                          user.createdAt
                        )}
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>

        {/* INTEGRATIONS */}

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Integrations
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Integration service status
              </p>
            </div>

            <Plug
              size={18}
              className="text-white/30"
            />
          </div>

          <div className="mt-6 space-y-3">
            {data.recentIntegrations
              .length === 0 ? (
              <div className="py-8 text-center text-sm text-white/30">
                No integrations configured.
              </div>
            ) : (
              data.recentIntegrations.map(
                (integration) => (
                  <div
                    key={
                      integration._id
                    }
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                        <Plug
                          size={15}
                          className="text-white/40"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm text-white/70">
                          {
                            integration.name
                          }
                        </div>

                        <div className="mt-1 truncate text-xs text-white/30">
                          {
                            integration.provider
                          }
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 shrink-0 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs text-white/40">
                        <span className="h-2 w-2 rounded-full bg-white" />

                        {
                          integration.status
                        }
                      </div>

                      <div className="mt-1 text-[10px] text-white/20">
                        {formatDate(
                          integration.lastCheckedAt
                        )}
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* ==================================================
          RECENT SUPPORT TICKETS
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              Recent Support Tickets
            </h2>

            <p className="mt-1 text-xs text-white/30">
              Latest support activity
            </p>
          </div>

          <Headphones
            size={18}
            className="text-white/30"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          {data.recentTickets
            .length === 0 ? (
            <div className="py-10 text-center text-sm text-white/30">
              No support tickets found.
            </div>
          ) : (
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[120px_1fr_120px_120px_140px] gap-4 border-b border-white/10 pb-3 text-[10px] uppercase tracking-wider text-white/25">
                <div>
                  Ticket
                </div>

                <div>
                  Subject
                </div>

                <div>
                  Priority
                </div>

                <div>
                  Status
                </div>

                <div>
                  Updated
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {data.recentTickets.map(
                  (ticket) => (
                    <div
                      key={
                        ticket._id
                      }
                      className="grid grid-cols-[120px_1fr_120px_120px_140px] items-center gap-4 py-4"
                    >
                      <div className="text-xs text-white/40">
                        {
                          ticket.ticketNumber
                        }
                      </div>

                      <div>
                        <div className="truncate text-sm text-white/60">
                          {
                            ticket.subject
                          }
                        </div>

                        <div className="mt-1 text-xs text-white/25">
                          {
                            ticket.category
                          }
                        </div>
                      </div>

                      <div className="text-xs text-white/40">
                        {
                          ticket.priority
                        }
                      </div>

                      <div className="text-xs text-white/40">
                        {
                          ticket.status
                        }
                      </div>

                      <div className="text-xs text-white/25">
                        {formatDate(
                          ticket.updatedAt
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          FOOTER SUMMARY
          ================================================== */}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="text-xs text-white/30">
            Active Users
          </div>

          <div className="mt-2 text-2xl font-bold">
            {formatNumber(
              data.stats
                .activeUsers
            )}
          </div>

          <div className="mt-1 text-xs text-white/25">
            {formatNumber(
              data.stats
                .inactiveUsers
            )}{" "}
            inactive
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="text-xs text-white/30">
            Published Content
          </div>

          <div className="mt-2 text-2xl font-bold">
            {formatNumber(
              data.stats
                .publishedLessons
            )}
          </div>

          <div className="mt-1 text-xs text-white/25">
            lessons published
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="text-xs text-white/30">
            Support Workload
          </div>

          <div className="mt-2 text-2xl font-bold">
            {formatNumber(
              data.stats
                .openTickets +
                data.stats
                  .inProgressTickets
            )}
          </div>

          <div className="mt-1 text-xs text-white/25">
            tickets requiring attention
          </div>
        </div>
      </div>
    </div>
  );
}