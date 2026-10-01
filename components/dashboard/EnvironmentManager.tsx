"use client";

import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Variable {
  key: string;
  value: string;
  enabled: boolean;
  secret: boolean;
}

interface Environment {
  _id: string;
  name: string;
  project:
    | {
        _id: string;
        name: string;
      }
    | string;
  variables: Variable[];
}

interface Project {
  _id: string;
  name: string;
}

interface EnvironmentManagerProps {
  projectId?: string;
}

const emptyVariable = (): Variable => ({
  key: "",
  value: "",
  enabled: true,
  secret: false,
});

export default function EnvironmentManager({
  projectId,
}: EnvironmentManagerProps) {
  const [environments, setEnvironments] =
    useState<Environment[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [selectedEnvironment, setSelectedEnvironment] =
    useState<Environment | null>(null);

  const [isEditing, setIsEditing] =
    useState(false);

  const [environmentName, setEnvironmentName] =
    useState("");

  const [selectedProject, setSelectedProject] =
    useState(projectId || "");

  const [variables, setVariables] =
    useState<Variable[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showValues, setShowValues] =
    useState<Record<number, boolean>>({});

  /*
   * ================================================
   * LOAD PROJECTS
   * ================================================
   */

  const loadProjects = async () => {
    try {
      const response = await fetch(
        "/api/projects",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to fetch projects"
        );
      }

      const projectList =
        data.projects || [];

      setProjects(projectList);

      if (
        !projectId &&
        !selectedProject &&
        projectList.length > 0
      ) {
        setSelectedProject(
          projectList[0]._id
        );
      }
    } catch (error) {
      console.error(
        "Load projects error:",
        error
      );
    }
  };

  /*
   * ================================================
   * LOAD ENVIRONMENTS
   * ================================================
   */

  const loadEnvironments = async () => {
    try {
      setLoading(true);
      setError("");

      const url = projectId
        ? `/api/api-environments?project=${encodeURIComponent(
            projectId
          )}`
        : "/api/api-environments";

      const response = await fetch(url, {
        credentials: "include",
      });

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to fetch environments"
        );
      }

      setEnvironments(
        data.environments || []
      );
    } catch (error) {
      console.error(
        "Load environments error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to fetch environments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    loadEnvironments();
  }, [projectId]);

  /*
   * ================================================
   * NEW ENVIRONMENT
   * ================================================
   */

  const handleNewEnvironment = () => {
    setSelectedEnvironment(null);

    setIsEditing(true);

    setEnvironmentName("");

    setSelectedProject(
      projectId ||
        selectedProject ||
        projects[0]?._id ||
        ""
    );

    setVariables([
      emptyVariable(),
    ]);

    setShowValues({});

    setError("");
    setSuccess("");
  };

  /*
   * ================================================
   * EDIT ENVIRONMENT
   * ================================================
   */

  const handleEditEnvironment = (
    environment: Environment
  ) => {
    setSelectedEnvironment(
      environment
    );

    setIsEditing(true);

    setEnvironmentName(
      environment.name
    );

    const projectValue =
      typeof environment.project ===
      "string"
        ? environment.project
        : environment.project?._id || "";

    setSelectedProject(
      projectValue
    );

    setVariables(
      environment.variables?.length
        ? environment.variables.map(
            (variable) => ({
              key: variable.key || "",
              value: variable.value || "",
              enabled:
                variable.enabled !== false,
              secret:
                variable.secret === true,
            })
          )
        : [emptyVariable()]
    );

    setShowValues({});

    setError("");
    setSuccess("");
  };

  /*
   * ================================================
   * CANCEL
   * ================================================
   */

  const handleCancel = () => {
    setIsEditing(false);

    setSelectedEnvironment(null);

    setEnvironmentName("");

    setVariables([]);

    setShowValues({});

    setError("");
    setSuccess("");
  };

  /*
   * ================================================
   * VARIABLES
   * ================================================
   */

  const addVariable = () => {
    setVariables((current) => [
      ...current,
      emptyVariable(),
    ]);
  };

  const removeVariable = (
    index: number
  ) => {
    setVariables((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  };

  const updateVariable = (
    index: number,
    field: keyof Variable,
    value: string | boolean
  ) => {
    setVariables((current) =>
      current.map(
        (variable, i) =>
          i === index
            ? {
                ...variable,
                [field]: value,
              }
            : variable
      )
    );
  };

  /*
   * ================================================
   * SAVE
   * ================================================
   */

  const saveEnvironment = async () => {
    if (!environmentName.trim()) {
      setError(
        "Environment name is required"
      );
      return;
    }

    if (!selectedProject) {
      setError(
        "Please select a project"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const cleanedVariables =
        variables
          .filter(
            (variable) =>
              variable.key.trim()
          )
          .map((variable) => ({
            key: variable.key.trim(),
            value: variable.value,
            enabled: variable.enabled,
            secret: variable.secret,
          }));

      const editing =
        !!selectedEnvironment;

      const url = editing
        ? `/api/api-environments/${selectedEnvironment._id}`
        : "/api/api-environments";

      const response = await fetch(url, {
        method: editing
          ? "PUT"
          : "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: environmentName.trim(),
          project: selectedProject,
          variables:
            cleanedVariables,
        }),
      });

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save environment"
        );
      }

      setSuccess(
        editing
          ? "Environment updated successfully."
          : "Environment created successfully."
      );

      await loadEnvironments();

      if (data.environment) {
        setSelectedEnvironment(
          data.environment
        );

        setEnvironmentName(
          data.environment.name
        );

        setVariables(
          data.environment.variables ||
            []
        );

        setIsEditing(true);
      }
    } catch (error) {
      console.error(
        "Save environment error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save environment"
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ================================================
   * DELETE
   * ================================================
   */

  const deleteEnvironment = async (
    environment: Environment
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${environment.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(
        environment._id
      );

      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/api-environments/${environment._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete environment"
        );
      }

      if (
        selectedEnvironment?._id ===
        environment._id
      ) {
        handleCancel();
      }

      setSuccess(
        "Environment deleted successfully."
      );

      await loadEnvironments();
    } catch (error) {
      console.error(
        "Delete environment error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete environment"
      );
    } finally {
      setDeleting(null);
    }
  };

  /*
   * ================================================
   * RENDER
   * ================================================
   */

  return (
    <div className="min-h-full bg-[#05070d] p-6 text-white">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Environments
            </h1>

            <p className="mt-1 text-sm text-white/40">
              Manage API variables and
              environment configurations.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleNewEnvironment
            }
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <Plus size={16} />
            New Environment
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <Check size={16} />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

          {/* ========================================
              ENVIRONMENT LIST
          ======================================== */}

          <div className="rounded-2xl border border-white/10 bg-[#0a0d15]">

            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold">
                Your Environments
              </div>

              <div className="mt-1 text-xs text-white/35">
                {environments.length}{" "}
                environment
                {environments.length ===
                1
                  ? ""
                  : "s"}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2
                  size={20}
                  className="animate-spin text-white/40"
                />
              </div>
            ) : environments.length ===
              0 ? (
              <div className="px-5 py-12 text-center">
                <div className="text-sm text-white/40">
                  No environments yet.
                </div>

                <button
                  type="button"
                  onClick={
                    handleNewEnvironment
                  }
                  className="mt-4 text-xs font-semibold text-white underline underline-offset-4"
                >
                  Create your first
                  environment
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {environments.map(
                  (environment) => (
                    <div
                      key={
                        environment._id
                      }
                      className={`group flex cursor-pointer items-center justify-between px-5 py-4 transition ${
                        selectedEnvironment?._id ===
                        environment._id
                          ? "bg-white/10"
                          : "hover:bg-white/5"
                      }`}
                      onClick={() =>
                        handleEditEnvironment(
                          environment
                        )
                      }
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {
                            environment.name
                          }
                        </div>

                        <div className="mt-1 text-xs text-white/30">
                          {
                            environment
                              .variables
                              ?.length || 0
                          }{" "}
                          variable
                          {environment
                            .variables
                            ?.length ===
                          1
                            ? ""
                            : "s"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            handleEditEnvironment(
                              environment
                            );
                          }}
                          className="rounded-lg p-2 text-white/30 transition hover:bg-white/10 hover:text-white"
                        >
                          <Pencil
                            size={14}
                          />
                        </button>

                        <button
                          type="button"
                          disabled={
                            deleting ===
                            environment._id
                          }
                          onClick={(event) => {
                            event.stopPropagation();

                            deleteEnvironment(
                              environment
                            );
                          }}
                          className="rounded-lg p-2 text-white/30 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                        >
                          {deleting ===
                          environment._id ? (
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={14}
                            />
                          )}
                        </button>

                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* ========================================
              EDITOR
          ======================================== */}

          <div className="rounded-2xl border border-white/10 bg-[#0a0d15]">

            {!isEditing ? (
              <div className="flex min-h-[500px] items-center justify-center px-8 text-center">

                <div>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Plus
                      size={22}
                      className="text-white/40"
                    />
                  </div>

                  <h2 className="text-base font-semibold">
                    Select an environment
                  </h2>

                  <p className="mt-2 max-w-sm text-sm text-white/35">
                    Select an existing
                    environment or create a
                    new one to manage your
                    variables.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleNewEnvironment
                    }
                    className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    Create Environment
                  </button>
                </div>

              </div>
            ) : (
              <>
                {/* EDITOR HEADER */}

                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

                  <div>
                    <h2 className="text-base font-semibold">
                      {selectedEnvironment
                        ? "Edit Environment"
                        : "New Environment"}
                    </h2>

                    <p className="mt-1 text-xs text-white/35">
                      Define variables used
                      by your API requests.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleCancel
                    }
                    className="rounded-lg p-2 text-white/30 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={17} />
                  </button>

                </div>

                {/* FORM */}

                <div className="space-y-6 p-6">

                  {/* NAME */}

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-white/50">
                      Environment Name
                    </label>

                    <input
                      value={
                        environmentName
                      }
                      onChange={(event) =>
                        setEnvironmentName(
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. Development"
                      autoFocus
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                    />
                  </div>

                  {/* PROJECT */}

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-white/50">
                      Project
                    </label>

                    <select
                      value={
                        selectedProject
                      }
                      onChange={(event) =>
                        setSelectedProject(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        !!projectId
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#11151f] px-4 py-3 text-sm text-white outline-none focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        Select project
                      </option>

                      {projects.map(
                        (project) => (
                          <option
                            key={
                              project._id
                            }
                            value={
                              project._id
                            }
                          >
                            {project.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* VARIABLES */}

                  <div>

                    <div className="mb-3 flex items-center justify-between">

                      <div>
                        <div className="text-sm font-semibold">
                          Variables
                        </div>

                        <div className="mt-1 text-xs text-white/30">
                          Use{" "}
                          <code className="rounded bg-white/5 px-1.5 py-0.5 text-white/60">
                            {"{{variable}}"}
                          </code>{" "}
                          inside API requests.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          addVariable
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                        <Plus
                          size={13}
                        />
                        Add Variable
                      </button>

                    </div>

                    {/* TABLE */}

                    <div className="overflow-hidden rounded-xl border border-white/10">

                      <div className="grid grid-cols-[1fr_1fr_70px_70px_45px] border-b border-white/10 bg-white/[0.02] px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                        <div className="px-2">
                          Key
                        </div>

                        <div className="px-2">
                          Value
                        </div>

                        <div className="text-center">
                          Enabled
                        </div>

                        <div className="text-center">
                          Secret
                        </div>

                        <div />
                      </div>

                      {variables.map(
                        (
                          variable,
                          index
                        ) => (
                          <div
                            key={index}
                            className="grid grid-cols-[1fr_1fr_70px_70px_45px] items-center border-b border-white/5 last:border-b-0"
                          >

                            {/* KEY */}

                            <div className="p-2">
                              <input
                                value={
                                  variable.key
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariable(
                                    index,
                                    "key",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="baseUrl"
                                className="w-full rounded-lg border border-transparent bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-white/15 focus:border-white/10 focus:bg-white/5"
                              />
                            </div>

                            {/* VALUE */}

                            <div className="relative p-2">

                              <input
                                type={
                                  variable.secret &&
                                  !showValues[
                                    index
                                  ]
                                    ? "password"
                                    : "text"
                                }
                                value={
                                  variable.value
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariable(
                                    index,
                                    "value",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Value"
                                className="w-full rounded-lg border border-transparent bg-transparent px-2 py-2 pr-9 text-xs text-white outline-none placeholder:text-white/15 focus:border-white/10 focus:bg-white/5"
                              />

                              {variable.secret && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowValues(
                                      (
                                        current
                                      ) => ({
                                        ...current,
                                        [index]:
                                          !current[
                                            index
                                          ],
                                      })
                                    )
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white"
                                >
                                  {showValues[
                                    index
                                  ] ? (
                                    <EyeOff
                                      size={
                                        13
                                      }
                                    />
                                  ) : (
                                    <Eye
                                      size={
                                        13
                                      }
                                    />
                                  )}
                                </button>
                              )}

                            </div>

                            {/* ENABLED */}

                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  updateVariable(
                                    index,
                                    "enabled",
                                    !variable.enabled
                                  )
                                }
                                className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${
                                  variable.enabled
                                    ? "bg-white"
                                    : "bg-white/10"
                                }`}
                              >
                                <span
                                  className={`h-4 w-4 rounded-full transition ${
                                    variable.enabled
                                      ? "translate-x-4 bg-black"
                                      : "translate-x-0 bg-white/30"
                                  }`}
                                />
                              </button>
                            </div>

                            {/* SECRET */}

                            <div className="flex justify-center">
                              <input
                                type="checkbox"
                                checked={
                                  variable.secret
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariable(
                                    index,
                                    "secret",
                                    event
                                      .target
                                      .checked
                                  )
                                }
                                className="h-4 w-4 accent-white"
                              />
                            </div>

                            {/* DELETE */}

                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  removeVariable(
                                    index
                                  )
                                }
                                className="rounded-lg p-2 text-white/20 transition hover:bg-red-500/10 hover:text-red-300"
                              >
                                <Trash2
                                  size={13}
                                />
                              </button>
                            </div>

                          </div>
                        )
                      )}

                      {variables.length ===
                        0 && (
                        <div className="px-5 py-10 text-center text-xs text-white/25">
                          No variables.
                          Click{" "}
                          <button
                            type="button"
                            onClick={
                              addVariable
                            }
                            className="text-white underline underline-offset-2"
                          >
                            Add Variable
                          </button>
                          .
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* FOOTER */}

                <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">

                  <button
                    type="button"
                    onClick={
                      handleCancel
                    }
                    className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      saveEnvironment
                    }
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save
                          size={15}
                        />
                        {selectedEnvironment
                          ? "Save Changes"
                          : "Create Environment"}
                      </>
                    )}
                  </button>

                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}