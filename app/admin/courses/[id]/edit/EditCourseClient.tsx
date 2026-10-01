"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CourseLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "ALL_LEVELS";

interface User {
  _id: string;
  name?: string;
  email?: string;
}

interface Course {
  _id: string;

  title?: string;
  slug?: string;

  shortDescription?: string;
  description?: string;

  thumbnail?: string;
  bannerImage?: string;

  category?: string;
  subCategory?: string;

  level?: CourseLevel;
  language?: string;

  instructor?: string | User | null;

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

  [key: string]: any;
}

interface Props {
  courseId: string;
}

const DEFAULT_COURSE: Course = {
  _id: "",

  title: "",
  slug: "",

  shortDescription: "",
  description: "",

  thumbnail: "",
  bannerImage: "",

  category: "",
  subCategory: "",

  level: "BEGINNER",
  language: "English",

  instructor: "",

  isFree: true,
  price: 0,
  discountPrice: 0,
  currency: "INR",

  durationMinutes: 0,

  featured: false,

  certificateEnabled: true,
  certificateName: "",

  requirements: [],
  learningOutcomes: [],
  tags: [],

  metaTitle: "",
  metaDescription: "",

  status: "DRAFT",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isValidUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function EditCourseClient({
  courseId,
}: Props) {
  const router = useRouter();

  const [course, setCourse] =
    useState<Course>(DEFAULT_COURSE);

  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [tagInput, setTagInput] =
    useState("");

  const [saveAsDraft, setSaveAsDraft] =
    useState(false);

  /*
   * --------------------------------------------------------
   * LOAD COURSE
   * --------------------------------------------------------
   */

  useEffect(() => {
    loadCourse();
    loadUsers();
  }, [courseId]);

  async function loadCourse() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/courses/${courseId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load course."
        );
      }

      const loadedCourse =
        data.course ||
        data.data;

      if (!loadedCourse) {
        throw new Error(
          "Course was not found."
        );
      }

      setCourse({
        ...DEFAULT_COURSE,
        ...loadedCourse,

        requirements:
          Array.isArray(
            loadedCourse.requirements
          )
            ? loadedCourse.requirements
            : [],

        learningOutcomes:
          Array.isArray(
            loadedCourse.learningOutcomes
          )
            ? loadedCourse.learningOutcomes
            : [],

        tags:
          Array.isArray(
            loadedCourse.tags
          )
            ? loadedCourse.tags
            : [],
      });
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
  }

  /*
   * --------------------------------------------------------
   * LOAD ACTIVE USERS
   * --------------------------------------------------------
   */

  async function loadUsers() {
    try {
      setLoadingUsers(true);

      const response = await fetch(
        "/api/admin/users?status=ACTIVE",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(
        "Load users error:",
        err
      );
    } finally {
      setLoadingUsers(false);
    }
  }

  /*
   * --------------------------------------------------------
   * FIELD UPDATE
   * --------------------------------------------------------
   */

  function updateField(
    field: keyof Course,
    value: any
  ) {
    setCourse((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => {
      const next = {
        ...previous,
      };

      delete next[field];

      return next;
    });
  }

  /*
   * --------------------------------------------------------
   * TITLE
   * --------------------------------------------------------
   */

  function updateTitle(
    value: string
  ) {
    setCourse((previous) => ({
      ...previous,
      title: value,
      slug:
        !previous.slug ||
        previous.slug ===
          slugify(
            previous.title || ""
          )
          ? slugify(value)
          : previous.slug,
    }));
  }

  /*
   * --------------------------------------------------------
   * REQUIREMENTS
   * --------------------------------------------------------
   */

  function updateRequirement(
    index: number,
    value: string
  ) {
    const requirements = [
      ...(course.requirements || []),
    ];

    requirements[index] = value;

    updateField(
      "requirements",
      requirements
    );
  }

  function addRequirement() {
    updateField(
      "requirements",
      [
        ...(course.requirements || []),
        "",
      ]
    );
  }

  function removeRequirement(
    index: number
  ) {
    updateField(
      "requirements",
      (
        course.requirements || []
      ).filter(
        (_, i) => i !== index
      )
    );
  }

  /*
   * --------------------------------------------------------
   * LEARNING OUTCOMES
   * --------------------------------------------------------
   */

  function updateOutcome(
    index: number,
    value: string
  ) {
    const learningOutcomes = [
      ...(course.learningOutcomes ||
        []),
    ];

    learningOutcomes[index] =
      value;

    updateField(
      "learningOutcomes",
      learningOutcomes
    );
  }

  function addOutcome() {
    updateField(
      "learningOutcomes",
      [
        ...(course.learningOutcomes ||
          []),
        "",
      ]
    );
  }

  function removeOutcome(
    index: number
  ) {
    updateField(
      "learningOutcomes",
      (
        course.learningOutcomes ||
        []
      ).filter(
        (_, i) => i !== index
      )
    );
  }

  /*
   * --------------------------------------------------------
   * TAGS
   * --------------------------------------------------------
   */

  function addTag() {
    const tag =
      tagInput.trim();

    if (!tag) {
      return;
    }

    const existingTags =
      course.tags || [];

    const alreadyExists =
      existingTags.some(
        (item) =>
          item.toLowerCase() ===
          tag.toLowerCase()
      );

    if (alreadyExists) {
      setTagInput("");
      return;
    }

    if (
      existingTags.length >= 20
    ) {
      setError(
        "Maximum 20 tags are allowed."
      );
      return;
    }

    updateField("tags", [
      ...existingTags,
      tag,
    ]);

    setTagInput("");
  }

  function removeTag(
    index: number
  ) {
    updateField(
      "tags",
      (course.tags || []).filter(
        (_, i) => i !== index
      )
    );
  }

  /*
   * --------------------------------------------------------
   * VALIDATION
   * --------------------------------------------------------
   */

  function validate() {
    const nextErrors: Record<
      string,
      string
    > = {};

    const title =
      course.title?.trim() || "";

    const slug =
      course.slug?.trim() || "";

    const shortDescription =
      course.shortDescription?.trim() ||
      "";

    const description =
      course.description?.trim() ||
      "";

    if (!title) {
      nextErrors.title =
        "Course title is required.";
    } else if (title.length < 3) {
      nextErrors.title =
        "Course title must contain at least 3 characters.";
    } else if (title.length > 200) {
      nextErrors.title =
        "Course title cannot exceed 200 characters.";
    }

    if (!slug) {
      nextErrors.slug =
        "Slug is required.";
    } else if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      nextErrors.slug =
        "Slug may contain lowercase letters, numbers and hyphens only.";
    }

    if (!shortDescription) {
      nextErrors.shortDescription =
        "Short description is required.";
    } else if (
      shortDescription.length > 500
    ) {
      nextErrors.shortDescription =
        "Short description cannot exceed 500 characters.";
    }

    if (!description) {
      nextErrors.description =
        "Course description is required.";
    }

    if (
      course.thumbnail &&
      !isValidUrl(
        course.thumbnail
      )
    ) {
      nextErrors.thumbnail =
        "Enter a valid thumbnail URL.";
    }

    if (
      course.bannerImage &&
      !isValidUrl(
        course.bannerImage
      )
    ) {
      nextErrors.bannerImage =
        "Enter a valid banner image URL.";
    }

    if (!course.category?.trim()) {
      nextErrors.category =
        "Category is required.";
    }

    if (!course.instructor) {
      nextErrors.instructor =
        "Please select an instructor.";
    }

    if (!course.isFree) {
      const price =
        Number(course.price);

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        nextErrors.price =
          "Enter a valid course price.";
      }

      const discount =
        Number(
          course.discountPrice || 0
        );

      if (
        discount > 0 &&
        discount >= price
      ) {
        nextErrors.discountPrice =
          "Discount price must be lower than the original price.";
      }
    }

    if (
      course.durationMinutes !==
        undefined &&
      course.durationMinutes !==
        null &&
      Number(course.durationMinutes) <
        0
    ) {
      nextErrors.durationMinutes =
        "Duration cannot be negative.";
    }

    if (
      course.certificateEnabled &&
      (
        course.certificateName ||
        ""
      ).length > 200
    ) {
      nextErrors.certificateName =
        "Certificate name cannot exceed 200 characters.";
    }

    if (
      (
        course.metaTitle ||
        ""
      ).length > 70
    ) {
      nextErrors.metaTitle =
        "Meta title should not exceed 70 characters.";
    }

    if (
      (
        course.metaDescription ||
        ""
      ).length > 160
    ) {
      nextErrors.metaDescription =
        "Meta description should not exceed 160 characters.";
    }

    if (
      (
        course.requirements || []
      ).length > 20
    ) {
      nextErrors.requirements =
        "Maximum 20 requirements are allowed.";
    }

    if (
      (
        course.learningOutcomes ||
        []
      ).length > 20
    ) {
      nextErrors.learningOutcomes =
        "Maximum 20 learning outcomes are allowed.";
    }

    setErrors(
      nextErrors
    );

    return (
      Object.keys(
        nextErrors
      ).length === 0
    );
  }

  /*
   * --------------------------------------------------------
   * PAYLOAD
   * --------------------------------------------------------
   */

  function buildPayload() {
    return {
      title:
        course.title?.trim(),

      slug:
        course.slug?.trim(),

      shortDescription:
        course.shortDescription?.trim(),

      description:
        course.description?.trim(),

      thumbnail:
        course.thumbnail?.trim() ||
        "",

      bannerImage:
        course.bannerImage?.trim() ||
        "",

      category:
        course.category?.trim(),

      subCategory:
        course.subCategory?.trim() ||
        "",

      level:
        course.level,

      language:
        course.language?.trim() ||
        "English",

      instructor:
        typeof course.instructor ===
        "object"
          ? course.instructor?._id
          : course.instructor,

      isFree:
        Boolean(course.isFree),

      price: course.isFree
        ? 0
        : Number(
            course.price || 0
          ),

      discountPrice:
        course.isFree
          ? 0
          : Number(
              course.discountPrice ||
                0
            ),

      currency:
        course.currency ||
        "INR",

      durationMinutes:
        Number(
          course.durationMinutes ||
            0
        ),

      featured:
        Boolean(course.featured),

      certificateEnabled:
        Boolean(
          course.certificateEnabled
        ),

      certificateName:
        course.certificateEnabled
          ? (
              course.certificateName ||
              ""
            ).trim()
          : "",

      requirements:
        (
          course.requirements ||
          []
        )
          .map((item) =>
            item.trim()
          )
          .filter(Boolean),

      learningOutcomes:
        (
          course.learningOutcomes ||
          []
        )
          .map((item) =>
            item.trim()
          )
          .filter(Boolean),

      tags:
        (
          course.tags || []
        )
          .map((item) =>
            item.trim()
          )
          .filter(Boolean),

      metaTitle:
        course.metaTitle?.trim() ||
        "",

      metaDescription:
        course.metaDescription?.trim() ||
        "",

      status: saveAsDraft
        ? "DRAFT"
        : course.status ||
          "DRAFT",
    };
  }

  /*
   * --------------------------------------------------------
   * SAVE
   * --------------------------------------------------------
   */

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validate()) {
      setError(
        "Please fix the highlighted fields before saving."
      );
      return;
    }

    try {
      setSaving(true);

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
              buildPayload()
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

      const updatedCourse =
        data.course ||
        data.data;

      if (updatedCourse) {
        setCourse((previous) => ({
          ...previous,
          ...updatedCourse,
        }));
      }

      setSuccess(
        saveAsDraft
          ? "Course saved as draft successfully."
          : "Course updated successfully."
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
   * LOADING
   * --------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-5">
            <div className="h-8 w-64 rounded bg-slate-200" />

            <div className="h-40 rounded-2xl bg-slate-200" />

            <div className="h-72 rounded-2xl bg-slate-200" />

            <div className="h-72 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------------
   * ERROR / NOT FOUND
   * --------------------------------------------------------
   */

  if (!course._id) {
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
            {error ||
              "The requested course could not be loaded."}
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Link
                href="/admin/courses"
                className="hover:text-slate-900"
              >
                Courses
              </Link>

              <span>/</span>

              <Link
                href={`/admin/courses/${courseId}`}
                className="max-w-xs truncate hover:text-slate-900"
              >
                {course.title}
              </Link>

              <span>/</span>

              <span className="text-slate-700">
                Edit
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Edit Course
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update course information
              and publishing settings.
            </p>
          </div>

          <Link
            href={`/admin/courses/${courseId}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← View Course
          </Link>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>Error:</strong>{" "}
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* BASIC INFORMATION */}

          <Section
            title="Basic Information"
            icon="📚"
            description="Update the course title, URL and descriptions."
          >
            <div className="space-y-5">
              <Field
                label="Course Title"
                required
                value={
                  course.title || ""
                }
                onChange={
                  updateTitle
                }
                placeholder="Course title"
                error={
                  errors.title
                }
              />

              <Field
                label="Slug"
                required
                value={
                  course.slug || ""
                }
                onChange={(value) =>
                  updateField(
                    "slug",
                    value
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )
                  )
                }
                placeholder="course-slug"
                error={
                  errors.slug
                }
              />

              <TextField
                label="Short Description"
                required
                value={
                  course.shortDescription ||
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "shortDescription",
                    value
                  )
                }
                placeholder="Short course summary"
                rows={3}
                error={
                  errors.shortDescription
                }
              />

              <TextField
                label="Description"
                required
                value={
                  course.description ||
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "description",
                    value
                  )
                }
                placeholder="Full course description"
                rows={8}
                error={
                  errors.description
                }
              />
            </div>
          </Section>

          {/* MEDIA */}

          <Section
            title="Course Media"
            icon="🖼️"
            description="Update course thumbnail and banner."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Thumbnail URL"
                value={
                  course.thumbnail ||
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "thumbnail",
                    value
                  )
                }
                placeholder="https://..."
                error={
                  errors.thumbnail
                }
              />

              <Field
                label="Banner Image URL"
                value={
                  course.bannerImage ||
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "bannerImage",
                    value
                  )
                }
                placeholder="https://..."
                error={
                  errors.bannerImage
                }
              />
            </div>

            {course.thumbnail && (
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={
                    course.thumbnail
                  }
                  alt={
                    course.title ||
                    "Course"
                  }
                  className="max-h-64 w-full object-cover"
                  onError={(
                    event
                  ) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              </div>
            )}
          </Section>

          {/* CLASSIFICATION */}

          <Section
            title="Classification"
            icon="🏷️"
            description="Organize the course and assign an instructor."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Category"
                required
                value={
                  course.category ||
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "category",
                    value
                  )
                }
                placeholder="Web Development"
                error={
                  errors.category
                }
              />

              <Field
                label="Sub Category"
                value={
                  course.subCategory ||
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "subCategory",
                    value
                  )
                }
                placeholder="Full Stack"
              />

              <Select
                label="Level"
                value={
                  course.level ||
                  "BEGINNER"
                }
                onChange={(value) =>
                  updateField(
                    "level",
                    value
                  )
                }
                options={[
                  {
                    value:
                      "BEGINNER",
                    label:
                      "Beginner",
                  },
                  {
                    value:
                      "INTERMEDIATE",
                    label:
                      "Intermediate",
                  },
                  {
                    value:
                      "ADVANCED",
                    label:
                      "Advanced",
                  },
                  {
                    value:
                      "ALL_LEVELS",
                    label:
                      "All Levels",
                  },
                ]}
              />

              <Field
                label="Language"
                value={
                  course.language ||
                  "English"
                }
                onChange={(value) =>
                  updateField(
                    "language",
                    value
                  )
                }
                placeholder="English"
              />

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Instructor
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={
                    typeof course.instructor ===
                    "object"
                      ? course.instructor?._id ||
                        ""
                      : course.instructor ||
                        ""
                  }
                  onChange={(event) =>
                    updateField(
                      "instructor",
                      event.target
                        .value
                    )
                  }
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${
                    errors.instructor
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                  }`}
                >
                  <option value="">
                    {loadingUsers
                      ? "Loading users..."
                      : "Select instructor"}
                  </option>

                  {users.map(
                    (user) => (
                      <option
                        key={
                          user._id
                        }
                        value={
                          user._id
                        }
                      >
                        {user.name ||
                          "Unnamed User"}{" "}
                        {user.email
                          ? `(${user.email})`
                          : ""}
                      </option>
                    )
                  )}

                  {/* Keep currently assigned user selectable
                      even if the active-user API does not return
                      the user. */}
                  {typeof course.instructor ===
                    "object" &&
                    course.instructor?._id &&
                    !users.some(
                      (user) =>
                        user._id ===
                        course.instructor?._id
                    ) && (
                      <option
                        value={
                          course
                            .instructor
                            ._id
                        }
                      >
                        {course
                          .instructor
                          .name ||
                          "Current Instructor"}{" "}
                        {course
                          .instructor
                          .email
                          ? `(${course.instructor.email})`
                          : ""}
                      </option>
                    )}
                </select>

                {errors.instructor && (
                  <p className="mt-1 text-xs text-red-600">
                    {
                      errors.instructor
                    }
                  </p>
                )}
              </div>

              <Field
                label="Duration (minutes)"
                type="number"
                value={String(
                  course.durationMinutes ||
                    ""
                )}
                onChange={(value) =>
                  updateField(
                    "durationMinutes",
                    value
                      ? Number(
                          value
                        )
                      : 0
                  )
                }
                placeholder="1200"
                error={
                  errors.durationMinutes
                }
              />
            </div>

            <div className="mt-5">
              <Checkbox
                checked={
                  Boolean(
                    course.featured
                  )
                }
                onChange={(checked) =>
                  updateField(
                    "featured",
                    checked
                  )
                }
                label="Featured course"
              />
            </div>
          </Section>

          {/* PRICING */}

          <Section
            title="Pricing"
            icon="💰"
            description="Configure course pricing."
          >
            <div className="mb-5 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  updateField(
                    "isFree",
                    true
                  )
                }
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${
                  course.isFree
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Free Course
              </button>

              <button
                type="button"
                onClick={() =>
                  updateField(
                    "isFree",
                    false
                  )
                }
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${
                  !course.isFree
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Paid Course
              </button>
            </div>

            {!course.isFree && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Select
                  label="Currency"
                  value={
                    course.currency ||
                    "INR"
                  }
                  onChange={(value) =>
                    updateField(
                      "currency",
                      value
                    )
                  }
                  options={[
                    {
                      value:
                        "INR",
                      label:
                        "INR - Indian Rupee",
                    },
                    {
                      value:
                        "USD",
                      label:
                        "USD - US Dollar",
                    },
                    {
                      value:
                        "EUR",
                      label:
                        "EUR - Euro",
                    },
                  ]}
                />

                <Field
                  label="Price"
                  required
                  type="number"
                  value={String(
                    course.price ||
                      ""
                  )}
                  onChange={(value) =>
                    updateField(
                      "price",
                      value
                        ? Number(
                            value
                          )
                        : 0
                    )
                  }
                  placeholder="999"
                  error={
                    errors.price
                  }
                />

                <Field
                  label="Discount Price"
                  type="number"
                  value={String(
                    course.discountPrice ||
                      ""
                  )}
                  onChange={(value) =>
                    updateField(
                      "discountPrice",
                      value
                        ? Number(
                            value
                          )
                        : 0
                    )
                  }
                  placeholder="799"
                  error={
                    errors.discountPrice
                  }
                />
              </div>
            )}
          </Section>

          {/* REQUIREMENTS */}

          <Section
            title="Requirements"
            icon="📋"
            description="What learners should know before starting."
          >
            <div className="space-y-3">
              {(
                course.requirements &&
                course.requirements.length
                  ? course.requirements
                  : [""]
              ).map(
                (
                  requirement,
                  index
                ) => (
                  <div
                    key={index}
                    className="flex gap-2"
                  >
                    <input
                      value={
                        requirement
                      }
                      onChange={(
                        event
                      ) =>
                        updateRequirement(
                          index,
                          event.target
                            .value
                        )
                      }
                      placeholder={`Requirement ${
                        index + 1
                      }`}
                      className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeRequirement(
                          index
                        )
                      }
                      className="rounded-xl border border-slate-200 px-3 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              onClick={
                addRequirement
              }
              className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              + Add Requirement
            </button>

            {errors.requirements && (
              <p className="mt-2 text-xs text-red-600">
                {
                  errors.requirements
                }
              </p>
            )}
          </Section>

          {/* OUTCOMES */}

          <Section
            title="Learning Outcomes"
            icon="🎯"
            description="Define what learners will achieve."
          >
            <div className="space-y-3">
              {(
                course.learningOutcomes &&
                course.learningOutcomes.length
                  ? course.learningOutcomes
                  : [""]
              ).map(
                (
                  outcome,
                  index
                ) => (
                  <div
                    key={index}
                    className="flex gap-2"
                  >
                    <input
                      value={
                        outcome
                      }
                      onChange={(
                        event
                      ) =>
                        updateOutcome(
                          index,
                          event.target
                            .value
                        )
                      }
                      placeholder={`Learning outcome ${
                        index + 1
                      }`}
                      className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeOutcome(
                          index
                        )
                      }
                      className="rounded-xl border border-slate-200 px-3 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              onClick={
                addOutcome
              }
              className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              + Add Learning Outcome
            </button>

            {errors.learningOutcomes && (
              <p className="mt-2 text-xs text-red-600">
                {
                  errors.learningOutcomes
                }
              </p>
            )}
          </Section>

          {/* TAGS */}

          <Section
            title="Tags"
            icon="🔖"
            description="Searchable keywords for this course."
          >
            <div className="flex gap-2">
              <input
                value={
                  tagInput
                }
                onChange={(event) =>
                  setTagInput(
                    event.target
                      .value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Type a tag and press Enter"
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />

              <button
                type="button"
                onClick={addTag}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Add
              </button>
            </div>

            {(course.tags || [])
              .length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  course.tags ||
                  []
                ).map(
                  (
                    tag,
                    index
                  ) => (
                    <span
                      key={`${tag}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      #{tag}

                      <button
                        type="button"
                        onClick={() =>
                          removeTag(
                            index
                          )
                        }
                        className="font-bold text-slate-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  )
                )}
              </div>
            )}
          </Section>

          {/* CERTIFICATE */}

          <Section
            title="Certificate"
            icon="🏆"
            description="Configure course completion certificates."
          >
            <Checkbox
              checked={Boolean(
                course.certificateEnabled
              )}
              onChange={(checked) =>
                updateField(
                  "certificateEnabled",
                  checked
                )
              }
              label="Enable certificate"
            />

            {course.certificateEnabled && (
              <div className="mt-5 max-w-xl">
                <Field
                  label="Certificate Name"
                  value={
                    course.certificateName ||
                    ""
                  }
                  onChange={(value) =>
                    updateField(
                      "certificateName",
                      value
                    )
                  }
                  placeholder="Course Completion Certificate"
                  error={
                    errors.certificateName
                  }
                />
              </div>
            )}
          </Section>

          {/* SEO */}

          <Section
            title="SEO"
            icon="🔎"
            description="Search engine metadata."
          >
            <div className="space-y-5">
              <Field
                label="Meta Title"
                value={
                  course.metaTitle ||
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "metaTitle",
                    value
                  )
                }
                placeholder="SEO title"
                error={
                  errors.metaTitle
                }
              />

              <TextField
                label="Meta Description"
                value={
                  course.metaDescription ||
                  ""
                }
                onChange={(value) =>
                  updateField(
                    "metaDescription",
                    value
                  )
                }
                placeholder="SEO description"
                rows={4}
                error={
                  errors.metaDescription
                }
              />
            </div>
          </Section>

          {/* SAVE */}

          <section className="sticky bottom-0 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {isPublished
                    ? "Published Course"
                    : "Draft Course"}
                </p>

                <p className="text-xs text-slate-500">
                  Save your changes when
                  finished.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Link
                  href={`/admin/courses/${courseId}`}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setSaveAsDraft(true);

                    setTimeout(() => {
                      document
                        .querySelector(
                          "form"
                        )
                        ?.requestSubmit();
                    }, 0);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {saving &&
                  saveAsDraft
                    ? "Saving..."
                    : "Save as Draft"}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  onClick={() =>
                    setSaveAsDraft(
                      false
                    )
                  }
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving &&
                  !saveAsDraft
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * SECTION
 * ============================================================
 */

function Section({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {icon}
          </span>

          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>
        </div>

        <p className="mt-1 pl-8 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}

/*
 * ============================================================
 * INPUT
 * ============================================================
 */

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
        }`}
      />

      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/*
 * ============================================================
 * TEXTAREA
 * ============================================================
 */

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 5,
  error,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        rows={rows}
        className={`w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
        }`}
      />

      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/*
 * ============================================================
 * SELECT
 * ============================================================
 */

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

/*
 * ============================================================
 * CHECKBOX
 * ============================================================
 */

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="h-4 w-4 rounded border-slate-300"
      />

      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
    </label>
  );
}