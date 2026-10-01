"use client";

import {
  ArrowUpRight,
  ExternalLink,
  FolderKanban,
  GitBranch,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import PageHeader from "@/components/dashboard/PageHeader";

interface Project {
  _id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  technologies: string[];
  repositoryUrl: string;
  liveUrl: string;
  createdAt: string;
}

const projectTypes = [
  ["WEB", "Web Application"],
  ["MOBILE", "Mobile Application"],
  ["API", "API"],
  ["INTEGRATION", "Integration"],
  ["AI", "AI / Machine Learning"],
  ["OTHER", "Other"],
];

const projectStatuses = [
  ["PLANNING", "Planning"],
  ["DEVELOPMENT", "Development"],
  ["PRODUCTION", "Production"],
  ["COMPLETED", "Completed"],
  ["ARCHIVED", "Archived"],
];

const emptyForm = {
  name: "",
  description: "",
  type: "WEB",
  status: "PLANNING",
  technologies: "",
  repositoryUrl: "",
  liveUrl: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  const [deleteProject, setDeleteProject] =
    useState<Project | null>(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const loadProjects = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/projects");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setProjects(data.projects || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);

    setForm({
      name: project.name,
      description: project.description || "",
      type: project.type || "WEB",
      status: project.status || "PLANNING",
      technologies: project.technologies?.join(", ") || "",
      repositoryUrl: project.repositoryUrl || "",
      liveUrl: project.liveUrl || "",
    });

    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSaving(true);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        status: form.status,
        technologies: form.technologies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        repositoryUrl: form.repositoryUrl,
        liveUrl: form.liveUrl,
      };

      const url = editingProject
        ? `/api/projects/${editingProject._id}`
        : "/api/projects";

      const response = await fetch(url, {
        method: editingProject ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save project"
        );
      }

      if (editingProject) {
        setProjects((current) =>
          current.map((project) =>
            project._id === data.project._id
              ? data.project
              : project
          )
        );
      } else {
        setProjects((current) => [
          data.project,
          ...current,
        ]);
      }

      setModalOpen(false);
      setEditingProject(null);
      setForm(emptyForm);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save project"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProject) return;

    try {
      const response = await fetch(
        `/api/projects/${deleteProject._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setProjects((current) =>
        current.filter(
          (project) =>
            project._id !== deleteProject._id
        )
      );

      setDeleteProject(null);

      if (
        selectedProject?._id === deleteProject._id
      ) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredProjects = projects.filter((project) =>
    `${project.name} ${project.description} ${
      project.type
    } ${project.status} ${project.technologies.join(
      " "
    )}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Create and manage your Codelaunch projects."
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <Plus size={17} />
            New Project
          </button>
        }
      />

      {/* SEARCH */}
      <div className="mt-8">
        <div className="relative max-w-md">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search projects..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
          />
        </div>
      </div>

      {/* PROJECT GRID */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-12 text-center text-sm text-white/30">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <FolderKanban
                size={24}
                className="text-white/30"
              />
            </div>

            <h3 className="mt-5 font-semibold">
              {search
                ? "No matching projects"
                : "No projects yet"}
            </h3>

            <p className="mt-2 text-sm text-white/30">
              {search
                ? "Try a different search."
                : "Create your first project to get started."}
            </p>

            {!search && (
              <button
                onClick={openCreate}
                className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
              >
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() =>
                      setSelectedProject(project)
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5"
                  >
                    <FolderKanban
                      size={19}
                      className="text-white/50"
                    />
                  </button>

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(project)}
                      className="rounded-lg p-2 text-white/25 transition hover:bg-white/5 hover:text-white"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() =>
                        setDeleteProject(project)
                      }
                      className="rounded-lg p-2 text-white/25 transition hover:bg-red-500/10 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setSelectedProject(project)
                  }
                  className="mt-5 block w-full text-left"
                >
                  <h3 className="truncate font-semibold">
                    {project.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/35">
                    {project.description ||
                      "No description provided."}
                  </p>
                </button>

                {/* TECHNOLOGIES */}
                {project.technologies?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.technologies
                      .slice(0, 3)
                      .map((technology) => (
                        <span
                          key={technology}
                          className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/40"
                        >
                          {technology}
                        </span>
                      ))}

                    {project.technologies.length > 3 && (
                      <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/30">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-wider text-white/40">
                    {project.type}
                  </span>

                  <span className="text-xs text-white/25">
                    {project.status}
                  </span>
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close modal"
          />

          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b1020] p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/25">
                  Projects
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  {editingProject
                    ? "Edit Project"
                    : "Create Project"}
                </h2>

                <p className="mt-1 text-sm text-white/30">
                  Configure your project details.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="text-white/30 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Project Name
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  required
                  placeholder="Enterprise API Platform"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Description
                </label>

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
                  placeholder="Describe your project..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {/* TYPE / STATUS */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Project Type
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        type: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#11172a] px-4 py-3 text-sm outline-none"
                  >
                    {projectTypes.map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#11172a] px-4 py-3 text-sm outline-none"
                  >
                    {projectStatuses.map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* TECHNOLOGIES */}
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Technologies
                </label>

                <input
                  value={form.technologies}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      technologies:
                        event.target.value,
                    })
                  }
                  placeholder="React, Next.js, MongoDB, AWS"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />

                <p className="mt-1.5 text-xs text-white/20">
                  Separate technologies with commas.
                </p>
              </div>

              {/* URLS */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Repository URL
                  </label>

                  <div className="relative">
                    <GitBranch
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                    />

                    <input
                      type="url"
                      value={form.repositoryUrl}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          repositoryUrl:
                            event.target.value,
                        })
                      }
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Live URL
                  </label>

                  <div className="relative">
                    <ExternalLink
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                    />

                    <input
                      type="url"
                      value={form.liveUrl}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          liveUrl:
                            event.target.value,
                        })
                      }
                      placeholder="https://example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                    : editingProject
                      ? "Save Changes"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT DETAILS */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
          <button
            onClick={() => setSelectedProject(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close details"
          />

          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b1020] p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <FolderKanban size={21} />
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedProject.name}
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    {selectedProject.type} ·{" "}
                    {selectedProject.status}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedProject(null)
                }
                className="text-white/30 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-7">
              <p className="text-sm leading-6 text-white/50">
                {selectedProject.description ||
                  "No description provided."}
              </p>

              {selectedProject.technologies?.length >
                0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs uppercase tracking-wider text-white/25">
                    Technologies
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map(
                      (technology) => (
                        <span
                          key={technology}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50"
                        >
                          {technology}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {selectedProject.repositoryUrl && (
                  <a
                    href={selectedProject.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                  >
                    <GitBranch size={17} />
                    Repository
                    <ArrowUpRight
                      size={15}
                      className="ml-auto"
                    />
                  </a>
                )}

                {selectedProject.liveUrl && (
                  <a
                    href={selectedProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                  >
                    <ExternalLink size={17} />
                    Live Application
                    <ArrowUpRight
                      size={15}
                      className="ml-auto"
                    />
                  </a>
                )}
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3 border-t border-white/10 pt-5">
              <button
                onClick={() => {
                  openEdit(selectedProject);
                  setSelectedProject(null);
                }}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:bg-white/5 hover:text-white"
              >
                <Pencil size={15} />
                Edit
              </button>

              <button
                onClick={() => {
                  setDeleteProject(selectedProject);
                  setSelectedProject(null);
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

      {/* DELETE CONFIRMATION */}
      {deleteProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button
            onClick={() => setDeleteProject(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            aria-label="Close confirmation"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1020] p-7 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Delete project?
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              You are about to delete{" "}
              <span className="text-white/70">
                {deleteProject.name}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setDeleteProject(null)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/50 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500/90"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}