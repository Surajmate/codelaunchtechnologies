"use client";

import { useEffect, useState } from "react";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Database,
  Loader2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import AnalyticsCharts from "./AnalyticsCharts";

type Range = 7 | 30 | 90 | 365;

interface AnalyticsResponse {
  success: boolean;

  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRoadmaps: number;
    totalModules: number;
    totalLessons: number;
    completedLessons: number;
  };

  quizzes: {
    attempts: number;
    passed: number;
    failed: number;
    averageScore: number;
    completionRate: number;
  };

  integrations: {
    total: number;
    active: number;
    successfulTests: number;
    failedTests: number;
    successRate: number;
  };

  platform: {
    users: number;
    roadmaps: number;
    modules: number;
    lessons: number;
    quizAttempts: number;
    completedLessons: number;
  };

  recent?: {
    users?: unknown[];
    progress?: unknown[];
    integrations?: unknown[];
  };
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
}

interface AnalyticsTrend {
  date: string;
  users: number;
  quizAttempts: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  completedLessons: number;
  progressRecords: number;
  integrationSuccess: number;
  integrationErrors: number;
  integrationAverageResponseTime: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50">
        <Icon size={18} />
      </div>

      <div className="mt-6 text-3xl font-bold">
        {value}
      </div>

      <div className="mt-1 text-sm text-white/40">
        {label}
      </div>
    </div>
  );
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value || 0);
}

