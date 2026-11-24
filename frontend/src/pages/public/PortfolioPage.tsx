import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Images,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiClient, extractApiError } from "../../api/client";
import { useBusiness } from "../../context/BusinessContext";
import { ApiResponse, PortfolioProject } from "../../types";
import { formatDate } from "../../utils/formatters";

function getProjectCategoryLabel(project: PortfolioProject): string {
  return (project.service?.name || project.category || "Portfolio").trim();
}

export function PortfolioPage() {
  const { business } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeServiceFilter = searchParams.get("service") || "";

  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lightbox state
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(
    null,
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadPortfolio() {
      try {
        const response =
          await apiClient.get<ApiResponse<PortfolioProject[]>>("/portfolio");
        if (active) setProjects(response.data.data || []);
      } catch (err) {
        if (active)
          setError(extractApiError(err, "Unable to load portfolio projects."));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPortfolio();
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(projects.map(getProjectCategoryLabel)),
    ).sort();
    return ["All", ...unique];
  }, [projects]);

  const activeServiceName = useMemo(() => {
    if (!activeServiceFilter) return "";
    const match = projects.find((p) => p.serviceId === activeServiceFilter);
    return match ? getProjectCategoryLabel(match) : "";
  }, [projects, activeServiceFilter]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (activeServiceFilter) {
        return p.serviceId === activeServiceFilter;
      }
      if (selectedCategory !== "All") {
        return (
          getProjectCategoryLabel(p).toLowerCase() ===
          selectedCategory.toLowerCase()
        );
      }
      return true;
    });
  }, [projects, selectedCategory, activeServiceFilter]);

  const openLightbox = (project: PortfolioProject, index = 0) => {
    if (project.images.length === 0) return;
    setActiveProject(project);
    setActiveImageIndex(index);
  };

  const closeLightbox = () => {
    setActiveProject(null);
    setActiveImageIndex(0);
  };

  const stepImage = (direction: -1 | 1) => {
    if (!activeProject || activeProject.images.length === 0) return;
    setActiveImageIndex(
      (prev) =>
        (prev + direction + activeProject.images.length) %
        activeProject.images.length,
    );
  };

  useEffect(() => {
    if (!activeProject) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") stepImage(1);
      if (e.key === "ArrowLeft") stepImage(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeProject]);

  const totalPhotosCount = useMemo(
    () => projects.reduce((sum, p) => sum + p.images.length, 0),
    [projects],
  );

  return (
    <div>
      {/* Editorial Portfolio Banner */}
      <section className="relative overflow-hidden bg-obsidian py-20 text-white sm:py-24">
        {business?.heroImageUrl && (
          <img
            src={business.heroImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/70 via-obsidian/85 to-obsidian" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Selected Client Galleries
            </p>
            <h1
              className="animate-fade-up mt-5 font-serif text-4xl font-medium leading-tight sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "90ms" }}
            >
              Our Portfolio
            </h1>
            <p
              className="animate-fade-up mt-4 max-w-2xl text-base leading-relaxed text-stone-300 sm:text-lg"
              style={{ animationDelay: "180ms" }}
            >
              Real stories captured by{" "}
              {business?.businessName || "Anaf Picture"} across weddings,
              birthdays, graduations, baptisms, portraits, and corporate events.
              Click any gallery to inspect the full collection.
            </p>
            {!loading && projects.length > 0 && (
              <p className="mt-5 inline-flex items-center gap-4 text-xs font-medium uppercase tracking-wider text-amber-200/90">
                <span className="inline-flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-accent" />
                  {projects.length}{" "}
                  {projects.length === 1 ? "Project" : "Projects"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Images className="h-3.5 w-3.5 text-accent" />
                  {totalPhotosCount}{" "}
                  {totalPhotosCount === 1 ? "Photograph" : "Photographs"}
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Service Filter Notice if deep-linked via /portfolio?service=<id> */}
        {activeServiceFilter && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-3.5 text-sm text-obsidian">
            <span>
              Showing portfolio galleries for{" "}
              <strong>
                {activeServiceName || "selected photography service"}
              </strong>
              .
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchParams({});
                setSelectedCategory("All");
              }}
              className="rounded-full bg-obsidian px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent hover:text-obsidian"
            >
              Show All Galleries
            </button>
          </div>
        )}

        {/* Category Filter Tabs */}
        {!loading && categories.length > 1 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected =
                !activeServiceFilter && selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    if (activeServiceFilter) setSearchParams({});
                  }}
                  className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition-all ${
                    isSelected
                      ? "bg-obsidian text-white shadow-sm"
                      : "border border-stone-300 bg-white text-stone-700 hover:border-obsidian hover:text-obsidian"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mb-8 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[420px] animate-pulse rounded-2xl bg-stone-200/70"
              />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-14 text-center">
            <Images className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-3 font-serif text-xl text-obsidian">
              No galleries found
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {activeServiceFilter || selectedCategory !== "All"
                ? "No portfolio projects have been published under this category yet."
                : "Portfolio galleries uploaded from the studio dashboard will appear here."}
            </p>
            {(activeServiceFilter || selectedCategory !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchParams({});
                }}
                className="mt-5 rounded-full bg-obsidian px-5 py-2 text-xs font-semibold text-white hover:bg-accent hover:text-obsidian"
              >
                View All Projects
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, index) => {
              const coverImage = project.images[0]?.imageUrl;
              const extraThumbnails = project.images.slice(1, 4);
              const label = getProjectCategoryLabel(project);

              return (
                <article
                  key={project.id}
                  onClick={() => openLightbox(project, 0)}
                  className="animate-fade-up group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                  style={{ animationDelay: `${Math.min(index * 70, 350)}ms` }}
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={project.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-stone-400">
                        No image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-obsidian/10" />

                    <span className="absolute left-3.5 top-3.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-obsidian shadow-sm backdrop-blur-sm">
                      {label}
                    </span>

                    <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-obsidian/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      <Images className="h-3.5 w-3.5 text-accent" />
                      {project.images.length}
                    </span>

                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-xs font-medium text-white opacity-90 sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover:opacity-100">
                      <span>Open Full Gallery</span>
                      <ArrowRight className="h-4 w-4 text-amber-200" />
                    </div>
                  </div>

                  {/* Mini Thumbnail Strip for Multi-Image Projects */}
                  {extraThumbnails.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1">
                      {extraThumbnails.map((img, thumbIdx) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(project, thumbIdx + 1);
                          }}
                          className="aspect-[16/10] overflow-hidden rounded-md bg-stone-200"
                        >
                          <img
                            src={img.imageUrl}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Project Info */}
                  <div className="flex flex-1 flex-col p-6">
                    {project.projectDate && (
                      <p className="inline-flex items-center gap-1.5 text-xs text-stone-400">
                        <Calendar className="h-3.5 w-3.5 text-accent" />
                        {formatDate(project.projectDate)}
                      </p>
                    )}
                    <h2 className="mt-1.5 font-serif text-xl font-medium text-obsidian">
                      {project.title}
                    </h2>
                    {project.description && (
                      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-stone-600">
                        {project.description}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* CTA Banner */}
        <div className="mt-20 rounded-3xl bg-obsidian p-8 text-center text-white shadow-lg sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            Let’s Create Together
          </p>
          <h2 className="mt-2 font-serif text-3xl font-medium sm:text-4xl">
            Want your story captured like this?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-stone-300">
            Reserve your preferred Ethiopian Calendar date online and our studio
            will contact you directly to plan your shoot.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-amber-500 px-7 py-3 text-sm font-semibold text-obsidian transition-all hover:brightness-110"
            >
              Book a Session
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-accent hover:text-amber-200"
            >
              Explore Packages
            </Link>
          </div>
        </div>
      </section>

      {/* Full-Screen Gallery Lightbox Modal */}
      {activeProject && activeProject.images[activeImageIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/94 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="mb-3 flex items-center justify-between gap-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-300">
                  {getProjectCategoryLabel(activeProject)} · Photo{" "}
                  {activeImageIndex + 1} of {activeProject.images.length}
                </p>
                <h3 className="font-serif text-lg sm:text-xl">
                  {activeProject.title}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={
                    activeProject.serviceId
                      ? `/book?service=${activeProject.serviceId}`
                      : "/book"
                  }
                  className="hidden rounded-full bg-gradient-to-r from-accent to-amber-500 px-4 py-2 text-xs font-semibold text-obsidian transition-all hover:brightness-110 sm:inline-block"
                >
                  Book Similar Shoot
                </Link>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                  aria-label="Close gallery"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Active Image Stage */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/60">
              <img
                src={activeProject.images[activeImageIndex].imageUrl}
                alt={`${activeProject.title} (${activeImageIndex + 1})`}
                className="max-h-[68vh] w-auto object-contain"
              />

              {activeProject.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepImage(-1)}
                    className="absolute left-3 rounded-full bg-black/65 p-2.5 text-white transition-colors hover:bg-black/90"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepImage(1)}
                    className="absolute right-3 rounded-full bg-black/65 p-2.5 text-white transition-colors hover:bg-black/90"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Description & Thumbnails */}
            <div className="mt-4 flex flex-col gap-3">
              {activeProject.description && (
                <p className="text-sm text-stone-300">
                  {activeProject.description}
                </p>
              )}
              {activeProject.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {activeProject.images.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity ${
                        idx === activeImageIndex
                          ? "border-accent opacity-100"
                          : "border-transparent opacity-55 hover:opacity-90"
                      }`}
                    >
                      <img
                        src={img.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
