"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type CourseLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "ALL_LEVELS";

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

interface CourseForm {
  title: string;
  slug: string;

  shortDescription: string;
  description: string;

  thumbnail: string;
  bannerImage: string;

  category: string;
  subCategory: string;

  level: CourseLevel;
  language: string;

  instructor: string;

  isFree: boolean;
  price: string;
  discountPrice: string;
  currency: string;

  durationMinutes: string;

  featured: boolean;

  certificateEnabled: boolean;
  certificateName: string;

  requirements: string[];
  learningOutcomes: string[];
  tags: string[];

  metaTitle: string;
  metaDescription: string;
}

const INITIAL_FORM: CourseForm = {
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
  price: "",
  discountPrice: "",
  currency: "INR",

  durationMinutes: "",

  featured: false,

  certificateEnabled: true,
  certificateName: "",

  requirements: [""],
  learningOutcomes: [""],
  tags: [],

  metaTitle: "",
  metaDescription: "",
};

/*
 * ============================================================
 * OPTIONS
 * ============================================================
 */

const LEVEL_OPTIONS: {
  value: CourseLevel;
  label: string;
}[] = [
  {
    value: "BEGINNER",
    label: "Beginner",
  },
  {
    value: "INTERMEDIATE",
    label: "Intermediate",
  },
  {
    value: "ADVANCED",
    label: "Advanced",
  },
  {
    value: "ALL_LEVELS",
    label: "All Levels",
  },
];

const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Bengali",
];

const CURRENCY_OPTIONS = [
  {
    value: "INR",
    label: "INR - Indian Rupee",
  },
  {
    value: "USD",
    label: "USD - US Dollar",
  },
  {
    value: "EUR",
    label: "EUR - Euro",
  },
];

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

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
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function getUserDisplayName(user: User) {
  if (user.name?.trim()) {
    return user.name.trim();
  }

  if (user.email?.trim()) {
    return user.email.trim();
  }

  return "Unnamed User";
}

