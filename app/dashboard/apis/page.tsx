"use client";

import {
  ArrowUpRight,
  ChevronDown,
  Code2,
  ExternalLink,
  FileJson,
  KeyRound,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  X,
  Copy,
  Check,
  Clock3,
  Globe2,
  Save,
} from "lucide-react";

import APITester from "@/components/dashboard/APITester";

import { useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";

import PageHeader from "@/components/dashboard/PageHeader";

interface Project {
  _id: string;
  name: string;
}

interface APICollection {
  _id: string;
  name: string;
  description?: string;
  project:
    | string
    | {
        _id: string;
        name: string;
      };
}

interface APIItem {
  _id: string;
  name: string;
  description: string;
  method: string;
  endpoint: string;
  baseUrl: string;
  version: string;
  status: string;
  project?: Project;
  parameters: Parameter[];
  headers: Header[];
  auth: AuthConfig;
  requestBody: string;
  responseExample: string;
  tags: string[];
  documentation: string;
}

interface Parameter {
  key: string;
  value: string;
  description: string;
  required: boolean;
}

interface Header {
  key: string;
  value: string;
  description: string;
  required: boolean;
}

type AuthType =
  | "NONE"
  | "BEARER"
  | "BASIC"
  | "API_KEY";

interface AuthConfig {
  type: AuthType;
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyValue?: string;
}

interface FormState {
  name: string;
  description: string;
  project: string;
  method: string;
  endpoint: string;
  baseUrl: string;
  version: string;
  status: string;
  parameters: Parameter[];
  headers: Header[];
  auth: AuthConfig;
  requestBody: string;
  responseExample: string;
  tags: string;
  documentation: string;
}

const emptyParameter: Parameter = {
  key: "",
  value: "",
  description: "",
  required: false,
};

const emptyHeader: Header = {
  key: "",
  value: "",
  description: "",
  required: false,
};

const emptyForm: FormState = {
  name: "",
  description: "",
  project: "",
  method: "GET",
  endpoint: "/api/v1/example",
  baseUrl: "",
  version: "v1",
  status: "DRAFT",
  parameters: [],
  headers: [],
  auth: {
    type: "NONE",
  },
  requestBody: "",
  responseExample: "",
  tags: "",
  documentation: "",
};

const methods = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

const statuses = [
  "DRAFT",
  "ACTIVE",
  "DEPRECATED",
  "ARCHIVED",
];

const authTypes = [
  "NONE",
  "BEARER",
  "BASIC",
  "API_KEY",
];

function methodClass(method: string) {
  switch (method) {
    case "GET":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";

    case "POST":
      return "text-blue-300 bg-blue-500/10 border-blue-500/20";

    case "PUT":
      return "text-amber-300 bg-amber-500/10 border-amber-500/20";

    case "PATCH":
      return "text-purple-300 bg-purple-500/10 border-purple-500/20";

    case "DELETE":
      return "text-red-300 bg-red-500/10 border-red-500/20";

    default:
      return "text-white/50 bg-white/5 border-white/10";
  }
}

function createId() {
  return `${Date.now()}-${Math.random()}`;
}

export default function APIsPage() {
  const [apis, setApis] = useState<APIItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [editingAPI, setEditingAPI] =
    useState<APIItem | null>(null);

  const [selectedAPI, setSelectedAPI] =
    useState<APIItem | null>(null);

  const [deleteAPI, setDeleteAPI] =
    useState<APIItem | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [collections, setCollections] =
  useState<APICollection[]>([]);

const [saveRequestOpen, setSaveRequestOpen] =
  useState(false);

const [saveRequestName, setSaveRequestName] =
  useState("");

const [selectedCollection, setSelectedCollection] =
  useState("");

const [collectionsLoading, setCollectionsLoading] =
  useState(false);

const [savingRequest, setSavingRequest] =
  useState(false);

const [saveRequestError, setSaveRequestError] =
  useState("");

const [saveRequestSuccess, setSaveRequestSuccess] =
  useState("");

const [editingRequestId, setEditingRequestId] =
  useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [apiResponse, projectResponse] =
        await Promise.all([
          fetch("/api/apis"),
          fetch("/api/projects"),
        ]);

      const apiData = await apiResponse.json();
      const projectData =
        await projectResponse.json();

      if (!apiResponse.ok) {
        throw new Error(
          apiData.message || "Unable to load APIs"
        );
      }

      if (!projectResponse.ok) {
        throw new Error(
          projectData.message ||
            "Unable to load projects"
        );
      }

      setApis(apiData.apis || []);
      setProjects(projectData.projects || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
  }, []);
  
  const searchParams = useSearchParams();

  const requestId =
    searchParams.get("request");

  useEffect(() => {
    if (!requestId) {
      return;
    }

    openSavedRequest(
      requestId
    );
  }, [requestId]);


  const loadSavedRequest = async (
    id: string
  ) => {
    try {
      const response = await fetch(
        `/api/api-requests/${id}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load saved request"
        );
      }

      const saved =
        data.request;

      /*
      * Populate API Tester
      */
      setTestMethod(
        saved.method || "GET"
      );

      setTestUrl(
        saved.url || ""
      );

      setTestBody(
        saved.body || ""
      );

      /*
      * Query parameters
      */
      setTestParameters(
        Array.isArray(
          saved.queryParams
        )
          ? saved.queryParams.map(
              (item: any) => ({
                key:
                  item.key || "",
                value:
                  item.value || "",
                description: "",
                required:
                  Boolean(
                    item.enabled
                  ),
              })
            )
          : []
      );

      /*
      * Headers
      */
      setTestHeaders(
        Array.isArray(
          saved.headers
        )
          ? saved.headers.map(
              (item: any) => ({
                key:
                  item.key || "",
                value:
                  item.value || "",
                description: "",
                required:
                  Boolean(
                    item.enabled
                  ),
              })
            )
          : []
      );

      /*
      * Authorization
      */
      if (saved.authorization) {
        const auth =
          saved.authorization;

        setTestAuth({
          type:
            auth.type || "NONE",

          token:
            auth.token || "",

          username:
            auth.username || "",

          password:
            auth.password || "",

          apiKey:
            auth.key || "",

          apiKeyValue:
            auth.value || "",
        });
      }

      /*
      * Open tester
      */
      setTesterOpen(true);
    } catch (error) {
      console.error(
        "Load saved request error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load saved request"
      );
    }
  };

  const openSavedRequest = async (
    id: string
  ) => {
    try {
      setTestLoading(true);
      setTestError("");
      setTestResponse(null);

      const response = await fetch(
        `/api/api-requests/${id}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load saved request"
        );
      }

      const saved =
        data.request;

      if (!saved) {
        throw new Error(
          "Saved request was not found."
        );
      }

      /*
      * Existing request ID.
      * This determines whether the Tester
      * is editing or creating a request.
      */
      setEditingRequestId(
        saved._id
      );

      /*
      * Project
      */
      const savedProject =
        typeof saved.project ===
        "object"
          ? saved.project
          : undefined;

      /*
      * API object required by Tester.
      */
      const savedAPI: APIItem = {
        _id:
          saved.api?._id ||
          saved._id,

        name:
          saved.name ||
          "Saved API Request",

        description:
          saved.description ||
          "",

        method:
          saved.method ||
          "GET",

        endpoint:
          saved.url ||
          "",

        baseUrl: "",

        version:
          saved.version ||
          "v1",

        status:
          saved.status ||
          "ACTIVE",

        project:
          savedProject
            ? {
                _id:
                  savedProject._id,
                name:
                  savedProject.name,
              }
            : undefined,

        parameters: [],

        headers: [],

        auth: {
          type:
            "NONE",
        },

        requestBody:
          saved.body ||
          "",

        responseExample:
          "",

        tags: [],

        documentation:
          "",
      };

      /*
      * IMPORTANT
      *
      * Tester is rendered using:
      *
      * testerOpen && selectedAPI
      */
      setSelectedAPI(
        savedAPI
      );

      /*
      * METHOD
      */
      setTestMethod(
        saved.method ||
          "GET"
      );

      /*
      * URL
      */
      setTestUrl(
        saved.url ||
          ""
      );

      /*
      * QUERY PARAMETERS
      */
      setTestParameters(
        Array.isArray(
          saved.queryParams
        )
          ? saved.queryParams.map(
              (item: any) => ({
                key:
                  item.key ||
                  "",

                value:
                  item.value ||
                  "",

                description:
                  item.description ||
                  "",

                required:
                  Boolean(
                    item.enabled
                  ),
              })
            )
          : []
      );

      /*
      * HEADERS
      */
      setTestHeaders(
        Array.isArray(
          saved.headers
        )
          ? saved.headers.map(
              (item: any) => ({
                key:
                  item.key ||
                  "",

                value:
                  item.value ||
                  "",

                description:
                  item.description ||
                  "",

                required:
                  Boolean(
                    item.enabled
                  ),
              })
            )
          : []
      );

      /*
      * AUTHORIZATION
      */
      const auth =
        saved.authorization;

      setTestAuth({
        type:
          auth?.type ||
          "NONE",

        token:
          auth?.token ||
          "",

        username:
          auth?.username ||
          "",

        password:
          auth?.password ||
          "",

        apiKey:
          auth?.key ||
          "",

        apiKeyValue:
          auth?.value ||
          "",
      });

      /*
      * BODY
      */
      setTestBody(
        saved.body ||
          ""
      );

      /*
      * RESPONSE
      */
      setResponseTab(
        "body"
      );

      /*
      * OPEN TESTER
      */
      setTesterOpen(
        true
      );
    } catch (error) {
      console.error(
        "Open saved request error:",
        error
      );

      setTestError(
        error instanceof Error
          ? error.message
          : "Unable to open saved request"
      );
    } finally {
      setTestLoading(
        false
      );
    }
  };

  const saveCurrentRequest = async () => {
    if (!selectedAPI) {
      setTestError(
        "No API request is selected."
      );
      return;
    }

    if (!testUrl.trim()) {
      setTestError(
        "URL is required."
      );
      return;
    }

    if (!editingRequestId) {
      /*
      * New request.
      *
      * Use the existing Save Request modal,
      * because it handles collection selection.
      */
      await openSaveRequest();
      return;
    }

    try {
      setSavingRequest(true);
      setTestError("");

      const response =
        await fetch(
          `/api/api-requests/${editingRequestId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                method:
                  testMethod,

                url:
                  testUrl.trim(),

                queryParams:
                  testParameters.map(
                    (item) => ({
                      key:
                        item.key || "",

                      value:
                        item.value || "",

                      enabled:
                        Boolean(
                          item.key?.trim()
                        ),
                    })
                  ),

                headers:
                  testHeaders.map(
                    (item) => ({
                      key:
                        item.key || "",

                      value:
                        item.value || "",

                      enabled:
                        Boolean(
                          item.key?.trim()
                        ),
                    })
                  ),

                authorization: {
                  type:
                    testAuth.type ||
                    "NONE",

                  token:
                    testAuth.token ||
                    "",

                  username:
                    testAuth.username ||
                    "",

                  password:
                    testAuth.password ||
                    "",

                  key:
                    testAuth.apiKey ||
                    "",

                  value:
                    testAuth.apiKeyValue ||
                    "",

                  addTo:
                    "HEADER",
                },

                bodyType:
                  testMethod ===
                    "GET" ||
                  testMethod ===
                    "HEAD"
                    ? "none"
                    : "json",

                body:
                  testMethod ===
                    "GET" ||
                  testMethod ===
                    "HEAD"
                    ? ""
                    : testBody,
              }),
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
            "Unable to update request"
        );
      }

      /*
      * Update local Tester state.
      */
      if (data.request) {
        setTestMethod(
          data.request.method ||
            testMethod
        );

        setTestUrl(
          data.request.url ||
            testUrl
        );

        setTestBody(
          data.request.body ||
            ""
        );
      }

      alert(
        "Request updated successfully."
      );
    } catch (error) {
      console.error(
        "Update request error:",
        error
      );

      setTestError(
        error instanceof Error
          ? error.message
          : "Unable to update request"
      );
    } finally {
      setSavingRequest(false);
    }
  };

  const deleteCurrentRequest =
    async () => {
      if (!editingRequestId) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this request?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setSavingRequest(true);
        setTestError("");

        const response =
          await fetch(
            `/api/api-requests/${editingRequestId}`,
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
              "Unable to delete request"
          );
        }

        setTesterOpen(
          false
        );

        setSelectedAPI(
          null
        );

        setEditingRequestId(
          null
        );

        window.history.replaceState(
          null,
          "",
          "/dashboard/apis"
        );

        alert(
          "Request deleted successfully."
        );
      } catch (error) {
        console.error(
          "Delete request error:",
          error
        );

        setTestError(
          error instanceof Error
            ? error.message
            : "Unable to delete request"
        );
      } finally {
        setSavingRequest(
          false
        );
      }
  };

  const openCreate = () => {
    setEditingAPI(null);

    setForm({
      ...emptyForm,
      project: projects[0]?._id || "",
    });

    setError("");
    setModalOpen(true);
  };

  const openEdit = (api: APIItem) => {
    setEditingAPI(api);

    setForm({
      name: api.name,
      description: api.description || "",
      project:
        typeof api.project === "object"
          ? api.project._id
          : "",
      method: api.method,
      endpoint: api.endpoint,
      baseUrl: api.baseUrl || "",
      version: api.version || "v1",
      status: api.status || "DRAFT",
      parameters: api.parameters || [],
      headers: api.headers || [],
      auth: api.auth || {
        type: "NONE",
      },
      requestBody: api.requestBody || "",
      responseExample:
        api.responseExample || "",
      tags: api.tags?.join(", ") || "",
      documentation: api.documentation || "",
    });

    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (!form.project) {
      setError("Please select a project.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,

        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const url = editingAPI
        ? `/api/apis/${editingAPI._id}`
        : "/api/apis";

      const response = await fetch(url, {
        method: editingAPI ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save API"
        );
      }

      if (editingAPI) {
        setApis((current) =>
          current.map((api) =>
            api._id === data.api._id
              ? data.api
              : api
          )
        );
      } else {
        setApis((current) => [
          data.api,
          ...current,
        ]);
      }

      setModalOpen(false);
      setEditingAPI(null);
      setForm(emptyForm);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save API"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAPI) return;

    try {
      const response = await fetch(
        `/api/apis/${deleteAPI._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setApis((current) =>
        current.filter(
          (api) => api._id !== deleteAPI._id
        )
      );

      setDeleteAPI(null);
      setDetailsOpen(false);
      setSelectedAPI(null);
    } catch (error) {
      console.error(error);
    }
  };

  const addParameter = () => {
    setForm((current) => ({
      ...current,
      parameters: [
        ...current.parameters,
        {
          ...emptyParameter,
          key: createId(),
        },
      ],
    }));
  };

  const updateParameter = (
    index: number,
    field: keyof Parameter,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      parameters: current.parameters.map(
        (parameter, i) =>
          i === index
            ? {
                ...parameter,
                [field]: value,
              }
            : parameter
      ),
    }));
  };

  const removeParameter = (index: number) => {
    setForm((current) => ({
      ...current,
      parameters: current.parameters.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const addHeader = () => {
    setForm((current) => ({
      ...current,
      headers: [
        ...current.headers,
        {
          ...emptyHeader,
          key: createId(),
        },
      ],
    }));
  };

  const updateHeader = (
    index: number,
    field: keyof Header,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      headers: current.headers.map(
        (header, i) =>
          i === index
            ? {
                ...header,
                [field]: value,
              }
            : header
      ),
    }));
  };

  const removeHeader = (index: number) => {
    setForm((current) => ({
      ...current,
      headers: current.headers.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const filteredAPIs = apis.filter((api) => {
    const projectName =
      typeof api.project === "object"
        ? api.project.name
        : "";

    return `${api.name}
      ${api.description}
      ${api.endpoint}
      ${api.method}
      ${projectName}
      ${api.status}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const [testerOpen, setTesterOpen] = useState(false);

const [testLoading, setTestLoading] = useState(false);

const [testError, setTestError] = useState("");

const [testResponse, setTestResponse] =
  useState<{
    status: number;
    statusText: string;
    responseTime: number;
    headers: Record<string, string>;
    data: unknown;
  } | null>(null);

const [testUrl, setTestUrl] = useState("");

const [testMethod, setTestMethod] =
  useState("GET");

const [testHeaders, setTestHeaders] =
  useState<Header[]>([]);

const [testParameters, setTestParameters] =
  useState<Parameter[]>([]);

const [testBody, setTestBody] =
  useState("");

const [testAuth, setTestAuth] =
  useState<AuthConfig>({
    type: "NONE",
  });

const [responseTab, setResponseTab] =
  useState<"body" | "headers">("body");

const openTester = (api: APIItem) => {
  const baseUrl = api.baseUrl || "";

  const endpoint = api.endpoint || "";

  setSelectedAPI(api);

  setTestMethod(api.method || "GET");

  setTestUrl(`${baseUrl}${endpoint}`);

  setTestHeaders(api.headers || []);

  setTestParameters(api.parameters || []);

  setTestBody(api.requestBody || "");

  setTestAuth(
    api.auth || {
      type: "NONE",
    }
  );

  setTestResponse(null);

  setTestError("");

  setTesterOpen(true);
};

const loadCollections = async (
  projectId?: string
) => {
  try {
    setCollectionsLoading(true);
    setSaveRequestError("");

    const response = await fetch(
      "/api/api-collections",
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Unable to load collections"
      );
    }

    let result: APICollection[] =
      data.collections || [];

    if (projectId) {
      result = result.filter((collection) => {
        const collectionProject =
          typeof collection.project === "object"
            ? collection.project._id
            : collection.project;

        return (
          collectionProject === projectId
        );
      });
    }

    setCollections(result);

    if (result.length > 0) {
      setSelectedCollection(
        result[0]._id
      );
    } else {
      setSelectedCollection("");
    }
  } catch (error) {
    console.error(error);

    setSaveRequestError(
      error instanceof Error
        ? error.message
        : "Unable to load collections"
    );
  } finally {
    setCollectionsLoading(false);
  }
};

const openSaveRequest = async () => {
  setSaveRequestError("");
  setSaveRequestSuccess("");

  const projectId =
    typeof selectedAPI?.project === "object"
      ? selectedAPI.project._id
      : "";

  setSaveRequestName(
    selectedAPI?.name ||
      "New API Request"
  );

  setSelectedCollection("");

  setSaveRequestOpen(true);

  await loadCollections(projectId);
};

const saveRequest = async () => {
  setSaveRequestError("");
  setSaveRequestSuccess("");

  if (!selectedAPI) {
    setSaveRequestError(
      "No API is selected."
    );
    return;
  }

  if (!saveRequestName.trim()) {
    setSaveRequestError(
      "Request name is required."
    );
    return;
  }

  if (!selectedCollection) {
    setSaveRequestError(
      "Please select a collection."
    );
    return;
  }

  const projectId =
    typeof selectedAPI.project === "object"
      ? selectedAPI.project._id
      : "";

  if (!projectId) {
    setSaveRequestError(
      "The selected API does not have a project."
    );
    return;
  }

  setSavingRequest(true);

  try {
    const response = await fetch(
      "/api/api-requests",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          name: saveRequestName.trim(),

          method: testMethod,

          url: testUrl.trim(),

          project: projectId,

          collection:
            selectedCollection,

          queryParams:
            testParameters.map(
              (parameter) => ({
                key: parameter.key || "",
                value:
                  parameter.value || "",
                enabled:
                  Boolean(
                    parameter.key?.trim()
                  ),
              })
            ),

          headers:
            testHeaders.map(
              (header) => ({
                key: header.key || "",
                value:
                  header.value || "",
                enabled:
                  Boolean(
                    header.key?.trim()
                  ),
              })
            ),

          authorization: {
            type:
              testAuth.type || "NONE",

            token:
              testAuth.token || "",

            username:
              testAuth.username || "",

            password:
              testAuth.password || "",

            key:
              testAuth.apiKey || "",

            value:
              testAuth.apiKeyValue || "",

            addTo: "HEADER",
          },

          bodyType:
            testMethod === "GET" ||
            testMethod === "HEAD"
              ? "none"
              : "json",

          body:
            testMethod === "GET" ||
            testMethod === "HEAD"
              ? ""
              : testBody,

          preRequestScript: "",

          testScript: "",
        }),
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
          "Unable to save request"
      );
    }

    setSaveRequestSuccess(
      "Request saved successfully."
    );

    setTimeout(() => {
      setSaveRequestOpen(false);
      setSaveRequestSuccess("");
    }, 900);
  } catch (error) {
    console.error(error);

    setSaveRequestError(
      error instanceof Error
        ? error.message
        : "Unable to save request"
    );
  } finally {
    setSavingRequest(false);
  }
};

const executeTest = async () => {
  setTestLoading(true);
  setTestError("");
  setTestResponse(null);

  try {
    let finalUrl = testUrl.trim();

    const activeParameters =
      testParameters.filter(
        (parameter) =>
          parameter.key.trim() &&
          parameter.value !== ""
      );

    if (activeParameters.length > 0) {
      const query = activeParameters
        .map(
          (parameter) =>
            `${encodeURIComponent(
              parameter.key
            )}=${encodeURIComponent(
              parameter.value
            )}`
        )
        .join("&");

      finalUrl +=
        finalUrl.includes("?")
          ? `&${query}`
          : `?${query}`;
    }

    const headers: Record<string, string> = {};

    testHeaders.forEach((header) => {
      if (
        header.key.trim() &&
        header.value !== ""
      ) {
        headers[header.key] = header.value;
      }
    });

    if (testAuth.type === "BEARER") {
      if (testAuth.token) {
        headers.Authorization =
          `Bearer ${testAuth.token}`;
      }
    }

    if (testAuth.type === "BASIC") {
      if (
        testAuth.username &&
        testAuth.password
      ) {
        const credentials =
          btoa(
            `${testAuth.username}:${testAuth.password}`
          );

        headers.Authorization =
          `Basic ${credentials}`;
      }
    }

    if (testAuth.type === "API_KEY") {
      if (
        testAuth.apiKey &&
        testAuth.apiKeyValue
      ) {
        headers[testAuth.apiKey] =
          testAuth.apiKeyValue;
      }
    }

    const response = await fetch(
      "/api/apis/test",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          method: testMethod,

          url: finalUrl,

          headers,

          body:
            testMethod === "GET" ||
            testMethod === "HEAD"
              ? undefined
              : testBody,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Request failed"
      );
    }

    setTestResponse(data.response);
  } catch (error) {
    console.error(error);

    setTestError(
      error instanceof Error
        ? error.message
        : "Unable to execute request"
    );
  } finally {
    setTestLoading(false);
  }
};

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Developer Platform"
        title="API Management"
        description="Design, document and manage your APIs from one workspace."
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <Plus size={17} />
            New API
          </button>
        }
      />

      {/* SEARCH */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search APIs, endpoints..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm outline-none placeholder:text-white/25 focus:border-white/20"
          />
        </div>

        <div className="text-xs text-white/25">
          {filteredAPIs.length} API
          {filteredAPIs.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* CONTENT */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-12 text-center text-sm text-white/30">
            Loading APIs...
          </div>
        ) : filteredAPIs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <Code2
                size={24}
                className="text-white/30"
              />
            </div>

            <h3 className="mt-5 font-semibold">
              {search
                ? "No matching APIs"
                : "No APIs yet"}
            </h3>

            <p className="mt-2 text-sm text-white/30">
              {search
                ? "Try a different search."
                : "Create your first API endpoint."}
            </p>

            {!search && (
              <button
                onClick={openCreate}
                className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
              >
                Create API
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {/* TABLE HEADER */}
            <div className="hidden grid-cols-[110px_1.5fr_1fr_120px_90px_80px] gap-4 border-b border-white/10 bg-white/[0.02] px-5 py-3 text-[10px] uppercase tracking-wider text-white/25 lg:grid">
              <div>Method</div>
              <div>API</div>
              <div>Project</div>
              <div>Status</div>
              <div>Version</div>
              <div />
            </div>

            {filteredAPIs.map((api) => (
              <div
                key={api._id}
                className="grid gap-4 border-b border-white/10 p-5 last:border-b-0 lg:grid-cols-[110px_1.5fr_1fr_120px_90px_80px] lg:items-center"
              >
                {/* METHOD */}
                <div>
                  <span
                    className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-semibold tracking-wider ${methodClass(
                      api.method
                    )}`}
                  >
                    {api.method}
                  </span>
                </div>

                {/* API */}
                <button
                  onClick={() => {
                    setSelectedAPI(api);
                    setDetailsOpen(true);
                  }}
                  className="min-w-0 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Code2
                      size={15}
                      className="shrink-0 text-white/30"
                    />

                    <span className="truncate text-sm font-medium">
                      {api.name}
                    </span>
                  </div>

                  <p className="mt-1 truncate font-mono text-[11px] text-white/25">
                    {api.endpoint}
                  </p>
                </button>

                {/* PROJECT */}
                <div className="truncate text-sm text-white/40">
                  {typeof api.project === "object"
                    ? api.project.name
                    : "—"}
                </div>

                {/* STATUS */}
                <div>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/40">
                    {api.status}
                  </span>
                </div>

                {/* VERSION */}
                <div className="text-xs text-white/30">
                  {api.version}
                </div>

                {/* ACTIONS */}
                <div className="flex gap-1">
                  <button
                    onClick={() => openTester(api)}
                    className="rounded-lg p-2 text-white/25 hover:bg-emerald-500/10 hover:text-emerald-300"
                    title="Test API"
                  >
                    <Play size={15} />
                  </button>

                  <button
                    onClick={() => openEdit(api)}
                    className="rounded-lg p-2 text-white/25 hover:bg-white/5 hover:text-white"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() =>
                      setDeleteAPI(api)
                    }
                    className="rounded-lg p-2 text-white/25 hover:bg-red-500/10 hover:text-red-300"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
          <button
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close"
          />

          <div className="relative my-8 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 px-7 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                  API Workspace
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {editingAPI
                    ? "Edit API"
                    : "Create API"}
                </h2>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="max-h-[75vh] overflow-y-auto p-7"
            >
              <div className="space-y-8">
                {/* BASIC */}
                <section>
                  <SectionTitle
                    title="Basic Information"
                    description="Define the API identity and project."
                  />

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field label="API Name">
                      <input
                        value={form.name}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            name: event.target.value,
                          })
                        }
                        required
                        placeholder="Customer Profile API"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Project">
                      <select
                        value={form.project}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            project:
                              event.target.value,
                          })
                        }
                        required
                        className={inputClass}
                      >
                        <option value="">
                          Select project
                        </option>

                        {projects.map((project) => (
                          <option
                            key={project._id}
                            value={project._id}
                          >
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field
                      label="Description"
                      className="sm:col-span-2"
                    >
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            description:
                              event.target.value,
                          })
                        }
                        rows={3}
                        placeholder="What does this API do?"
                        className={`${inputClass} resize-none`}
                      />
                    </Field>
                  </div>
                </section>

                {/* ENDPOINT */}
                <section>
                  <SectionTitle
                    title="Endpoint"
                    description="Configure the API method and endpoint."
                  />

                  <div className="mt-5 grid gap-4 sm:grid-cols-[130px_1fr_100px]">
                    <Field label="Method">
                      <select
                        value={form.method}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            method:
                              event.target.value,
                          })
                        }
                        className={`${inputClass} font-semibold`}
                      >
                        {methods.map((method) => (
                          <option
                            key={method}
                            value={method}
                          >
                            {method}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Endpoint">
                      <input
                        value={form.endpoint}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            endpoint:
                              event.target.value,
                          })
                        }
                        required
                        placeholder="/api/v1/customers"
                        className={`${inputClass} font-mono`}
                      />
                    </Field>

                    <Field label="Version">
                      <input
                        value={form.version}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            version:
                              event.target.value,
                          })
                        }
                        placeholder="v1"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Base URL">
                      <input
                        value={form.baseUrl}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            baseUrl:
                              event.target.value,
                          })
                        }
                        placeholder="https://api.example.com"
                        className={`${inputClass} font-mono`}
                      />
                    </Field>

                    <Field label="Status">
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            status:
                              event.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        {statuses.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </section>

                {/* PARAMETERS */}
                <section>
                  <SectionTitle
                    title="Query Parameters"
                    description="Define dynamic query parameters."
                    action={
                      <button
                        type="button"
                        onClick={addParameter}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                      >
                        <Plus size={13} />
                        Add Parameter
                      </button>
                    }
                  />

                  <div className="mt-5 space-y-3">
                    {form.parameters.length === 0 ? (
                      <EmptyInline text="No query parameters configured." />
                    ) : (
                      form.parameters.map(
                        (parameter, index) => (
                          <div
                            key={`${parameter.key}-${index}`}
                            className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-[1fr_1fr_1.3fr_60px_40px]"
                          >
                            <input
                              value={parameter.key}
                              onChange={(event) =>
                                updateParameter(
                                  index,
                                  "key",
                                  event.target.value
                                )
                              }
                              placeholder="Parameter"
                              className={smallInputClass}
                            />

                            <input
                              value={parameter.value}
                              onChange={(event) =>
                                updateParameter(
                                  index,
                                  "value",
                                  event.target.value
                                )
                              }
                              placeholder="Value"
                              className={smallInputClass}
                            />

                            <input
                              value={
                                parameter.description
                              }
                              onChange={(event) =>
                                updateParameter(
                                  index,
                                  "description",
                                  event.target.value
                                )
                              }
                              placeholder="Description"
                              className={smallInputClass}
                            />

                            <label className="flex items-center justify-center gap-1 text-[10px] text-white/30">
                              <input
                                type="checkbox"
                                checked={
                                  parameter.required
                                }
                                onChange={(event) =>
                                  updateParameter(
                                    index,
                                    "required",
                                    event.target.checked
                                  )
                                }
                              />
                              Req
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                removeParameter(
                                  index
                                )
                              }
                              className="flex items-center justify-center text-white/20 hover:text-red-300"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        )
                      )
                    )}
                  </div>
                </section>

                {/* HEADERS */}
                <section>
                  <SectionTitle
                    title="Headers"
                    description="Configure request headers."
                    action={
                      <button
                        type="button"
                        onClick={addHeader}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                      >
                        <Plus size={13} />
                        Add Header
                      </button>
                    }
                  />

                  <div className="mt-5 space-y-3">
                    {form.headers.length === 0 ? (
                      <EmptyInline text="No custom headers configured." />
                    ) : (
                      form.headers.map(
                        (header, index) => (
                          <div
                            key={`${header.key}-${index}`}
                            className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-[1fr_1fr_1.3fr_60px_40px]"
                          >
                            <input
                              value={header.key}
                              onChange={(event) =>
                                updateHeader(
                                  index,
                                  "key",
                                  event.target.value
                                )
                              }
                              placeholder="Header"
                              className={smallInputClass}
                            />

                            <input
                              value={header.value}
                              onChange={(event) =>
                                updateHeader(
                                  index,
                                  "value",
                                  event.target.value
                                )
                              }
                              placeholder="Value"
                              className={smallInputClass}
                            />

                            <input
                              value={
                                header.description
                              }
                              onChange={(event) =>
                                updateHeader(
                                  index,
                                  "description",
                                  event.target.value
                                )
                              }
                              placeholder="Description"
                              className={smallInputClass}
                            />

                            <label className="flex items-center justify-center gap-1 text-[10px] text-white/30">
                              <input
                                type="checkbox"
                                checked={
                                  header.required
                                }
                                onChange={(event) =>
                                  updateHeader(
                                    index,
                                    "required",
                                    event.target.checked
                                  )
                                }
                              />
                              Req
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                removeHeader(index)
                              }
                              className="flex items-center justify-center text-white/20 hover:text-red-300"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        )
                      )
                    )}
                  </div>
                </section>

                {/* AUTH */}
                <section>
                  <SectionTitle
                    title="Authentication"
                    description="Configure how clients authenticate with this API."
                  />

                  <div className="mt-5">
                    <Field label="Authentication Type">
                      <select
                        value={form.auth.type}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            auth: {
                              ...form.auth,
                              type: event.target.value,
                            },
                          })
                        }
                        className={inputClass}
                      >
                        {authTypes.map((type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>

                    {form.auth.type ===
                      "BEARER" && (
                      <div className="mt-4">
                        <Field label="Bearer Token">
                          <input
                            type="password"
                            value={
                              form.auth.token || ""
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,
                                auth: {
                                  ...form.auth,
                                  token:
                                    event.target.value,
                                },
                              })
                            }
                            placeholder="Enter bearer token"
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    )}

                    {form.auth.type === "BASIC" && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Username">
                          <input
                            value={
                              form.auth.username ||
                              ""
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,
                                auth: {
                                  ...form.auth,
                                  username:
                                    event.target
                                      .value,
                                },
                              })
                            }
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Password">
                          <input
                            type="password"
                            value={
                              form.auth.password ||
                              ""
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,
                                auth: {
                                  ...form.auth,
                                  password:
                                    event.target
                                      .value,
                                },
                              })
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    )}

                    {form.auth.type ===
                      "API_KEY" && (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Key Name">
                          <input
                            value={
                              form.auth.apiKey ||
                              ""
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,
                                auth: {
                                  ...form.auth,
                                  apiKey:
                                    event.target
                                      .value,
                                },
                              })
                            }
                            placeholder="x-api-key"
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Key Value">
                          <input
                            type="password"
                            value={
                              form.auth.apiKeyValue ||
                              ""
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,
                                auth: {
                                  ...form.auth,
                                  apiKeyValue:
                                    event.target
                                      .value,
                                },
                              })
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    )}

                    {form.auth.type ===
                      "OAUTH2" && (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/30">
                        OAuth 2.0 configuration will be
                        expanded in the authentication
                        module.
                      </div>
                    )}
                  </div>
                </section>

                {/* BODY */}
                <section>
                  <SectionTitle
                    title="Request / Response"
                    description="Add example payloads for documentation and testing."
                  />

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <Field label="Request Body">
                      <textarea
                        value={form.requestBody}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            requestBody:
                              event.target.value,
                          })
                        }
                        rows={9}
                        placeholder={`{
  "customerId": "12345"
}`}
                        className={`${inputClass} resize-none font-mono text-xs`}
                      />
                    </Field>

                    <Field label="Response Example">
                      <textarea
                        value={form.responseExample}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            responseExample:
                              event.target.value,
                          })
                        }
                        rows={9}
                        placeholder={`{
  "success": true,
  "data": {}
}`}
                        className={`${inputClass} resize-none font-mono text-xs`}
                      />
                    </Field>
                  </div>
                </section>

                {/* DOCUMENTATION */}
                <section>
                  <SectionTitle
                    title="Documentation"
                    description="Describe the API for consumers."
                  />

                  <div className="mt-5 space-y-5">
                    <Field label="Tags">
                      <input
                        value={form.tags}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            tags: event.target.value,
                          })
                        }
                        placeholder="customer, profile, core"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Documentation">
                      <textarea
                        value={form.documentation}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            documentation:
                              event.target.value,
                          })
                        }
                        rows={6}
                        placeholder="Explain request requirements, business rules and response behavior..."
                        className={`${inputClass} resize-none`}
                      />
                    </Field>
                  </div>
                </section>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* FOOTER */}
                <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={() =>
                      setModalOpen(false)
                    }
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingAPI
                        ? "Save Changes"
                        : "Create API"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {detailsOpen && selectedAPI && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
          <button
            onClick={() => setDetailsOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close"
          />

          <div className="relative my-8 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 p-7">
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold ${methodClass(
                      selectedAPI.method
                    )}`}
                  >
                    {selectedAPI.method}
                  </span>

                  <span className="font-mono text-sm text-white/50">
                    {selectedAPI.endpoint}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold">
                  {selectedAPI.name}
                </h2>

                <p className="mt-1 text-sm text-white/30">
                  {selectedAPI.description ||
                    "No description provided."}
                </p>
              </div>

              <button
                onClick={() =>
                  setDetailsOpen(false)
                }
                className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard
                  label="Project"
                  value={
                    typeof selectedAPI.project ===
                    "object"
                      ? selectedAPI.project.name
                      : "—"
                  }
                />

                <InfoCard
                  label="Version"
                  value={selectedAPI.version}
                />

                <InfoCard
                  label="Status"
                  value={selectedAPI.status}
                />
              </div>

              {/* AUTH */}
              <div className="mt-8">
                <DetailTitle
                  icon={<KeyRound size={15} />}
                  title="Authentication"
                />

                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-sm text-white/50">
                    {selectedAPI.auth?.type ||
                      "NONE"}
                  </span>
                </div>
              </div>

              {/* PARAMETERS */}
              {selectedAPI.parameters?.length >
                0 && (
                <div className="mt-8">
                  <DetailTitle
                    icon={<ChevronDown size={15} />}
                    title="Query Parameters"
                  />

                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                    {selectedAPI.parameters.map(
                      (parameter, index) => (
                        <div
                          key={index}
                          className="grid gap-3 border-b border-white/10 p-4 last:border-b-0 sm:grid-cols-[1fr_1fr_2fr_80px]"
                        >
                          <span className="font-mono text-xs text-white/60">
                            {parameter.key}
                          </span>

                          <span className="text-xs text-white/40">
                            {parameter.value || "—"}
                          </span>

                          <span className="text-xs text-white/30">
                            {parameter.description ||
                              "—"}
                          </span>

                          <span className="text-[10px] text-white/25">
                            {parameter.required
                              ? "Required"
                              : "Optional"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* HEADERS */}
              {selectedAPI.headers?.length >
                0 && (
                <div className="mt-8">
                  <DetailTitle
                    icon={<KeyRound size={15} />}
                    title="Headers"
                  />

                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                    {selectedAPI.headers.map(
                      (header, index) => (
                        <div
                          key={index}
                          className="grid gap-3 border-b border-white/10 p-4 last:border-b-0 sm:grid-cols-[1fr_1fr_2fr_80px]"
                        >
                          <span className="font-mono text-xs text-white/60">
                            {header.key}
                          </span>

                          <span className="text-xs text-white/40">
                            {header.value || "—"}
                          </span>

                          <span className="text-xs text-white/30">
                            {header.description ||
                              "—"}
                          </span>

                          <span className="text-[10px] text-white/25">
                            {header.required
                              ? "Required"
                              : "Optional"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* REQUEST / RESPONSE */}
              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                {selectedAPI.requestBody && (
                  <CodeBlock
                    icon={<FileJson size={15} />}
                    title="Request Body"
                    value={
                      selectedAPI.requestBody
                    }
                  />
                )}

                {selectedAPI.responseExample && (
                  <CodeBlock
                    icon={<FileJson size={15} />}
                    title="Response Example"
                    value={
                      selectedAPI.responseExample
                    }
                  />
                )}
              </div>

              {/* DOCUMENTATION */}
              {selectedAPI.documentation && (
                <div className="mt-8">
                  <DetailTitle
                    icon={<Code2 size={15} />}
                    title="Documentation"
                  />

                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-7 text-white/40">
                    {selectedAPI.documentation}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 p-5">
              {selectedAPI.baseUrl &&
                selectedAPI.endpoint && (
                  <a
                    href={`${selectedAPI.baseUrl}${selectedAPI.endpoint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/40 hover:bg-white/5 hover:text-white"
                  >
                    <ExternalLink size={15} />
                    Open Endpoint
                  </a>
                )}

              <button
                onClick={() => {
                  openEdit(selectedAPI);
                  setDetailsOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:bg-white/5 hover:text-white"
              >
                <Pencil size={15} />
                Edit
              </button>

              <button
                onClick={() => {
                  setDeleteAPI(selectedAPI);
                  setDetailsOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteAPI && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            onClick={() => setDeleteAPI(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            aria-label="Close"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1020] p-7 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Delete API?
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              You are about to delete{" "}
              <span className="text-white/70">
                {deleteAPI.name}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setDeleteAPI(null)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/50 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500/90"
              >
                Delete API
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API TESTER */}
      <APITester
        open={testerOpen}
        onSaveNew={openSaveRequest}
        onClose={() => {
          setTesterOpen(false);
          setEditingRequestId(null);
        }}
        requestId={editingRequestId}
        initialMethod={
          testMethod as any
        }
        initialUrl={testUrl}
        initialBody={testBody}
        initialParams={testParameters}
        initialHeaders={testHeaders}
        initialAuthorization={testAuth}
        requestName={
          selectedAPI?.name ||
          "API Request"
        }
        onSaved={() => {
          loadData();
        }}
        onDeleted={() => {
          loadData();
        }}
      />

{/* SAVE REQUEST MODAL */}
{saveRequestOpen && (
  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
    <button
      type="button"
      onClick={() =>
        setSaveRequestOpen(false)
      }
      className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      aria-label="Close"
    />

    <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
            API Workspace
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            Save Request
          </h2>

          <p className="mt-1 text-xs text-white/30">
            Save the current API Tester configuration.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setSaveRequestOpen(false)
          }
          className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="space-y-5 p-6">
        <Field label="Request Name">
          <input
            value={saveRequestName}
            onChange={(event) =>
              setSaveRequestName(
                event.target.value
              )
            }
            placeholder="Get Customer"
            autoFocus
            className={inputClass}
          />
        </Field>

        <Field label="Project">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
            {selectedAPI &&
            typeof selectedAPI.project ===
              "object"
              ? selectedAPI.project.name
              : "No project"}
          </div>
        </Field>

        <Field label="Collection">
          {collectionsLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/30">
              Loading collections...
            </div>
          ) : (
            <select
              value={selectedCollection}
              onChange={(event) =>
                setSelectedCollection(
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="">
                Select collection
              </option>

              {collections.map(
                (collection) => (
                  <option
                    key={collection._id}
                    value={collection._id}
                  >
                    {collection.name}
                  </option>
                )
              )}
            </select>
          )}
        </Field>

        {collections.length === 0 &&
          !collectionsLoading && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs text-amber-300">
                No collection exists for this
                project yet.
              </p>

              <p className="mt-1 text-[11px] text-amber-300/50">
                Create a collection first from
                the Collections page.
              </p>
            </div>
          )}

        {/* REQUEST PREVIEW */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/25">
            Request Preview
          </p>

          <div className="mt-3 flex items-start gap-3">
            <span
              className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${methodClass(
                testMethod
              )}`}
            >
              {testMethod}
            </span>

            <p className="min-w-0 break-all font-mono text-xs text-white/50">
              {testUrl || "No URL"}
            </p>
          </div>
        </div>

        {saveRequestError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {saveRequestError}
          </div>
        )}

        {saveRequestSuccess && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {saveRequestSuccess}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 border-t border-white/10 p-5">
        <button
          type="button"
          onClick={() =>
            setSaveRequestOpen(false)
          }
          className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveRequest}
          disabled={
            savingRequest ||
            collectionsLoading ||
            !selectedCollection
          }
          className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {savingRequest ? (
            "Saving..."
          ) : (
            <>
              <Check size={15} />
              Save Request
            </>
          )}
        </button>

      </div>
    </div>
  </div>
)}
    </div>
  );
}

/* ---------------------------------- */
/* REUSABLE UI                        */
/* ---------------------------------- */

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30";

const smallInputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/30";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs text-white/50">
        {label}
      </label>

      {children}
    </div>
  );
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-xs text-white/25">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

function EmptyInline({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-white/25">
      {text}
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[10px] uppercase tracking-wider text-white/25">
        {label}
      </p>

      <p className="mt-2 truncate text-sm text-white/60">
        {value}
      </p>
    </div>
  );
}

function DetailTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-white/60">
      {icon}
      {title}
    </div>
  );
}

function CodeBlock({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div>
      <DetailTitle
        icon={icon}
        title={title}
      />

      <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-white/40">
        {value}
      </pre>
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