"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Course = {
  _id: string;
  title: string;
  slug?: string;
};

type FormData = {
  title: string;
  description: string;
  course: string;
  issuer: string;
  issuerName: string;
  issuerLogo: string;
  template: string;
  validity: "PERMANENT" | "LIMITED";
  validityDays: string;
  completionPercentage: string;
  minimumScore: string;
  requireFinalAssessment: boolean;
  isActive: boolean;
};

const initialForm: FormData = {
  title: "",
  description: "",
  course: "",
  issuer: "",
  issuerName: "",
  issuerLogo: "",
  template: "default",
  validity: "PERMANENT",
  validityDays: "",
  completionPercentage: "100",
  minimumScore: "",
  requireFinalAssessment: false,
  isActive: true,
};

export default function CreateCertificateClient() {
  const router = useRouter();

  const [form, setForm] =
    useState<FormData>(initialForm);

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * ============================================================
   * LOAD COURSES
   * ============================================================
   *
   * Adjust this endpoint only if your existing course API
   * uses a different route.
   */

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        setLoadingCourses(true);

        const response = await fetch(
          "/api/courses?limit=1000",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load courses"
          );
        }

        if (cancelled) return;

        const list =
          Array.isArray(data.courses)
            ? data.courses
            : Array.isArray(data.data)
            ? data.data
            : [];

        setCourses(
          list.map((course: any) => ({
            _id: String(course._id),
            title: String(
              course.title ||
                course.name ||
                "Untitled Course"
            ),
            slug: course.slug,
          }))
        );
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load courses"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ============================================================
   * UPDATE FIELD
   * ============================================================
   */

  function updateField<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  /*
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  function validate(): string | null {
    const title =
      form.title.trim();

    const description =
      form.description.trim();

    const issuer =
      form.issuer.trim();

    const issuerName =
      form.issuerName.trim();

    if (!title) {
      return "Certificate title is required.";
    }

    if (title.length < 3) {
      return "Certificate title must contain at least 3 characters.";
    }

    if (title.length > 200) {
      return "Certificate title cannot exceed 200 characters.";
    }

    if (description.length > 2000) {
      return "Description cannot exceed 2000 characters.";
    }

    if (!form.course) {
      return "Please select a course.";
    }

    if (!issuer) {
      return "Issuer is required.";
    }

    if (issuer.length > 200) {
      return "Issuer cannot exceed 200 characters.";
    }

    if (!issuerName) {
      return "Issuer name is required.";
    }

    if (issuerName.length > 200) {
      return "Issuer name cannot exceed 200 characters.";
    }

    if (
      form.issuerLogo.trim() &&
      form.issuerLogo.trim().length > 1000
    ) {
      return "Issuer logo URL is too long.";
    }

    if (!form.template.trim()) {
      return "Certificate template is required.";
    }

    if (
      form.validity === "LIMITED"
    ) {
      const days =
        Number(form.validityDays);

      if (
        !form.validityDays ||
        !Number.isInteger(days) ||
        days <= 0
      ) {
        return "Validity days must be a positive whole number.";
      }

      if (days > 36500) {
        return "Validity cannot exceed 100 years.";
      }
    }

    const completion =
      Number(
        form.completionPercentage
      );

    if (
      !Number.isFinite(completion) ||
      completion < 0 ||
      completion > 100
    ) {
      return "Completion percentage must be between 0 and 100.";
    }

    const minimumScore =
      form.minimumScore.trim()
        ? Number(form.minimumScore)
        : null;

    if (
      minimumScore !== null &&
      (!Number.isFinite(
        minimumScore
      ) ||
        minimumScore < 0 ||
        minimumScore > 100)
    ) {
      return "Minimum score must be between 0 and 100.";
    }

    return null;
  }

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: form.title.trim(),

        description:
          form.description.trim(),

        course: form.course,

        issuer: form.issuer.trim(),

        issuerName:
          form.issuerName.trim(),

        issuerLogo:
          form.issuerLogo.trim(),

        template:
          form.template.trim(),

        validity:
          form.validity,

        validityDays:
          form.validity ===
          "LIMITED"
            ? Number(
                form.validityDays
              )
            : null,

        requirements: {
          completionPercentage:
            Number(
              form.completionPercentage
            ),

          minimumScore:
            form.minimumScore.trim()
              ? Number(
                  form.minimumScore
                )
              : null,

          requireFinalAssessment:
            form.requireFinalAssessment,
        },

        isActive:
          form.isActive,
      };

      const response =
        await fetch(
          "/api/admin/certificates",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create certificate"
        );
      }

      setSuccess(
        "Certificate created successfully."
      );

      /*
       * Prefer opening the newly created certificate.
       */

      const certificateId =
        data.certificate?._id ||
        data.data?._id;

      if (certificateId) {
        router.push(
          `/admin/certificates/${certificateId}`
        );

        return;
      }

      router.push(
        "/admin/certificates"
      );
    } catch (err: any) {
      console.error(
        "Create certificate error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create certificate."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * ============================================================
   * CANCEL
   * ============================================================
   */

  function handleCancel() {
    if (
      submitting
    ) {
      return;
    }

    router.push(
      "/admin/certificates"
    );
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
        >
          {success}
        </div>
      )}

      {/* ====================================================== */}
      {/* BASIC INFORMATION */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <SectionHeader
          title="Basic Information"
          description="Define the certificate and the course it belongs to."
        />

        <div className="mt-6 grid gap-5">
          {/* Title */}
          <Field
            label="Certificate Title"
            required
            hint="Example: Full Stack Web Development Certificate"
          >
            <input
              type="text"
              value={form.title}
              maxLength={200}
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value
                )
              }
              placeholder="Enter certificate title"
              className={inputClass}
            />

            <CharacterCount
              value={form.title}
              max={200}
            />
          </Field>

          {/* Description */}
          <Field
            label="Description"
            hint="A short description shown with the certificate."
          >
            <textarea
              value={
                form.description
              }
              maxLength={2000}
              rows={4}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              placeholder="Describe what this certificate represents..."
              className={`${inputClass} min-h-[110px] resize-y py-3`}
            />

            <CharacterCount
              value={
                form.description
              }
              max={2000}
            />
          </Field>

          {/* Course */}
          <Field
            label="Course"
            required
            hint="The certificate will be associated with this course."
          >
            <select
              value={form.course}
              disabled={
                loadingCourses
              }
              onChange={(event) =>
                updateField(
                  "course",
                  event.target.value
                )
              }
              className={selectClass}
            >
              <option value="">
                {loadingCourses
                  ? "Loading courses..."
                  : "Select a course"}
              </option>

              {!loadingCourses &&
                courses.map(
                  (course) => (
                    <option
                      key={
                        course._id
                      }
                      value={
                        course._id
                      }
                    >
                      {
                        course.title
                      }
                    </option>
                  )
                )}
            </select>

            {!loadingCourses &&
              courses.length ===
                0 && (
                <p className="mt-2 text-xs text-amber-300/70">
                  No courses were returned
                  by the course API.
                </p>
              )}
          </Field>
        </div>
      </section>

      {/* ====================================================== */}
      {/* ISSUER */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <SectionHeader
          title="Issuer Information"
          description="Information displayed as the certificate issuer."
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field
            label="Issuer"
            required
          >
            <input
              type="text"
              value={form.issuer}
              maxLength={200}
              onChange={(event) =>
                updateField(
                  "issuer",
                  event.target.value
                )
              }
              placeholder="Example: Codelaunch Technologies"
              className={inputClass}
            />
          </Field>

          <Field
            label="Issuer Name"
            required
            hint="Name shown as the authorized issuer."
          >
            <input
              type="text"
              value={
                form.issuerName
              }
              maxLength={200}
              onChange={(event) =>
                updateField(
                  "issuerName",
                  event.target.value
                )
              }
              placeholder="Example: Learning & Development Team"
              className={inputClass}
            />
          </Field>

          <div className="md:col-span-2">
            <Field
              label="Issuer Logo URL"
              hint="Optional HTTPS image URL."
            >
              <input
                type="url"
                value={
                  form.issuerLogo
                }
                maxLength={1000}
                onChange={(event) =>
                  updateField(
                    "issuerLogo",
                    event.target.value
                  )
                }
                placeholder="https://example.com/logo.png"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* TEMPLATE */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <SectionHeader
          title="Certificate Template"
          description="Choose the template used when displaying or generating the certificate."
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TemplateOption
            value="default"
            label="Default"
            description="Standard certificate design"
            selected={
              form.template ===
              "default"
            }
            onClick={() =>
              updateField(
                "template",
                "default"
              )
            }
          />

          <TemplateOption
            value="classic"
            label="Classic"
            description="Traditional certificate layout"
            selected={
              form.template ===
              "classic"
            }
            onClick={() =>
              updateField(
                "template",
                "classic"
              )
            }
          />

          <TemplateOption
            value="modern"
            label="Modern"
            description="Clean modern certificate layout"
            selected={
              form.template ===
              "modern"
            }
            onClick={() =>
              updateField(
                "template",
                "modern"
              )
            }
          />
        </div>
      </section>

      {/* ====================================================== */}
      {/* VALIDITY */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <SectionHeader
          title="Certificate Validity"
          description="Configure how long issued certificates remain valid."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ChoiceCard
            selected={
              form.validity ===
              "PERMANENT"
            }
            title="Permanent"
            description="Certificate does not expire."
            onClick={() =>
              updateField(
                "validity",
                "PERMANENT"
              )
            }
          />

          <ChoiceCard
            selected={
              form.validity ===
              "LIMITED"
            }
            title="Limited Validity"
            description="Certificate expires after a defined number of days."
            onClick={() =>
              updateField(
                "validity",
                "LIMITED"
              )
            }
          />
        </div>

        {form.validity ===
          "LIMITED" && (
          <div className="mt-5 max-w-sm">
            <Field
              label="Validity Days"
              required
              hint="Example: 365"
            >
              <input
                type="number"
                min={1}
                max={36500}
                step={1}
                value={
                  form.validityDays
                }
                onChange={(event) =>
                  updateField(
                    "validityDays",
                    event.target.value
                  )
                }
                placeholder="365"
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </section>

      {/* ====================================================== */}
      {/* REQUIREMENTS */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <SectionHeader
          title="Eligibility Requirements"
          description="Define what a learner must complete before receiving the certificate."
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* Completion */}
          <Field
            label="Required Course Completion"
            required
            hint="Percentage of the course that must be completed."
          >
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={
                  form.completionPercentage
                }
                onChange={(event) =>
                  updateField(
                    "completionPercentage",
                    event.target.value
                  )
                }
                className={`${inputClass} pr-10`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/30">
                %
              </span>
            </div>
          </Field>

          {/* Score */}
          <Field
            label="Minimum Score"
            hint="Optional. Leave empty if no minimum score is required."
          >
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={
                  form.minimumScore
                }
                onChange={(event) =>
                  updateField(
                    "minimumScore",
                    event.target.value
                  )
                }
                placeholder="Optional"
                className={`${inputClass} pr-10`}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/30">
                %
              </span>
            </div>
          </Field>
        </div>

        {/* Final Assessment */}
        <div className="mt-5">
          <Toggle
            checked={
              form.requireFinalAssessment
            }
            onChange={(checked) =>
              updateField(
                "requireFinalAssessment",
                checked
              )
            }
            title="Require final assessment"
            description="Learners must complete the final assessment before the certificate can be issued."
          />
        </div>
      </section>

      {/* ====================================================== */}
      {/* STATUS */}
      {/* ====================================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <SectionHeader
          title="Certificate Status"
          description="Inactive certificates cannot be newly issued."
        />

        <div className="mt-6">
          <Toggle
            checked={
              form.isActive
            }
            onChange={(checked) =>
              updateField(
                "isActive",
                checked
              )
            }
            title="Active"
            description="Make this certificate available for issuance immediately."
          />
        </div>
      </section>

      {/* ====================================================== */}
      {/* ACTIONS */}
      {/* ====================================================== */}

      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-white/10 bg-[#101010]/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={submitting}
          onClick={
            handleCancel
          }
          className="h-11 rounded-xl border border-white/10 px-5 text-sm font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            submitting ||
            loadingCourses
          }
          className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Spinner />
              Creating...
            </>
          ) : (
            <>
              <span className="mr-2">
                ✓
              </span>
              Create Certificate
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/*
 * ============================================================
 * SECTION HEADER
 * ============================================================
 */

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-5 text-white/35">
        {description}
      </p>
    </div>
  );
}

/*
 * ============================================================
 * FIELD
 * ============================================================
 */

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/75">
        {label}

        {required && (
          <span className="ml-1 text-red-300">
            *
          </span>
        )}
      </label>

      {hint && (
        <p className="mt-1 text-xs text-white/30">
          {hint}
        </p>
      )}

      <div className="mt-2">
        {children}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * CHARACTER COUNT
 * ============================================================
 */

function CharacterCount({
  value,
  max,
}: {
  value: string;
  max: number;
}) {
  return (
    <div className="mt-1 text-right text-[11px] text-white/20">
      {value.length}/{max}
    </div>
  );
}

/*
 * ============================================================
 * TEMPLATE OPTION
 * ============================================================
 */

function TemplateOption({
  value,
  label,
  description,
  selected,
  onClick,
}: {
  value: string;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-white/30 bg-white/[0.08]"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">
          {label}
        </span>

        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
            selected
              ? "border-white bg-white text-black"
              : "border-white/20"
          }`}
        >
          {selected && (
            <span className="text-[10px] font-bold">
              ✓
            </span>
          )}
        </span>
      </div>

      <p className="mt-1 text-xs text-white/35">
        {description}
      </p>

      <span className="sr-only">
        {value}
      </span>
    </button>
  );
}

/*
 * ============================================================
 * CHOICE CARD
 * ============================================================
 */

function ChoiceCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-white/30 bg-white/[0.08]"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-white bg-white"
              : "border-white/20"
          }`}
        >
          {selected && (
            <span className="h-2 w-2 rounded-full bg-black" />
          )}
        </span>

        <div>
          <div className="text-sm font-semibold text-white">
            {title}
          </div>

          <div className="mt-1 text-xs leading-5 text-white/35">
            {description}
          </div>
        </div>
      </div>
    </button>
  );
}

/*
 * ============================================================
 * TOGGLE
 * ============================================================
 */

function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() =>
        onChange(!checked)
      }
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:bg-white/[0.05]"
    >
      <div>
        <div className="text-sm font-medium text-white">
          {title}
        </div>

        <div className="mt-1 text-xs leading-5 text-white/35">
          {description}
        </div>
      </div>

      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-white"
            : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full transition ${
            checked
              ? "left-6 bg-black"
              : "left-1 bg-white/40"
          }`}
        />
      </span>
    </button>
  );
}

/*
 * ============================================================
 * SPINNER
 * ============================================================
 */

function Spinner() {
  return (
    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
  );
}

/*
 * ============================================================
 * INPUT STYLES
 * ============================================================
 */

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.04]";

const selectClass =
  "w-full rounded-xl border border-white/10 bg-[#111] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50";