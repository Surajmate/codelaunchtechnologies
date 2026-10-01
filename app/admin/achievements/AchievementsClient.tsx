"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Trophy,
  User,
  Users,
  X,
  Lock,
} from "lucide-react";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

interface UserInfo {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

interface ActiveUser {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

interface Achievement {
  _id: string;

  user:
    | string
    | UserInfo
    | null;

  title: string;

  description?: string;

  type?: string;

  progress?: number;

  status?: string;

  createdAt?: string;

  updatedAt?: string;
}

interface Stats {
  total?: number;
  completed?: number;
  inProgress?: number;
  locked?: number;
  users?: number;
  [key: string]: unknown;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;

  data?: Achievement[];

  stats?: Stats;

  pagination?: Pagination;

  users?: ActiveUser[];
}

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getUserInfo(
  user?: UserInfo | string | null
): UserInfo | null {
  if (!user) {
    return null;
  }

  if (typeof user === "string") {
    return {
      _id: user,
    };
  }

  return user;
}

function getUserName(
  user?: UserInfo | string | null
): string {
  const info = getUserInfo(user);

  if (!info) {
    return "Unknown User";
  }

  return (
    info.name ||
    info.email ||
    "Unknown User"
  );
}

function getUserEmail(
  user?: UserInfo | string | null
): string {
  const info = getUserInfo(user);

  return info?.email || "";
}

function formatDate(
  value?: string | null
): string {
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

function formatDateTime(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

function getStatusLabel(
  status?: string
): string {
  switch (status) {
    case "COMPLETED":
      return "Completed";

    case "IN_PROGRESS":
      return "In Progress";

    case "LOCKED":
      return "Locked";

    default:
      return status || "Unknown";
  }
}

function getStatusClass(
  status?: string
): string {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "IN_PROGRESS":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "LOCKED":
      return "border-white/10 bg-white/5 text-white/40";

    default:
      return "border-white/10 bg-white/5 text-white/50";
  }
}

function getStatusIcon(
  status?: string
) {
  switch (status) {
    case "COMPLETED":
      return CheckCircle2;

    case "IN_PROGRESS":
      return Clock3;

    case "LOCKED":
      return Lock;

    default:
      return Award;
  }
}

/*
 * ============================================================
 * FORM INPUT
 * ============================================================
 */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-white/45">
        {label}

        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.03]"
      />
    </div>
  );
}

/*
 * ============================================================
 * FORM TEXTAREA
 * ============================================================
 */

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-white/45">
        {label}

        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        rows={4}
        className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.03]"
      />
    </div>
  );
}

/*
 * ============================================================
 * FORM SELECT
 * ============================================================
 */

function FormSelect({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-white/45">
        {label}

        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-white/10 bg-[#090d18] px-4 text-sm text-white outline-none transition focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/*
 * ============================================================
 * ACTIVE USER SELECT
 * ============================================================
 */

function ActiveUserSelect({
  users,
  value,
  onChange,
  loading,
  error,
}: {
  users: ActiveUser[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  error: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-white/45">
        Select User
        <span className="ml-1 text-red-400">
          *
        </span>
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          required
          disabled={
            loading ||
            users.length === 0
          }
          className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#090d18] px-4 pr-10 text-sm text-white outline-none transition focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {loading
              ? "Loading active users..."
              : users.length === 0
                ? "No active users found"
                : "Select an active user"}
          </option>

          {users.map((user) => (
            <option
              key={user._id}
              value={user._id}
            >
              {user.name ||
                user.email ||
                "Unnamed User"}
              {user.email &&
              user.name
                ? ` — ${user.email}`
                : ""}
            </option>
          ))}
        </select>

        {loading ? (
          <Loader2
            size={16}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-white/30"
          />
        ) : (
          <ChevronRight
            size={16}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-white/30"
          />
        )}
      </div>

      {value && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-white/30">
          <User size={12} />

          <span>
            {
              users.find(
                (user) =>
                  user._id === value
              )?.email
            }
          </span>
        </div>
      )}

      {error && (
        <div className="mt-2 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-[11px] text-red-400">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        users.length === 0 && (
          <p className="mt-2 text-[11px] text-white/25">
            There are currently no active users
            available for assignment.
          </p>
        )}
    </div>
  );
}

/*
 * ============================================================
 * MODAL
 * ============================================================
 */

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#090d18] shadow-2xl ${
          wide
            ? "max-w-3xl"
            : "max-w-2xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#090d18]/95 px-6 py-5 backdrop-blur">
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * MODAL ACTIONS
 * ============================================================
 */

function ModalActions({
  saving,
  submitLabel,
  onCancel,
}: {
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/50 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving && (
          <Loader2
            size={15}
            className="animate-spin"
          />
        )}

        {saving
          ? "Saving..."
          : submitLabel}
      </button>
    </div>
  );
}

/*
 * ============================================================
 * STAT CARD
 * ============================================================
 */

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  icon: typeof Trophy;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/30">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {value}
          </p>

          <p className="mt-1 text-[10px] text-white/20">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Icon
            size={17}
            className="text-white/50"
          />
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * LOADING STATE
 * ============================================================
 */

function LoadingState() {
  return (
    <div className="divide-y divide-white/[0.06]">
      {[1, 2, 3, 4].map(
        (item) => (
          <div
            key={item}
            className="animate-pulse p-5"
          >
            <div className="h-4 w-1/3 rounded bg-white/5" />

            <div className="mt-3 h-3 w-1/2 rounded bg-white/5" />

            <div className="mt-5 h-2 w-full rounded bg-white/5" />

            <div className="mt-4 h-3 w-1/4 rounded bg-white/5" />
          </div>
        )
      )}
    </div>
  );
}

/*
 * ============================================================
 * EMPTY STATE
 * ============================================================
 */

function EmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Trophy
          size={22}
          className="text-white/40"
        />
      </div>

      <h3 className="mt-4 text-sm font-semibold">
        No achievements found
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/30">
        There are no achievements matching
        your current search and filters.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90"
      >
        + Assign Achievement
      </button>
    </div>
  );
}

