import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Images,
  Pencil,
  Plus,
  Power,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiClient, extractApiError } from "../../api/client";
import { ApiResponse, Service } from "../../types";
import { formatCurrency } from "../../utils/formatters";

interface ServiceFormState {
  name: string;
  price: string;
  showPrice: boolean;
  duration: string;
  description: string;
  includesText: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_FORM: ServiceFormState = {
  name: "",
  price: "",
  showPrice: true,
  duration: "",
  description: "",
  includesText: "",
  imageUrl: "",
  isActive: true,
};

export function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryUrlsText, setGalleryUrlsText] = useState("");

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response =
        await apiClient.get<ApiResponse<Service[]>>("/services?all=true");
      setServices(response.data.data);
    } catch (err) {
      setError(extractApiError(err, "Failed to load photography services."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openCreateModal = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setGalleryFiles([]);
    setGalleryUrlsText("");
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      price: String(service.price),
      showPrice: service.showPrice,
      duration: service.duration || "",
      description: service.description,
      includesText: service.includes.join("\n"),
      imageUrl: service.imageUrl,
      isActive: service.isActive,
    });
    setImageFile(null);
    setGalleryFiles([]);
    setGalleryUrlsText("");
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (
      !editingService &&
      !imageFile &&
      !form.imageUrl.trim() &&
      galleryFiles.length === 0 &&
      !galleryUrlsText.trim()
    ) {
      setError("Please upload at least one image file or enter an image URL.");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("price", form.price);
      formData.append("showPrice", String(form.showPrice));
      formData.append("duration", form.duration.trim());
      formData.append("description", form.description.trim());
      formData.append("includes", form.includesText);
      formData.append("isActive", String(form.isActive));

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (form.imageUrl.trim()) {
        formData.append("imageUrl", form.imageUrl.trim());
      }

      for (const file of galleryFiles) {
        formData.append("galleryImages", file);
      }
      if (galleryUrlsText.trim()) {
        formData.append("galleryImageUrls", galleryUrlsText.trim());
      }

      if (editingService) {
        await apiClient.put(`/services/${editingService.id}`, formData);
        setNotice(`"${form.name.trim()}" updated successfully.`);
      } else {
        await apiClient.post("/services", formData);
        setNotice(`"${form.name.trim()}" created successfully.`);
      }

      setModalOpen(false);
      await fetchServices();
    } catch (err) {
      setError(extractApiError(err, "Failed to save photography service."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteServicePhoto = async (
    serviceId: string,
    imageId: string,
  ) => {
    if (!window.confirm("Remove this photo from the service slideshow?"))
      return;
    setError("");
    setNotice("");
    try {
      await apiClient.delete(`/services/${serviceId}/images/${imageId}`);
      setEditingService((prev) =>
        prev
          ? {
              ...prev,
              images: (prev.images || []).filter((img) => img.id !== imageId),
            }
          : null,
      );
      await fetchServices();
      setNotice("Service photo removed.");
    } catch (err) {
      setError(extractApiError(err, "Failed to remove service photo."));
    }
  };

  const handleToggleActive = async (service: Service) => {
    setBusyId(service.id);
    setError("");
    setNotice("");
    try {
      await apiClient.put(`/services/${service.id}`, {
        isActive: !service.isActive,
      });
      setNotice(
        `"${service.name}" is now ${service.isActive ? "inactive (hidden from public site)" : "active"}.`,
      );
      await fetchServices();
    } catch (err) {
      setError(extractApiError(err, "Failed to update service status."));
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePriceVisibility = async (service: Service) => {
    setBusyId(service.id);
    setError("");
    setNotice("");
    try {
      await apiClient.put(`/services/${service.id}`, {
        showPrice: !service.showPrice,
      });
      setNotice(
        `Price for "${service.name}" is now ${service.showPrice ? 'hidden publicly ("Contact for Pricing")' : "visible publicly"}.`,
      );
      await fetchServices();
    } catch (err) {
      setError(extractApiError(err, "Failed to update price visibility."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (service: Service) => {
    const confirmed = window.confirm(
      `Delete "${service.name}"? Services with existing bookings cannot be deleted and should be deactivated instead.`,
    );
    if (!confirmed) return;

    setBusyId(service.id);
    setError("");
    setNotice("");
    try {
      await apiClient.delete(`/services/${service.id}`);
      setNotice(`"${service.name}" deleted successfully.`);
      await fetchServices();
    } catch (err) {
      setError(extractApiError(err, "Failed to delete service."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-medium text-obsidian">
            Service Management
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage photography programs, Birr pricing, public price visibility,
            and multiple animated photos per service.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-obsidian px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-obsidian"
        >
          <Plus className="h-4 w-4" />
          Add Service
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 animate-pulse rounded-2xl bg-stone-200/70"
            />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
          No photography services yet. Click “Add Service” to create your first
          package.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const isBusy = busyId === service.id;
            const totalSlides =
              (service.images?.length || 0) +
              (service.galleryImages?.length ? 0 : 0);
            const photoCount = Math.max(
              service.galleryImages?.length || 0,
              service.images?.length || 0,
            );
            return (
              <article
                key={service.id}
                className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ${
                  service.isActive
                    ? "border-stone-200"
                    : "border-stone-200 opacity-75"
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        service.isActive
                          ? "bg-emerald-600 text-white"
                          : "bg-stone-800 text-stone-200"
                      }`}
                    >
                      {service.isActive ? "Active" : "Inactive"}
                    </span>
                    {!service.showPrice && (
                      <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                        Price Hidden
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif text-lg font-medium text-obsidian">
                      {service.name}
                    </h2>
                    <div className="shrink-0 text-right">
                      <span className="block font-semibold text-obsidian">
                        {formatCurrency(service.price)}
                      </span>
                      {!service.showPrice && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-amber-700">
                          Hidden on site
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                    {service.duration && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-accent" />
                        {service.duration}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Images className="h-3.5 w-3.5 text-accent" />
                      {photoCount} slideshow{" "}
                      {photoCount === 1 ? "photo" : "photos"}
                      {totalSlides > 0 ? ` (${totalSlides} direct)` : ""}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 flex-1 text-xs leading-relaxed text-stone-600">
                    {service.description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                    <button
                      type="button"
                      onClick={() => openEditModal(service)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit / Photos
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleTogglePriceVisibility(service)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-300 px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                      title={
                        service.showPrice
                          ? "Hide price from public site"
                          : "Show price on public site"
                      }
                    >
                      {service.showPrice ? (
                        <EyeOff className="h-3.5 w-3.5 text-amber-700" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-emerald-700" />
                      )}
                      <span>
                        {service.showPrice ? "Hide Price" : "Show Price"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleActive(service)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-300 px-2.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                      title={
                        service.isActive
                          ? "Deactivate service"
                          : "Activate service"
                      }
                    >
                      <Power className="h-3.5 w-3.5" />
                      {service.isActive ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(service)}
                      className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      title="Delete service"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Service Modal */}
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
              <h2 className="font-serif text-2xl font-medium text-obsidian">
                {editingService
                  ? "Edit Photography Service"
                  : "New Photography Service"}
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
                  Service Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Wedding Program, HBD / Birthday Program"
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Price (Birr / ETB) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="15000"
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Session Duration
                  </label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, duration: e.target.value }))
                    }
                    placeholder="e.g. 2 Hours, Full Day"
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-800">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe what clients can expect from this photography package..."
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-800">
                  What’s Included{" "}
                  <span className="text-xs font-normal text-stone-400">
                    (One item per line)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={form.includesText}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, includesText: e.target.value }))
                  }
                  placeholder={
                    "60+ high-resolution edited photos\nOnline sharing gallery\nPrint release"
                  }
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                />
              </div>

              {/* Primary Cover Photo */}
              <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                <label className="block text-sm font-medium text-stone-800">
                  Primary Cover Image
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-xs font-medium text-stone-700 hover:border-stone-500">
                  <Upload className="h-4 w-4 text-accent" />
                  <span>
                    {imageFile
                      ? imageFile.name
                      : "Upload cover image (JPEG, PNG, WebP)"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </label>
                <div>
                  <span className="block text-xs text-stone-500">
                    Or paste a cover image URL:
                  </span>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, imageUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs focus:border-obsidian focus:outline-none"
                  />
                </div>
              </div>

              {/* Multiple Animated Slideshow Photos for This Service */}
              <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Additional Service Photos (Animated Slideshow)
                  </label>
                  <p className="text-xs text-stone-500">
                    Upload multiple photos—they animate smoothly on both the
                    Home Page and Services Page.
                  </p>
                </div>

                {editingService?.images && editingService.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {editingService.images.map((img) => (
                      <div
                        key={img.id}
                        className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-200"
                      >
                        <img
                          src={img.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteServicePhoto(editingService.id, img.id)
                          }
                          className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white hover:bg-rose-600"
                          title="Remove photo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-4 text-center text-xs font-medium text-stone-700 hover:border-stone-500">
                  <Upload className="h-4 w-4 text-accent" />
                  <span>
                    {galleryFiles.length > 0
                      ? `${galleryFiles.length} photo(s) ready to upload`
                      : "Click to select multiple photos (up to 12)"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      setGalleryFiles(
                        e.target.files ? Array.from(e.target.files) : [],
                      )
                    }
                  />
                </label>

                <textarea
                  rows={2}
                  value={galleryUrlsText}
                  onChange={(e) => setGalleryUrlsText(e.target.value)}
                  placeholder={
                    "Or paste extra image URLs (one per line)\nhttps://..."
                  }
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs focus:border-obsidian focus:outline-none"
                />
              </div>

              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-2.5 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isActive: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-stone-300 accent-obsidian"
                  />
                  <span>
                    Active (visible on public website and booking form)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={form.showPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, showPrice: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-stone-300 accent-obsidian"
                  />
                  <span>
                    Show price publicly on the website (uncheck for “Contact for
                    Pricing”)
                  </span>
                </label>
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
                  className="rounded-full bg-obsidian px-6 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-obsidian disabled:opacity-60"
                >
                  {saving
                    ? "Uploading & Saving..."
                    : editingService
                      ? "Save Changes"
                      : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
