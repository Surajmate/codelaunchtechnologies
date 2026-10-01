"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

type Certificate = {
  _id: string;
  title: string;
  description?: string;
  course?: {
    _id: string;
    title: string;
    slug?: string;
    thumbnail?: string;
  } | null;

  issuer?: string;
  issuerName?: string;
  issuerLogo?: string;

  template?: string;

  validity?: string;
  validityDays?: number | null;

  requirements?: {
    completionPercentage?: number;
    minimumScore?: number | null;
    requireFinalAssessment?: boolean;
  };

  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
};

type IssuedCertificate = {
  _id: string;
  certificateNumber?: string;
  verificationCode?: string;

  user?: {
    _id: string;
    name?: string;
    email?: string;
    avatar?: string;
  } | null;

  status?: string;

  issuedAt?: string;
  expiresAt?: string | null;

  pdfUrl?: string;

  createdAt?: string;
};

type User = {
  _id: string;
  name?: string;
  email?: string;
  avatar?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;

  certificate?: Certificate;

  issuedCertificates?: IssuedCertificate[];

  certificates?: IssuedCertificate[];

  users?: User[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.04]";

const selectClass =
  "w-full rounded-xl border border-white/10 bg-[#111] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-white/25";

export default function CertificateAdminClient({
  certificateId,
}: {
  certificateId: string;
}) {
  const [certificate, setCertificate] =
    useState<Certificate | null>(null);

  const [
    issuedCertificates,
    setIssuedCertificates,
  ] = useState<IssuedCertificate[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [issuedLoading, setIssuedLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [showIssueModal, setShowIssueModal] =
    useState(false);

  const [showRevokeModal, setShowRevokeModal] =
    useState<IssuedCertificate | null>(
      null
    );

  const [actionLoading, setActionLoading] =
    useState(false);

  const [users, setUsers] =
    useState<User[]>([]);

  const [usersLoading, setUsersLoading] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState("");

  const [issueNotes, setIssueNotes] =
    useState("");

  const [form, setForm] =
    useState({
      title: "",
      description: "",
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
    });

  /*
   * ============================================================
   * LOAD CERTIFICATE
   * ============================================================
   */

  const loadCertificate =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/certificates/${certificateId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: ApiResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load certificate"
          );
        }

        if (!data.certificate) {
          throw new Error(
            "Certificate was not found"
          );
        }

        setCertificate(
          data.certificate
        );

        populateForm(
          data.certificate
        );
      } catch (err: any) {
        console.error(
          "Load certificate error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load certificate"
        );
      } finally {
        setLoading(false);
      }
    }, [certificateId]);

  /*
   * ============================================================
   * LOAD ISSUED CERTIFICATES
   * ============================================================
   */

  const loadIssuedCertificates =
    useCallback(async () => {
      try {
        setIssuedLoading(true);

        const response = await fetch(
          `/api/admin/certificates/${certificateId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: ApiResponse =
          await response.json();

        if (!response.ok) {
          return;
        }

        setIssuedCertificates(
          Array.isArray(
            data.issuedCertificates
          )
            ? data.issuedCertificates
            : Array.isArray(
                data.certificates
              )
            ? data.certificates
            : []
        );
      } catch (err) {
        console.error(
          "Load issued certificates error:",
          err
        );
      } finally {
        setIssuedLoading(false);
      }
    }, [certificateId]);

  useEffect(() => {
    loadCertificate();
    loadIssuedCertificates();
  }, [
    loadCertificate,
    loadIssuedCertificates,
  ]);

  /*
   * ============================================================
   * POPULATE FORM
   * ============================================================
   */

  function populateForm(
    data: Certificate
  ) {
    setForm({
      title: data.title || "",
      description:
        data.description || "",
      issuer: data.issuer || "",
      issuerName:
        data.issuerName || "",
      issuerLogo:
        data.issuerLogo || "",
      template:
        data.template || "default",
      validity:
        data.validity || "PERMANENT",
      validityDays:
        data.validityDays != null
          ? String(
              data.validityDays
            )
          : "",
      completionPercentage:
        String(
          data.requirements
            ?.completionPercentage ??
            100
        ),
      minimumScore:
        data.requirements
          ?.minimumScore != null
          ? String(
              data.requirements
                .minimumScore
            )
          : "",
      requireFinalAssessment:
        Boolean(
          data.requirements
            ?.requireFinalAssessment
        ),
      isActive:
        data.isActive !== false,
    });
  }

  /*
   * ============================================================
   * FORM UPDATE
   * ============================================================
   */

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  /*
   * ============================================================
   * VALIDATE
   * ============================================================
   */

  function validateForm(): string | null {
    if (!form.title.trim()) {
      return "Certificate title is required.";
    }

    if (
      form.title.trim().length <
      3
    ) {
      return "Certificate title must contain at least 3 characters.";
    }

    if (
      form.title.trim().length >
      200
    ) {
      return "Certificate title cannot exceed 200 characters.";
    }

    if (
      form.description.length >
      2000
    ) {
      return "Description cannot exceed 2000 characters.";
    }

    if (!form.issuer.trim()) {
      return "Issuer is required.";
    }

    if (
      !form.issuerName.trim()
    ) {
      return "Issuer name is required.";
    }

    if (
      form.validity ===
      "LIMITED"
    ) {
      const days =
        Number(
          form.validityDays
        );

      if (
        !Number.isInteger(
          days
        ) ||
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
      !Number.isFinite(
        completion
      ) ||
      completion < 0 ||
      completion > 100
    ) {
      return "Completion percentage must be between 0 and 100.";
    }

    if (
      form.minimumScore.trim()
    ) {
      const score =
        Number(
          form.minimumScore
        );

      if (
        !Number.isFinite(
          score
        ) ||
        score < 0 ||
        score > 100
      ) {
        return "Minimum score must be between 0 and 100.";
      }
    }

    return null;
  }

  /*
   * ============================================================
   * SAVE CHANGES
   * ============================================================
   */

  async function saveChanges() {
    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        issuer:
          form.issuer.trim(),

        issuerName:
          form.issuerName.trim(),

        issuerLogo:
          form.issuerLogo.trim(),

        template:
          form.template,

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
          `/api/admin/certificates/${certificateId}`,
          {
            method: "PATCH",

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
            "Unable to update certificate"
        );
      }

      if (data.certificate) {
        setCertificate(
          data.certificate
        );

        populateForm(
          data.certificate
        );
      }

      setEditing(false);

      setSuccess(
        "Certificate updated successfully."
      );
    } catch (err: any) {
      console.error(
        "Update certificate error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update certificate"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================================================
   * TOGGLE ACTIVE STATUS
   * ============================================================
   */

  async function toggleActive() {
    if (!certificate) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const nextStatus =
        !certificate.isActive;

      const response =
        await fetch(
          `/api/admin/certificates/${certificateId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              isActive:
                nextStatus,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update status"
        );
      }

      if (data.certificate) {
        setCertificate(
          data.certificate
        );

        populateForm(
          data.certificate
        );
      } else {
        setCertificate(
          (current) =>
            current
              ? {
                  ...current,
                  isActive:
                    nextStatus,
                }
              : current
        );

        setForm(
          (current) => ({
            ...current,
            isActive:
              nextStatus,
          })
        );
      }

      setSuccess(
        nextStatus
          ? "Certificate activated."
          : "Certificate deactivated."
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to update status"
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * ============================================================
   * LOAD ACTIVE USERS
   * ============================================================
   */

  async function loadUsers() {
    try {
      setUsersLoading(true);

      const response = await fetch(
        "/api/admin/users?status=ACTIVE&limit=1000",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load users"
        );
      }

      const list =
        Array.isArray(data.users)
          ? data.users
          : Array.isArray(
              data.data
            )
          ? data.data
          : [];

      setUsers(
        list.map(
          (user: any) => ({
            _id: String(
              user._id
            ),
            name:
              user.name ||
              user.fullName ||
              "",
            email:
              user.email ||
              "",
            avatar:
              user.avatar ||
              "",
          })
        )
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load users"
      );
    } finally {
      setUsersLoading(false);
    }
  }

  /*
   * ============================================================
   * OPEN ISSUE MODAL
   * ============================================================
   */

  function openIssueModal() {
    setSelectedUser("");
    setIssueNotes("");
    setError("");
    setSuccess("");

    setShowIssueModal(true);

    loadUsers();
  }

  /*
   * ============================================================
   * ISSUE CERTIFICATE
   * ============================================================
   */

  async function issueCertificate() {
    if (!selectedUser) {
      setError(
        "Please select a user."
      );
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          "/api/admin/certificates/issue",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              certificate:
                certificateId,

              user:
                selectedUser,

              notes:
                issueNotes.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to issue certificate"
        );
      }

      setShowIssueModal(
        false
      );

      setSelectedUser("");
      setIssueNotes("");

      setSuccess(
        "Certificate issued successfully."
      );

      await loadIssuedCertificates();
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to issue certificate"
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * ============================================================
   * REVOKE CERTIFICATE
   * ============================================================
   */

  async function revokeCertificate() {
    if (!showRevokeModal) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/admin/certificates/${showRevokeModal._id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status: "REVOKED",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to revoke certificate"
        );
      }

      setShowRevokeModal(
        null
      );

      setSuccess(
        "Issued certificate revoked successfully."
      );

      await loadIssuedCertificates();
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to revoke certificate"
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * ============================================================
   * FORMAT DATE
   * ============================================================
   */

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

  /*
   * ============================================================
   * STATUS CLASS
   * ============================================================
   */

  function statusClass(
    status?: string
  ) {
    switch (
      status?.toUpperCase()
    ) {
      case "ACTIVE":
      case "ISSUED":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "REVOKED":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      case "EXPIRED":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";

      default:
        return "border-white/10 bg-white/5 text-white/40";
    }
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03] lg:col-span-2" />

          <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ERROR / NOT FOUND
   * ============================================================
   */

  if (!certificate) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center">
        <div className="text-3xl">
          ⚠
        </div>

        <h2 className="mt-3 text-lg font-semibold text-white">
          Certificate not found
        </h2>

        <p className="mt-2 text-sm text-red-200/60">
          {error ||
            "The requested certificate could not be loaded."}
        </p>

        <Link
          href="/admin/certificates"
          className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
        >
          Back to Certificates
        </Link>
      </div>
    );
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-6">
      {/* ====================================================== */}
      {/* GLOBAL MESSAGES */}
      {/* ====================================================== */}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="text-white/50 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          <span>{success}</span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            className="text-white/50 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* ====================================================== */}
      {/* TOP BAR */}
      {/* ====================================================== */}

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
            {certificate.issuerLogo ? (
              <img
                src={
                  certificate.issuerLogo
                }
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              "🏆"
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              {certificate.title}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/35">
              <span>
                {certificate.course
                  ?.title ||
                  "Course"}
              </span>

              <span>
                •
              </span>

              <span
                className={`rounded-full border px-2 py-0.5 ${statusClass(
                  certificate.isActive
                    ? "ACTIVE"
                    : "INACTIVE"
                )}`}
              >
                {certificate.isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/certificates"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
          >
            Back
          </Link>

          {!editing && (
            <button
              type="button"
              onClick={() =>
                setEditing(true)
              }
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white"
            >
              Edit
            </button>
          )}

          <button
            type="button"
            disabled={
              actionLoading
            }
            onClick={
              toggleActive
            }
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${
              certificate.isActive
                ? "border border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/15"
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {actionLoading
              ? "Updating..."
              : certificate.isActive
              ? "Disable"
              : "Activate"}
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* MAIN GRID */}
      {/* ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ==================================================== */}
        {/* DETAILS */}
        {/* ==================================================== */}

        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Certificate Configuration
                </h3>

                <p className="mt-1 text-sm text-white/35">
                  Certificate definition and eligibility settings.
                </p>
              </div>
            </div>

            {editing ? (
              <div className="mt-6 space-y-5">
                {/* Title */}
                <Field label="Title">
                  <input
                    value={form.title}
                    maxLength={200}
                    onChange={(event) =>
                      updateField(
                        "title",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                {/* Description */}
                <Field label="Description">
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    className={`${inputClass} resize-y`}
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Issuer">
                    <input
                      value={
                        form.issuer
                      }
                      maxLength={200}
                      onChange={(event) =>
                        updateField(
                          "issuer",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Issuer Name">
                    <input
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
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Issuer Logo URL">
                  <input
                    type="url"
                    value={
                      form.issuerLogo
                    }
                    onChange={(event) =>
                      updateField(
                        "issuerLogo",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Template">
                    <select
                      value={
                        form.template
                      }
                      onChange={(event) =>
                        updateField(
                          "template",
                          event.target.value
                        )
                      }
                      className={selectClass}
                    >
                      <option value="default">
                        Default
                      </option>

                      <option value="classic">
                        Classic
                      </option>

                      <option value="modern">
                        Modern
                      </option>
                    </select>
                  </Field>

                  <Field label="Validity">
                    <select
                      value={
                        form.validity
                      }
                      onChange={(event) =>
                        updateField(
                          "validity",
                          event.target.value
                        )
                      }
                      className={selectClass}
                    >
                      <option value="PERMANENT">
                        Permanent
                      </option>

                      <option value="LIMITED">
                        Limited
                      </option>
                    </select>
                  </Field>
                </div>

                {form.validity ===
                  "LIMITED" && (
                  <Field label="Validity Days">
                    <input
                      type="number"
                      min={1}
                      max={36500}
                      value={
                        form.validityDays
                      }
                      onChange={(event) =>
                        updateField(
                          "validityDays",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Completion Percentage">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
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

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                        %
                      </span>
                    </div>
                  </Field>

                  <Field label="Minimum Score">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
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

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                        %
                      </span>
                    </div>
                  </Field>
                </div>

                <Toggle
                  checked={
                    form.requireFinalAssessment
                  }
                  onChange={(value) =>
                    updateField(
                      "requireFinalAssessment",
                      value
                    )
                  }
                  title="Require final assessment"
                  description="Require the learner to complete the final assessment."
                />

                <Toggle
                  checked={
                    form.isActive
                  }
                  onChange={(value) =>
                    updateField(
                      "isActive",
                      value
                    )
                  }
                  title="Active"
                  description="Allow this certificate to be issued."
                />

                <div className="flex justify-end gap-2 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() => {
                      setEditing(false);

                      if (
                        certificate
                      ) {
                        populateForm(
                          certificate
                        );
                      }

                      setError("");
                    }}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      saveChanges
                    }
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <CertificateInformation
                certificate={
                  certificate
                }
              />
            )}
          </section>
        </div>

        {/* ==================================================== */}
        {/* SIDE PANEL */}
        {/* ==================================================== */}

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">
              Certificate Status
            </h3>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-white/40">
                Current status
              </span>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                  certificate.isActive
                    ? "ACTIVE"
                    : "INACTIVE"
                )}`}
              >
                {certificate.isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-white/40">
                Created
              </span>

              <span className="text-sm text-white/70">
                {formatDate(
                  certificate.createdAt
                )}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-white/40">
                Updated
              </span>

              <span className="text-sm text-white/70">
                {formatDate(
                  certificate.updatedAt
                )}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">
              Eligibility
            </h3>

            <div className="mt-5 space-y-4">
              <InfoRow
                label="Completion"
                value={`${certificate.requirements?.completionPercentage ?? 100}%`}
              />

              <InfoRow
                label="Minimum Score"
                value={
                  certificate.requirements
                    ?.minimumScore !=
                  null
                    ? `${certificate.requirements.minimumScore}%`
                    : "Not required"
                }
              />

              <InfoRow
                label="Final Assessment"
                value={
                  certificate
                    .requirements
                    ?.requireFinalAssessment
                    ? "Required"
                    : "Not required"
                }
              />

              <InfoRow
                label="Validity"
                value={
                  certificate.validity ===
                  "LIMITED"
                    ? `${certificate.validityDays || 0} days`
                    : "Permanent"
                }
              />
            </div>
          </section>
        </div>
      </div>

      {/* ====================================================== */}
      {/* ISSUED CERTIFICATES */}
      {/* ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              Issued Certificates
            </h3>

            <p className="mt-1 text-sm text-white/35">
              Certificates issued using this definition.
            </p>
          </div>

          <button
            type="button"
            disabled={
              !certificate.isActive
            }
            onClick={
              openIssueModal
            }
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Issue Certificate
          </button>
        </div>

        {issuedLoading ? (
          <div className="p-8 text-center text-sm text-white/30">
            Loading issued certificates...
          </div>
        ) : issuedCertificates.length ===
          0 ? (
          <div className="p-12 text-center">
            <div className="text-2xl">
              📜
            </div>

            <h4 className="mt-3 text-sm font-semibold text-white">
              No certificates issued
            </h4>

            <p className="mt-1 text-sm text-white/30">
              No user has received this certificate yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    User
                  </th>

                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    Certificate No.
                  </th>

                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    Issued
                  </th>

                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    Expires
                  </th>

                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/30">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-white/30">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {issuedCertificates.map(
                  (item) => (
                    <tr
                      key={
                        item._id
                      }
                      className="border-b border-white/[0.06] hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-white">
                          {item.user
                            ?.name ||
                            "Unknown User"}
                        </div>

                        <div className="mt-0.5 text-xs text-white/30">
                          {
                            item.user
                              ?.email
                          }
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <code className="rounded-lg bg-white/[0.04] px-2 py-1 text-xs text-white/60">
                          {item.certificateNumber ||
                            "—"}
                        </code>
                      </td>

                      <td className="px-5 py-4 text-sm text-white/60">
                        {formatDate(
                          item.issuedAt
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-white/60">
                        {formatDate(
                          item.expiresAt
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                            item.status
                          )}`}
                        >
                          {item.status ||
                            "UNKNOWN"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {item.status !==
                          "REVOKED" && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowRevokeModal(
                                item
                              )
                            }
                            className="rounded-lg px-3 py-2 text-xs font-medium text-red-300/70 hover:bg-red-400/10 hover:text-red-300"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ====================================================== */}
      {/* ISSUE MODAL */}
      {/* ====================================================== */}

      {showIssueModal && (
        <Modal
          title="Issue Certificate"
          description="Select an active user to issue this certificate."
          onClose={() =>
            setShowIssueModal(false)
          }
        >
          <div className="space-y-5">
            <Field
              label="User"
              required
            >
              <select
                value={
                  selectedUser
                }
                disabled={
                  usersLoading ||
                  actionLoading
                }
                onChange={(event) =>
                  setSelectedUser(
                    event.target.value
                  )
                }
                className={selectClass}
              >
                <option value="">
                  {usersLoading
                    ? "Loading active users..."
                    : "Select active user"}
                </option>

                {!usersLoading &&
                  users.map(
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
                          ? `— ${user.email}`
                          : ""}
                      </option>
                    )
                  )}
              </select>

              {!usersLoading &&
                users.length ===
                  0 && (
                  <p className="mt-2 text-xs text-amber-300/70">
                    No active users were found.
                  </p>
                )}
            </Field>

            <Field
              label="Notes"
              hint="Optional internal note."
            >
              <textarea
                rows={3}
                maxLength={1000}
                value={
                  issueNotes
                }
                onChange={(event) =>
                  setIssueNotes(
                    event.target.value
                  )
                }
                placeholder="Optional issuance note..."
                className={`${inputClass} resize-y`}
              />
            </Field>

            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200/70">
              Issuing a certificate creates a permanent
              user certificate record and generates a
              unique certificate number and verification
              code.
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 pt-5">
              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  setShowIssueModal(
                    false
                  )
                }
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  actionLoading ||
                  usersLoading ||
                  !selectedUser
                }
                onClick={
                  issueCertificate
                }
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actionLoading
                  ? "Issuing..."
                  : "Issue Certificate"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ====================================================== */}
      {/* REVOKE MODAL */}
      {/* ====================================================== */}

      {showRevokeModal && (
        <Modal
          title="Revoke Certificate"
          description="This will mark the issued certificate as revoked."
          onClose={() =>
            !actionLoading &&
            setShowRevokeModal(
              null
            )
          }
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <div className="text-sm font-medium text-red-200">
                Are you sure?
              </div>

              <p className="mt-1 text-xs leading-5 text-red-200/60">
                The certificate issued to{" "}
                <span className="font-medium text-red-100">
                  {showRevokeModal
                    .user
                    ?.name ||
                    showRevokeModal
                      .user
                      ?.email ||
                    "this user"}
                </span>{" "}
                will be marked as revoked.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={() =>
                  setShowRevokeModal(
                    null
                  )
                }
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  actionLoading
                }
                onClick={
                  revokeCertificate
                }
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500/90 disabled:opacity-40"
              >
                {actionLoading
                  ? "Revoking..."
                  : "Revoke Certificate"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/*
 * ============================================================
 * CERTIFICATE INFORMATION
 * ============================================================
 */

function CertificateInformation({
  certificate,
}: {
  certificate: Certificate;
}) {
  return (
    <div className="mt-6 space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-white/25">
          Description
        </div>

        <p className="mt-2 text-sm leading-6 text-white/55">
          {certificate.description ||
            "No description provided."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <InfoBlock
          label="Course"
          value={
            certificate.course
              ?.title ||
            "—"
          }
        />

        <InfoBlock
          label="Issuer"
          value={
            certificate.issuer ||
            "—"
          }
        />

        <InfoBlock
          label="Issuer Name"
          value={
            certificate.issuerName ||
            "—"
          }
        />

        <InfoBlock
          label="Template"
          value={
            certificate.template ||
            "default"
          }
        />

        <InfoBlock
          label="Validity"
          value={
            certificate.validity ===
            "LIMITED"
              ? `${
                  certificate.validityDays ||
                  0
                } days`
              : "Permanent"
          }
        />

        <InfoBlock
          label="Completion Required"
          value={`${certificate.requirements?.completionPercentage ?? 100}%`}
        />

        <InfoBlock
          label="Minimum Score"
          value={
            certificate.requirements
              ?.minimumScore !=
            null
              ? `${certificate.requirements.minimumScore}%`
              : "Not required"
          }
        />

        <InfoBlock
          label="Final Assessment"
          value={
            certificate.requirements
              ?.requireFinalAssessment
              ? "Required"
              : "Not required"
          }
        />
      </div>
    </div>
  );
}

/*
 * ============================================================
 * INFO BLOCK
 * ============================================================
 */

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4">
      <div className="text-xs text-white/30">
        {label}
      </div>

      <div className="mt-1.5 text-sm font-medium text-white/75">
        {value}
      </div>
    </div>
  );
}

/*
 * ============================================================
 * INFO ROW
 * ============================================================
 */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/40">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-white/70">
        {value}
      </span>
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
      <label className="block text-sm font-medium text-white/70">
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
    value: boolean
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
 * MODAL
 * ============================================================
 */

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-white/35">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-white/40 hover:bg-white/[0.05] hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}