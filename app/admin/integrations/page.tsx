"use client";

import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit3,
  Globe,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Server,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

interface Integration {
  _id: string;
  name: string;
  provider: string;
  category: string;
  baseUrl?: string;
  description?: string;
  status: string;
  config?: Record<string, unknown>;
  lastCheckedAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface IntegrationsResponse {
  success: boolean;
  message?: string;

  integrations: Integration[];

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
    errors: number;
  };
}

interface IntegrationLogUser {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

interface IntegrationLog {
  _id: string;
  integration: string;
  action: string;
  result: "SUCCESS" | "ERROR";
  method?: string | null;
  statusCode?: number | null;
  responseTime?: number | null;
  message?: string;
  responsePreview?: string;
  error?: string;
  performedBy?: IntegrationLogUser | null;
  createdAt: string;
}

interface IntegrationLogsResponse {
  success: boolean;
  message?: string;

  integration: {
    _id: string;
    name: string;
    provider?: string;
    category?: string;
    status?: string;
    lastCheckedAt?: string | null;
    lastError?: string | null;
  };

  summary: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    successRate: number;
  };

  logs: IntegrationLog[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface IntegrationForm {
  name: string;
  provider: string;
  category: string;
  baseUrl: string;
  description: string;
  status: string;
  secret: string;
  configText: string;
}

type StatusFilter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE"
  | "ERROR";

const categories = [
  "API",
  "DATABASE",
  "CRM",
  "ERP",
  "MARKETING",
  "COMMUNICATION",
  "CLOUD",
  "OTHER",
];

/*
 * ======================================================
 * HELPERS
 * ======================================================
 */

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Never";
  }

  return new Date(
    value
  ).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(
  status: string
) {
  if (status === "ACTIVE") {
    return "Active";
  }

  if (status === "ERROR") {
    return "Error";
  }

  return "Inactive";
}

function getStatusClass(
  status: string
) {
  if (status === "ACTIVE") {
    return "text-white/60";
  }

  if (status === "ERROR") {
    return "text-white/50";
  }

  return "text-white/30";
}

function getCategoryIcon(
  category: string
) {
  if (category === "DATABASE") {
    return Database;
  }

  if (category === "API") {
    return Server;
  }

  if (category === "CLOUD") {
    return Globe;
  }

  return Zap;
}

function emptyForm(): IntegrationForm {
  return {
    name: "",
    provider: "",
    category: "API",
    baseUrl: "",
    description: "",
    status: "INACTIVE",
    secret: "",
    configText: "{}",
  };
}

/*
 * ======================================================
 * PAGE
 * ======================================================
 */

export default function IntegrationsPage() {
  const [data, setData] =
    useState<IntegrationsResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState<StatusFilter>("ALL");

  const [category, setCategory] =
    useState("ALL");

  const [page, setPage] =
    useState(1);

  const limit = 20;

  /*
   * Modal
   */

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<IntegrationForm>(
      emptyForm()
    );

  const [saving, setSaving] =
    useState(false);

  /*
   * Connection testing
   */

  const [testingId, setTestingId] =
    useState<string | null>(null);

  /*
   * Deleting
   */

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

   /*
    * Activity / Logs
    */

  const [
    activityIntegration,
    setActivityIntegration,
    ] = useState<Integration | null>(
    null
    );

    const [
    activityData,
    setActivityData,
    ] =
    useState<IntegrationLogsResponse | null>(
        null
    );

    const [
    activityLoading,
    setActivityLoading,
    ] =
    useState(false);

    const [
    activityError,
    setActivityError,
    ] =
    useState("");

    const [
    activityPage,
    setActivityPage,
    ] =
    useState(1);

    const activityLimit = 10;


    /*
 * ====================================================
 * LOAD INTEGRATION ACTIVITY
 * ====================================================
 */

async function loadIntegrationLogs(
  integrationId: string,
  requestedPage = activityPage
) {
  try {
    setActivityLoading(true);
    setActivityError("");

    const params =
      new URLSearchParams();

    params.set(
      "page",
      String(requestedPage)
    );

    params.set(
      "limit",
      String(activityLimit)
    );

    params.set(
      "action",
      "TEST"
    );

    const response =
      await fetch(
        `/api/admin/integrations/${integrationId}/logs?${params.toString()}`,
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
          "Unable to load integration activity"
      );
    }

    if (!result.success) {
      throw new Error(
        result.message ||
          "Unable to load integration activity"
      );
    }

    setActivityData(result);

    setActivityPage(
      requestedPage
    );
  } catch (err) {
    console.error(
      "[ADMIN INTEGRATION ACTIVITY]",
      err
    );

    setActivityError(
      err instanceof Error
        ? err.message
        : "Unable to load integration activity"
    );
  } finally {
    setActivityLoading(false);
  }
}

/*
 * ====================================================
 * OPEN INTEGRATION ACTIVITY
 * ====================================================
 */

async function openActivity(
  integration: Integration
) {
  setActivityIntegration(
    integration
  );

  setActivityData(null);

  setActivityError("");

  setActivityPage(1);

  await loadIntegrationLogs(
    integration._id,
    1
  );
}

/*
 * ====================================================
 * CLOSE INTEGRATION ACTIVITY
 * ====================================================
 */

function closeActivity() {
  setActivityIntegration(null);

  setActivityData(null);

  setActivityError("");

  setActivityPage(1);
}