export default function AnalyticsClient() {
  const [range, setRange] =
    useState<Range>(30);

  const [data, setData] =
    useState<AnalyticsResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [trends, setTrends] =
    useState<AnalyticsTrend[]>([]);

  async function loadTrends(
    selectedRange: Range
    ) {
    try {
        const response = await fetch(
        `/api/admin/analytics/trends?range=${selectedRange}`,
        {
            method: "GET",
            cache: "no-store",
        }
        );

        const result =
        await response.json();

        if (
        !response.ok ||
        !result.success
        ) {
        throw new Error(
            result.message ||
            "Unable to load analytics trends"
        );
        }

        setTrends(
        Array.isArray(result.trends)
            ? result.trends
            : []
        );
    } catch (error) {
        console.error(
        "[ANALYTICS TRENDS CLIENT] ERROR:",
        error
        );

        setTrends([]);
    }
    }

  async function loadAnalytics(
    selectedRange: Range
  ) {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/admin/analytics?range=${selectedRange}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to load analytics"
        );
      }

      setData(result);
    } catch (err) {
      console.error(
        "[ANALYTICS CLIENT] ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load analytics"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics(range);
    loadTrends(range);
  }, [range]);

  return (
    <div className="space-y-6">
      {/* DATE FILTER */}

      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90, 365].map(
          (item) => {
            const selected =
              range === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setRange(
                    item as Range
                  )
                }
                disabled={loading}
                className={`rounded-lg border px-4 py-2 text-xs transition ${
                  selected
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-white/[0.02] text-white/40 hover:bg-white/5 hover:text-white/70"
                } ${
                  loading
                    ? "cursor-wait opacity-60"
                    : ""
                }`}
              >
                {item === 365
                  ? "12 Months"
                  : `${item} Days`}
              </button>
            );
          }
        )}
      </div>

      {/* LOADING */}

      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-white/40">
          <Loader2
            size={14}
            className="animate-spin"
          />

          Loading analytics...
        </div>
      )}

      {/* ERROR */}

      {error && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-sm text-red-300">
            Unable to load analytics
          </div>

          <div className="mt-1 text-xs text-red-300/60">
            {error}
          </div>

          <button
            type="button"
            onClick={() =>
              loadAnalytics(range)
            }
            className="mt-3 rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* ANALYTICS */}

      {data && !error && (
        <>

          {/* KPI */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Users"
              value={formatNumber(
                data.overview
                  .totalUsers
              )}
              icon={Users}
            />

            <StatCard
              label="Active Users"
              value={formatNumber(
                data.overview
                  .activeUsers
              )}
              icon={Activity}
            />

            <StatCard
              label="Quiz Attempts"
              value={formatNumber(
                data.quizzes.attempts
              )}
              icon={BarChart3}
            />

            <StatCard
              label="Completion Rate"
              value={`${data.quizzes.completionRate}%`}
              icon={CheckCircle2}
            />
          </div>

          {/* PLATFORM + QUIZ */}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* PLATFORM */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Platform Activity
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Activity during the selected
                    period
                  </p>
                </div>

                <Activity
                  size={18}
                  className="text-white/30"
                />
              </div>

              <div className="mt-8 space-y-5">
                <MetricRow
                  label="Users"
                  value={data.platform.users}
                />

                <MetricRow
                  label="Roadmaps"
                  value={
                    data.platform.roadmaps
                  }
                />

                <MetricRow
                  label="Modules"
                  value={
                    data.platform.modules
                  }
                />

                <MetricRow
                  label="Lessons"
                  value={
                    data.platform.lessons
                  }
                />

                <MetricRow
                  label="Quiz Attempts"
                  value={
                    data.platform
                      .quizAttempts
                  }
                />

                <MetricRow
                  label="Completed Lessons"
                  value={
                    data.platform
                      .completedLessons
                  }
                />
              </div>
            </div>

            {/* QUIZ */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Quiz Performance
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Learner quiz performance
                  </p>
                </div>

                <BarChart3
                  size={18}
                  className="text-white/30"
                />
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <MetricCard
                  label="Passed"
                  value={
                    data.quizzes.passed
                  }
                  icon={CheckCircle2}
                />

                <MetricCard
                  label="Failed"
                  value={
                    data.quizzes.failed
                  }
                  icon={XCircle}
                />

                <MetricCard
                  label="Average Score"
                  value={`${data.quizzes.averageScore}%`}
                  icon={TrendingUp}
                />

                <MetricCard
                  label="Attempts"
                  value={
                    data.quizzes.attempts
                  }
                  icon={BarChart3}
                />
              </div>
            </div>
          </div>

          {/* INTEGRATIONS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  Integration Analytics
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Integration health during the
                  selected period
                </p>
              </div>

              <Database
                size={18}
                className="text-white/30"
              />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard
                label="Total"
                value={
                  data.integrations.total
                }
              />

              <MetricCard
                label="Active"
                value={
                  data.integrations.active
                }
              />

              <MetricCard
                label="Successful Tests"
                value={
                  data.integrations
                    .successfulTests
                }
                icon={CheckCircle2}
              />

              <MetricCard
                label="Failed Tests"
                value={
                  data.integrations
                    .failedTests
                }
                icon={XCircle}
              />

              <MetricCard
                label="Success Rate"
                value={`${data.integrations.successRate}%`}
                icon={TrendingUp}
              />
            </div>
          </div>

          {/* LEARNING SUMMARY */}

          <div className="grid gap-6 lg:grid-cols-3">
            <SummaryCard
              title="Roadmaps"
              subtitle="Available roadmaps"
              value={
                data.overview
                  .totalRoadmaps
              }
              icon={Database}
            />

            <SummaryCard
              title="Lessons"
              subtitle="Total platform lessons"
              value={
                data.overview
                  .totalLessons
              }
              icon={BarChart3}
            />

            <SummaryCard
              title="Completed"
              subtitle="Lessons completed"
              value={
                data.overview
                  .completedLessons
              }
              icon={CheckCircle2}
            />
          </div>

            {/* ANALYTICS CHARTS */}

            <div className="mt-8">
                <AnalyticsCharts
                    trends={trends}
                />
            </div>
        </>
      )}
    </div>
  );
}

/*
 * ======================================================
 * METRIC ROW
 * ======================================================
 */

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/45">
        {label}
      </span>

      <span className="text-sm font-medium text-white/70">
        {formatNumber(value)}
      </span>
    </div>
  );
}

/*
 * ======================================================
 * METRIC CARD
 * ======================================================
 */

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-xs text-white/30">
        {Icon && <Icon size={14} />}

        {label}
      </div>

      <div className="mt-3 text-2xl font-semibold">
        {typeof value === "number"
          ? formatNumber(value)
          : value}
      </div>
    </div>
  );
}

/*
 * ======================================================
 * SUMMARY CARD
 * ======================================================
 */

function SummaryCard({
  title,
  subtitle,
  value,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
          <Icon
            size={16}
            className="text-white/40"
          />
        </div>

        <div>
          <h2 className="font-semibold">
            {title}
          </h2>

          <p className="text-xs text-white/25">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-6 text-3xl font-bold">
        {formatNumber(value)}
      </div>
    </div>
  );
}