/*
 * ============================================================
 * SECTION HEADER
 * ============================================================
 */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-base">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-semibold text-white">
            {title}
          </h2>

          {description && (
            <p className="mt-0.5 text-xs text-white/35">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * INPUT
 * ============================================================
 */

function Input({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  disabled = false,
  error,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/70">
        {label}

        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white/[0.025] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
            : "border-white/10 focus:border-white/25 focus:ring-2 focus:ring-white/5"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-400">
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

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 5,
  error,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  error?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-sm font-medium text-white/70">
          {label}

          {required && (
            <span className="ml-1 text-red-400">
              *
            </span>
          )}
        </label>

        {maxLength && (
          <span className="text-[10px] text-white/20">
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className={`w-full resize-y rounded-xl border bg-white/[0.025] px-3.5 py-2.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 ${
          error
            ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
            : "border-white/10 focus:border-white/25 focus:ring-2 focus:ring-white/5"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-400">
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
  required = false,
  error,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  required?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/70">
        {label}

        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}
      </label>

      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`w-full rounded-xl border bg-[#0b1020] px-3.5 py-2.5 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? "border-red-400/50 focus:border-red-400"
            : "border-white/10 focus:border-white/25"
        }`}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#0b1020] text-white"
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
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
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.035]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-0.5 h-4 w-4 accent-white"
      />

      <span>
        <span className="block text-sm font-medium text-white/75">
          {label}
        </span>

        {description && (
          <span className="mt-1 block text-xs leading-5 text-white/30">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function CreateCourseClient() {
  const router = useRouter();

  const [form, setForm] =
    useState<CourseForm>(
      INITIAL_FORM
    );

  const [errors, setErrors] =
    useState<Record<string, string>>(
      {}
    );

  const [users, setUsers] =
    useState<User[]>([]);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [saveAsDraft, setSaveAsDraft] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [tagInput, setTagInput] =
    useState("");

  /*
   * ============================================================
   * UPDATE FIELD
   * ============================================================
   */

  function updateField(
    field: keyof CourseForm,
    value: any
  ) {
    setForm((previous) => ({
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

    setError("");
  }

  /*
   * ============================================================
   * TITLE -> SLUG
   * ============================================================
   */

  function handleTitleChange(
    value: string
  ) {
    setForm((previous) => {
      const generatedPreviousSlug =
        slugify(previous.title);

      const shouldAutoGenerate =
        !previous.slug ||
        previous.slug ===
          generatedPreviousSlug;

      return {
        ...previous,
        title: value,
        slug: shouldAutoGenerate
          ? slugify(value)
          : previous.slug,
      };
    });

    setErrors((previous) => {
      const next = {
        ...previous,
      };

      delete next.title;
      delete next.slug;

      return next;
    });

    setError("");
  }

  /*
   * ============================================================
   * LOAD ACTIVE USERS
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        setLoadingUsers(true);

        const response =
          await fetch(
            "/api/admin/users?status=ACTIVE",
            {
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
              "Unable to load active users."
          );
        }

        if (!cancelled) {
          setUsers(
            Array.isArray(data.users)
              ? data.users
              : []
          );
        }
      } catch (err) {
        console.error(
          "[CREATE COURSE] USERS ERROR:",
          err
        );

        if (!cancelled) {
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ============================================================
   * REQUIREMENTS
   * ============================================================
   */

  function updateRequirement(
    index: number,
    value: string
  ) {
    setForm((previous) => {
      const requirements = [
        ...previous.requirements,
      ];

      requirements[index] = value;

      return {
        ...previous,
        requirements,
      };
    });

    setErrors((previous) => {
      const next = {
        ...previous,
      };

      delete next.requirements;

      return next;
    });
  }

  function addRequirement() {
    if (
      form.requirements.length >= 20
    ) {
      setError(
        "You can add a maximum of 20 requirements."
      );
      return;
    }

    setForm((previous) => ({
      ...previous,
      requirements: [
        ...previous.requirements,
        "",
      ],
    }));
  }

  function removeRequirement(
    index: number
  ) {
    setForm((previous) => ({
      ...previous,
      requirements:
        previous.requirements.filter(
          (_, currentIndex) =>
            currentIndex !== index
        ),
    }));
  }

  /*
   * ============================================================
   * LEARNING OUTCOMES
   * ============================================================
   */

  function updateOutcome(
    index: number,
    value: string
  ) {
    setForm((previous) => {
      const learningOutcomes = [
        ...previous.learningOutcomes,
      ];

      learningOutcomes[index] = value;

      return {
        ...previous,
        learningOutcomes,
      };
    });

    setErrors((previous) => {
      const next = {
        ...previous,
      };

      delete next.learningOutcomes;

      return next;
    });
  }

  function addOutcome() {
    if (
      form.learningOutcomes.length >= 20
    ) {
      setError(
        "You can add a maximum of 20 learning outcomes."
      );
      return;
    }

    setForm((previous) => ({
      ...previous,
      learningOutcomes: [
        ...previous.learningOutcomes,
        "",
      ],
    }));
  }

  function removeOutcome(
    index: number
  ) {
    setForm((previous) => ({
      ...previous,
      learningOutcomes:
        previous.learningOutcomes.filter(
          (_, currentIndex) =>
            currentIndex !== index
        ),
    }));
  }

  /*
   * ============================================================
   * TAGS
   * ============================================================
   */

  function addTag() {
    const tag =
      tagInput.trim();

    if (!tag) {
      return;
    }

    if (tag.length > 50) {
      setError(
        "Each tag cannot exceed 50 characters."
      );
      return;
    }

    if (
      form.tags.some(
        (existing) =>
          existing.toLowerCase() ===
          tag.toLowerCase()
      )
    ) {
      setTagInput("");
      return;
    }

    if (form.tags.length >= 20) {
      setError(
        "You can add a maximum of 20 tags."
      );
      return;
    }

    updateField("tags", [
      ...form.tags,
      tag.toLowerCase(),
    ]);

    setTagInput("");
  }

  function removeTag(
    index: number
  ) {
    updateField(
      "tags",
      form.tags.filter(
        (_, currentIndex) =>
          currentIndex !== index
      )
    );
  }

  function handleTagKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      event.preventDefault();
      addTag();
    }
  }

  /*
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  function validate() {
    const nextErrors: Record<
      string,
      string
    > = {};

    const title =
      form.title.trim();

    const slug =
      form.slug.trim();

    const shortDescription =
      form.shortDescription.trim();

    const description =
      form.description.trim();

    /*
     * TITLE
     */

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

    /*
     * SLUG
     */

    if (!slug) {
      nextErrors.slug =
        "Slug is required.";
    } else if (
      slug.length > 200
    ) {
      nextErrors.slug =
        "Slug cannot exceed 200 characters.";
    } else if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      nextErrors.slug =
        "Slug may contain lowercase letters, numbers and hyphens only.";
    }

    /*
     * SHORT DESCRIPTION
     */

    if (!shortDescription) {
      nextErrors.shortDescription =
        "Short description is required.";
    } else if (
      shortDescription.length > 500
    ) {
      nextErrors.shortDescription =
        "Short description cannot exceed 500 characters.";
    }

    /*
     * DESCRIPTION
     */

    if (!description) {
      nextErrors.description =
        "Course description is required.";
    }

    /*
     * IMAGE URLS
     */

    if (
      form.thumbnail &&
      !isValidUrl(form.thumbnail)
    ) {
      nextErrors.thumbnail =
        "Enter a valid HTTP/HTTPS thumbnail URL.";
    }

    if (
      form.bannerImage &&
      !isValidUrl(form.bannerImage)
    ) {
      nextErrors.bannerImage =
        "Enter a valid HTTP/HTTPS banner image URL.";
    }

    /*
     * CATEGORY
     */

    if (!form.category.trim()) {
      nextErrors.category =
        "Category is required.";
    } else if (
      form.category.trim().length > 100
    ) {
      nextErrors.category =
        "Category cannot exceed 100 characters.";
    }

    if (
      form.subCategory.trim().length > 100
    ) {
      nextErrors.subCategory =
        "Sub-category cannot exceed 100 characters.";
    }

    /*
     * INSTRUCTOR
     */

    if (!form.instructor) {
      nextErrors.instructor =
        "Please select an active instructor.";
    }

    /*
     * PRICING
     */

    if (!form.isFree) {
      const price =
        Number(form.price);

      if (
        !form.price ||
        !Number.isFinite(price) ||
        price <= 0
      ) {
        nextErrors.price =
          "Enter a valid course price.";
      }

      if (form.discountPrice) {
        const discount =
          Number(form.discountPrice);

        if (
          !Number.isFinite(discount) ||
          discount <= 0
        ) {
          nextErrors.discountPrice =
            "Enter a valid discount price.";
        } else if (
          discount >= price
        ) {
          nextErrors.discountPrice =
            "Discount price must be lower than the original price.";
        }
      }
    }

    /*
     * DURATION
     */

    if (form.durationMinutes) {
      const duration =
        Number(
          form.durationMinutes
        );

      if (
        !Number.isInteger(duration) ||
        duration <= 0
      ) {
        nextErrors.durationMinutes =
          "Duration must be a positive number of minutes.";
      }
    }

    /*
     * CERTIFICATE
     */

    if (
      form.certificateEnabled &&
      form.certificateName.trim()
        .length > 200
    ) {
      nextErrors.certificateName =
        "Certificate name cannot exceed 200 characters.";
    }

    /*
     * SEO
     */

    if (
      form.metaTitle.length > 70
    ) {
      nextErrors.metaTitle =
        "Meta title should not exceed 70 characters.";
    }

    if (
      form.metaDescription.length >
      160
    ) {
      nextErrors.metaDescription =
        "Meta description should not exceed 160 characters.";
    }

    /*
     * REQUIREMENTS
     */

    const validRequirements =
      form.requirements.filter(
        (item) => item.trim()
      );

    if (
      validRequirements.length > 20
    ) {
      nextErrors.requirements =
        "Maximum 20 requirements are allowed.";
    }

    for (
      const requirement of validRequirements
    ) {
      if (
        requirement.trim().length >
        500
      ) {
        nextErrors.requirements =
          "Each requirement cannot exceed 500 characters.";
        break;
      }
    }

    /*
     * OUTCOMES
     */

    const validOutcomes =
      form.learningOutcomes.filter(
        (item) => item.trim()
      );

    if (
      validOutcomes.length > 20
    ) {
      nextErrors.learningOutcomes =
        "Maximum 20 learning outcomes are allowed.";
    }

    for (
      const outcome of validOutcomes
    ) {
      if (
        outcome.trim().length >
        500
      ) {
        nextErrors.learningOutcomes =
          "Each learning outcome cannot exceed 500 characters.";
        break;
      }
    }

    /*
     * TAGS
     */

    if (form.tags.length > 20) {
      nextErrors.tags =
        "Maximum 20 tags are allowed.";
    }

    for (const tag of form.tags) {
      if (tag.length > 50) {
        nextErrors.tags =
          "Each tag cannot exceed 50 characters.";
        break;
      }
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length ===
      0
    );
  }

  /*
   * ============================================================
   * BUILD PAYLOAD
   * ============================================================
   */

  function buildPayload() {
    return {
      title:
        form.title.trim(),

      slug:
        form.slug.trim(),

      shortDescription:
        form.shortDescription.trim(),

      description:
        form.description.trim(),

      thumbnail:
        form.thumbnail.trim(),

      bannerImage:
        form.bannerImage.trim(),

      category:
        form.category.trim(),

      subCategory:
        form.subCategory.trim(),

      level:
        form.level,

      language:
        form.language.trim(),

      instructor:
        form.instructor || null,

      isFree:
        form.isFree,

      price: form.isFree
        ? 0
        : Number(form.price),

      discountPrice:
        form.isFree
          ? 0
          : form.discountPrice
          ? Number(
              form.discountPrice
            )
          : 0,

      currency:
        form.currency,

      durationMinutes:
        form.durationMinutes
          ? Number(
              form.durationMinutes
            )
          : 0,

      featured:
        form.featured,

      certificateEnabled:
        form.certificateEnabled,

      certificateName:
        form.certificateEnabled
          ? form.certificateName.trim()
          : "",

      requirements:
        form.requirements
          .map((item) =>
            item.trim()
          )
          .filter(Boolean),

      learningOutcomes:
        form.learningOutcomes
          .map((item) =>
            item.trim()
          )
          .filter(Boolean),

      tags:
        form.tags
          .map((tag) =>
            tag.trim().toLowerCase()
          )
          .filter(Boolean),

      metaTitle:
        form.metaTitle.trim(),

      metaDescription:
        form.metaDescription.trim(),

      status: saveAsDraft
        ? "DRAFT"
        : "PUBLISHED",
    };
  }

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    status: "DRAFT" | "PUBLISHED"
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    const valid = validate();

    if (!valid) {
      setError(
        "Please fix the highlighted fields before continuing."
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...buildPayload(),
        status,
      };

      console.log(
        "[CREATE COURSE] SUBMIT PAYLOAD:",
        payload
      );

      const response = await fetch(
        "/api/admin/courses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      console.log(
        "[CREATE COURSE] API RESPONSE:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to create course."
        );
      }

      const courseId =
        data.course?._id ||
        data.data?._id ||
        data._id;

      setSuccess(
        status === "DRAFT"
          ? "Course saved as draft successfully."
          : "Course published successfully."
      );

      /*
      * IMPORTANT:
      *
      * Do not call router.refresh() immediately after
      * router.push(). A single navigation is sufficient.
      */

      if (courseId) {
        window.location.assign(
          `/admin/courses/${courseId}`
        );

        return;
      }

      window.location.assign(
        "/admin/courses"
      );
    } catch (err) {
      console.error(
        "[CREATE COURSE] ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create course."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================================================
   * PRICE PREVIEW
   * ============================================================
   */

  const previewPrice =
    useMemo(() => {
      if (form.isFree) {
        return "Free";
      }

      if (
        form.discountPrice &&
        Number(form.discountPrice) <
          Number(form.price)
      ) {
        return `₹${Number(
          form.discountPrice
        ).toLocaleString("en-IN")}`;
      }

      if (form.price) {
        return `₹${Number(
          form.price
        ).toLocaleString("en-IN")}`;
      }

      return "Price not set";
    }, [
      form.isFree,
      form.price,
      form.discountPrice,
    ]);

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/25">
            <Link
              href="/admin/courses"
              className="transition hover:text-white/60"
            >
              Courses
            </Link>

            <span>/</span>

            <span>
              Create
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Create Course
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Build a new course for your
            learners. Configure the
            course content, instructor,
            pricing, certificate and
            publishing settings.
          </p>
        </div>

        <Link
          href="/admin/courses"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
        >
          ← Back to Courses
        </Link>
      </div>

      {/* ======================================================
          GLOBAL ERROR
          ====================================================== */}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3.5 text-sm text-red-300">
          <div className="font-semibold">
            Unable to continue
          </div>

          <div className="mt-1 text-red-300/70">
            {error}
          </div>
        </div>
      )}

      {/* ======================================================
          SUCCESS
          ====================================================== */}

      {success && (
        <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3.5 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* ======================================================
          FORM
          ====================================================== */}

      <form
        onSubmit={(event) =>
          handleSubmit(
            event,
            "DRAFT"
          )
        }
        className="space-y-6"
      >
        {/* ====================================================
            BASIC INFORMATION
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="📚"
            title="Basic Information"
            description="Define the course title, description and URL."
          />

          <div className="space-y-5">
            <Input
              label="Course Title"
              value={form.title}
              onChange={
                handleTitleChange
              }
              placeholder="e.g. Complete MERN Stack Development"
              required
              error={errors.title}
              maxLength={200}
            />

            <Input
              label="Slug"
              value={form.slug}
              onChange={(value) =>
                updateField(
                  "slug",
                  value
                    .toLowerCase()
                    .replace(
                      /\s+/g,
                      "-"
                    )
                    .replace(
                      /[^a-z0-9-]/g,
                      ""
                    )
                )
              }
              placeholder="complete-mern-stack-development"
              required
              error={errors.slug}
              maxLength={200}
            />

            <Textarea
              label="Short Description"
              value={
                form.shortDescription
              }
              onChange={(value) =>
                updateField(
                  "shortDescription",
                  value
                )
              }
              placeholder="A short summary shown in course cards."
              required
              rows={3}
              error={
                errors.shortDescription
              }
              maxLength={500}
            />

            <Textarea
              label="Course Description"
              value={form.description}
              onChange={(value) =>
                updateField(
                  "description",
                  value
                )
              }
              placeholder="Describe what students will learn in this course..."
              required
              rows={8}
              error={errors.description}
            />
          </div>
        </section>

        {/* ====================================================
            MEDIA
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="🖼️"
            title="Course Media"
            description="Optional thumbnail and banner images."
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Input
              label="Thumbnail URL"
              value={form.thumbnail}
              onChange={(value) =>
                updateField(
                  "thumbnail",
                  value
                )
              }
              placeholder="https://example.com/course-thumbnail.jpg"
              error={errors.thumbnail}
            />

            <Input
              label="Banner Image URL"
              value={form.bannerImage}
              onChange={(value) =>
                updateField(
                  "bannerImage",
                  value
                )
              }
              placeholder="https://example.com/course-banner.jpg"
              error={
                errors.bannerImage
              }
            />
          </div>
        </section>

        {/* ====================================================
            COURSE DETAILS
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="🎓"
            title="Course Details"
            description="Configure category, level, language and instructor."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Category"
              value={form.category}
              onChange={(value) =>
                updateField(
                  "category",
                  value
                )
              }
              placeholder="e.g. Web Development"
              required
              error={errors.category}
              maxLength={100}
            />

            <Input
              label="Sub-category"
              value={
                form.subCategory
              }
              onChange={(value) =>
                updateField(
                  "subCategory",
                  value
                )
              }
              placeholder="e.g. MERN Stack"
              error={
                errors.subCategory
              }
              maxLength={100}
            />

            <Select
              label="Level"
              value={form.level}
              onChange={(value) =>
                updateField(
                  "level",
                  value as CourseLevel
                )
              }
              options={LEVEL_OPTIONS}
            />

            <Select
              label="Language"
              value={form.language}
              onChange={(value) =>
                updateField(
                  "language",
                  value
                )
              }
              options={LANGUAGE_OPTIONS.map(
                (language) => ({
                  value: language,
                  label: language,
                })
              )}
            />

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-white/70">
                Instructor
                <span className="ml-1 text-red-400">
                  *
                </span>
              </label>

              <select
                value={form.instructor}
                disabled={
                  loadingUsers
                }
                onChange={(event) =>
                  updateField(
                    "instructor",
                    event.target.value
                  )
                }
                className={`w-full rounded-xl border bg-[#0b1020] px-3.5 py-2.5 text-sm text-white outline-none transition ${
                  errors.instructor
                    ? "border-red-400/50"
                    : "border-white/10 focus:border-white/25"
                }`}
              >
                <option
                  value=""
                  className="bg-[#0b1020]"
                >
                  {loadingUsers
                    ? "Loading active users..."
                    : users.length === 0
                    ? "No active users available"
                    : "Select an instructor"}
                </option>

                {users.map(
                  (user) => (
                    <option
                      key={user._id}
                      value={user._id}
                      className="bg-[#0b1020]"
                    >
                      {getUserDisplayName(
                        user
                      )}
                      {user.email &&
                      user.name
                        ? ` — ${user.email}`
                        : ""}
                    </option>
                  )
                )}
              </select>

              {loadingUsers && (
                <p className="mt-1.5 text-xs text-white/25">
                  Loading active users...
                </p>
              )}

              {!loadingUsers &&
                users.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-400/70">
                    No active users were
                    returned by the users
                    API.
                  </p>
                )}

              {errors.instructor && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.instructor}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ====================================================
            COURSE SETTINGS
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="⚙️"
            title="Course Settings"
            description="Configure duration, featured status and visibility."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Duration"
              value={
                form.durationMinutes
              }
              onChange={(value) =>
                updateField(
                  "durationMinutes",
                  value.replace(
                    /[^\d]/g,
                    ""
                  )
                )
              }
              placeholder="e.g. 360"
              type="number"
              error={
                errors.durationMinutes
              }
            />

            <div className="flex items-end">
              <Checkbox
                checked={
                  form.featured
                }
                onChange={(checked) =>
                  updateField(
                    "featured",
                    checked
                  )
                }
                label="Featured course"
                description="Show this course in featured/recommended areas."
              />
            </div>
          </div>
        </section>

        {/* ====================================================
            PRICING
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="💰"
            title="Pricing"
            description="Configure whether the course is free or paid."
          />

          <div className="mb-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                updateField(
                  "isFree",
                  true
                )
              }
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                form.isFree
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/[0.025] text-white/55 hover:bg-white/[0.05] hover:text-white"
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
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                !form.isFree
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/[0.025] text-white/55 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              Paid Course
            </button>
          </div>

          {!form.isFree && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Select
                label="Currency"
                value={form.currency}
                onChange={(value) =>
                  updateField(
                    "currency",
                    value
                  )
                }
                options={
                  CURRENCY_OPTIONS
                }
              />

              <Input
                label="Price"
                value={form.price}
                onChange={(value) =>
                  updateField(
                    "price",
                    value.replace(
                      /[^\d.]/g,
                      ""
                    )
                  )
                }
                placeholder="999"
                type="number"
                required
                error={errors.price}
              />

              <Input
                label="Discount Price"
                value={
                  form.discountPrice
                }
                onChange={(value) =>
                  updateField(
                    "discountPrice",
                    value.replace(
                      /[^\d.]/g,
                      ""
                    )
                  )
                }
                placeholder="799"
                type="number"
                error={
                  errors.discountPrice
                }
              />
            </div>
          )}

          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-white/25">
              Display Price
            </span>

            <div className="mt-1 text-xl font-bold text-white">
              {previewPrice}
            </div>
          </div>
        </section>

        {/* ====================================================
            REQUIREMENTS
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="📋"
            title="Requirements"
            description="Tell learners what they should know before starting."
          />

          <div className="space-y-3">
            {form.requirements.map(
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
                    onChange={(event) =>
                      updateRequirement(
                        index,
                        event.target.value
                      )
                    }
                    placeholder={`Requirement ${
                      index + 1
                    }`}
                    maxLength={500}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25 focus:ring-2 focus:ring-white/5"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeRequirement(
                        index
                      )
                    }
                    disabled={
                      form.requirements
                        .length === 1
                    }
                    className="rounded-xl border border-white/10 px-3 text-white/35 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
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
            disabled={
              form.requirements
                .length >= 20
            }
            className="mt-4 rounded-xl border border-dashed border-white/15 px-4 py-2 text-sm font-semibold text-white/50 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            + Add Requirement
          </button>

          {errors.requirements && (
            <p className="mt-2 text-xs text-red-400">
              {errors.requirements}
            </p>
          )}
        </section>

        {/* ====================================================
            LEARNING OUTCOMES
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="🎯"
            title="Learning Outcomes"
            description="Define what students will be able to do after completing the course."
          />

          <div className="space-y-3">
            {form.learningOutcomes.map(
              (
                outcome,
                index
              ) => (
                <div
                  key={index}
                  className="flex gap-2"
                >
                  <input
                    value={outcome}
                    onChange={(event) =>
                      updateOutcome(
                        index,
                        event.target.value
                      )
                    }
                    placeholder={`Learning outcome ${
                      index + 1
                    }`}
                    maxLength={500}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25 focus:ring-2 focus:ring-white/5"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeOutcome(
                        index
                      )
                    }
                    disabled={
                      form.learningOutcomes
                        .length === 1
                    }
                    className="rounded-xl border border-white/10 px-3 text-white/35 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>

          <button
            type="button"
            onClick={addOutcome}
            disabled={
              form.learningOutcomes
                .length >= 20
            }
            className="mt-4 rounded-xl border border-dashed border-white/15 px-4 py-2 text-sm font-semibold text-white/50 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            + Add Learning Outcome
          </button>

          {errors.learningOutcomes && (
            <p className="mt-2 text-xs text-red-400">
              {
                errors.learningOutcomes
              }
            </p>
          )}
        </section>

        {/* ====================================================
            TAGS
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="🏷️"
            title="Tags"
            description="Add searchable keywords for the course."
          />

          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(event) =>
                setTagInput(
                  event.target.value
                )
              }
              onKeyDown={
                handleTagKeyDown
              }
              placeholder="Type a tag and press Enter"
              maxLength={50}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25 focus:ring-2 focus:ring-white/5"
            />

            <button
              type="button"
              onClick={addTag}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              Add
            </button>
          </div>

          {form.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {form.tags.map(
                (tag, index) => (
                  <div
                    key={`${tag}-${index}`}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60"
                  >
                    <span>
                      {tag}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeTag(
                          index
                        )
                      }
                      className="text-white/30 transition hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {errors.tags && (
            <p className="mt-2 text-xs text-red-400">
              {errors.tags}
            </p>
          )}

          <p className="mt-3 text-[11px] text-white/20">
            Maximum 20 tags. Press Enter
            or comma to add a tag.
          </p>
        </section>

        {/* ====================================================
            CERTIFICATE
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="🏆"
            title="Certificate"
            description="Configure certificate generation after course completion."
          />

          <Checkbox
            checked={
              form.certificateEnabled
            }
            onChange={(checked) =>
              updateField(
                "certificateEnabled",
                checked
              )
            }
            label="Enable certificate for this course"
            description="Learners can receive a certificate after meeting the configured completion requirements."
          />

          {form.certificateEnabled && (
            <div className="mt-5 max-w-xl">
              <Input
                label="Certificate Name"
                value={
                  form.certificateName
                }
                onChange={(value) =>
                  updateField(
                    "certificateName",
                    value
                  )
                }
                placeholder="e.g. MERN Stack Development Certificate"
                error={
                  errors.certificateName
                }
                maxLength={200}
              />
            </div>
          )}
        </section>

        {/* ====================================================
            SEO
            ==================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <SectionHeader
            icon="🔎"
            title="SEO"
            description="Optional search-engine metadata for the course page."
          />

          <div className="space-y-5">
            <Input
              label="Meta Title"
              value={form.metaTitle}
              onChange={(value) =>
                updateField(
                  "metaTitle",
                  value
                )
              }
              placeholder="Course SEO title"
              error={
                errors.metaTitle
              }
              maxLength={70}
            />

            <Textarea
              label="Meta Description"
              value={
                form.metaDescription
              }
              onChange={(value) =>
                updateField(
                  "metaDescription",
                  value
                )
              }
              placeholder="Short description for search engines"
              rows={4}
              error={
                errors.metaDescription
              }
              maxLength={160}
            />
          </div>
        </section>

        {/* ====================================================
            SUBMIT
            ==================================================== */}

        <section className="sticky bottom-4 z-20 rounded-2xl border border-white/10 bg-[#090d1a]/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-white/80">
                Ready to create your
                course?
              </p>

              <p className="mt-1 text-xs text-white/30">
                You can save it as a draft
                and continue editing later.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">

              <Link
                href="/admin/courses"
                className="rounded-xl border border-white/10 px-5 py-2.5 text-center text-sm font-semibold text-white/55 transition hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </Link>

              <button
                type="button"
                disabled={saving}
                onClick={(event) => {
                  const form =
                    event.currentTarget.closest(
                      "form"
                    ) as HTMLFormElement | null;

                  if (!form) {
                    return;
                  }

                  const submitEvent =
                    new Event("submit", {
                      bubbles: true,
                      cancelable: true,
                    });

                  Object.defineProperty(
                    submitEvent,
                    "currentTarget",
                    {
                      value: form,
                    }
                  );

                  handleSubmit(
                    submitEvent as unknown as FormEvent<HTMLFormElement>,
                    "DRAFT"
                  );
                }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? "Saving..."
                  : "Save Draft"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={(event) => {
                  const form =
                    event.currentTarget.closest(
                      "form"
                    ) as HTMLFormElement | null;

                  if (!form) {
                    return;
                  }

                  const submitEvent =
                    new Event("submit", {
                      bubbles: true,
                      cancelable: true,
                    });

                  Object.defineProperty(
                    submitEvent,
                    "currentTarget",
                    {
                      value: form,
                    }
                  );

                  handleSubmit(
                    submitEvent as unknown as FormEvent<HTMLFormElement>,
                    "PUBLISHED"
                  );
                }}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? "Publishing..."
                  : "Create & Publish"}
              </button>

            </div>

          </div>
        </section>
      </form>
    </div>
  );
}