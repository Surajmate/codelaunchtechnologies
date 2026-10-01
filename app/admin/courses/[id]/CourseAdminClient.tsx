"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Course {
  _id: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;

  thumbnail?: string;
  bannerImage?: string;

  category?: string;
  subCategory?: string;

  level?: string;
  language?: string;

  instructor?: {
    _id: string;
    name?: string;
    email?: string;
  } | null;

  isFree?: boolean;
  price?: number;
  discountPrice?: number;
  currency?: string;

  durationMinutes?: number;

  featured?: boolean;

  certificateEnabled?: boolean;
  certificateName?: string;

  requirements?: string[];
  learningOutcomes?: string[];
  tags?: string[];

  metaTitle?: string;
  metaDescription?: string;

  status?: string;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

interface CourseStats {
  students?: number;
  enrolled?: number;
  completed?: number;
  completionRate?: number;
  lessons?: number;
  modules?: number;
  averageProgress?: number;
}

interface Props {
  courseId: string;
}

export default function CourseAdminClient({
  courseId,
}: Props) {
  const router = useRouter();

  const [course, setCourse] =
    useState<Course | null>(null);

  const [stats, setStats] =
    useState<CourseStats | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  /*
   * --------------------------------------------------------
   * FETCH COURSE
   * --------------------------------------------------------
   */

  const loadCourse =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/admin/courses/${courseId}`,
            {
              method: "GET",
              cache: "no-store",
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
              "Unable to load course."
          );
        }

        setCourse(
          data.course ||
            data.data ||
            null
        );

        if (
          data.stats
        ) {
          setStats(
            data.stats
          );
        }
      } catch (err: any) {
        console.error(
          "Load course error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load course."
        );
      } finally {
        setLoading(false);
      }
    }, [courseId]);

  /*
   * --------------------------------------------------------
   * INITIAL LOAD
   * --------------------------------------------------------
   */

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  /*
   * --------------------------------------------------------
   * UPDATE COURSE
   * --------------------------------------------------------
   */

  async function updateCourse(
    updates: Record<
      string,
      any
    >,
    successMessage: string
  ) {
    if (!course) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/courses/${courseId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              updates
            ),
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
            "Unable to update course."
        );
      }

      setCourse(
        data.course ||
          data.data ||
          {
            ...course,
            ...updates,
          }
      );

      setSuccess(
        successMessage
      );

      router.refresh();
    } catch (err: any) {
      console.error(
        "Update course error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update course."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------------------------------
   * PUBLISH
   * --------------------------------------------------------
   */

  async function publishCourse() {
    await updateCourse(
      {
        status: "PUBLISHED",
      },
      "Course published successfully."
    );
  }

  /*
   * --------------------------------------------------------
   * UNPUBLISH
   * --------------------------------------------------------
   */

  async function unpublishCourse() {
    await updateCourse(
      {
        status: "DRAFT",
      },
      "Course moved back to draft."
    );
  }

  /*
   * --------------------------------------------------------
   * FEATURED
   * --------------------------------------------------------
   */

  async function toggleFeatured() {
    await updateCourse(
      {
        featured:
          !course?.featured,
      },
      course?.featured
        ? "Course removed from featured courses."
        : "Course marked as featured."
    );
  }

  /*
   * --------------------------------------------------------
   * DELETE
   * --------------------------------------------------------
   */

  async function deleteCourse() {
    try {
      setDeleting(true);
      setError("");

      const response =
        await fetch(
          `/api/admin/courses/${courseId}`,
          {
            method: "DELETE",
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
            "Unable to delete course."
        );
      }

      router.push(
        "/admin/courses"
      );

      router.refresh();
    } catch (err: any) {
      console.error(
        "Delete course error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete course."
      );

      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  /*
   * --------------------------------------------------------
   * LOADING
   * --------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-slate-200" />

            <div className="h-48 rounded-2xl bg-slate-200" />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-2xl bg-slate-200"
                />
              ))}
            </div>

            <div className="h-96 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------------
   * NOT FOUND
   * --------------------------------------------------------
   */

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="text-6xl">
            📚
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Course not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The course may have been
            deleted or the ID is
            invalid.
          </p>

          <Link
            href="/admin/courses"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const isPublished =
    String(
      course.status ||
        ""
    ).toUpperCase() ===
    "PUBLISHED";

  const price =
    Number(
      course.price || 0
    );

  const discountPrice =
    Number(
      course.discountPrice ||
        0
    );

  const displayPrice =
    course.isFree
      ? "Free"
      : discountPrice > 0 &&
        discountPrice <
          price
      ? `${course.currency || "INR"} ${discountPrice.toLocaleString(
          "en-IN"
        )}`
      : `${course.currency || "INR"} ${price.toLocaleString(
          "en-IN"
        )}`;

  const duration =
    formatDuration(
      course.durationMinutes
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            BREADCRUMB
        ================================================== */}

        <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/admin/courses"
            className="hover:text-slate-900"
          >
            Courses
          </Link>

          <span>
            /
          </span>

          <span className="text-slate-700">
            {course.title}
          </span>
        </div>

        {/* ==================================================
            ALERTS
        ================================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* ==================================================
            HEADER
        ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-52 bg-slate-900 sm:h-64">
            {course.bannerImage ? (
              <img
                src={
                  course.bannerImage
                }
                alt={
                  course.title
                }
                className="h-full w-full object-cover opacity-70"
              />
            ) : course.thumbnail ? (
              <img
                src={
                  course.thumbnail
                }
                alt={
                  course.title
                }
                className="h-full w-full object-cover opacity-60"
              />
            ) : null}

            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge
                  status={
                    course.status
                  }
                />

                {course.featured && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    ⭐ Featured
                  </span>
                )}

                {course.isFree && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Free
                  </span>
                )}
              </div>

              <h1 className="max-w-4xl text-2xl font-bold text-white sm:text-3xl">
                {course.title}
              </h1>

              {course.shortDescription && (
                <p className="mt-2 max-w-3xl text-sm text-white/80 sm:text-base">
                  {
                    course.shortDescription
                  }
                </p>
              )}
            </div>
          </div>

          {/* ACTION BAR */}

          <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/courses/${courseId}/edit`}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                ✏️ Edit Course
              </Link>

              {!isPublished ? (
                <button
                  type="button"
                  onClick={
                    publishCourse
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving
                    ? "Updating..."
                    : "🚀 Publish"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    unpublishCourse
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Unpublish
                </button>
              )}

              <button
                type="button"
                onClick={
                  toggleFeatured
                }
                disabled={
                  saving
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {course.featured
                  ? "Remove Featured"
                  : "⭐ Feature"}
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowDeleteModal(
                  true
                )
              }
              className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              🗑 Delete
            </button>
          </div>
        </section>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon="👥"
            label="Enrolled"
            value={
              stats?.enrolled ??
              stats?.students ??
              0
            }
          />

          <StatCard
            icon="📚"
            label="Modules"
            value={
              stats?.modules ??
              0
            }
          />

          <StatCard
            icon="🎬"
            label="Lessons"
            value={
              stats?.lessons ??
              0
            }
          />

          <StatCard
            icon="📈"
            label="Completion"
            value={`${stats?.completionRate ?? 0}%`}
          />
        </div>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT */}

          <div className="space-y-6 lg:col-span-2">
            {/* DESCRIPTION */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionTitle
                title="Course Description"
                icon="📝"
              />

              <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {course.description ||
                  "No description available."}
              </div>
            </section>

            {/* LEARNING OUTCOMES */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionTitle
                title="Learning Outcomes"
                icon="🎯"
              />

              {course.learningOutcomes &&
              course.learningOutcomes
                .length >
                0 ? (
                <ul className="mt-5 space-y-3">
                  {course.learningOutcomes.map(
                    (
                      item,
                      index
                    ) => (
                      <li
                        key={
                          index
                        }
                        className="flex gap-3 text-sm text-slate-600"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">
                          ✓
                        </span>

                        <span>
                          {item}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <EmptyText text="No learning outcomes added." />
              )}
            </section>

            {/* REQUIREMENTS */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionTitle
                title="Requirements"
                icon="📋"
              />

              {course.requirements &&
              course.requirements
                .length >
                0 ? (
                <ul className="mt-5 space-y-3">
                  {course.requirements.map(
                    (
                      item,
                      index
                    ) => (
                      <li
                        key={
                          index
                        }
                        className="flex gap-3 text-sm text-slate-600"
                      >
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" />

                        <span>
                          {item}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <EmptyText text="No requirements added." />
              )}
            </section>

            {/* TAGS */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionTitle
                title="Tags"
                icon="🏷️"
              />

              {course.tags &&
              course.tags.length >
                0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {course.tags.map(
                    (
                      tag,
                      index
                    ) => (
                      <span
                        key={
                          `${tag}-${index}`
                        }
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        #{tag}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <EmptyText text="No tags added." />
              )}
            </section>
          </div>

          {/* RIGHT */}

          <div className="space-y-6">
            {/* COURSE DETAILS */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                title="Course Details"
                icon="ℹ️"
              />

              <div className="mt-5 space-y-4">
                <DetailRow
                  label="Category"
                  value={
                    course.category ||
                    "—"
                  }
                />

                <DetailRow
                  label="Sub Category"
                  value={
                    course.subCategory ||
                    "—"
                  }
                />

                <DetailRow
                  label="Level"
                  value={
                    formatLabel(
                      course.level
                    )
                  }
                />

                <DetailRow
                  label="Language"
                  value={
                    course.language ||
                    "—"
                  }
                />

                <DetailRow
                  label="Duration"
                  value={
                    duration
                  }
                />

                <DetailRow
                  label="Price"
                  value={
                    displayPrice
                  }
                />

                <DetailRow
                  label="Slug"
                  value={
                    course.slug ||
                    "—"
                  }
                />
              </div>
            </section>

            {/* INSTRUCTOR */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                title="Instructor"
                icon="👨‍🏫"
              />

              {course.instructor ? (
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg">
                    👤
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {course
                        .instructor
                        .name ||
                        "Unnamed User"}
                    </p>

                    {course
                      .instructor
                      .email && (
                      <p className="truncate text-xs text-slate-500">
                        {
                          course
                            .instructor
                            .email
                        }
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyText text="No instructor assigned." />
              )}
            </section>

            {/* CERTIFICATE */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                title="Certificate"
                icon="🏆"
              />

              <div className="mt-5">
                {course.certificateEnabled ? (
                  <>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-800">
                        Certificate Enabled
                      </p>

                      <p className="mt-1 text-xs text-emerald-700">
                        {course.certificateName ||
                          "Course Completion Certificate"}
                      </p>
                    </div>

                    <Link
                      href="/admin/certificates"
                      className="mt-3 block rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Manage Certificates
                    </Link>
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">
                      Certificate Disabled
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Students will not
                      receive a certificate
                      for this course.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* SEO */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionTitle
                title="SEO"
                icon="🔎"
              />

              <div className="mt-5 space-y-4">
                <DetailRow
                  label="Meta Title"
                  value={
                    course.metaTitle ||
                    "—"
                  }
                />

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Meta Description
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {course.metaDescription ||
                      "—"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ==================================================
            DATES
        ================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <DetailRow
              label="Created"
              value={formatDate(
                course.createdAt
              )}
            />

            <DetailRow
              label="Last Updated"
              value={formatDate(
                course.updatedAt
              )}
            />
          </div>
        </section>
      </div>

      {/* ====================================================
          DELETE MODAL
      ==================================================== */}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
              🗑
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Delete Course?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to delete{" "}
              <strong className="text-slate-700">
                {course.title}
              </strong>
              . This action cannot
              be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowDeleteModal(
                    false
                  )
                }
                disabled={
                  deleting
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  deleteCourse
                }
                disabled={
                  deleting
                }
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * ============================================================
 * STAT CARD
 * ============================================================
 */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-0.5 text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * SECTION TITLE
 * ============================================================
 */

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span>
        {icon}
      </span>

      <h2 className="text-base font-bold text-slate-900">
        {title}
      </h2>
    </div>
  );
}

/*
 * ============================================================
 * DETAIL ROW
 * ============================================================
 */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * STATUS BADGE
 * ============================================================
 */

function StatusBadge({
  status,
}: {
  status?: string;
}) {
  const normalized =
    String(
      status || "DRAFT"
    ).toUpperCase();

  if (
    normalized ===
    "PUBLISHED"
  ) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        ● Published
      </span>
    );
  }

  if (
    normalized ===
    "ARCHIVED"
  ) {
    return (
      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
        Archived
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      ● Draft
    </span>
  );
}

/*
 * ============================================================
 * EMPTY TEXT
 * ============================================================
 */

function EmptyText({
  text,
}: {
  text: string;
}) {
  return (
    <p className="mt-4 text-sm text-slate-400">
      {text}
    </p>
  );
}

/*
 * ============================================================
 * FORMAT LABEL
 * ============================================================
 */

function formatLabel(
  value?: string
) {
  if (!value) return "—";

  return value
    .replace(
      /_/g,
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

/*
 * ============================================================
 * FORMAT DURATION
 * ============================================================
 */

function formatDuration(
  minutes?: number
) {
  const value =
    Number(minutes || 0);

  if (!value) {
    return "—";
  }

  const hours =
    Math.floor(
      value / 60
    );

  const remaining =
    value % 60;

  if (hours === 0) {
    return `${remaining} min`;
  }

  if (
    remaining === 0
  ) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
}

/*
 * ============================================================
 * FORMAT DATE
 * ============================================================
 */

function formatDate(
  value?: string
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

  return date.toLocaleString(
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