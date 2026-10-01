"use client";

import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  FolderKanban,
  Gauge,
  GraduationCap,
  Home,
  Library,
  LogOut,
  Menu,
  Network,
  PlayCircle,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AppShellProps {
  children: React.ReactNode;
  user: User;
  admin?: boolean;
}

/*
 * =========================================================
 * STUDENT NAVIGATION
 * =========================================================
 */

const studentSections = [
  {
    label: "HOME",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: Home,
      },
    ],
  },

  {
    label: "LEARN",
    items: [
      {
        label: "Roadmaps",
        href: "/dashboard/roadmaps",
        icon: GraduationCap,
      },
      {
        label: "Courses",
        href: "/dashboard/courses",
        icon: BookOpen,
      },
      {
        label: "Practice",
        href: "/dashboard/practice",
        icon: PlayCircle,
      },
      {
        label: "Resources",
        href: "/dashboard/resources",
        icon: Library,
      },
    ],
  },

  {
    label: "BUILD",
    items: [
      {
        label: "Projects",
        href: "/dashboard/projects",
        icon: FolderKanban,
      },
      {
        label: "API Tester",
        href: "/dashboard/apis",
        icon: Code2,
      },
      {
        label: "Environments",
        href: "/dashboard/environments",
        icon: Network,
      },
      {
        label: "Collections",
        href: "/dashboard/collections",
        icon: FolderKanban,
      },
    ],
  },

  {
    label: "TRACK",
    items: [
      {
        label: "Progress",
        href: "/dashboard/progress",
        icon: BarChart3,
      },
      {
        label: "Achievements",
        href: "/dashboard/achievements",
        icon: Trophy,
      },
      {
        label: "Certificates",
        href: "/dashboard/certificates",
        icon: Award,
      },
    ],
  },
];

/*
 * =========================================================
 * ADMIN NAVIGATION
 * =========================================================
 */