/*
 * ============================================================
 * PAGINATION
 * ============================================================
 */

function Pagination({
  pagination,
  onPrevious,
  onNext,
}: {
  pagination: Pagination;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-4">
      <div className="text-xs text-white/30">
        Page{" "}
        <span className="text-white/60">
          {pagination.page}
        </span>{" "}
        of{" "}
        <span className="text-white/60">
          {Math.max(
            1,
            pagination.totalPages
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={
            !pagination.hasPreviousPage
          }
          onClick={onPrevious}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={13} />
          Previous
        </button>

        <button
          type="button"
          disabled={
            !pagination.hasNextPage
          }
          onClick={onNext}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * DETAILS PANEL
 * ============================================================
 */

function DetailsPanel({
  achievement,
  onClose,
  onEdit,
  onDelete,
}: {
  achievement: Achievement;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const user = getUserInfo(
    achievement.user
  );

  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(
        achievement.progress ?? 0
      )
    )
  );

  const StatusIcon =
    getStatusIcon(
      achievement.status
    );

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#090d18] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#090d18]/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
              Achievement Details
            </p>

            <h2 className="mt-1 text-lg font-semibold">
              {achievement.title ||
                "Untitled Achievement"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Status */}

          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${getStatusClass(
                achievement.status
              )}`}
            >
              <StatusIcon size={13} />

              {getStatusLabel(
                achievement.status
              )}
            </span>

            {achievement.type && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40">
                {achievement.type}
              </span>
            )}
          </div>

          {/* User */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
              Assigned User
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/70">
                {getUserName(
                  achievement.user
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {getUserName(
                    achievement.user
                  )}
                </p>

                {getUserEmail(
                  achievement.user
                ) && (
                  <p className="mt-1 truncate text-xs text-white/30">
                    {getUserEmail(
                      achievement.user
                    )}
                  </p>
                )}
              </div>
            </div>

            {user?._id && (
              <p className="mt-4 break-all text-[10px] text-white/15">
                User ID: {user._id}
              </p>
            )}
          </div>

          {/* Description */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
              Description
            </p>

            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/50">
              {achievement.description ||
                "No description provided."}
            </p>
          </div>

          {/* Progress */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                Progress
              </p>

              <p className="text-sm font-semibold text-white">
                {progress}%
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          {/* Dates */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] text-white/25">
                Created
              </p>

              <p className="mt-2 text-xs text-white/50">
                {formatDateTime(
                  achievement.createdAt
                )}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[10px] text-white/25">
                Updated
              </p>

              <p className="mt-2 text-xs text-white/50">
                {formatDateTime(
                  achievement.updatedAt
                )}
              </p>
            </div>
          </div>

          {/* Actions */}

          <div className="flex gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              <Edit3 size={15} />
              Edit
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/10 px-4 py-3 text-sm text-red-400/70 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

export default function AchievementsClient() {
  /*
   * ----------------------------------------------------------
   * DATA
   * ----------------------------------------------------------
   */

  const [achievements, setAchievements] =
    useState<Achievement[]>([]);

  const [stats, setStats] =
    useState<Stats | null>(null);

  const [activeUsers, setActiveUsers] =
    useState<ActiveUser[]>([]);

  /*
   * ----------------------------------------------------------
   * PAGINATION
   * ----------------------------------------------------------
   */

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 15,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [page, setPage] =
    useState(1);

  /*
   * ----------------------------------------------------------
   * FILTERS
   * ----------------------------------------------------------
   */

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [type, setType] =
    useState("ALL");

  /*
   * ----------------------------------------------------------
   * LOADING
   * ----------------------------------------------------------
   */

  const [loading, setLoading] =
    useState(true);

  const [statsLoading, setStatsLoading] =
    useState(true);

  const [usersLoading, setUsersLoading] =
    useState(true);

  /*
   * ----------------------------------------------------------
   * ERRORS
   * ----------------------------------------------------------
   */

  const [error, setError] =
    useState("");

  const [usersError, setUsersError] =
    useState("");

  /*
   * ----------------------------------------------------------
   * UI
   * ----------------------------------------------------------
   */

  const [
    selectedAchievement,
    setSelectedAchievement,
  ] = useState<Achievement | null>(
    null
  );

  const [showCreate, setShowCreate] =
    useState(false);

  const [showEdit, setShowEdit] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  /*
   * ----------------------------------------------------------
   * CREATE FORM
   * ----------------------------------------------------------
   */

  const [createForm, setCreateForm] =
    useState({
      user: "",
      title: "",
      description: "",
      type: "COURSE",
      progress: "0",
      status: "LOCKED",
    });

  /*
   * ----------------------------------------------------------
   * EDIT FORM
   * ----------------------------------------------------------
   */

  const [editForm, setEditForm] =
    useState({
      title: "",
      description: "",
      type: "",
      progress: "0",
      status: "LOCKED",
    });

  /*
   * ==========================================================
   * LOAD ACTIVE USERS
   * ==========================================================
   */

  const loadActiveUsers =
    useCallback(async () => {
      try {
        setUsersLoading(true);
        setUsersError("");

        const response =
          await fetch(
            "/api/admin/achievements/users",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result: ApiResponse =
          await response
            .json()
            .catch(() => ({}));

        console.log(
          "[ADMIN ACHIEVEMENTS USERS]",
          result
        );

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
              result.error ||
              "Unable to load active users"
          );
        }

        const users =
          Array.isArray(result.users)
            ? result.users
            : [];

        /*
         * Only keep active users.
         *
         * This is an additional frontend safety
         * check even though the API should already
         * return active users only.
         */

        const activeOnly =
          users.filter(
            (user) => {
              if (!user.status) {
                return true;
              }

              return (
                user.status ===
                  "ACTIVE" ||
                user.status ===
                  "active"
              );
            }
          );

        setActiveUsers(
          activeOnly
        );
      } catch (err) {
        console.error(
          "[ADMIN ACHIEVEMENTS USERS] ERROR:",
          err
        );

        setActiveUsers([]);

        setUsersError(
          err instanceof Error
            ? err.message
            : "Unable to load active users"
        );
      } finally {
        setUsersLoading(false);
      }
    }, []);

  /*
   * ==========================================================
   * LOAD ACHIEVEMENTS
   * ==========================================================
   */

  const loadAchievements =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(page)
        );

        params.set(
          "limit",
          String(
            pagination.limit
          )
        );

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (status !== "ALL") {
          params.set(
            "status",
            status
          );
        }

        if (type !== "ALL") {
          params.set(
            "type",
            type
          );
        }

        const response =
          await fetch(
            `/api/admin/achievements?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result: ApiResponse =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
              result.error ||
              "Unable to load achievements"
          );
        }

        setAchievements(
          Array.isArray(
            result.data
          )
            ? result.data
            : []
        );

        if (result.pagination) {
          setPagination(
            result.pagination
          );
        }
      } catch (err) {
        console.error(
          "[ADMIN ACHIEVEMENTS] LOAD ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load achievements"
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      pagination.limit,
      search,
      status,
      type,
    ]);

  /*
   * ==========================================================
   * LOAD STATS
   * ==========================================================
   */

  const loadStats =
    useCallback(async () => {
      try {
        setStatsLoading(true);

        const response =
          await fetch(
            "/api/admin/achievements/stats",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result: ApiResponse =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
              result.error ||
              "Unable to load statistics"
          );
        }

        setStats(
          result.stats ||
            (result.data as unknown as Stats) ||
            null
        );
      } catch (err) {
        console.error(
          "[ADMIN ACHIEVEMENTS] STATS ERROR:",
          err
        );
      } finally {
        setStatsLoading(false);
      }
    }, []);

  /*
   * ==========================================================
   * INITIAL LOAD
   * ==========================================================
   */

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadActiveUsers();
  }, [loadActiveUsers]);

  /*
   * ==========================================================
   * OPEN CREATE
   * ==========================================================
   */

  function openCreate() {
    setCreateForm({
      user: "",
      title: "",
      description: "",
      type: "COURSE",
      progress: "0",
      status: "LOCKED",
    });

    setUsersError("");

    setShowCreate(true);

    /*
     * Refresh users when opening the form.
     * This makes sure newly activated users
     * appear without a full page refresh.
     */

    loadActiveUsers();
  }

  /*
   * ==========================================================
   * SEARCH
   * ==========================================================
   */

  function handleSearch(
    value: string
  ) {
    setSearch(value);
    setPage(1);
  }

  /*
   * ==========================================================
   * STATUS
   * ==========================================================
   */

  function handleStatus(
    value: string
  ) {
    setStatus(value);
    setPage(1);
  }

  /*
   * ==========================================================
   * TYPE
   * ==========================================================
   */

  function handleType(
    value: string
  ) {
    setType(value);
    setPage(1);
  }

  /*
   * ==========================================================
   * OPEN EDIT
   * ==========================================================
   */

  function openEdit(
    achievement: Achievement
  ) {
    setSelectedAchievement(
      achievement
    );

    setEditForm({
      title:
        achievement.title || "",

      description:
        achievement.description ||
        "",

      type:
        achievement.type || "",

      progress: String(
        achievement.progress ?? 0
      ),

      status:
        achievement.status ||
        "LOCKED",
    });

    setShowEdit(true);
  }

  /*
   * ==========================================================
   * CREATE ACHIEVEMENT
   * ==========================================================
   */

  async function createAchievement(
    event: FormEvent
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    try {
      setSaving(true);

      if (!createForm.user) {
        throw new Error(
          "Please select an active user"
        );
      }

      if (
        !createForm.title.trim()
      ) {
        throw new Error(
          "Achievement title is required"
        );
      }

      const progress =
        Number(
          createForm.progress
        );

      if (
        Number.isNaN(progress) ||
        progress < 0 ||
        progress > 100
      ) {
        throw new Error(
          "Progress must be between 0 and 100"
        );
      }

      /*
       * IMPORTANT:
       *
       * The selected dropdown value is the
       * actual MongoDB User _id.
       */

      const response =
        await fetch(
          "/api/admin/achievements",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              userId:
                createForm.user,

              title:
                createForm.title.trim(),

              description:
                createForm.description.trim(),

              type:
                createForm.type.trim(),

              progress,

              status:
                createForm.status,
            }),
          }
        );

      const result: ApiResponse =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            result.error ||
            "Unable to create achievement"
        );
      }

      setCreateForm({
        user: "",
        title: "",
        description: "",
        type: "COURSE",
        progress: "0",
        status: "LOCKED",
      });

      setShowCreate(false);

      await Promise.all([
        loadAchievements(),
        loadStats(),
      ]);
    } catch (err) {
      console.error(
        "[ADMIN ACHIEVEMENTS] CREATE ERROR:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Unable to create achievement"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ==========================================================
   * UPDATE ACHIEVEMENT
   * ==========================================================
   */

  async function updateAchievement(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      saving ||
      !selectedAchievement
    ) {
      return;
    }

    try {
      setSaving(true);

      if (
        !editForm.title.trim()
      ) {
        throw new Error(
          "Achievement title is required"
        );
      }

      const progress =
        Number(
          editForm.progress
        );

      if (
        Number.isNaN(progress) ||
        progress < 0 ||
        progress > 100
      ) {
        throw new Error(
          "Progress must be between 0 and 100"
        );
      }

      const response =
        await fetch(
          `/api/admin/achievements/${selectedAchievement._id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              title:
                editForm.title.trim(),

              description:
                editForm.description.trim(),

              type:
                editForm.type.trim(),

              progress,

              status:
                editForm.status,
            }),
          }
        );

      const result: ApiResponse =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            result.error ||
            "Unable to update achievement"
        );
      }

      setShowEdit(false);
      setSelectedAchievement(
        null
      );

      await Promise.all([
        loadAchievements(),
        loadStats(),
      ]);
    } catch (err) {
      console.error(
        "[ADMIN ACHIEVEMENTS] UPDATE ERROR:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Unable to update achievement"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ==========================================================
   * DELETE ACHIEVEMENT
   * ==========================================================
   */

  async function deleteAchievement(
    id: string
  ) {
    if (saving) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this achievement?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setDeleteId(id);

      const response =
        await fetch(
          `/api/admin/achievements/${id}`,
          {
            method: "DELETE",
          }
        );

      const result: ApiResponse =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            result.error ||
            "Unable to delete achievement"
        );
      }

      if (
        selectedAchievement?._id ===
        id
      ) {
        setSelectedAchievement(
          null
        );
      }

      await Promise.all([
        loadAchievements(),
        loadStats(),
      ]);
    } catch (err) {
      console.error(
        "[ADMIN ACHIEVEMENTS] DELETE ERROR:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete achievement"
      );
    } finally {
      setSaving(false);
      setDeleteId(null);
    }
  }

  /*
   * ==========================================================
   * ACHIEVEMENT TYPES
   * ==========================================================
   */

  const achievementTypes =
    useMemo(() => {
      const values =
        achievements
          .map(
            (item) =>
              item.type
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          );

      return Array.from(
        new Set(values)
      ).sort();
    }, [achievements]);

  /*
   * ==========================================================
   * SAFE STATS
   * ==========================================================
   */

  const total =
    Number(
      stats?.total ??
        pagination.total ??
        0
    );

  const completed =
    Number(
      stats?.completed ?? 0
    );

  const inProgress =
    Number(
      stats?.inProgress ?? 0
    );

  const locked =
    Number(
      stats?.locked ?? 0
    );

  const userCount =
    Number(
      stats?.users ??
        activeUsers.length ??
        0
    );

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="mx-auto max-w-7xl pb-20">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Achievements
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Assign achievements to students,
            track progress, and manage learning
            milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          <Award size={16} />
          Assign Achievement
        </button>
      </div>

      {/* ====================================================
          STATS
      ==================================================== */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total"
          value={statsLoading ? 0 : total}
          icon={Trophy}
          description="All achievements"
        />

        <StatCard
          title="Completed"
          value={
            statsLoading
              ? 0
              : completed
          }
          icon={CheckCircle2}
          description="Successfully completed"
        />

        <StatCard
          title="In Progress"
          value={
            statsLoading
              ? 0
              : inProgress
          }
          icon={Clock3}
          description="Currently in progress"
        />

        <StatCard
          title="Locked"
          value={
            statsLoading
              ? 0
              : locked
          }
          icon={Lock}
          description="Not started yet"
        />
      </div>

      {/* ====================================================
          FILTERS
      ==================================================== */}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          {/* Search */}

          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              value={search}
              onChange={(event) =>
                handleSearch(
                  event.target.value
                )
              }
              placeholder="Search achievements or users..."
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
          </div>

          {/* Status */}

          <select
            value={status}
            onChange={(event) =>
              handleStatus(
                event.target.value
              )
            }
            className="h-12 rounded-xl border border-white/10 bg-[#090d18] px-4 text-sm text-white outline-none"
          >
            <option value="ALL">
              All Statuses
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="IN_PROGRESS">
              In Progress
            </option>

            <option value="LOCKED">
              Locked
            </option>
          </select>

          {/* Type */}

          <select
            value={type}
            onChange={(event) =>
              handleType(
                event.target.value
              )
            }
            className="h-12 rounded-xl border border-white/10 bg-[#090d18] px-4 text-sm text-white outline-none"
          >
            <option value="ALL">
              All Types
            </option>

            {achievementTypes.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          {/* Refresh */}

          <button
            type="button"
            onClick={() => {
              loadAchievements();
              loadStats();
              loadActiveUsers();
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-red-400">
              Unable to load achievements
            </div>

            <div className="mt-1 text-xs text-red-300/60">
              {error}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              loadAchievements();
              loadStats();
            }}
            className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-400/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* ====================================================
          ACHIEVEMENT LIST
      ==================================================== */}

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">
                Student Achievements
              </h2>

              <p className="mt-1 text-xs text-white/30">
                {pagination.total} achievement
                {pagination.total === 1
                  ? ""
                  : "s"} found
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/25">
              <Users size={13} />

              {userCount} active users
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : achievements.length === 0 ? (
          <EmptyState
            onCreate={openCreate}
          />
        ) : (
          <>
            <div className="divide-y divide-white/[0.06]">
              {achievements.map(
                (achievement) => {
                  const user =
                    getUserInfo(
                      achievement.user
                    );

                  const progress =
                    Math.min(
                      100,
                      Math.max(
                        0,
                        Number(
                          achievement.progress ??
                            0
                        )
                      )
                    );

                  return (
                    <div
                      key={
                        achievement._id
                      }
                      className="group p-5 transition hover:bg-white/[0.025]"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        {/* Main */}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-white">
                              {achievement.title ||
                                "Untitled Achievement"}
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${getStatusClass(
                                achievement.status
                              )}`}
                            >
                              {getStatusLabel(
                                achievement.status
                              )}
                            </span>

                            {achievement.type && (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/40">
                                {
                                  achievement.type
                                }
                              </span>
                            )}
                          </div>

                          <p className="mt-2 line-clamp-2 text-xs text-white/35">
                            {achievement.description ||
                              "No description"}
                          </p>

                          {/* User */}

                          <div className="mt-4 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/70">
                              {getUserName(
                                achievement.user
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-xs font-medium text-white/70">
                                {getUserName(
                                  achievement.user
                                )}
                              </div>

                              {getUserEmail(
                                achievement.user
                              ) && (
                                <div className="truncate text-[11px] text-white/25">
                                  {getUserEmail(
                                    achievement.user
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress */}

                        <div className="w-full lg:w-56">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] text-white/25">
                              Progress
                            </span>

                            <span className="text-[10px] text-white/40">
                              {progress}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-white transition-all"
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>

                          <p className="mt-2 text-[10px] text-white/20">
                            {formatDate(
                              achievement.createdAt
                            )}
                          </p>
                        </div>

                        {/* Actions */}

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAchievement(
                                achievement
                              )
                            }
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                achievement
                              )
                            }
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              deleteId ===
                              achievement._id
                            }
                            onClick={() =>
                              deleteAchievement(
                                achievement._id
                              )
                            }
                            className="rounded-lg border border-red-500/10 px-3 py-2 text-xs text-red-400/60 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                          >
                            {deleteId ===
                            achievement._id
                              ? "..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <Pagination
              pagination={pagination}
              onPrevious={() =>
                setPage(
                  Math.max(
                    1,
                    page - 1
                  )
                )
              }
              onNext={() =>
                setPage(
                  page + 1
                )
              }
            />
          </>
        )}
      </div>

      {/* ====================================================
          DETAILS PANEL
      ==================================================== */}

      {selectedAchievement &&
        !showEdit && (
          <DetailsPanel
            achievement={
              selectedAchievement
            }
            onClose={() =>
              setSelectedAchievement(
                null
              )
            }
            onEdit={() =>
              openEdit(
                selectedAchievement
              )
            }
            onDelete={() =>
              deleteAchievement(
                selectedAchievement._id
              )
            }
          />
        )}

      {/* ====================================================
          CREATE MODAL
      ==================================================== */}

      {showCreate && (
        <Modal
          title="Assign Achievement"
          onClose={() => {
            if (!saving) {
              setShowCreate(
                false
              );
            }
          }}
        >
          <form
            onSubmit={
              createAchievement
            }
            className="space-y-5"
          >
            {/* ACTIVE USER DROPDOWN */}

            <ActiveUserSelect
              users={activeUsers}
              value={
                createForm.user
              }
              onChange={(value) =>
                setCreateForm(
                  (previous) => ({
                    ...previous,
                    user: value,
                  })
                )
              }
              loading={
                usersLoading
              }
              error={
                usersError
              }
            />

            {/* TITLE */}

            <FormInput
              label="Achievement Title"
              value={
                createForm.title
              }
              onChange={(value) =>
                setCreateForm(
                  (previous) => ({
                    ...previous,
                    title: value,
                  })
                )
              }
              placeholder="e.g. JavaScript Master"
              required
            />

            {/* DESCRIPTION */}

            <FormTextarea
              label="Description"
              value={
                createForm.description
              }
              onChange={(value) =>
                setCreateForm(
                  (previous) => ({
                    ...previous,
                    description: value,
                  })
                )
              }
              placeholder="Describe the achievement..."
            />

            {/* TYPE + PROGRESS */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                label="Type"
                value={
                  createForm.type
                }
                onChange={(value) =>
                  setCreateForm(
                    (previous) => ({
                      ...previous,
                      type: value,
                    })
                  )
                }
                placeholder="COURSE"
                required
              />

              <FormInput
                label="Progress"
                type="number"
                min="0"
                max="100"
                value={
                  createForm.progress
                }
                onChange={(value) =>
                  setCreateForm(
                    (previous) => ({
                      ...previous,
                      progress: value,
                    })
                  )
                }
              />
            </div>

            {/* STATUS */}

            <FormSelect
              label="Status"
              value={
                createForm.status
              }
              onChange={(value) =>
                setCreateForm(
                  (previous) => ({
                    ...previous,
                    status: value,
                  })
                )
              }
              options={[
                {
                  value: "LOCKED",
                  label: "Locked",
                },
                {
                  value: "IN_PROGRESS",
                  label: "In Progress",
                },
                {
                  value: "COMPLETED",
                  label: "Completed",
                },
              ]}
            />

            <ModalActions
              saving={saving}
              submitLabel="Assign Achievement"
              onCancel={() =>
                setShowCreate(
                  false
                )
              }
            />
          </form>
        </Modal>
      )}

      {/* ====================================================
          EDIT MODAL
      ==================================================== */}

      {showEdit &&
        selectedAchievement && (
          <Modal
            title="Edit Achievement"
            onClose={() => {
              if (!saving) {
                setShowEdit(
                  false
                );

                setSelectedAchievement(
                  null
                );
              }
            }}
          >
            <form
              onSubmit={
                updateAchievement
              }
              className="space-y-5"
            >
              {/* USER - READ ONLY */}

              <div>
                <label className="mb-2 block text-xs font-medium text-white/45">
                  Assigned User
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/60">
                    {getUserName(
                      selectedAchievement.user
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/70">
                      {getUserName(
                        selectedAchievement.user
                      )}
                    </p>

                    <p className="truncate text-[11px] text-white/25">
                      {getUserEmail(
                        selectedAchievement.user
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <FormInput
                label="Achievement Title"
                value={
                  editForm.title
                }
                onChange={(value) =>
                  setEditForm(
                    (previous) => ({
                      ...previous,
                      title: value,
                    })
                  )
                }
                placeholder="Achievement title"
                required
              />

              <FormTextarea
                label="Description"
                value={
                  editForm.description
                }
                onChange={(value) =>
                  setEditForm(
                    (previous) => ({
                      ...previous,
                      description: value,
                    })
                  )
                }
                placeholder="Achievement description"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="Type"
                  value={
                    editForm.type
                  }
                  onChange={(value) =>
                    setEditForm(
                      (previous) => ({
                        ...previous,
                        type: value,
                      })
                    )
                  }
                  placeholder="COURSE"
                  required
                />

                <FormInput
                  label="Progress"
                  type="number"
                  min="0"
                  max="100"
                  value={
                    editForm.progress
                  }
                  onChange={(value) =>
                    setEditForm(
                      (previous) => ({
                        ...previous,
                        progress: value,
                      })
                    )
                  }
                />
              </div>

              <FormSelect
                label="Status"
                value={
                  editForm.status
                }
                onChange={(value) =>
                  setEditForm(
                    (previous) => ({
                      ...previous,
                      status: value,
                    })
                  )
                }
                options={[
                  {
                    value: "LOCKED",
                    label: "Locked",
                  },
                  {
                    value: "IN_PROGRESS",
                    label: "In Progress",
                  },
                  {
                    value: "COMPLETED",
                    label: "Completed",
                  },
                ]}
              />

              <ModalActions
                saving={saving}
                submitLabel="Save Changes"
                onCancel={() => {
                  setShowEdit(
                    false
                  );

                  setSelectedAchievement(
                    null
                  );
                }}
              />
            </form>
          </Modal>
        )}
    </div>
  );
}