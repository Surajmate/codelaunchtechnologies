"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface UsersResponse {
  success: boolean;
  message?: string;

  users: UserItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  stats: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    regularUsers: number;
  };
}

type StatusFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE";

type RoleFilter =
  | "ALL"
  | "USER"
  | "ADMIN"
  | "SUPER_ADMIN";

/*
 * ------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------
 */

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
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
        part.charAt(0).toUpperCase()
    )
    .join("");
}

/*
 * ------------------------------------------------------
 * ROLE BADGE
 * ------------------------------------------------------
 */

function RoleBadge({
  role,
}: {
  role: string;
}) {
  const label =
    role === "SUPER_ADMIN"
      ? "Super Admin"
      : role === "ADMIN"
      ? "Admin"
      : "User";

  return (
    <span
      className="
        inline-flex
        items-center
        rounded-full
        border
        border-white/10
        bg-white/[0.03]
        px-2.5
        py-1
        text-[10px]
        font-medium
        uppercase
        tracking-wide
        text-white/50
      "
    >
      {label}
    </span>
  );
}

/*
 * ------------------------------------------------------
 * STATUS BADGE
 * ------------------------------------------------------
 */

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-white/40">
      <span
        className={`h-2 w-2 rounded-full ${
          active
            ? "bg-white"
            : "bg-white/20"
        }`}
      />

      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

/*
 * ------------------------------------------------------
 * PAGE
 * ------------------------------------------------------
 */

