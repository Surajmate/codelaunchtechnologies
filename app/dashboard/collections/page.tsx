"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

type CollectionRequest = {
  _id: string;
  name: string;
  method: string;
  url: string;
  project?: {
    _id: string;
    name: string;
  };
  collection?: {
    _id: string;
    name: string;
  };
};

type Collection = {
  _id: string;
  name: string;
  description?: string;
  project?: {
    _id: string;
    name: string;
  };
};

type Project = {
  _id: string;
  name: string;
};

const methodClass = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return "text-emerald-300";

    case "POST":
      return "text-blue-300";

    case "PUT":
      return "text-amber-300";

    case "PATCH":
      return "text-purple-300";

    case "DELETE":
      return "text-red-300";

    case "HEAD":
      return "text-cyan-300";

    case "OPTIONS":
      return "text-pink-300";

    default:
      return "text-white/50";
  }
};

export default function CollectionsPage() {
  const [collections, setCollections] =
    useState<Collection[]>([]);

  const [requests, setRequests] =
    useState<CollectionRequest[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [expanded, setExpanded] =
    useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Collection | null>(null);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [project, setProject] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Load collections, projects and
   * saved API requests independently.
   */
  const loadData = async () => {
    setLoading(true);

    try {
      const [
        collectionsResponse,
        projectsResponse,
        requestsResponse,
      ] = await Promise.all([
        fetch("/api/api-collections", {
          cache: "no-store",
        }),

        fetch("/api/projects", {
          cache: "no-store",
        }),

        fetch("/api/api-requests", {
          cache: "no-store",
        }),
      ]);

      const collectionsData =
        await collectionsResponse.json();

      const projectsData =
        await projectsResponse.json();

      const requestsData =
        await requestsResponse.json();

      if (
        !collectionsResponse.ok ||
        !collectionsData.success
      ) {
        throw new Error(
          collectionsData.message ||
            "Unable to load collections"
        );
      }

      if (
        !projectsResponse.ok ||
        !projectsData.success
      ) {
        throw new Error(
          projectsData.message ||
            "Unable to load projects"
        );
      }

      if (
        !requestsResponse.ok ||
        !requestsData.success
      ) {
        throw new Error(
          requestsData.message ||
            "Unable to load requests"
        );
      }

      setCollections(
        collectionsData.collections || []
      );

      setProjects(
        projectsData.projects || []
      );

      setRequests(
        requestsData.requests || []
      );
    } catch (error) {
      console.error(
        "Load collections page error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get requests belonging to a collection.
   */
  const getCollectionRequests = (
    collectionId: string
  ) => {
    return requests.filter((request) => {
      if (!request.collection) {
        return false;
      }

      const requestCollectionId =
        typeof request.collection ===
        "object"
          ? request.collection._id
          : request.collection;

      return (
        requestCollectionId ===
        collectionId
      );
    });
  };

  /**
   * Create collection.
   */
  const openCreate = () => {
    setEditing(null);

    setName("");

    setDescription("");

    setProject("");

    setError("");

    setModalOpen(true);
  };

  /**
   * Edit collection.
   */
  const openEdit = (
    collection: Collection
  ) => {
    setEditing(collection);

    setName(collection.name);

    setDescription(
      collection.description || ""
    );

    setProject(
      collection.project?._id || ""
    );

    setError("");

    setModalOpen(true);
  };

  /**
   * Save collection.
   */
  const saveCollection = async () => {
    if (!name.trim()) {
      setError(
        "Collection name is required"
      );

      return;
    }

    if (!project) {
      setError("Select a project");

      return;
    }

    setSaving(true);

    setError("");

    try {
      const response = await fetch(
        editing
          ? `/api/api-collections/${editing._id}`
          : "/api/api-collections",
        {
          method: editing
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),

            description:
              description.trim(),

            project,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save collection"
        );
      }

      setModalOpen(false);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save collection"
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete collection.
   */
  const deleteCollection = async (
    collection: Collection
  ) => {
    const collectionRequests =
      getCollectionRequests(
        collection._id
      );

    let message = `Delete "${collection.name}"?`;

    if (collectionRequests.length > 0) {
      message += `\n\nThis collection contains ${collectionRequests.length} saved request${
        collectionRequests.length === 1
          ? ""
          : "s"
      }.`;
    }

    const confirmed =
      window.confirm(message);

    if (!confirmed) return;

    try {
      const response =
        await fetch(
          `/api/api-collections/${collection._id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete collection"
        );
      }

      await loadData();
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Unable to delete collection"
      );
    }
  };

  /**
   * Expand / collapse collection.
   */
  const toggleCollection = (
    id: string
  ) => {
    setExpanded(
      (current) => ({
        ...current,
        [id]: !current[id],
      })
    );
  };

  /**
   * Open saved request.
   *
   * For now we navigate to API management
   * with the request ID in the URL.
   *
   * The API Tester can consume this ID
   * in the next integration step.
   */
  const openRequest = (
    request: CollectionRequest
  ) => {
    if (!request._id) return;

    window.location.href =
      `/dashboard/apis?request=${request._id}`;
  };

  /**
   * Search collections and requests.
   */
  const filteredCollections =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      if (!searchValue) {
        return collections;
      }

      return collections.filter(
        (collection) => {
          const collectionRequests =
            getCollectionRequests(
              collection._id
            );

          const collectionText =
            `${collection.name} ${
              collection.description ||
              ""
            } ${
              collection.project?.name ||
              ""
            }`.toLowerCase();

          const requestMatch =
            collectionRequests.some(
              (request) =>
                `${request.name} ${request.method} ${request.url}`
                  .toLowerCase()
                  .includes(
                    searchValue
                  )
            );

          return (
            collectionText.includes(
              searchValue
            ) ||
            requestMatch
          );
        }
      );
    }, [collections, requests, search]);

  /**
   * Automatically expand matching
   * collections during search.
   */
  useEffect(() => {
    if (!search.trim()) {
      return;
    }

    const matchingState: Record<
      string,
      boolean
    > = {};

    filteredCollections.forEach(
      (collection) => {
        matchingState[
          collection._id
        ] = true;
      }
    );

    setExpanded(
      (current) => ({
        ...current,
        ...matchingState,
      })
    );
  }, [
    search,
    filteredCollections,
  ]);

  return (
    <div className="min-h-full">
      {/* HEADER */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Folder
              size={20}
              className="text-white/50"
            />

            <h1 className="text-xl font-semibold">
              Collections
            </h1>
          </div>

          <p className="mt-1 text-xs text-white/30">
            Organize and reuse your API
            requests.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
        >
          <FolderPlus size={16} />

          New Collection
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-5 flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3">
        <Search
          size={15}
          className="text-white/25"
        />

        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search collections or requests..."
          className="w-full bg-transparent px-3 py-3 text-xs text-white outline-none placeholder:text-white/20"
        />
      </div>

      {/* CONTENT */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {loading ? (
          <div className="p-10 text-center text-sm text-white/25">
            Loading collections...
          </div>
        ) : filteredCollections.length ===
          0 ? (
          <div className="p-14 text-center">
            <Folder
              size={30}
              className="mx-auto text-white/10"
            />

            <p className="mt-4 text-sm text-white/30">
              {search
                ? "No collections or requests found."
                : "No collections found."}
            </p>

            {!search && (
              <button
                onClick={openCreate}
                className="mt-4 text-xs text-white/60 hover:text-white"
              >
                Create your first collection
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredCollections.map(
              (collection) => {
                const collectionRequests =
                  getCollectionRequests(
                    collection._id
                  );

                const isExpanded =
                  expanded[
                    collection._id
                  ];

                const requestCount =
                  collectionRequests.length;

                return (
                  <div
                    key={
                      collection._id
                    }
                    className="border-b border-white/10 last:border-b-0"
                  >
                    {/* COLLECTION ROW */}
                    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.025]">
                      <button
                        onClick={() =>
                          toggleCollection(
                            collection._id
                          )
                        }
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown
                            size={15}
                            className="shrink-0 text-white/30"
                          />
                        ) : (
                          <ChevronRight
                            size={15}
                            className="shrink-0 text-white/30"
                          />
                        )}

                        <Folder
                          size={17}
                          className="shrink-0 text-white/40"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {
                              collection.name
                            }
                          </p>

                          <p className="truncate text-[11px] text-white/25">
                            {requestCount}{" "}
                            {requestCount ===
                            1
                              ? "request"
                              : "requests"}

                            {collection
                              .project
                              ?.name &&
                              ` · ${collection.project.name}`}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            openEdit(
                              collection
                            )
                          }
                          title="Edit collection"
                          className="rounded-lg p-2 text-white/25 hover:bg-white/5 hover:text-white"
                        >
                          <Pencil
                            size={14}
                          />
                        </button>

                        <button
                          onClick={() =>
                            deleteCollection(
                              collection
                            )
                          }
                          title="Delete collection"
                          className="rounded-lg p-2 text-white/25 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>

                        <button
                          onClick={() =>
                            toggleCollection(
                              collection._id
                            )
                          }
                          title={
                            isExpanded
                              ? "Collapse"
                              : "Expand"
                          }
                          className="rounded-lg p-2 text-white/25 hover:bg-white/5 hover:text-white"
                        >
                          <MoreHorizontal
                            size={14}
                          />
                        </button>
                      </div>
                    </div>

                    {/* REQUESTS */}
                    {isExpanded && (
                      <div className="border-t border-white/5 bg-black/10">
                        {collectionRequests.length ===
                        0 ? (
                          <div className="px-12 py-7">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                                <Plus
                                  size={14}
                                  className="text-white/20"
                                />
                              </div>

                              <div>
                                <p className="text-xs text-white/30">
                                  No saved requests
                                </p>

                                <p className="mt-1 text-[10px] text-white/15">
                                  Save requests from
                                  the API Tester to
                                  see them here.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          collectionRequests.map(
                            (
                              request
                            ) => (
                              <button
                                key={
                                  request._id
                                }
                                onClick={() =>
                                  openRequest(
                                    request
                                  )
                                }
                                className="group flex w-full items-center gap-4 border-b border-white/5 px-12 py-3 text-left transition hover:bg-white/[0.035]"
                              >
                                <span
                                  className={`w-14 shrink-0 font-mono text-[10px] font-bold ${methodClass(
                                    request.method
                                  )}`}
                                >
                                  {request.method.toUpperCase()}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-white/60 group-hover:text-white">
                                    {
                                      request.name
                                    }
                                  </p>

                                  <p className="mt-0.5 truncate font-mono text-[9px] text-white/15">
                                    {
                                      request.url
                                    }
                                  </p>
                                </div>

                                <ExternalLink
                                  size={13}
                                  className="shrink-0 text-white/10 opacity-0 transition group-hover:opacity-100"
                                />
                              </button>
                            )
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            onClick={() =>
              setModalOpen(false)
            }
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close"
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1c] p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                {editing
                  ? "Edit Collection"
                  : "New Collection"}
              </h2>

              <p className="mt-1 text-xs text-white/25">
                Create a reusable group of
                API requests.
              </p>
            </div>

            <div className="space-y-4">
              {/* NAME */}
              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Collection Name
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. User Management APIs"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {/* PROJECT */}
              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Project
                </label>

                <select
                  value={project}
                  onChange={(event) =>
                    setProject(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#111625] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">
                    Select project
                  </option>

                  {projects.map(
                    (item) => (
                      <option
                        key={item._id}
                        value={item._id}
                      >
                        {item.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-xs text-white/40">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="What is this collection used for?"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                  {error}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() =>
                  setModalOpen(false)
                }
                className="rounded-xl px-4 py-2.5 text-xs text-white/40 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={saveCollection}
                disabled={saving}
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Create Collection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}