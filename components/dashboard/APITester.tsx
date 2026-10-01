"use client";

import {
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Database,
  Eye,
  EyeOff,
  FileJson,
  KeyRound,
  Loader2,
  Lock,
  Play,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

type AuthType =
  | "NONE"
  | "BEARER"
  | "BASIC"
  | "API_KEY";

type ResponseData = {
  success?: boolean;
  status?: number;
  statusText?: string;
  duration?: number;
  responseTime?: number;
  headers?: Record<string, string>;
  body?: unknown;
  data?: unknown;
  url?: string;
  method?: string;
  message?: string;
};

type KeyValueItem = {
  key: string;
  value: string;
  description?: string;
  enabled?: boolean;
};

type AuthorizationState = {
  type: AuthType;
  token: string;
  username: string;
  password: string;
  apiKey: string;
  apiKeyValue: string;
  addTo: "HEADER" | "QUERY";
};

type EnvironmentVariable = {
  key: string;
  value: string;
  enabled?: boolean;
  secret?: boolean;
};

type Environment = {
  _id: string;
  name: string;
  project:
    | string
    | {
        _id: string;
        name?: string;
      };
  variables?: EnvironmentVariable[];
};

interface APITesterProps {
  open: boolean;
  onClose: () => void;

  requestId?: string | null;

  initialMethod?: HTTPMethod;
  initialUrl?: string;
  initialBody?: string;

  initialParams?: KeyValueItem[];
  initialHeaders?: KeyValueItem[];

  initialAuthorization?: Partial<AuthorizationState>;

  requestName?: string;

  onSaved?: () => void;
  onDeleted?: () => void;

  /*
   * Optional callback used by the parent
   * when a brand-new request needs to
   * be saved into a collection.
   */
  onSaveNew?: () => void;
}

/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const DEFAULT_AUTH: AuthorizationState = {
  type: "NONE",
  token: "",
  username: "",
  password: "",
  apiKey: "",
  apiKeyValue: "",
  addTo: "HEADER",
};

const METHODS: HTTPMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30";

const smallInputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/30";

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatJSON(value: unknown) {
  if (value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    try {
      return JSON.stringify(
        JSON.parse(value),
        null,
        2
      );
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
}

/*
 * Resolve:
 *
 * {{baseUrl}}
 * {{clientId}}
 * {{token}}
 *
 * Unknown variables are intentionally
 * left untouched.
 */

function resolveVariables(
  value: string,
  variables: Record<string, string>
) {
  if (!value) {
    return value;
  }

  return value.replace(
    /\{\{\s*([^{}\s]+)\s*\}\}/g,
    (
      fullMatch,
      variableName: string
    ) => {
      if (
        Object.prototype.hasOwnProperty.call(
          variables,
          variableName
        )
      ) {
        return variables[
          variableName
        ];
      }

      return fullMatch;
    }
  );
}

/*
 * Build a variable dictionary from
 * selected environment.
 */

function buildVariableMap(
  environment: Environment | null
) {
  const map: Record<string, string> =
    {};

  if (!environment) {
    return map;
  }

  (
    environment.variables || []
  ).forEach((variable) => {
    if (
      variable.enabled === false
    ) {
      return;
    }

    if (!variable.key?.trim()) {
      return;
    }

    map[variable.key.trim()] =
      variable.value ?? "";
  });

  return map;
}

/*
 * =========================================================
 * REUSABLE UI
 * =========================================================
 */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs text-white/50">
        {label}
      </label>

      {children}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/25">
        {icon}
      </div>

      <p className="mt-3 text-xs font-medium text-white/40">
        {title}
      </p>

      <p className="mt-1 max-w-sm text-[10px] leading-5 text-white/20">
        {description}
      </p>

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

function TesterSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-white/60">
            {title}
          </h3>

          {count !== undefined && (
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-white/25">
              {count}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {children}
      </div>
    </section>
  );
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function APITester({
  open,
  onClose,

  requestId = null,

  initialMethod = "GET",
  initialUrl = "",
  initialBody = "",

  initialParams = [],
  initialHeaders = [],

  initialAuthorization,

  requestName = "API Request",

  onSaved,
  onDeleted,

  onSaveNew,
}: APITesterProps) {
  /*
   * -------------------------------------------------------
   * REQUEST STATE
   * -------------------------------------------------------
   */

  const [method, setMethod] =
    useState<HTTPMethod>(
      initialMethod
    );

  const [url, setUrl] =
    useState(initialUrl);

  const [params, setParams] =
    useState<KeyValueItem[]>(
      initialParams
    );

  const [headers, setHeaders] =
    useState<KeyValueItem[]>(
      initialHeaders
    );

  const [authorization, setAuthorization] =
    useState<AuthorizationState>({
      ...DEFAULT_AUTH,
      ...initialAuthorization,
    });

  const [body, setBody] =
    useState(initialBody);

  const [bodyType, setBodyType] =
    useState("json");

  /*
   * -------------------------------------------------------
   * UI STATE
   * -------------------------------------------------------
   */

  const [activeTab, setActiveTab] =
    useState<
      "params" | "headers" | "auth" | "body"
    >("params");

  const [responseTab, setResponseTab] =
    useState<
      "body" | "headers"
    >("body");

  const [response, setResponse] =
    useState<ResponseData | null>(
      null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  /*
   * -------------------------------------------------------
   * ENVIRONMENT STATE
   * -------------------------------------------------------
   */

  const [environments, setEnvironments] =
    useState<Environment[]>([]);

  const [selectedEnvironmentId, setSelectedEnvironmentId] =
    useState("");

  const [environmentsLoading, setEnvironmentsLoading] =
    useState(false);

  const [environmentError, setEnvironmentError] =
    useState("");

  const [showEnvironmentVariables, setShowEnvironmentVariables] =
    useState(false);

  const [showSecretValues, setShowSecretValues] =
    useState(false);

  /*
   * =========================================================
   * LOAD ENVIRONMENTS
   * =========================================================
   */

  const loadEnvironments =
    async () => {
      try {
        setEnvironmentsLoading(
          true
        );

        setEnvironmentError("");

        const response =
          await fetch(
            "/api/api-environments",
            {
              cache: "no-store",
              credentials:
                "include",
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
              "Unable to load environments"
          );
        }

        const list =
          Array.isArray(
            data.environments
          )
            ? data.environments
            : [];

        setEnvironments(list);

        /*
         * Only automatically select the
         * first environment if nothing
         * is currently selected.
         */
        if (
          !selectedEnvironmentId &&
          list.length > 0
        ) {
          setSelectedEnvironmentId(
            list[0]._id
          );
        }
      } catch (err) {
        console.error(
          "Load environments error:",
          err
        );

        setEnvironmentError(
          err instanceof Error
            ? err.message
            : "Unable to load environments"
        );
      } finally {
        setEnvironmentsLoading(
          false
        );
      }
    };

  /*
   * Load environments whenever the
   * tester is opened.
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    loadEnvironments();
  }, [open]);

  /*
   * =========================================================
   * SYNC PROPS
   * =========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    setMethod(
      initialMethod || "GET"
    );

    setUrl(
      initialUrl || ""
    );

    setBody(
      initialBody || ""
    );

    setParams(
      Array.isArray(
        initialParams
      )
        ? initialParams
        : []
    );

    setHeaders(
      Array.isArray(
        initialHeaders
      )
        ? initialHeaders
        : []
    );

    setAuthorization({
      ...DEFAULT_AUTH,
      ...initialAuthorization,
    });

    setResponse(null);
    setError("");
    setCopied(false);
  }, [
    open,
    requestId,
    initialMethod,
    initialUrl,
    initialBody,
    initialParams,
    initialHeaders,
    initialAuthorization,
  ]);

  /*
   * =========================================================
   * SELECTED ENVIRONMENT
   * =========================================================
   */

  const selectedEnvironment =
    useMemo(() => {
      return (
        environments.find(
          (environment) =>
            environment._id ===
            selectedEnvironmentId
        ) || null
      );
    }, [
      environments,
      selectedEnvironmentId,
    ]);

  /*
   * =========================================================
   * ENVIRONMENT VARIABLES
   * =========================================================
   */

  const environmentVariables =
    useMemo(() => {
      return buildVariableMap(
        selectedEnvironment
      );
    }, [
      selectedEnvironment,
    ]);

  /*
   * =========================================================
   * RESOLVED REQUEST VALUES
   * =========================================================
   */

  const resolvedUrl = useMemo(() => {
    return resolveVariables(
      url.trim(),
      environmentVariables
    );
  }, [
    url,
    environmentVariables,
  ]);

  const resolvedParams =
    useMemo(() => {
      return params.map((item) => ({
        ...item,

        key: resolveVariables(
          item.key,
          environmentVariables
        ),

        value: resolveVariables(
          item.value,
          environmentVariables
        ),
      }));
    }, [
      params,
      environmentVariables,
    ]);

  const resolvedHeaders =
    useMemo(() => {
      return headers.map((item) => ({
        ...item,

        key: resolveVariables(
          item.key,
          environmentVariables
        ),

        value: resolveVariables(
          item.value,
          environmentVariables
        ),
      }));
    }, [
      headers,
      environmentVariables,
    ]);

  const resolvedAuthorization =
    useMemo(() => {
      return {
        ...authorization,

        token: resolveVariables(
          authorization.token,
          environmentVariables
        ),

        username:
          resolveVariables(
            authorization.username,
            environmentVariables
          ),

        password:
          resolveVariables(
            authorization.password,
            environmentVariables
          ),

        apiKey:
          resolveVariables(
            authorization.apiKey,
            environmentVariables
          ),

        apiKeyValue:
          resolveVariables(
            authorization.apiKeyValue,
            environmentVariables
          ),
      };
    }, [
      authorization,
      environmentVariables,
    ]);

  const resolvedBody =
    useMemo(() => {
      return resolveVariables(
        body,
        environmentVariables
      );
    }, [
      body,
      environmentVariables,
    ]);

  /*
   * =========================================================
   * VARIABLE RESOLUTION INFO
   * =========================================================
   */

  const unresolvedVariables =
    useMemo(() => {
      const source = [
        url,
        ...params.flatMap(
          (item) => [
            item.key,
            item.value,
          ]
        ),
        ...headers.flatMap(
          (item) => [
            item.key,
            item.value,
          ]
        ),
        authorization.token,
        authorization.username,
        authorization.password,
        authorization.apiKey,
        authorization.apiKeyValue,
        body,
      ].filter(Boolean);

      const found = new Set<string>();

      source.forEach((value) => {
        const matches =
          value.matchAll(
            /\{\{\s*([^{}\s]+)\s*\}\}/g
          );

        for (const match of matches) {
          const name =
            match[1];

          if (
            !Object.prototype.hasOwnProperty.call(
              environmentVariables,
              name
            )
          ) {
            found.add(name);
          }
        }
      });

      return Array.from(found);
    }, [
      url,
      params,
      headers,
      authorization,
      body,
      environmentVariables,
    ]);

  /*
   * =========================================================
   * QUERY PARAMETER HELPERS
   * =========================================================
   */

  const addParam = () => {
    setParams((current) => [
      ...current,
      {
        key: "",
        value: "",
        description: "",
        enabled: true,
      },
    ]);
  };

  const updateParam = (
    index: number,
    field: keyof KeyValueItem,
    value: string | boolean
  ) => {
    setParams((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      )
    );
  };

  const removeParam = (
    index: number
  ) => {
    setParams((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  /*
   * =========================================================
   * HEADER HELPERS
   * =========================================================
   */

  const addHeader = () => {
    setHeaders((current) => [
      ...current,
      {
        key: "",
        value: "",
        description: "",
        enabled: true,
      },
    ]);
  };

  const updateHeader = (
    index: number,
    field: keyof KeyValueItem,
    value: string | boolean
  ) => {
    setHeaders((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      )
    );
  };

  const removeHeader = (
    index: number
  ) => {
    setHeaders((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  /*
   * =========================================================
   * PREVIEW URL
   * =========================================================
   */

  const previewUrl =
    useMemo(() => {
      if (!resolvedUrl) {
        return "";
      }

      try {
        const parsed =
          new URL(resolvedUrl);

        resolvedParams.forEach(
          (item) => {
            if (
              item.enabled !==
                false &&
              item.key.trim()
            ) {
              parsed.searchParams.set(
                item.key.trim(),
                item.value
              );
            }
          }
        );

        if (
          resolvedAuthorization.type ===
            "API_KEY" &&
          resolvedAuthorization.addTo ===
            "QUERY" &&
          resolvedAuthorization.apiKey &&
          resolvedAuthorization.apiKeyValue
        ) {
          parsed.searchParams.set(
            resolvedAuthorization.apiKey,
            resolvedAuthorization.apiKeyValue
          );
        }

        return parsed.toString();
      } catch {
        return resolvedUrl;
      }
    }, [
      resolvedUrl,
      resolvedParams,
      resolvedAuthorization,
    ]);

  /*
   * =========================================================
   * REQUEST PAYLOAD FOR SAVE
   *
   * IMPORTANT:
   *
   * We save the original {{variables}}
   * rather than resolved secrets.
   * =========================================================
   */

  const requestPayload =
    useMemo(
      () => ({
        method,

        url: url.trim(),

        queryParams:
          params.map((item) => ({
            key: item.key,
            value: item.value,
            enabled:
              item.enabled !== false,
          })),

        headers:
          headers.map((item) => ({
            key: item.key,
            value: item.value,
            enabled:
              item.enabled !== false,
          })),

        authorization,

        body:
          method === "GET" ||
          method === "HEAD" ||
          method === "OPTIONS"
            ? ""
            : body,

        bodyType,
      }),
      [
        method,
        url,
        params,
        headers,
        authorization,
        body,
        bodyType,
      ]
    );

  /*
   * =========================================================
   * SEND REQUEST
   * =========================================================
   */

  const sendRequest =
    async () => {
      if (!url.trim()) {
        setError(
          "Please enter a request URL."
        );

        return;
      }

      /*
       * Warn about missing environment
       * variables before sending.
       */
      if (
        unresolvedVariables.length >
        0
      ) {
        setError(
          `Missing environment variables: ${unresolvedVariables
            .map(
              (item) =>
                `{{${item}}}`
            )
            .join(", ")}`
        );

        return;
      }

      setLoading(true);
      setError("");
      setResponse(null);

      try {
        const response =
          await fetch(
            "/api/api-tester/execute",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                method,

                url: previewUrl,

                queryParams:
                  resolvedParams,

                headers:
                  resolvedHeaders,

                authorization:
                  resolvedAuthorization,

                body:
                  method === "GET" ||
                  method === "HEAD" ||
                  method === "OPTIONS"
                    ? ""
                    : resolvedBody,

                bodyType,
              }),
              credentials: "include"
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          data.success === false
        ) {
          setError(
            data.message ||
              "Unable to execute request."
          );

          setResponse(data);

          return;
        }

        setResponse(data);

        setResponseTab(
          "body"
        );
      } catch (err) {
        console.error(
          "API Tester error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to execute request."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * =========================================================
   * SAVE EXISTING REQUEST
   * =========================================================
   */

  const saveRequest =
    async () => {
      if (!requestId) {
        /*
         * Let parent handle Save New.
         */
        if (onSaveNew) {
          onSaveNew();
          return;
        }

        setError(
          "This request does not have a saved request ID."
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        const response =
          await fetch(
            `/api/api-requests/${requestId}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  requestPayload
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
              "Unable to save request."
          );
        }

        onSaved?.();
      } catch (err) {
        console.error(
          "Save request error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to save request."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * =========================================================
   * DELETE REQUEST
   * =========================================================
   */

  const deleteRequest =
    async () => {
      if (!requestId) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this request?"
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);
      setError("");

      try {
        const response =
          await fetch(
            `/api/api-requests/${requestId}`,
            {
              method: "DELETE",
              credentials: "include"
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
              "Unable to delete request."
          );
        }

        onDeleted?.();

        onClose();
      } catch (err) {
        console.error(
          "Delete request error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete request."
        );
      } finally {
        setDeleting(false);
      }
    };

  /*
   * =========================================================
   * COPY RESPONSE
   * =========================================================
   */

  const copyResponse =
    async () => {
      if (!response) {
        return;
      }

      try {
        const value =
          response.body ??
          response.data ??
          "";

        await navigator.clipboard.writeText(
          formatJSON(value)
        );

        setCopied(true);

        setTimeout(
          () =>
            setCopied(false),
          1500
        );
      } catch {
        setError(
          "Unable to copy response."
        );
      }
    };

  /*
   * =========================================================
   * AUTHORIZATION OPTIONS
   * =========================================================
   */

  const authTypes: {
    value: AuthType;
    label: string;
  }[] = [
    {
      value: "NONE",
      label: "No Auth",
    },
    {
      value: "BEARER",
      label: "Bearer",
    },
    {
      value: "BASIC",
      label: "Basic",
    },
    {
      value: "API_KEY",
      label: "API Key",
    },
  ];

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

      <div className="flex h-[92vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0d] shadow-2xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
              <Send
                size={17}
                className="text-white"
              />
            </div>

            <div className="min-w-0">

              <div className="truncate text-sm font-semibold text-white">
                {requestName}
              </div>

              <div className="text-[11px] text-white/40">
                API Tester
              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>

        </div>

        {/* ================================================= */}
        {/* ENVIRONMENT BAR */}
        {/* ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.015] px-5 py-2.5">

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 text-[11px] text-white/40">
              <Database size={13} />

              Environment
            </div>

            <div className="relative">

              <select
                value={
                  selectedEnvironmentId
                }
                onChange={(event) =>
                  setSelectedEnvironmentId(
                    event.target.value
                  )
                }
                disabled={
                  environmentsLoading
                }
                className="min-w-[190px] appearance-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 pr-8 text-[11px] text-white outline-none transition focus:border-white/25 disabled:opacity-50"
              >

                <option value="">
                  No Environment
                </option>

                {environments.map(
                  (environment) => (
                    <option
                      key={
                        environment._id
                      }
                      value={
                        environment._id
                      }
                    >
                      {
                        environment.name
                      }
                    </option>
                  )
                )}

              </select>

              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30"
              />

            </div>

            {environmentsLoading && (
              <Loader2
                size={13}
                className="animate-spin text-white/30"
              />
            )}

            {selectedEnvironment && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[9px] text-emerald-300/70">
                {
                  selectedEnvironment
                    .variables?.length || 0
                }{" "}
                variables
              </span>
            )}

          </div>

          <div className="flex items-center gap-3">

            {environmentError && (
              <span className="text-[10px] text-red-300">
                {environmentError}
              </span>
            )}

            {unresolvedVariables.length >
              0 && (
              <span className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[9px] text-amber-300/80">
                Missing:{" "}
                {unresolvedVariables
                  .map(
                    (item) =>
                      `{{${item}}}`
                  )
                  .join(", ")}
              </span>
            )}

            {selectedEnvironment && (
              <button
                type="button"
                onClick={() =>
                  setShowEnvironmentVariables(
                    (current) =>
                      !current
                  )
                }
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                {showEnvironmentVariables ? (
                  <EyeOff size={12} />
                ) : (
                  <Eye size={12} />
                )}

                Variables
              </button>
            )}

          </div>

        </div>

        {/* ================================================= */}
        {/* ENVIRONMENT VARIABLE PREVIEW */}
        {/* ================================================= */}

        {showEnvironmentVariables &&
          selectedEnvironment && (
            <div className="shrink-0 border-b border-white/10 bg-black/20 px-5 py-3">

              <div className="mb-2 flex items-center justify-between">

                <span className="text-[10px] uppercase tracking-wider text-white/25">
                  {
                    selectedEnvironment.name
                  }{" "}
                  Variables
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setShowEnvironmentVariables(
                      false
                    )
                  }
                  className="text-white/20 hover:text-white"
                >
                  <X size={13} />
                </button>

              </div>

              <div className="flex flex-wrap gap-2">

                {(
                  selectedEnvironment.variables ||
                  []
                ).map(
                  (
                    variable,
                    index
                  ) => (
                    <div
                      key={`${variable.key}-${index}`}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                    >

                      <code className="text-[10px] text-white/50">
                        {`{{${variable.key}}}`}
                      </code>

                      <span className="text-white/15">
                        =
                      </span>

                      <code className="max-w-[180px] truncate text-[10px] text-white/60">
                        {variable.secret &&
                        !showSecretValues
                          ? "••••••••"
                          : variable.value}
                      </code>

                    </div>
                  )
                )}

                {(selectedEnvironment
                  .variables || []
                ).some(
                  (item) =>
                    item.secret
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowSecretValues(
                        (current) =>
                          !current
                      )
                    }
                    className="rounded-lg border border-white/10 px-2.5 py-2 text-[9px] text-white/30 hover:text-white"
                  >
                    {showSecretValues
                      ? "Hide Secrets"
                      : "Show Secrets"}
                  </button>
                )}

              </div>

            </div>
          )}

        {/* ================================================= */}
        {/* WORKSPACE */}
        {/* ================================================= */}

        <div className="grid min-h-0 flex-1 grid-cols-2">

          {/* ================================================= */}
          {/* LEFT REQUEST PANEL */}
          {/* ================================================= */}

          <div className="flex min-h-0 flex-col border-r border-white/10">

            {/* REQUEST URL */}
            <div className="shrink-0 border-b border-white/10 p-4">

              <div className="flex gap-2">

                {/* METHOD */}

                <div className="relative w-32">

                  <select
                    value={method}
                    onChange={(event) =>
                      setMethod(
                        event.target
                          .value as HTTPMethod
                      )
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-4 pr-8 text-xs font-semibold text-white outline-none focus:border-white/30"
                  >
                    {METHODS.map(
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

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
                  />

                </div>

                {/* URL */}

                <input
                  value={url}
                  onChange={(event) =>
                    setUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://api.example.com/users/{{userId}}"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-mono text-xs text-white outline-none placeholder:text-white/20 focus:border-white/30"
                />

                {/* SEND */}

                <button
                  type="button"
                  onClick={
                    sendRequest
                  }
                  disabled={loading}
                  className="flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={15} />
                  )}

                  Send
                </button>

              </div>

              {/* RESOLVED URL */}

              {selectedEnvironment &&
                url !== resolvedUrl && (
                  <div className="mt-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2">

                    <div className="mb-1 text-[9px] uppercase tracking-wider text-white/20">
                      Resolved URL
                    </div>

                    <div className="break-all font-mono text-[10px] text-emerald-300/60">
                      {previewUrl ||
                        resolvedUrl}
                    </div>

                  </div>
                )}

            </div>

            {/* REQUEST TABS */}

            <div className="flex h-12 shrink-0 items-center gap-1 border-b border-white/10 px-3">

              {[
                {
                  id: "params",
                  label: "Params",
                },
                {
                  id: "headers",
                  label: "Headers",
                },
                {
                  id: "auth",
                  label: "Authorization",
                },
                {
                  id: "body",
                  label: "Body",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | "params"
                        | "headers"
                        | "auth"
                        | "body"
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-[11px] font-medium transition ${
                    activeTab ===
                    tab.id
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {tab.label}

                  {tab.id ===
                    "params" &&
                    params.length >
                      0 && (
                      <span className="ml-1.5 text-white/30">
                        {
                          params.length
                        }
                      </span>
                    )}

                  {tab.id ===
                    "headers" &&
                    headers.length >
                      0 && (
                      <span className="ml-1.5 text-white/30">
                        {
                          headers.length
                        }
                      </span>
                    )}
                </button>
              ))}

            </div>

            {/* REQUEST CONTENT */}

            <div className="min-h-0 flex-1 overflow-auto p-4">

              {/* ================================================= */}
              {/* PARAMS */}
              {/* ================================================= */}

              {activeTab ===
                "params" && (
                <div>

                  <div className="mb-3 flex items-center justify-between">

                    <div>
                      <div className="text-xs font-semibold text-white">
                        Query Parameters
                      </div>

                      <div className="mt-0.5 text-[10px] text-white/35">
                        Parameters appended to the URL
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        addParam
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <Plus
                        size={13}
                      />
                      Add
                    </button>

                  </div>

                  {params.length ===
                  0 ? (
                    <EmptyState
                      icon={
                        <Database
                          size={17}
                        />
                      }
                      title="No query parameters"
                      description="Add parameters such as page, limit or search."
                      action={
                        <button
                          type="button"
                          onClick={
                            addParam
                          }
                          className="text-xs text-white/40 underline underline-offset-4 hover:text-white"
                        >
                          Add parameter
                        </button>
                      }
                    />
                  ) : (
                    <div className="space-y-2">

                      {params.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={index}
                            className="grid grid-cols-[22px_1fr_1fr_28px] items-center gap-2"
                          >

                            <input
                              type="checkbox"
                              checked={
                                item.enabled !==
                                false
                              }
                              onChange={(
                                event
                              ) =>
                                updateParam(
                                  index,
                                  "enabled",
                                  event
                                    .target
                                    .checked
                                )
                              }
                              className="h-3.5 w-3.5 accent-white"
                            />

                            <input
                              value={
                                item.key
                              }
                              onChange={(
                                event
                              ) =>
                                updateParam(
                                  index,
                                  "key",
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Parameter"
                              className={
                                smallInputClass
                              }
                            />

                            <input
                              value={
                                item.value
                              }
                              onChange={(
                                event
                              ) =>
                                updateParam(
                                  index,
                                  "value",
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Value / {{variable}}"
                              className={
                                smallInputClass
                              }
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeParam(
                                  index
                                )
                              }
                              className="flex items-center justify-center rounded-lg p-2 text-white/20 hover:text-red-300"
                            >
                              <X
                                size={14}
                              />
                            </button>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* ================================================= */}
              {/* HEADERS */}
              {/* ================================================= */}

              {activeTab ===
                "headers" && (
                <TesterSection
                  title="Headers"
                  count={
                    headers.filter(
                      (item) =>
                        item.key.trim()
                    ).length
                  }
                >

                  {headers.length ===
                  0 ? (
                    <EmptyState
                      icon={
                        <KeyRound
                          size={17}
                        />
                      }
                      title="No headers"
                      description="Add headers such as Content-Type, Accept or client-id."
                      action={
                        <button
                          type="button"
                          onClick={
                            addHeader
                          }
                          className="text-xs text-white/40 underline underline-offset-4 hover:text-white"
                        >
                          Add header
                        </button>
                      }
                    />
                  ) : (
                    <>
                      {headers.map(
                        (
                          header,
                          index
                        ) => (
                          <div
                            key={index}
                            className="grid grid-cols-[22px_1fr_1fr_28px] items-center gap-2"
                          >

                            <input
                              type="checkbox"
                              checked={
                                header.enabled !==
                                false
                              }
                              onChange={(
                                event
                              ) =>
                                updateHeader(
                                  index,
                                  "enabled",
                                  event
                                    .target
                                    .checked
                                )
                              }
                              className="h-3.5 w-3.5 accent-white"
                            />

                            <input
                              value={
                                header.key
                              }
                              onChange={(
                                event
                              ) =>
                                updateHeader(
                                  index,
                                  "key",
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Header"
                              className={
                                smallInputClass
                              }
                            />

                            <input
                              value={
                                header.value
                              }
                              onChange={(
                                event
                              ) =>
                                updateHeader(
                                  index,
                                  "value",
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Value / {{variable}}"
                              className={
                                smallInputClass
                              }
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeHeader(
                                  index
                                )
                              }
                              className="flex items-center justify-center rounded-lg p-2 text-white/20 hover:text-red-300"
                            >
                              <X
                                size={14}
                              />
                            </button>

                          </div>
                        )
                      )}

                      <button
                        type="button"
                        onClick={
                          addHeader
                        }
                        className="mt-2 text-xs text-white/30 hover:text-white"
                      >
                        + Add header
                      </button>
                    </>
                  )}

                </TesterSection>
              )}

              {/* ================================================= */}
              {/* AUTH */}
              {/* ================================================= */}

              {activeTab ===
                "auth" && (
                <div>

                  <div className="mb-4">

                    <div className="text-xs font-semibold text-white">
                      Authorization
                    </div>

                    <div className="mt-0.5 text-[10px] text-white/35">
                      Configure authentication for this request.
                    </div>

                  </div>

                  <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">

                    {authTypes.map(
                      (item) => (
                        <button
                          key={
                            item.value
                          }
                          type="button"
                          onClick={() =>
                            setAuthorization(
                              (
                                current
                              ) => ({
                                ...current,
                                type:
                                  item.value,
                              })
                            )
                          }
                          className={`rounded-xl border px-3 py-3 text-left transition ${
                            authorization.type ===
                            item.value
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                          }`}
                        >
                          <div className="text-[11px] font-semibold">
                            {
                              item.label
                            }
                          </div>
                        </button>
                      )
                    )}

                  </div>

                  {authorization.type ===
                    "NONE" && (
                    <EmptyState
                      icon={
                        <Lock
                          size={17}
                        />
                      }
                      title="No authentication"
                      description="This request will be sent without an Authorization header."
                    />
                  )}

                  {authorization.type ===
                    "BEARER" && (
                    <Field label="Token">
                      <input
                        type="password"
                        value={
                          authorization.token
                        }
                        onChange={(
                          event
                        ) =>
                          setAuthorization(
                            (
                              current
                            ) => ({
                              ...current,
                              token:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        placeholder="Bearer token or {{token}}"
                        className={
                          inputClass
                        }
                      />
                    </Field>
                  )}

                  {authorization.type ===
                    "BASIC" && (
                    <div className="space-y-3">

                      <Field label="Username">
                        <input
                          value={
                            authorization.username
                          }
                          onChange={(
                            event
                          ) =>
                            setAuthorization(
                              (
                                current
                              ) => ({
                                ...current,
                                username:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Username or {{username}}"
                          className={
                            inputClass
                          }
                        />
                      </Field>

                      <Field label="Password">
                        <input
                          type="password"
                          value={
                            authorization.password
                          }
                          onChange={(
                            event
                          ) =>
                            setAuthorization(
                              (
                                current
                              ) => ({
                                ...current,
                                password:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Password or {{password}}"
                          className={
                            inputClass
                          }
                        />
                      </Field>

                    </div>
                  )}

                  {authorization.type ===
                    "API_KEY" && (
                    <div className="space-y-3">

                      <Field label="Key">
                        <input
                          value={
                            authorization.apiKey
                          }
                          onChange={(
                            event
                          ) =>
                            setAuthorization(
                              (
                                current
                              ) => ({
                                ...current,
                                apiKey:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="X-API-Key"
                          className={
                            inputClass
                          }
                        />
                      </Field>

                      <Field label="Value">
                        <input
                          type="password"
                          value={
                            authorization.apiKeyValue
                          }
                          onChange={(
                            event
                          ) =>
                            setAuthorization(
                              (
                                current
                              ) => ({
                                ...current,
                                apiKeyValue:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="API key or {{apiKey}}"
                          className={
                            inputClass
                          }
                        />
                      </Field>

                      <div>

                        <div className="mb-2 text-[10px] font-medium text-white/40">
                          Add API key to
                        </div>

                        <div className="flex gap-2">

                          {[
                            "HEADER",
                            "QUERY",
                          ].map(
                            (location) => (
                              <button
                                key={
                                  location
                                }
                                type="button"
                                onClick={() =>
                                  setAuthorization(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      addTo:
                                        location as
                                          | "HEADER"
                                          | "QUERY",
                                    })
                                  )
                                }
                                className={`rounded-lg border px-3 py-2 text-[10px] ${
                                  authorization.addTo ===
                                  location
                                    ? "border-white/20 bg-white/10 text-white"
                                    : "border-white/10 bg-white/5 text-white/30"
                                }`}
                              >
                                {
                                  location ===
                                  "HEADER"
                                    ? "Header"
                                    : "Query"
                                }
                              </button>
                            )
                          )}

                        </div>

                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* ================================================= */}
              {/* BODY */}
              {/* ================================================= */}

              {activeTab ===
                "body" && (
                <div>

                  <div className="mb-4 flex items-center justify-between">

                    <div>
                      <div className="text-xs font-semibold text-white">
                        Request Body
                      </div>

                      <div className="mt-0.5 text-[10px] text-white/35">
                        Variables such as{" "}
                        <code className="text-white/50">
                          {"{{token}}"}
                        </code>{" "}
                        are resolved from the selected environment.
                      </div>
                    </div>

                    <select
                      value={
                        bodyType
                      }
                      onChange={(
                        event
                      ) =>
                        setBodyType(
                          event.target
                            .value
                        )
                      }
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-white/60 outline-none"
                    >
                      <option value="json">
                        JSON
                      </option>

                      <option value="text">
                        Text
                      </option>
                    </select>

                  </div>

                  {[
                    "GET",
                    "HEAD",
                    "OPTIONS",
                  ].includes(
                    method
                  ) ? (
                    <EmptyState
                      icon={
                        <FileJson
                          size={17}
                        />
                      }
                      title="No request body"
                      description={`The ${method} method normally does not send a request body.`}
                    />
                  ) : (
                    <textarea
                      value={body}
                      onChange={(
                        event
                      ) =>
                        setBody(
                          event.target
                            .value
                        )
                      }
                      rows={18}
                      spellCheck={false}
                      placeholder={`{
  "clientId": "{{clientId}}",
  "name": "Codelaunch"
}`}
                      className={`${inputClass} resize-none font-mono text-xs leading-6`}
                    />
                  )}

                </div>
              )}

            </div>

          </div>

          {/* ================================================= */}
          {/* RIGHT RESPONSE PANEL */}
          {/* ================================================= */}

          <div className="flex min-h-0 flex-col">

            {/* RESPONSE HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">

              <div className="flex items-center gap-5">

                <span className="text-xs font-medium text-white/50">
                  Response
                </span>

                {response && (
                  <>
                    <span
                      className={`text-xs font-semibold ${
                        (response.status ||
                          0) >=
                          200 &&
                        (response.status ||
                          0) <
                          300
                          ? "text-emerald-300"
                          : (response.status ||
                                0) >=
                              400
                            ? "text-red-300"
                            : "text-amber-300"
                      }`}
                    >
                      {response.status ||
                        "—"}{" "}
                      {
                        response.statusText ||
                        ""
                      }
                    </span>

                    <span className="flex items-center gap-1 text-xs text-white/25">
                      <Clock3
                        size={12}
                      />

                      {response.duration ??
                        response.responseTime ??
                        0}
                      ms
                    </span>
                  </>
                )}

              </div>

              {response && (
                <button
                  type="button"
                  onClick={
                    copyResponse
                  }
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] text-white/40 hover:bg-white/5 hover:text-white"
                >
                  {copied ? (
                    <Check
                      size={13}
                    />
                  ) : (
                    <Copy
                      size={13}
                    />
                  )}

                  {copied
                    ? "Copied"
                    : "Copy"}
                </button>
              )}

            </div>

            {/* RESPONSE TABS */}

            <div className="flex h-12 shrink-0 items-center border-b border-white/10 px-3">

              <button
                type="button"
                onClick={() =>
                  setResponseTab(
                    "body"
                  )
                }
                className={`rounded-lg px-3 py-2 text-[11px] ${
                  responseTab ===
                  "body"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                }`}
              >
                Body
              </button>

              <button
                type="button"
                onClick={() =>
                  setResponseTab(
                    "headers"
                  )
                }
                className={`rounded-lg px-3 py-2 text-[11px] ${
                  responseTab ===
                  "headers"
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                }`}
              >
                Headers
              </button>

            </div>

            {/* RESPONSE CONTENT */}

            <div className="min-h-0 flex-1 overflow-auto">

              {loading && (
                <div className="flex h-full items-center justify-center">

                  <div className="flex flex-col items-center gap-3">

                    <Loader2
                      size={24}
                      className="animate-spin text-white/50"
                    />

                    <div className="text-xs text-white/35">
                      Sending request...
                    </div>

                  </div>

                </div>
              )}

              {!loading &&
                error && (
                  <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">

                    <div className="mb-1 text-xs font-semibold text-red-300">
                      Request failed
                    </div>

                    <div className="break-words text-xs leading-5 text-red-300/70">
                      {error}
                    </div>

                  </div>
                )}

              {!loading &&
                !error &&
                !response && (
                  <div className="flex h-full flex-col items-center justify-center text-center">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                      <Play
                        size={20}
                        className="text-white/20"
                      />
                    </div>

                    <p className="mt-4 text-sm text-white/30">
                      Send a request to see
                      the response
                    </p>

                    {selectedEnvironment && (
                      <p className="mt-2 text-[10px] text-white/15">
                        Environment:{" "}
                        {
                          selectedEnvironment.name
                        }
                      </p>
                    )}

                  </div>
                )}

              {!loading &&
                response &&
                responseTab ===
                  "body" && (
                  <div className="p-4">

                    <pre className="min-h-[300px] whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-[11px] leading-5 text-white/75">
                      {formatJSON(
                        response.body ??
                          response.data
                      )}
                    </pre>

                  </div>
                )}

              {!loading &&
                response &&
                responseTab ===
                  "headers" && (
                  <div className="p-4">

                    {Object.keys(
                      response.headers ||
                        {}
                    ).length ===
                    0 ? (
                      <EmptyState
                        icon={
                          <Database
                            size={
                              17
                            }
                          />
                        }
                        title="No response headers"
                        description="The API did not return response headers."
                      />
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-white/10">

                        {Object.entries(
                          response.headers ||
                            {}
                        ).map(
                          ([
                            key,
                            value,
                          ]) => (
                            <div
                              key={
                                key
                              }
                              className="grid grid-cols-2 border-b border-white/5 last:border-0"
                            >

                              <div className="bg-white/[0.02] px-3 py-2.5 font-mono text-[10px] text-white/50">
                                {
                                  key
                                }
                              </div>

                              <div className="break-all px-3 py-2.5 font-mono text-[10px] text-white/70">
                                {
                                  value
                                }
                              </div>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>
                )}

            </div>

            {/* RESPONSE FOOTER */}

            {response && (
              <div className="flex h-10 shrink-0 items-center border-t border-white/10 px-4 text-[10px] text-white/30">

                {response.method ||
                  method}

                {" • "}

                {response.url ||
                  previewUrl ||
                  url}

              </div>
            )}

          </div>

        </div>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="flex h-16 shrink-0 items-center justify-between border-t border-white/10 px-5">

          <div className="flex items-center gap-2 text-[10px] text-white/30">

            {requestId ? (
              <>
                <Check
                  size={12}
                  className="text-emerald-400"
                />

                Saved request
              </>
            ) : (
              <>
                <Database
                  size={12}
                />

                Unsaved request
              </>
            )}

            {selectedEnvironment && (
              <>
                <span className="text-white/10">
                  •
                </span>

                <span className="text-white/25">
                  {
                    selectedEnvironment.name
                  }
                </span>
              </>
            )}

          </div>

          <div className="flex items-center gap-2">

            {requestId && (
              <button
                type="button"
                onClick={
                  deleteRequest
                }
                disabled={
                  deleting ||
                  saving
                }
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={14}
                  />
                )}

                Delete
              </button>
            )}

            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              Close
            </button>

            <button
              type="button"
              onClick={
                saveRequest
              }
              disabled={
                saving ||
                deleting
              }
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Save size={14} />
              )}

              {requestId
                ? "Save Changes"
                : "Save Request"}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}