export default function UsersPage() {
  const [data, setData] =
    useState<UsersResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [role, setRole] =
    useState<RoleFilter>(
      "ALL"
    );

  const [status, setStatus] =
    useState<StatusFilter>(
      "ALL"
    );

  const [page, setPage] =
    useState(1);

  const limit = 20;

  /*
   * ----------------------------------------------------
   * LOAD USERS
   * ----------------------------------------------------
   */

  async function loadUsers() {
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
        String(limit)
      );

      if (search) {
        params.set(
          "search",
          search
        );
      }

      if (role !== "ALL") {
        params.set(
          "role",
          role
        );
      }

      if (status !== "ALL") {
        params.set(
          "status",
          status
        );
      }

      const response =
        await fetch(
          `/api/admin/users?${params.toString()}`,
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
            "Unable to load users"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to load users"
        );
      }

      setData(result);
    } catch (err) {
      console.error(
        "[ADMIN USERS PAGE]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load users"
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ----------------------------------------------------
   * LOAD WHEN FILTERS CHANGE
   * ----------------------------------------------------
   */

  useEffect(() => {
    loadUsers();
  }, [
    page,
    search,
    role,
    status,
  ]);

  /*
   * ----------------------------------------------------
   * SEARCH
   * ----------------------------------------------------
   */

  function handleSearch(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(
      searchInput.trim()
    );
  }

  /*
   * ----------------------------------------------------
   * RESET FILTERS
   * ----------------------------------------------------
   */

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setRole("ALL");
    setStatus("ALL");
    setPage(1);
  }

  /*
   * ----------------------------------------------------
   * LOADING
   * ----------------------------------------------------
   */

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Administration
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Users
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Loading users...
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.025] p-6"
            >
              <div className="h-4 w-20 rounded bg-white/5" />

              <div className="mt-4 h-8 w-16 rounded bg-white/5" />
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

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Administration
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Users
        </h1>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-8">
          <div className="text-sm text-white/50">
            Unable to load users.
          </div>

          <div className="mt-2 text-sm text-white/30">
            {error}
          </div>

          <button
            onClick={
              loadUsers
            }
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------------------
   * SAFE DATA
   * ----------------------------------------------------
   */

  const users =
    data?.users || [];

  const stats =
    data?.stats || {
      total: 0,
      active: 0,
      inactive: 0,
      admins: 0,
      regularUsers: 0,
    };

  const pagination =
    data?.pagination || {
      page: 1,
      limit,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

  /*
   * ----------------------------------------------------
   * PAGE
   * ----------------------------------------------------
   */

  return (
    <div className="mx-auto max-w-7xl pb-20">
      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/30">
            Administration
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Users
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Manage platform users,
            roles and account status.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/30">
          <Users size={14} />

          {stats.total} total users
        </div>
      </div>

      {/* ==================================================
          STATISTICS
          ================================================== */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Users size={14} />

            Total Users
          </div>

          <div className="mt-3 text-2xl font-bold">
            {stats.total}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <UserCheck size={14} />

            Active Users
          </div>

          <div className="mt-3 text-2xl font-bold">
            {stats.active}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <UserX size={14} />

            Inactive Users
          </div>

          <div className="mt-3 text-2xl font-bold">
            {stats.inactive}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Shield size={14} />

            Administrators
          </div>

          <div className="mt-3 text-2xl font-bold">
            {stats.admins}
          </div>
        </div>
      </div>

      {/* ==================================================
          FILTERS
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          {/* SEARCH */}

          <form
            onSubmit={
              handleSearch
            }
            className="flex min-w-0 flex-1"
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                value={
                  searchInput
                }
                onChange={(event) =>
                  setSearchInput(
                    event.target
                      .value
                  )
                }
                placeholder="Search by name or email..."
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-black/20
                  pl-11
                  pr-4
                  text-sm
                  text-white
                  outline-none
                  placeholder:text-white/20
                  focus:border-white/20
                "
              />
            </div>

            <button
              type="submit"
              className="ml-2 rounded-xl bg-white px-5 text-sm font-medium text-black hover:bg-white/90"
            >
              Search
            </button>
          </form>

          {/* ROLE */}

          <select
            value={role}
            onChange={(event) => {
              setRole(
                event.target
                  .value as RoleFilter
              );
              setPage(1);
            }}
            className="
              h-11
              rounded-xl
              border
              border-white/10
              bg-[#111]
              px-4
              text-sm
              text-white/60
              outline-none
            "
          >
            <option value="ALL">
              All Roles
            </option>

            <option value="USER">
              Users
            </option>

            <option value="ADMIN">
              Admins
            </option>

            <option value="SUPER_ADMIN">
              Super Admins
            </option>
          </select>

          {/* STATUS */}

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target
                  .value as StatusFilter
              );
              setPage(1);
            }}
            className="
              h-11
              rounded-xl
              border
              border-white/10
              bg-[#111]
              px-4
              text-sm
              text-white/60
              outline-none
            "
          >
            <option value="ALL">
              All Status
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>

          {/* RESET */}

          {(search ||
            role !== "ALL" ||
            status !== "ALL") && (
            <button
              onClick={
                resetFilters
              }
              className="h-11 rounded-xl border border-white/10 px-4 text-sm text-white/40 hover:bg-white/5 hover:text-white"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ==================================================
          ERROR WHILE REFRESHING
          ================================================== */}

      {error && data && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/50">
          {error}
        </div>
      )}

      {/* ==================================================
          USER TABLE
          ================================================== */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-wider text-white/25">
                  User
                </th>

                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-wider text-white/25">
                  Role
                </th>

                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-wider text-white/25">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-wider text-white/25">
                  Joined
                </th>

                <th className="px-6 py-4 text-right text-[10px] uppercase tracking-wider text-white/25">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {users.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center"
                  >
                    <Users
                      size={28}
                      className="mx-auto text-white/15"
                    />

                    <div className="mt-4 text-sm text-white/40">
                      No users found.
                    </div>

                    <div className="mt-1 text-xs text-white/20">
                      Try changing your search
                      or filters.
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(
                  (user) => (
                    <tr
                      key={
                        user._id
                      }
                      className="transition hover:bg-white/[0.02]"
                    >
                      {/* USER */}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={
                                user.avatar
                              }
                              alt={
                                user.name
                              }
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/60">
                              {getInitials(
                                user.name
                              )}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-white/75">
                              {
                                user.name
                              }
                            </div>

                            <div className="mt-1 truncate text-xs text-white/30">
                              {
                                user.email
                              }
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}

                      <td className="px-6 py-4">
                        <RoleBadge
                          role={
                            user.role
                          }
                        />
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">
                        <StatusBadge
                          active={
                            user.isActive
                          }
                        />
                      </td>

                      {/* JOINED */}

                      <td className="px-6 py-4 text-sm text-white/35">
                        {formatDate(
                          user.createdAt
                        )}
                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/users/${user._id}`}
                          className="inline-flex items-center rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================================
            PAGINATION
            ================================================== */}

        <div className="flex flex-col justify-between gap-3 border-t border-white/10 px-6 py-4 sm:flex-row sm:items-center">
          <div className="text-xs text-white/25">
            {pagination.total ===
            0
              ? "No users"
              : `Showing ${
                  (pagination.page -
                    1) *
                    pagination.limit +
                  1
                }–${Math.min(
                  pagination.page *
                    pagination.limit,
                  pagination.total
                )} of ${
                  pagination.total
                } users`}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={
                !pagination.hasPreviousPage ||
                loading
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current -
                        1
                    )
                )
              }
              className="
                flex
                h-9
                items-center
                gap-1
                rounded-lg
                border
                border-white/10
                px-3
                text-xs
                text-white/40
                transition
                hover:bg-white/5
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ChevronLeft
                size={14}
              />

              Previous
            </button>

            <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-white px-3 text-xs font-medium text-black">
              {pagination.page}
            </div>

            <button
              disabled={
                !pagination.hasNextPage ||
                loading
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current + 1
                )
              }
              className="
                flex
                h-9
                items-center
                gap-1
                rounded-lg
                border
                border-white/10
                px-3
                text-xs
                text-white/40
                transition
                hover:bg-white/5
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              Next

              <ChevronRight
                size={14}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}