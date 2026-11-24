import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Images,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiClient, extractApiError } from "../../api/client";
import { ApiResponse, PortfolioProject, Service } from "../../types";
import { formatDate } from "../../utils/formatters";

interface PortfolioFormState {
  title: string;
  serviceId: string;
  category: string;
  projectDate: string;
  description: string;
  imageUrlsText: string;
}

const EMPTY_FORM: PortfolioFormState = {
  title: "",
  serviceId: "",
  category: "",
  projectDate: "",
  description: "",
  imageUrlsText: "",
};

export function AdminPortfolioPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(
    null,
  );
  const [form, setForm] = useState<PortfolioFormState>(EMPTY_FORM);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [portfolioRes, servicesRes] = await Promise.all([
        apiClient.get<ApiResponse<PortfolioProject[]>>("/portfolio"),
        apiClient.get<ApiResponse<Service[]>>("/services?all=true"),
      ]);
      setProjects(portfolioRes.data.data);
      setServices(servicesRes.data.data);
    } catch (err) {
      setError(extractApiError(err, "Failed to load portfolio projects."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setSelectedFiles([]);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (project: PortfolioProject) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      serviceId: project.serviceId || "",
      category: project.category,
      projectDate: project.projectDate ? project.projectDate.slice(0, 10) : "",
      description: project.description || "",
      imageUrlsText: "",
    });
    setSelectedFiles([]);
    setError("");
    setModalOpen(true);
  };

  const handleServiceSelect = (serviceId: string) => {
    const matched = services.find((s) => s.id === serviceId);
    setForm((prev) => ({
      ...prev,
      serviceId,
      category: matched ? matched.name : prev.category,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (
      !editingProject &&
      selectedFiles.length === 0 &&
      !form.imageUrlsText.trim()
    ) {
      setError("Please upload at least one image or paste an image URL.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("category", form.category.trim());
      formData.append("serviceId", form.serviceId);
      formData.append("projectDate", form.projectDate);
      formData.append("description", form.description.trim());

      for (const file of selectedFiles) {
        formData.append("images", file);
      }
      if (form.imageUrlsText.trim()) {
        formData.append("imageUrls", form.imageUrlsText.trim());
      }

      if (editingProject) {
        await apiClient.put(`/portfolio/${editingProject.id}`, formData);
        setNotice(`Project "${form.title.trim()}" updated successfully.`);
      } else {
        await apiClient.post("/portfolio", formData);
        setNotice(`Project "${form.title.trim()}" published to the portfolio.`);
      }

      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(extractApiError(err, "Failed to save portfolio project."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (projectId: string, imageId: string) => {
    const confirmed = window.confirm(
      "Remove this image from the portfolio project?",
    );
    if (!confirmed) return;

    setBusyKey(imageId);
    setError("");
    setNotice("");
    try {
      await apiClient.delete(`/portfolio/${projectId}/images/${imageId}`);
      setNotice("Image removed from project.");
      await fetchData();
    } catch (err) {
      setError(extractApiError(err, "Failed to remove image."));
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteProject = async (project: PortfolioProject) => {
    const confirmed = window.confirm(
      `Permanently delete "${project.title}" and all ${project.images.length} images in it?`,
    );
    if (!confirmed) return;

    setBusyKey(project.id);
    setError("");
    setNotice("");
    try {
      await apiClient.delete(`/portfolio/${project.id}`);
      setNotice(`Project "${project.title}" deleted.`);
      await fetchData();
    } catch (err) {
      setError(extractApiError(err, "Failed to delete portfolio project."));
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-stone-900">
            Portfolio Management
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Upload completed work photos and link them to any photography
            service—they publish automatically to the public gallery and Home
            page.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
          New Portfolio Project
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && !modalOpen && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-56 animate-pulse rounded-2xl bg-stone-200/70"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
          No portfolio projects uploaded yet. Click “New Portfolio Project” to
          add your work.
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-stone-100 pb-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-accent">
                      {project.service?.name || project.category}
                    </span>
                    {project.projectDate && (
                      <span className="inline-flex items-center gap-1 text-stone-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(project.projectDate)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-stone-400">
                      <Images className="h-3.5 w-3.5" />
                      {project.images.length}{" "}
                      {project.images.length === 1 ? "image" : "images"}
                    </span>
                  </div>
                  <h2 className="mt-2 font-serif text-xl font-medium text-stone-900">
                    {project.title}
                  </h2>
                  {project.description && (
                    <p className="mt-1 text-sm text-stone-600">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(project)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit / Add Photos
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === project.id}
                    onClick={() => handleDeleteProject(project)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Project
                  </button>
                </div>
              </div>

              {/* Project Images Grid */}
              {project.images.length === 0 ? (
                <p className="mt-4 text-xs text-stone-400">
                  No images in this project. Click “Edit / Add Photos” to upload
                  images.
                </p>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {project.images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100"
                    >
                      <img
                        src={img.imageUrl}
                        alt={project.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        disabled={busyKey === img.id}
                        onClick={() => handleDeleteImage(project.id, img.id)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-90 transition-opacity hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Create / Edit Portfolio Project Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="font-serif text-2xl font-medium text-stone-900">
                {editingProject
                  ? "Edit Project & Upload Photos"
                  : "Create Portfolio Project"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-800">
                  Project Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Hanna & Daniel — Summer Wedding"
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Link to Service
                  </label>
                  <select
                    value={form.serviceId}
                    onChange={(e) => handleServiceSelect(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-none"
                  >
                    <option value="">General Portfolio (Unlinked)</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    placeholder="e.g. Wedding, Birthday, Graduation"
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-800">
                  Project Date{" "}
                  <span className="text-xs font-normal text-stone-400">
                    (Optional)
                  </span>
                </label>
                <input
                  type="date"
                  value={form.projectDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, projectDate: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-800">
                  Description{" "}
                  <span className="text-xs font-normal text-stone-400">
                    (Optional)
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Short story or venue details for this shoot..."
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
                <label className="block text-sm font-medium text-stone-800">
                  {editingProject
                    ? "Add More Photos (Optional)"
                    : "Upload Project Photos"}
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-5 text-center text-xs font-medium text-stone-700 hover:border-stone-500">
                  <Upload className="h-5 w-5 text-accent" />
                  <span>
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file(s) selected`
                      : "Click to select multiple photos (up to 15, max 8 MB each)"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      setSelectedFiles(
                        e.target.files ? Array.from(e.target.files) : [],
                      )
                    }
                  />
                </label>

                {selectedFiles.length > 0 && (
                  <ul className="max-h-24 overflow-y-auto text-xs text-stone-600 space-y-0.5">
                    {selectedFiles.map((file, idx) => (
                      <li key={idx} className="truncate">
                        • {file.name}
                      </li>
                    ))}
                  </ul>
                )}

                <div>
                  <span className="block text-xs text-stone-500">
                    Or paste image URLs (one URL per line):
                  </span>
                  <textarea
                    rows={2}
                    value={form.imageUrlsText}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, imageUrlsText: e.target.value }))
                    }
                    placeholder={"https://...\nhttps://..."}
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs focus:border-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-stone-900 px-6 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60"
                >
                  {saving
                    ? "Uploading & Saving..."
                    : editingProject
                      ? "Save Changes"
                      : "Publish Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
