"use client";

import { useState } from "react";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  XCircle,
} from "lucide-react";

interface Trend {
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

interface AnalyticsChartsProps {
  trends: Trend[];
}

/*
 * ======================================================
 * HELPERS
 * ======================================================
 */

function numericValue(
  value: unknown
): number {
  const number =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  ).format(
    numericValue(value)
  );
}

function formatDate(
  date: string
): string {
  if (!date) {
    return "Unknown date";
  }

  const value =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return date;
  }

  return value.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatShortDate(
  date: string
): string {
  if (!date) {
    return "—";
  }

  const value =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      value.getTime()
    )
  ) {
    return date;
  }

  return value.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

/*
 * ======================================================
 * NORMALIZE DATA
 * ======================================================
 *
 * This protects the charts if the API returns:
 *
 * "5"
 *
 * instead of:
 *
 * 5
 *
 * ======================================================
 */

function normalizeTrends(
  trends: Trend[]
): Trend[] {
  return trends
    .map((item) => ({
      date:
        String(
          item?.date || ""
        ),

      users:
        numericValue(
          item?.users
        ),

      quizAttempts:
        numericValue(
          item?.quizAttempts
        ),

      quizzesCompleted:
        numericValue(
          item?.quizzesCompleted
        ),

      averageQuizScore:
        numericValue(
          item?.averageQuizScore
        ),

      completedLessons:
        numericValue(
          item?.completedLessons
        ),

      progressRecords:
        numericValue(
          item?.progressRecords
        ),

      integrationSuccess:
        numericValue(
          item?.integrationSuccess
        ),

      integrationErrors:
        numericValue(
          item?.integrationErrors
        ),

      integrationAverageResponseTime:
        numericValue(
          item
            ?.integrationAverageResponseTime
        ),
    }))
    .filter(
      (item) =>
        Boolean(item.date)
    );
}

/*
 * ======================================================
 * NICE MAX VALUE
 * ======================================================
 */

function getNiceMax(
  values: number[],
  forcedMax?: number
): number {
  const actualMax =
    Math.max(
      ...values.map(
        numericValue
      ),
      0
    );

  if (
    forcedMax !== undefined
  ) {
    return Math.max(
      forcedMax,
      1
    );
  }

  if (actualMax <= 0) {
    return 1;
  }

  /*
   * Give the chart a little
   * breathing room above the
   * highest point.
   */

  if (actualMax <= 5) {
    return 5;
  }

  if (actualMax <= 10) {
    return 10;
  }

  if (actualMax <= 25) {
    return 25;
  }

  if (actualMax <= 50) {
    return 50;
  }

  if (actualMax <= 100) {
    return 100;
  }

  const magnitude =
    Math.pow(
      10,
      Math.floor(
        Math.log10(
          actualMax
        )
      )
    );

  return (
    Math.ceil(
      (actualMax * 1.1) /
        magnitude
    ) *
    magnitude
  );
}

/*
 * ======================================================
 * LINE CHART
 * ======================================================
 */