const adminSections = [
  {
    label: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: Gauge,
      },
    ],
  },

  {
    label: "MANAGE",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Projects",
        href: "/admin/projects",
        icon: FolderKanban,
      },
      {
        label: "APIs",
        href: "/admin/apis",
        icon: Code2,
      },
      {
        label: "Integrations",
        href: "/admin/integrations",
        icon: Network,
      },
      {
        label: "Achievements",
        href: "/admin/achievements",
        icon: Trophy,
      },
      {
        label: "Certificates",
        href: "/admin/certificates",
        icon: Award,
      },
    ],
  },

  {
    label: "INSIGHTS",
    items: [
      {
        label: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
];

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function AppShell({
  children,
  user,
  admin = false,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const sections = admin
    ? adminSections
    : studentSections;

  /*
   * =======================================================
   * LOGOUT
   * =======================================================
   */

  const handleLogout = async () => {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error(
        "[APP SHELL] Logout error:",
        error
      );
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  /*
   * =======================================================
   * ACTIVE ROUTE
   * =======================================================
   */

  const isActive = (
    href: string
  ) => {
    if (
      href === "/dashboard" ||
      href === "/admin"
    ) {
      return pathname === href;
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  };

  /*
   * =======================================================
   * INITIALS
   * =======================================================
   */

  const initials =
    user.name
      ?.split(" ")
      .filter(Boolean)
      .map(
        (part) => part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  /*
   * =======================================================
   * NAVIGATION
   * =======================================================
   */

  const navigate = (
    href: string
  ) => {
    router.push(href);

    setMobileOpen(false);
    setProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">

      {/* ================================================= */}
      {/* MOBILE OVERLAY */}
      {/* ================================================= */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() =>
            setMobileOpen(false)
          }
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-white/10 bg-[#080c1a]
          transition-all duration-300

          ${
            collapsed
              ? "w-[76px]"
              : "w-[260px]"
          }

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >

        {/* =============================================== */}
        {/* LOGO */}
        {/* =============================================== */}

        <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-5">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black">
              <Code2 size={21} />
            </div>

            {!collapsed && (
              <div className="min-w-0">

                <div className="truncate text-sm font-bold">
                  Codelaunch
                </div>

                <div className="truncate text-[9px] uppercase tracking-[0.2em] text-white/30">
                  Technologies
                </div>

              </div>
            )}

          </div>

          {/* MOBILE CLOSE */}

          <button
            type="button"
            aria-label="Close navigation"
            onClick={() =>
              setMobileOpen(false)
            }
            className="ml-auto rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>

        </div>

        {/* =============================================== */}
        {/* NAVIGATION */}
        {/* =============================================== */}

        <div className="flex-1 overflow-y-auto px-3 py-5">

          {sections.map(
            (section) => (
              <div
                key={
                  section.label
                }
                className="mb-6"
              >

                {!collapsed && (
                  <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
                    {
                      section.label
                    }
                  </div>
                )}

                <nav className="space-y-1">

                  {section.items.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      const active =
                        isActive(
                          item.href
                        );

                      return (
                        <button
                          type="button"
                          key={
                            item.href
                          }
                          onClick={() =>
                            navigate(
                              item.href
                            )
                          }
                          title={
                            collapsed
                              ? item.label
                              : undefined
                          }
                          className={`
                            group flex w-full items-center gap-3 rounded-xl px-3 py-3
                            text-sm transition

                            ${
                              active
                                ? "bg-white text-black shadow-sm"
                                : "text-white/45 hover:bg-white/5 hover:text-white"
                            }
                          `}
                        >

                          <Icon
                            size={19}
                            className="shrink-0"
                          />

                          {!collapsed && (
                            <span className="truncate">
                              {
                                item.label
                              }
                            </span>
                          )}

                        </button>
                      );
                    }
                  )}

                </nav>

              </div>
            )
          )}

          {/* ============================================= */}
          {/* SYSTEM */}
          {/* ============================================= */}

          <div className="border-t border-white/10 pt-5">

            {!collapsed && (
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
                SYSTEM
              </div>
            )}

            {/* SUPPORT */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  admin
                    ? "/admin/support"
                    : "/dashboard/support"
                )
              }
              title={
                collapsed
                  ? "Support"
                  : undefined
              }
              className={`
                flex w-full items-center gap-3 rounded-xl px-3 py-3
                text-sm transition

                ${
                  isActive(
                    admin
                      ? "/admin/support"
                      : "/dashboard/support"
                  )
                    ? "bg-white text-black"
                    : "text-white/45 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <CircleHelp
                size={19}
                className="shrink-0"
              />

              {!collapsed && (
                <span>
                  Support
                </span>
              )}
            </button>

            {/* SETTINGS */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  admin
                    ? "/admin/settings"
                    : "/dashboard/settings"
                )
              }
              title={
                collapsed
                  ? "Settings"
                  : undefined
              }
              className={`
                mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3
                text-sm transition

                ${
                  isActive(
                    admin
                      ? "/admin/settings"
                      : "/dashboard/settings"
                  )
                    ? "bg-white text-black"
                    : "text-white/45 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <Settings
                size={19}
                className="shrink-0"
              />

              {!collapsed && (
                <span>
                  Settings
                </span>
              )}
            </button>

          </div>

        </div>

        {/* ================================================= */}
        {/* USER AREA */}
        {/* ================================================= */}

        <div className="shrink-0 border-t border-white/10 p-3">

          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
              {initials}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">

                <div className="truncate text-sm font-medium">
                  {user.name}
                </div>

                <div className="truncate text-xs text-white/30">
                  {user.email}
                </div>

              </div>
            )}

          </div>

          {/* LOGOUT */}

          {!collapsed ? (
            <button
              type="button"
              onClick={
                handleLogout
              }
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/35 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut
                size={17}
              />

              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={
                handleLogout
              }
              title="Logout"
              className="mt-2 flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-white/35 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut
                size={17}
              />
            </button>
          )}

        </div>

        {/* ================================================= */}
        {/* COLLAPSE BUTTON */}
        {/* ================================================= */}

        <button
          type="button"
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          onClick={() =>
            setCollapsed(
              !collapsed
            )
          }
          className="absolute -right-3 top-[84px] hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0d1324] text-white/50 transition hover:text-white lg:flex"
        >
          {collapsed ? (
            <ChevronRight
              size={14}
            />
          ) : (
            <ChevronLeft
              size={14}
            />
          )}
        </button>

      </aside>

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header
        className={`
          fixed right-0 top-0 z-30 h-20
          border-b border-white/10 bg-[#050816]/80
          backdrop-blur-xl transition-all duration-300

          ${
            collapsed
              ? "left-[76px]"
              : "left-[260px]"
          }

          max-lg:left-0
        `}
      >

        <div className="flex h-full items-center justify-between px-4 sm:px-6">

          {/* LEFT */}

          <div className="flex items-center gap-3">

            <button
              type="button"
              aria-label="Open navigation"
              onClick={() =>
                setMobileOpen(true)
              }
              className="rounded-xl border border-white/10 p-2.5 text-white/60 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div>

              <div className="text-sm font-semibold">
                {admin
                  ? "Admin Dashboard"
                  : "Student Dashboard"}
              </div>

              <div className="hidden text-xs text-white/30 sm:block">
                {admin
                  ? "Manage your Codelaunch platform"
                  : `Welcome back, ${user.name}`}
              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-2 sm:gap-4">

            {/* NOTIFICATIONS */}

            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              <Bell size={18} />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white" />
            </button>

            {/* PROFILE */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    !profileOpen
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pr-3 transition hover:bg-white/[0.06]"
              >

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-black">
                  {initials}
                </div>

                <div className="hidden text-left sm:block">

                  <div className="max-w-[120px] truncate text-xs font-medium">
                    {user.name}
                  </div>

                  <div className="text-[10px] text-white/30">
                    {user.role}
                  </div>

                </div>

                <ChevronDown
                  size={14}
                  className="text-white/30"
                />

              </button>

              {/* PROFILE MENU */}

              {profileOpen && (
                <>

                  <button
                    type="button"
                    aria-label="Close profile menu"
                    onClick={() =>
                      setProfileOpen(
                        false
                      )
                    }
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] p-2 shadow-2xl">

                    {/* USER INFO */}

                    <div className="border-b border-white/10 px-3 py-3">

                      <div className="text-sm font-medium">
                        {user.name}
                      </div>

                      <div className="mt-1 truncate text-xs text-white/30">
                        {user.email}
                      </div>

                    </div>

                    {/* SETTINGS */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          admin
                            ? "/admin/settings"
                            : "/dashboard/settings"
                        )
                      }
                      className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                    >
                      <Settings
                        size={16}
                      />

                      Settings
                    </button>

                    {/* SUPPORT */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          admin
                            ? "/admin/support"
                            : "/dashboard/support"
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                    >
                      <CircleHelp
                        size={16}
                      />

                      Support
                    </button>

                    {/* LOGOUT */}

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <LogOut
                        size={16}
                      />

                      Logout
                    </button>

                  </div>

                </>
              )}

            </div>

          </div>

        </div>

      </header>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div
        className={`
          min-h-screen pt-20 transition-all duration-300

          ${
            collapsed
              ? "lg:pl-[76px]"
              : "lg:pl-[260px]"
          }
        `}
      >

        <main className="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

    </div>
  );
}