  /*
   * ====================================================
   * LOAD INTEGRATIONS
   * ====================================================
   */

  async function loadIntegrations() {
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

      if (status !== "ALL") {
        params.set(
          "status",
          status
        );
      }

      if (category !== "ALL") {
        params.set(
          "category",
          category
        );
      }

      const response =
        await fetch(
          `/api/admin/integrations?${params.toString()}`,
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
            "Unable to load integrations"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to load integrations"
        );
      }

      setData(result);
    } catch (err) {
      console.error(
        "[ADMIN INTEGRATIONS PAGE]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load integrations"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIntegrations();
  }, [
    page,
    search,
    status,
    category,
  ]);

  /*
   * ====================================================
   * SEARCH
   * ====================================================
   */

  function handleSearch(
    event: FormEvent
  ) {
    event.preventDefault();

    setPage(1);

    setSearch(
      searchInput.trim()
    );
  }

  /*
   * ====================================================
   * RESET FILTERS
   * ====================================================
   */

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setCategory("ALL");
    setPage(1);
  }

  /*
   * ====================================================
   * OPEN CREATE
   * ====================================================
   */

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setMessage("");
    setShowModal(true);
  }

  /*
   * ====================================================
   * OPEN EDIT
   * ====================================================
   */

  async function openEdit(
    integration: Integration
  ) {
    try {
      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/admin/integrations/${integration._id}`,
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
            "Unable to load integration"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to load integration"
        );
      }

      const item =
        result.integration;

      setEditingId(
        integration._id
      );

      setForm({
        name:
          item.name || "",

        provider:
          item.provider || "",

        category:
          item.category ||
          "API",

        baseUrl:
          item.baseUrl || "",

        description:
          item.description ||
          "",

        status:
          item.status ||
          "INACTIVE",

        /*
         * Existing secret is intentionally
         * NOT loaded.
         */

        secret: "",

        configText:
          item.config
            ? JSON.stringify(
                item.config,
                null,
                2
              )
            : "{}",
      });

      setShowModal(true);
    } catch (err) {
      console.error(
        "[ADMIN INTEGRATIONS EDIT]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load integration"
      );
    }
  }

  /*
   * ====================================================
   * SAVE
   * ====================================================
   */

  async function saveIntegration(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      let config: Record<
        string,
        unknown
      > = {};

      try {
        const parsed =
          JSON.parse(
            form.configText ||
              "{}"
          );

        if (
          !parsed ||
          typeof parsed !==
            "object" ||
          Array.isArray(parsed)
        ) {
          throw new Error(
            "Config must be a JSON object"
          );
        }

        config = parsed;
      } catch {
        throw new Error(
          "Config must contain valid JSON"
        );
      }

      const payload: Record<
        string,
        unknown
      > = {
        name: form.name.trim(),

        provider:
          form.provider.trim(),

        category:
          form.category,

        baseUrl:
          form.baseUrl.trim(),

        description:
          form.description.trim(),

        status:
          form.status,

        config,
      };

      /*
       * Only send secret when user
       * actually entered a new one.
       */

      if (
        form.secret.trim()
      ) {
        payload.secret =
          form.secret;
      }

      const url =
        editingId
          ? `/api/admin/integrations/${editingId}`
          : "/api/admin/integrations";

      const response =
        await fetch(url, {
          method:
            editingId
              ? "PATCH"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        });

        const responseText = await response.text();

        let result: any = {};

        try {
        result = responseText
            ? JSON.parse(responseText)
            : {};
        } catch {
        result = {
            message: responseText,
        };
        }

        if (!response.ok) {
        throw new Error(
            result?.message ||
            result?.error ||
            `API returned HTTP ${response.status}`
        );
        }

        if (!result.success) {
        throw new Error(
            result?.message ||
            result?.error ||
            "Unable to save integration"
        );
        }

      setMessage(
        result.message ||
          "Integration saved successfully"
      );

      setShowModal(false);

      setForm(
        emptyForm()
      );

      setEditingId(null);

      await loadIntegrations();
        if (
            activityIntegration?._id ===
            integration._id
            ) {
            await loadIntegrationLogs(
                integration._id,
                1
            );
        }
    } catch (err) {
      console.error(
        "[ADMIN INTEGRATIONS SAVE]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save integration"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ====================================================
   * TOGGLE STATUS
   * ====================================================
   */

  async function toggleStatus(
    integration: Integration
  ) {
    const nextStatus =
      integration.status ===
      "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    try {
      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/admin/integrations/${integration._id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status:
                nextStatus,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to update integration"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to update integration"
        );
      }

      setMessage(
        result.message ||
          "Integration updated successfully"
      );

      await loadIntegrations();
    } catch (err) {
      console.error(
        "[ADMIN INTEGRATIONS TOGGLE]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update integration"
      );
    }
  }

  /*
   * ====================================================
   * TEST CONNECTION
   * ====================================================
   */

  async function testConnection(
    integration: Integration
  ) {
    try {
      setTestingId(
        integration._id
      );

      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/admin/integrations/${integration._id}`,
          {
            method: "POST",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to test integration"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to test integration"
        );
      }

      if (
        result.connected
      ) {
        setMessage(
          `${integration.name}: ${result.message}${
            result.status
              ? ` (HTTP ${result.status})`
              : ""
          }`
        );
      } else {
        setError(
          `${integration.name}: ${result.message}${
            result.status
              ? ` (HTTP ${result.status})`
              : ""
          }`
        );
      }

      await loadIntegrations();
    } catch (err) {
      console.error(
        "[ADMIN INTEGRATIONS TEST]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to test integration"
      );
    } finally {
      setTestingId(null);
    }
  }

  /*
   * ====================================================
   * DELETE
   * ====================================================
   */

  async function deleteIntegration(
    integration: Integration
  ) {
    const confirmed =
      window.confirm(
        `Delete "${integration.name}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        integration._id
      );

      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/admin/integrations/${integration._id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to delete integration"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to delete integration"
        );
      }

      setMessage(
        result.message ||
          "Integration deleted successfully"
      );

      await loadIntegrations();
    } catch (err) {
      console.error(
        "[ADMIN INTEGRATIONS DELETE]",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete integration"
      );
    } finally {
      setDeletingId(null);
    }
  }

  /*
   * ====================================================
   * SAFE DEFAULTS
   * ====================================================
   */

  const integrations =
    data?.integrations ||
    [];

  const stats =
    data?.stats || {
      total: 0,
      active: 0,
      inactive: 0,
      errors: 0,
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
   * ====================================================
   * INITIAL LOADING
   * ====================================================
   */

  if (
    loading &&
    !data
  ) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Administration
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Integrations
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Loading integrations...
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
              />
            )
          )}
        </div>
      </div>
    );
  }

  /*
   * ====================================================
   * INITIAL ERROR
   * ====================================================
   */

  if (
    error &&
    !data
  ) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Administration
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Integrations
        </h1>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-8">
          <div className="text-sm text-white/50">
            Unable to load integrations.
          </div>

          <div className="mt-2 text-sm text-white/30">
            {error}
          </div>

          <button
            onClick={
              loadIntegrations
            }
            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /*
   * ====================================================
   * PAGE
   * ====================================================
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
            Integrations
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Manage APIs, databases and
            external platform connections.
          </p>
        </div>

        <button
          onClick={
            openCreate
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
        >
          <Plus size={16} />

          Add Integration
        </button>
      </div>

      {/* ==================================================
          MESSAGES
          ================================================== */}

      {message && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/50">
          {message}
        </div>
      )}

      {error && data && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/50">
          {error}
        </div>
      )}

      {/* ==================================================
          STATS
          ================================================== */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Activity size={14} />

            Total
          </div>

          <div className="mt-3 text-2xl font-bold">
            {stats.total}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <CheckCircle2 size={14} />

            Active
          </div>

          <div className="mt-3 text-2xl font-bold">
            {stats.active}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <XCircle size={14} />

            Inactive
          </div>

          <div className="mt-3 text-2xl font-bold">
            {stats.inactive}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Server size={14} />

            Errors
          </div>

          <div className="mt-3 text-2xl font-bold">
            {stats.errors}
          </div>
        </div>
      </div>

      {/* ==================================================
          FILTERS
          ================================================== */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <form
            onSubmit={
              handleSearch
            }
            className="flex flex-1"
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
                placeholder="Search integrations..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
              />
            </div>

            <button
              type="submit"
              className="ml-2 rounded-xl bg-white px-5 text-sm font-medium text-black"
            >
              Search
            </button>
          </form>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target
                  .value as StatusFilter
              );

              setPage(1);
            }}
            className="h-11 rounded-xl border border-white/10 bg-[#111] px-4 text-sm text-white/60 outline-none"
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

            <option value="ERROR">
              Error
            </option>
          </select>

          <select
            value={category}
            onChange={(event) => {
              setCategory(
                event.target
                  .value
              );

              setPage(1);
            }}
            className="h-11 rounded-xl border border-white/10 bg-[#111] px-4 text-sm text-white/60 outline-none"
          >
            <option value="ALL">
              All Categories
            </option>

            {categories.map(
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

          {(search ||
            status !==
              "ALL" ||
            category !==
              "ALL") && (
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
          INTEGRATION TABLE
          ================================================== */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-wider text-white/25">
                  Integration
                </th>

                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-wider text-white/25">
                  Category
                </th>

                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-wider text-white/25">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-wider text-white/25">
                  Last Checked
                </th>

                <th className="px-6 py-4 text-right text-[10px] uppercase tracking-wider text-white/25">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {integrations.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center"
                  >
                    <Server
                      size={28}
                      className="mx-auto text-white/15"
                    />

                    <div className="mt-4 text-sm text-white/40">
                      No integrations found.
                    </div>

                    <div className="mt-1 text-xs text-white/20">
                      Add an integration
                      or change your filters.
                    </div>
                  </td>
                </tr>
              ) : (
                integrations.map(
                  (
                    integration
                  ) => {
                    const Icon =
                      getCategoryIcon(
                        integration.category
                      );

                    return (
                      <tr
                        key={
                          integration._id
                        }
                        className="transition hover:bg-white/[0.02]"
                      >
                        {/* INTEGRATION */}

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40">
                              <Icon
                                size={17}
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="text-sm font-medium text-white/70">
                                {
                                  integration.name
                                }
                              </div>

                              <div className="mt-1 text-xs text-white/25">
                                {
                                  integration.provider
                                }
                              </div>

                              {integration.baseUrl && (
                                <div className="mt-1 max-w-[350px] truncate text-[10px] text-white/15">
                                  {
                                    integration.baseUrl
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}

                        <td className="px-6 py-5">
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-wide text-white/35">
                            {
                              integration.category
                            }
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">
                          <div
                            className={`flex items-center gap-2 text-xs ${getStatusClass(
                              integration.status
                            )}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                integration.status ===
                                "ACTIVE"
                                  ? "bg-white"
                                  : integration.status ===
                                    "ERROR"
                                  ? "bg-white/40"
                                  : "bg-white/15"
                              }`}
                            />

                            {statusLabel(
                              integration.status
                            )}
                          </div>

                          {integration.lastError && (
                            <div className="mt-1 max-w-[220px] truncate text-[10px] text-white/20">
                              {
                                integration.lastError
                              }
                            </div>
                          )}
                        </td>

                        {/* LAST CHECKED */}

                        <td className="px-6 py-5 text-xs text-white/30">
                          {formatDate(
                            integration.lastCheckedAt
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            {/* TEST */}

                            <button
                              disabled={
                                testingId ===
                                integration._id
                              }
                              onClick={() =>
                                testConnection(
                                  integration
                                )
                              }
                              title="Test connection"
                              className="flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30"
                            >
                              <RefreshCw
                                size={13}
                                className={
                                  testingId ===
                                  integration._id
                                    ? "animate-spin"
                                    : ""
                                }
                              />

                              Test
                            </button>

                            {/* TOGGLE */}

                            <button
                              disabled={
                                testingId ===
                                integration._id
                              }
                              onClick={() =>
                                toggleStatus(
                                  integration
                                )
                              }
                              title={
                                integration.status ===
                                "ACTIVE"
                                  ? "Disable"
                                  : "Enable"
                              }
                              className="flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30"
                            >
                              {integration.status ===
                              "ACTIVE"
                                ? "Disable"
                                : "Enable"}
                            </button>

                            {/* EDIT */}

                            <button
                              onClick={() =>
                                openEdit(
                                  integration
                                )
                              }
                              title="Edit integration"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
                            >
                              <Edit3
                                size={14}
                              />
                            </button>

                            {/* DELETE */}

                            <button
                              onClick={() =>
                                deleteIntegration(
                                  integration
                                )
                              }
                              disabled={
                                deletingId ===
                                integration._id
                              }
                              title="Delete integration"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/30 hover:bg-white/5 hover:text-white disabled:opacity-30"
                            >
                              {deletingId ===
                              integration._id ? (
                                <RefreshCw
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={14}
                                />
                              )}
                            </button>

                            {/* ACTIVITY */}

                            <button
                                type="button"
                                onClick={() =>
                                    openActivity(integration)
                                }
                                title="View activity"
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-white/45 transition hover:bg-white/10 hover:text-white/80"
                                >
                                <History size={14} />

                                <span className="hidden xl:inline">
                                    Activity
                                </span>
                                </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
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
              ? "No integrations"
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
                } integrations`}
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
              className="flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30"
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
              className="flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30"
            >
              Next

              <ChevronRight
                size={14}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          CREATE / EDIT MODAL
          ================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="font-semibold">
                  {editingId
                    ? "Edit Integration"
                    : "Add Integration"}
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Configure the external
                  connection.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                saveIntegration
              }
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                {/* NAME */}

                <div>
                  <label className="mb-2 block text-xs text-white/40">
                    Integration Name
                  </label>

                  <input
                    required
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          name: event
                            .target
                            .value,
                        })
                      )
                    }
                    placeholder="Bajaj DMS API"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
                  />
                </div>

                {/* PROVIDER */}

                <div>
                  <label className="mb-2 block text-xs text-white/40">
                    Provider
                  </label>

                  <input
                    required
                    value={
                      form.provider
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          provider:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Bajaj Auto"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
                  />
                </div>

                {/* CATEGORY */}

                <div>
                  <label className="mb-2 block text-xs text-white/40">
                    Category
                  </label>

                  <select
                    value={
                      form.category
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          category:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#111] px-4 text-sm text-white/60 outline-none"
                  >
                    {categories.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {
                            item
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* STATUS */}

                <div>
                  <label className="mb-2 block text-xs text-white/40">
                    Status
                  </label>

                  <select
                    value={
                      form.status
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          status:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#111] px-4 text-sm text-white/60 outline-none"
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>

                    <option value="ERROR">
                      Error
                    </option>
                  </select>
                </div>
              </div>

              {/* BASE URL */}

              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Base URL
                </label>

                <input
                  value={
                    form.baseUrl
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        baseUrl:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="https://api.example.com"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Describe what this integration is used for..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
                />
              </div>

              {/* SECRET */}

              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Secret
                  {editingId &&
                    " (leave blank to keep existing)"}
                </label>

                <input
                  type="password"
                  value={
                    form.secret
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        secret:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder={
                    editingId
                      ? "Enter new secret only if changing it"
                      : "Client secret / API token"
                  }
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
                />

                <div className="mt-2 text-[10px] text-white/20">
                  The secret is encrypted
                  before being stored and
                  is never returned by the
                  API.
                </div>
              </div>

              {/* CONFIG */}

              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Configuration JSON
                </label>

                <textarea
                  value={
                    form.configText
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        configText:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  rows={8}
                  spellCheck={
                    false
                  }
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-xs text-white/60 outline-none placeholder:text-white/20 focus:border-white/20"
                />

                <div className="mt-2 text-[10px] text-white/20">
                  Example: {"{"}"timeout":5000,
                  "method":"POST"{"}"}
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-2 border-t border-white/10 pt-5">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  )}

                  {editingId
                    ? "Save Changes"
                    : "Create Integration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================================================
    INTEGRATION ACTIVITY DRAWER
    ================================================== */}

{activityIntegration && (
  <div className="fixed inset-0 z-[70]">

    {/* BACKDROP */}

    <button
      type="button"
      aria-label="Close activity"
      onClick={closeActivity}
      className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
    />

    {/* DRAWER */}

    <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#090909] shadow-2xl">

      {/* HEADER */}

      <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">

        <div className="min-w-0">

          <div className="text-[10px] uppercase tracking-[0.2em] text-white/25">
            Integration Activity
          </div>

          <h2 className="mt-2 truncate text-lg font-semibold text-white/80">
            {activityIntegration.name}
          </h2>

          <p className="mt-1 text-xs text-white/30">
            {activityIntegration.provider ||
              "Integration"}{" "}
            · Connection test history
          </p>

        </div>

        <button
          type="button"
          onClick={closeActivity}
          className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>

      </div>

      {/* CONTENT */}

      <div className="flex-1 overflow-y-auto">

        {/* LOADING */}

        {activityLoading &&
          !activityData && (
            <div className="space-y-4 p-6">

              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]"
                />
              ))}

            </div>
          )}

        {/* ERROR */}

        {activityError && (
          <div className="p-6">

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

              <XCircle
                size={20}
                className="text-white/40"
              />

              <p className="mt-3 text-sm text-white/60">
                Unable to load activity
              </p>

              <p className="mt-1 text-xs leading-5 text-white/30">
                {activityError}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadIntegrationLogs(
                    activityIntegration._id,
                    1
                  )
                }
                className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50 hover:bg-white/10 hover:text-white"
              >
                Try Again
              </button>

            </div>

          </div>
        )}

        {/* DATA */}

        {activityData && (
          <div className="space-y-6 p-6">

            {/* SUMMARY */}

            <div className="grid grid-cols-2 gap-3">

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

                <div className="text-[10px] uppercase tracking-wider text-white/25">
                  Total Tests
                </div>

                <div className="mt-2 text-2xl font-semibold text-white/75">
                  {
                    activityData.summary
                      .totalTests
                  }
                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

                <div className="text-[10px] uppercase tracking-wider text-white/25">
                  Success Rate
                </div>

                <div className="mt-2 text-2xl font-semibold text-white/75">
                  {
                    activityData.summary
                      .successRate
                  }
                  %
                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

                <div className="text-[10px] uppercase tracking-wider text-white/25">
                  Successful
                </div>

                <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-white/70">

                  <CheckCircle2
                    size={16}
                  />

                  {
                    activityData.summary
                      .successfulTests
                  }

                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

                <div className="text-[10px] uppercase tracking-wider text-white/25">
                  Failed
                </div>

                <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-white/70">

                  <XCircle
                    size={16}
                  />

                  {
                    activityData.summary
                      .failedTests
                  }

                </div>

              </div>

            </div>

            {/* LAST CHECK */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <div className="text-[10px] uppercase tracking-wider text-white/25">
                    Last Checked
                  </div>

                  <div className="mt-1 text-sm text-white/60">
                    {formatDate(
                      activityData
                        .integration
                        .lastCheckedAt
                    )}
                  </div>

                </div>

                <button
                  type="button"
                  disabled={
                    activityLoading
                  }
                  onClick={() =>
                    loadIntegrationLogs(
                      activityIntegration._id,
                      activityPage
                    )
                  }
                  className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                  <RefreshCw
                    size={13}
                    className={
                      activityLoading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>

              </div>

            </div>

            {/* LOGS */}

            <div>

              <div className="mb-3 flex items-center justify-between">

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/25">
                    Test History
                  </div>

                  <div className="mt-1 text-xs text-white/30">
                    {
                      activityData
                        .pagination
                        .total
                    }{" "}
                    records
                  </div>
                </div>

              </div>

              {activityData.logs.length ===
              0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-10 text-center">

                  <Activity
                    size={24}
                    className="mx-auto text-white/15"
                  />

                  <p className="mt-3 text-sm text-white/40">
                    No test activity yet.
                  </p>

                  <p className="mt-1 text-xs text-white/20">
                    Run Test Connection to
                    create an activity record.
                  </p>

                </div>
              ) : (
                <div className="space-y-3">

                  {activityData.logs.map(
                    (log) => (
                      <div
                        key={log._id}
                        className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
                      >

                        {/* TOP */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex items-center gap-2">

                            {log.result ===
                            "SUCCESS" ? (
                              <CheckCircle2
                                size={16}
                                className="text-white/60"
                              />
                            ) : (
                              <XCircle
                                size={16}
                                className="text-white/40"
                              />
                            )}

                            <span className="text-xs font-medium text-white/60">
                              {log.result ===
                              "SUCCESS"
                                ? "Successful"
                                : "Failed"}
                            </span>

                          </div>

                          <span className="text-[10px] text-white/25">
                            {formatDate(
                              log.createdAt
                            )}
                          </span>

                        </div>

                        {/* METHOD / STATUS */}

                        <div className="mt-4 flex flex-wrap items-center gap-2">

                          {log.method && (
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-white/45">
                              {log.method}
                            </span>
                          )}

                          {log.statusCode !==
                            null &&
                            log.statusCode !==
                              undefined && (
                              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/40">
                                HTTP{" "}
                                {
                                  log.statusCode
                                }
                              </span>
                            )}

                          {log.responseTime !==
                            null &&
                            log.responseTime !==
                              undefined && (
                              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/35">
                                {
                                  log.responseTime
                                }{" "}
                                ms
                              </span>
                            )}

                        </div>

                        {/* MESSAGE */}

                        {log.message && (
                          <p className="mt-3 text-xs leading-5 text-white/45">
                            {log.message}
                          </p>
                        )}

                        {/* ERROR */}

                        {log.error && (
                          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">

                            <div className="text-[10px] uppercase tracking-wider text-white/20">
                              Error
                            </div>

                            <p className="mt-1 break-words text-xs leading-5 text-white/40">
                              {log.error}
                            </p>

                          </div>
                        )}

                        {/* RESPONSE */}

                        {log.responsePreview && (
                          <details className="mt-3">

                            <summary className="cursor-pointer text-[10px] text-white/25 hover:text-white/50">
                              View response preview
                            </summary>

                            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/30 p-3 text-[10px] leading-5 text-white/35">
                              {
                                log.responsePreview
                              }
                            </pre>

                          </details>
                        )}

                        {/* PERFORMED BY */}

                        {log.performedBy && (
                          <div className="mt-3 text-[10px] text-white/20">
                            Tested by{" "}
                            {log.performedBy
                              .name ||
                              log.performedBy
                                .email ||
                              "Admin"}
                          </div>
                        )}

                      </div>
                    )
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* FOOTER / PAGINATION */}

      {activityData &&
        activityData.pagination
          .totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">

            <button
              type="button"
              disabled={
                !activityData
                  .pagination
                  .hasPreviousPage ||
                activityLoading
              }
              onClick={() =>
                loadIntegrationLogs(
                  activityIntegration._id,
                  activityPage - 1
                )
              }
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/40 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft
                size={14}
              />

              Previous
            </button>

            <span className="text-xs text-white/25">
              Page{" "}
              {activityData
                .pagination.page}{" "}
              of{" "}
              {activityData
                .pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                !activityData
                  .pagination
                  .hasNextPage ||
                activityLoading
              }
              onClick={() =>
                loadIntegrationLogs(
                  activityIntegration._id,
                  activityPage + 1
                )
              }
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/40 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next

              <ChevronRight
                size={14}
              />
            </button>

          </div>
        )}

    </aside>

  </div>
)}
    </div>
  );
}