function LineChart({
  data,
  dataKey,
  label,
  unit = "",
  fixedMax,
}: {
  data: Trend[];
  dataKey: keyof Trend;
  label: string;
  unit?: string;
  fixedMax?: number;
}) {
  const [
    activeIndex,
    setActiveIndex,
  ] = useState<number | null>(
    null
  );

  const values =
    data.map((item) =>
      numericValue(
        item[dataKey]
      )
    );

  const max =
    getNiceMax(
      values,
      fixedMax
    );

  const width = 1000;
  const height = 330;

  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const points = data.map(
    (item, index) => {
      const value =
        numericValue(
          item[dataKey]
        );

      const x =
        data.length === 1
          ? paddingLeft +
            chartWidth / 2
          : paddingLeft +
            (index /
              (data.length - 1)) *
              chartWidth;

      const y =
        paddingTop +
        chartHeight -
        (value / max) *
          chartHeight;

      return {
        x,
        y,
        value,
        date: item.date,
      };
    }
  );

  const path =
    points.length > 0
      ? points
          .map(
            (
              point,
              index
            ) =>
              `${
                index === 0
                  ? "M"
                  : "L"
              } ${point.x} ${point.y}`
          )
          .join(" ")
      : "";

  const areaPath =
    points.length > 0
      ? `${path} L ${
          points[
            points.length - 1
          ].x
        } ${
          paddingTop +
          chartHeight
        } L ${
          points[0].x
        } ${
          paddingTop +
          chartHeight
        } Z`
      : "";

  const activePoint =
    activeIndex !== null
      ? points[activeIndex]
      : null;

  /*
   * --------------------------------------------------
   * GRID LABELS
   * --------------------------------------------------
   */

  const gridLines = [
    {
      ratio: 0,
      label: max,
    },
    {
      ratio: 0.25,
      label: max * 0.75,
    },
    {
      ratio: 0.5,
      label: max * 0.5,
    },
    {
      ratio: 0.75,
      label: max * 0.25,
    },
    {
      ratio: 1,
      label: 0,
    },
  ];

  /*
   * --------------------------------------------------
   * TOOLTIP POSITION
   * --------------------------------------------------
   */

  let tooltipLeft = 50;

  if (activePoint) {
    tooltipLeft =
      (activePoint.x /
        width) *
      100;

    if (
      tooltipLeft < 15
    ) {
      tooltipLeft = 15;
    }

    if (
      tooltipLeft > 85
    ) {
      tooltipLeft = 85;
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs text-white/30">
          {label}
        </div>

        <div className="text-[10px] text-white/20">
          Max:{" "}
          {formatNumber(max)}
          {unit}
        </div>
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[300px] w-full overflow-visible"
          role="img"
          aria-label={label}
        >
          {/* ================================================= */}
          {/* GRID */}
          {/* ================================================= */}

          {gridLines.map(
            (
              grid,
              index
            ) => {
              const y =
                paddingTop +
                grid.ratio *
                  chartHeight;

              return (
                <g
                  key={index}
                >
                  <line
                    x1={
                      paddingLeft
                    }
                    x2={
                      width -
                      paddingRight
                    }
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    className="text-white/5"
                  />

                  <text
                    x={
                      paddingLeft -
                      10
                    }
                    y={
                      y + 4
                    }
                    textAnchor="end"
                    className="fill-white/20 text-[11px]"
                  >
                    {formatNumber(
                      grid.label
                    )}
                    {unit}
                  </text>
                </g>
              );
            }
          )}

          {/* ================================================= */}
          {/* AREA */}
          {/* ================================================= */}

          {areaPath && (
            <path
              d={areaPath}
              fill="currentColor"
              className="text-white/[0.025]"
            />
          )}

          {/* ================================================= */}
          {/* LINE */}
          {/* ================================================= */}

          {path && (
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/70"
            />
          )}

          {/* ================================================= */}
          {/* POINTS */}
          {/* ================================================= */}

          {points.map(
            (
              point,
              index
            ) => (
              <g
                key={`${point.date}-${index}`}
              >
                {/* Visible point */}

                <circle
                  cx={point.x}
                  cy={point.y}
                  r={
                    activeIndex ===
                    index
                      ? 6
                      : 4
                  }
                  fill="currentColor"
                  className="text-white"
                />

                {/* Invisible large hover target */}

                <circle
                  cx={point.x}
                  cy={point.y}
                  r="16"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setActiveIndex(
                      index
                    )
                  }
                  onMouseLeave={() =>
                    setActiveIndex(
                      null
                    )
                  }
                  onClick={() =>
                    setActiveIndex(
                      activeIndex ===
                        index
                        ? null
                        : index
                    )
                  }
                />
              </g>
            )
          )}
        </svg>

        {/* ================================================= */}
        {/* TOOLTIP */}
        {/* ================================================= */}

        {activePoint && (
          <div
            className="pointer-events-none absolute top-2 z-20 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b0f1c] px-4 py-3 shadow-2xl"
            style={{
              left: `${tooltipLeft}%`,
            }}
          >
            <div className="whitespace-nowrap text-[10px] text-white/35">
              {formatDate(
                activePoint.date
              )}
            </div>

            <div className="mt-1 whitespace-nowrap text-sm font-semibold text-white">
              {label}:{" "}
              {formatNumber(
                activePoint.value
              )}
              {unit}
            </div>
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* X AXIS */}
      {/* ================================================= */}

      {points.length > 0 && (
        <div className="mt-1 flex justify-between px-1 text-[10px] text-white/20">
          <span>
            {formatShortDate(
              points[0].date
            )}
          </span>

          {points.length > 2 && (
            <span>
              {formatShortDate(
                points[
                  Math.floor(
                    points.length /
                      2
                  )
                ].date
              )}
            </span>
          )}

          {points.length > 1 && (
            <span>
              {formatShortDate(
                points[
                  points.length -
                    1
                ].date
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/*
 * ======================================================
 * INTEGRATION HEALTH BAR CHART
 * ======================================================
 */

function IntegrationHealthChart({
  data,
}: {
  data: Trend[];
}) {
  const [
    activeIndex,
    setActiveIndex,
  ] = useState<number | null>(
    null
  );

  const displayData =
    data.length > 31
      ? data.filter(
          (_, index) =>
            index %
              Math.ceil(
                data.length /
                  31
              ) ===
            0
        )
      : data;

  const max =
    getNiceMax(
      displayData.map(
        (item) =>
          numericValue(
            item.integrationSuccess
          ) +
          numericValue(
            item.integrationErrors
          )
      )
    );

  const activeItem =
    activeIndex !== null
      ? displayData[
          activeIndex
        ]
      : null;

  return (
    <div className="mt-6">
      {/* LEGEND */}

      <div className="mb-5 flex flex-wrap items-center gap-5 text-xs text-white/30">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/70" />
          Successful
        </span>

        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/20" />
          Errors
        </span>
      </div>

      {/* CHART */}

      <div className="relative">
        <div className="flex h-[260px] items-end gap-1 border-b border-white/5 px-1">
          {displayData.map(
            (
              item,
              index
            ) => {
              const success =
                numericValue(
                  item.integrationSuccess
                );

              const errors =
                numericValue(
                  item.integrationErrors
                );

              const total =
                success +
                errors;

              const successHeight =
                total > 0
                  ? Math.max(
                      (success /
                        max) *
                        220,
                      success >
                        0
                        ? 3
                        : 0
                    )
                  : 0;

              const errorHeight =
                total > 0
                  ? Math.max(
                      (errors /
                        max) *
                        220,
                      errors >
                        0
                        ? 3
                        : 0
                    )
                  : 0;

              const isActive =
                activeIndex ===
                index;

              return (
                <div
                  key={`${item.date}-${index}`}
                  className="relative flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center"
                  onMouseEnter={() =>
                    setActiveIndex(
                      index
                    )
                  }
                  onMouseLeave={() =>
                    setActiveIndex(
                      null
                    )
                  }
                  onClick={() =>
                    setActiveIndex(
                      isActive
                        ? null
                        : index
                    )
                  }
                >
                  {/* ERROR */}

                  <div
                    className={`w-full max-w-5 transition-all ${
                      isActive
                        ? "bg-white/35"
                        : "bg-white/20"
                    }`}
                    style={{
                      height: `${errorHeight}px`,
                    }}
                  />

                  {/* SUCCESS */}

                  <div
                    className={`w-full max-w-5 transition-all ${
                      isActive
                        ? "bg-white"
                        : "bg-white/70"
                    }`}
                    style={{
                      height: `${successHeight}px`,
                    }}
                  />
                </div>
              );
            }
          )}
        </div>

        {/* ================================================= */}
        {/* TOOLTIP */}
        {/* ================================================= */}

        {activeItem && (
          <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b0f1c] px-4 py-3 shadow-2xl">
            <div className="whitespace-nowrap text-[10px] text-white/35">
              {formatDate(
                activeItem.date
              )}
            </div>

            <div className="mt-2 space-y-1 text-xs">
              <div className="whitespace-nowrap text-white/70">
                Successful:{" "}
                <span className="font-semibold text-white">
                  {formatNumber(
                    activeItem.integrationSuccess
                  )}
                </span>
              </div>

              <div className="whitespace-nowrap text-white/40">
                Errors:{" "}
                <span className="font-semibold text-white/70">
                  {formatNumber(
                    activeItem.integrationErrors
                  )}
                </span>
              </div>

              <div className="border-t border-white/10 pt-1 text-white/30">
                Total:{" "}
                <span className="text-white/60">
                  {formatNumber(
                    numericValue(
                      activeItem.integrationSuccess
                    ) +
                      numericValue(
                        activeItem.integrationErrors
                      )
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* X AXIS */}

      {displayData.length > 0 && (
        <div className="mt-2 flex justify-between px-1 text-[10px] text-white/20">
          <span>
            {formatShortDate(
              displayData[0]
                .date
            )}
          </span>

          {displayData.length >
            2 && (
            <span>
              {formatShortDate(
                displayData[
                  Math.floor(
                    displayData.length /
                      2
                  )
                ].date
              )}
            </span>
          )}

          {displayData.length >
            1 && (
            <span>
              {formatShortDate(
                displayData[
                  displayData.length -
                    1
                ].date
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/*
 * ======================================================
 * EMPTY CHART
 * ======================================================
 */

function EmptyChart({
  message =
    "No activity recorded during this period.",
}: {
  message?: string;
}) {
  return (
    <div className="mt-6 flex h-[300px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
      <div className="text-center">
        <BarChart3
          size={24}
          className="mx-auto text-white/15"
        />

        <p className="mt-3 text-xs text-white/30">
          {message}
        </p>
      </div>
    </div>
  );
}

/*
 * ======================================================
 * CHART CARD
 * ======================================================
 */

function ChartCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-white/30">
          {icon}
        </div>

        <div>
          <h2 className="font-semibold">
            {title}
          </h2>

          <p className="mt-1 text-xs text-white/30">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

/*
 * ======================================================
 * MAIN COMPONENT
 * ======================================================
 */

export default function AnalyticsCharts({
  trends,
}: AnalyticsChartsProps) {
  const normalizedTrends =
    normalizeTrends(
      trends
    );

  if (
    normalizedTrends.length ===
    0
  ) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center">
        <BarChart3
          size={24}
          className="mx-auto text-white/20"
        />

        <div className="mt-3 text-sm text-white/40">
          No analytics data available
        </div>

        <div className="mt-1 text-xs text-white/20">
          Activity will appear here once
          the platform starts receiving
          data.
        </div>
      </div>
    );
  }

  /*
   * ====================================================
   * CHECK WHETHER A PARTICULAR METRIC
   * HAS ANY DATA
   * ====================================================
   */

  const hasUsers =
    normalizedTrends.some(
      (item) =>
        item.users > 0
    );

  const hasQuizAttempts =
    normalizedTrends.some(
      (item) =>
        item.quizAttempts >
        0
    );

  const hasCompletedLessons =
    normalizedTrends.some(
      (item) =>
        item.completedLessons >
        0
    );

  const hasQuizScore =
    normalizedTrends.some(
      (item) =>
        item.averageQuizScore >
        0
    );

  const hasIntegrationHealth =
    normalizedTrends.some(
      (item) =>
        item.integrationSuccess >
          0 ||
        item.integrationErrors >
          0
    );

  const hasResponseTime =
    normalizedTrends.some(
      (item) =>
        item.integrationAverageResponseTime >
        0
    );

  return (
    <div className="space-y-6">
      {/* ================================================= */}
      {/* USER GROWTH */}
      {/* ================================================= */}

      <ChartCard
        title="User Growth"
        description="New users registered during the selected period"
        icon={
          <TrendingUp
            size={18}
          />
        }
      >
        {hasUsers ? (
          <LineChart
            data={
              normalizedTrends
            }
            dataKey="users"
            label="New Users"
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      {/* ================================================= */}
      {/* LEARNING ACTIVITY */}
      {/* ================================================= */}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Quiz Attempts"
          description="Daily quiz activity"
          icon={
            <BarChart3
              size={18}
            />
          }
        >
          {hasQuizAttempts ? (
            <LineChart
              data={
                normalizedTrends
              }
              dataKey="quizAttempts"
              label="Attempts"
            />
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="Lesson Completion"
          description="Lessons completed by users"
          icon={
            <CheckCircle2
              size={18}
            />
          }
        >
          {hasCompletedLessons ? (
            <LineChart
              data={
                normalizedTrends
              }
              dataKey="completedLessons"
              label="Completed Lessons"
            />
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      {/* ================================================= */}
      {/* QUIZ SCORE */}
      {/* ================================================= */}

      <ChartCard
        title="Average Quiz Score"
        description="Average learner score per day"
        icon={
          <Activity
            size={18}
          />
        }
      >
        {hasQuizScore ? (
          <LineChart
            data={
              normalizedTrends
            }
            dataKey="averageQuizScore"
            label="Average Score"
            unit="%"
            fixedMax={100}
          />
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      {/* ================================================= */}
      {/* INTEGRATIONS */}
      {/* ================================================= */}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Integration Health"
          description="Successful vs failed integration operations"
          icon={
            <CheckCircle2
              size={18}
            />
          }
        >
          {hasIntegrationHealth ? (
            <IntegrationHealthChart
              data={
                normalizedTrends
              }
            />
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="Integration Response Time"
          description="Average response time in milliseconds"
          icon={
            <XCircle
              size={18}
            />
          }
        >
          {hasResponseTime ? (
            <LineChart
              data={
                normalizedTrends
              }
              dataKey="integrationAverageResponseTime"
              label="Response Time"
              unit=" ms"
            />
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>
    </div>
  );
}