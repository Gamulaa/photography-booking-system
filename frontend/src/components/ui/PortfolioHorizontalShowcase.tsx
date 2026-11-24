import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Images,
  Pause,
  Play,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PortfolioProject } from "../../types";

interface PortfolioHorizontalShowcaseProps {
  projects: PortfolioProject[];
}

function formatProjectDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function PortfolioHorizontalShowcase({
  projects,
}: PortfolioHorizontalShowcaseProps) {
  const [hovered, setHovered] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);

  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(
    null,
  );
  const [slideIndex, setSlideIndex] = useState(0);

  const validProjects = useMemo(
    () =>
      projects.filter((project) => project.images && project.images.length > 0),
    [projects],
  );

  // Repeat stored projects enough times to fill wide screens cleanly before seamless looping
  const loopProjects = useMemo(() => {
    if (validProjects.length === 0) return [];
    const repeatCount = Math.max(1, Math.ceil(6 / validProjects.length));
    const list: { project: PortfolioProject; copyIndex: number }[] = [];
    for (let copyIndex = 0; copyIndex < repeatCount; copyIndex += 1) {
      validProjects.forEach((project) => {
        list.push({ project, copyIndex });
      });
    }
    return list;
  }, [validProjects]);

  // Consistent cinematic speed regardless of how many projects are stored
  const durationSeconds = Math.max(24, loopProjects.length * 6);
  const isPaused = hovered || manuallyPaused || Boolean(activeProject);

  const openProjectLightbox = (project: PortfolioProject) => {
    setActiveProject(project);
    setSlideIndex(0);
  };

  const closeProjectLightbox = () => {
    setActiveProject(null);
    setSlideIndex(0);
  };

  const stepLightbox = useCallback(
    (delta: -1 | 1) => {
      if (!activeProject || activeProject.images.length === 0) return;
      setSlideIndex(
        (prev) =>
          (prev + delta + activeProject.images.length) %
          activeProject.images.length,
      );
    },
    [activeProject],
  );

  useEffect(() => {
    if (!activeProject) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProjectLightbox();
      if (e.key === "ArrowRight") stepLightbox(1);
      if (e.key === "ArrowLeft") stepLightbox(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeProject, stepLightbox]);

  if (validProjects.length === 0) return null;

  const renderProjectCard = (project: PortfolioProject, key: string) => {
    const coverUrl = project.images[0].imageUrl;
    const categoryLabel = project.service?.name || project.category;
    const dateLabel = formatProjectDate(project.projectDate);

    return (
      <article
        key={key}
        onClick={() => openProjectLightbox(project)}
        className="group relative w-[290px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-xl dark:border-white/10 dark:bg-surface sm:w-[340px] lg:w-[370px]"
      >
        {/* Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-obsidian">
          <img
            src={coverUrl}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/15 to-transparent" />

          {/* Top Badges */}
          <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
            <span className="truncate rounded-full bg-obsidian/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-200 backdrop-blur-md">
              {categoryLabel}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-obsidian/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
              <Images className="h-3 w-3 text-accent" />
              {project.images.length}
            </span>
          </div>

          {/* Hover Preview Prompt */}
          <div className="absolute bottom-3 right-3 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-obsidian opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            View Project
          </div>
        </div>

        {/* Project Info */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 font-serif text-lg font-medium text-obsidian transition-colors group-hover:text-accent-dark dark:text-white dark:group-hover:text-amber-200">
              {project.title}
            </h3>
            {dateLabel && (
              <span className="inline-flex shrink-0 items-center gap-1 pt-1 text-[11px] text-stone-500 dark:text-stone-400">
                <Calendar className="h-3 w-3 text-accent" />
                {dateLabel}
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              {project.description}
            </p>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="overflow-hidden border-y border-stone-200/80 bg-stone-100/70 py-16 dark:border-white/10 dark:bg-surface/60 sm:py-20">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Selected Works · {validProjects.length}{" "}
              {validProjects.length === 1 ? "Project" : "Projects"}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-obsidian dark:text-white sm:text-4xl">
              Recent Stories Behind the Lens
            </h2>
            <p className="mt-2 max-w-xl text-sm text-stone-600 dark:text-stone-400">
              Hover over any project to pause, or click to explore its complete
              photo gallery.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setManuallyPaused((prev) => !prev)}
              aria-label={
                manuallyPaused
                  ? "Resume horizontal movement"
                  : "Pause horizontal movement"
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-obsidian transition-colors hover:border-accent hover:bg-obsidian hover:text-white dark:border-white/15 dark:bg-surface dark:text-white dark:hover:border-accent dark:hover:bg-accent dark:hover:text-obsidian"
            >
              {manuallyPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 text-accent" />
                  <span>Play</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 text-accent" />
                  <span>Pause</span>
                </>
              )}
            </button>

            <Link
              to="/portfolio"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-obsidian transition-colors hover:border-obsidian hover:bg-obsidian hover:text-white dark:border-white/15 dark:bg-surface dark:text-amber-200 dark:hover:border-accent dark:hover:bg-accent dark:hover:text-obsidian sm:text-sm"
            >
              <span>Full Portfolio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Continuous Auto-Moving Horizontal Track */}
      <div
        className="portfolio-marquee-mask relative mt-10 w-full overflow-hidden py-2"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="flex w-max will-change-transform"
          style={{
            animation: `portfolio-marquee ${durationSeconds}s linear infinite`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {/* First half */}
          <div className="flex shrink-0 gap-5 pr-5">
            {loopProjects.map(({ project, copyIndex }) =>
              renderProjectCard(project, `track-a-${copyIndex}-${project.id}`),
            )}
          </div>

          {/* Identical second half for seamless infinite wrap */}
          <div className="flex shrink-0 gap-5 pr-5" aria-hidden="true">
            {loopProjects.map(({ project, copyIndex }) =>
              renderProjectCard(project, `track-b-${copyIndex}-${project.id}`),
            )}
          </div>
        </div>
      </div>

      {/* Full-Screen Project Gallery Lightbox */}
      {activeProject && activeProject.images[slideIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/94 p-4 backdrop-blur-sm"
          onClick={closeProjectLightbox}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-widest text-amber-300">
                  {activeProject.service?.name || activeProject.category} ·{" "}
                  {slideIndex + 1} / {activeProject.images.length}
                </p>
                <h3 className="truncate font-serif text-base sm:text-xl">
                  {activeProject.title}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <Link
                  to={
                    activeProject.serviceId
                      ? `/book?service=${activeProject.serviceId}`
                      : "/book"
                  }
                  className="rounded-full bg-gradient-to-r from-accent to-amber-500 px-3.5 py-2 text-xs font-semibold text-obsidian transition-all hover:brightness-110 sm:px-4"
                >
                  Book Similar
                </Link>
                <button
                  type="button"
                  onClick={closeProjectLightbox}
                  className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                  aria-label="Close project gallery"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/60">
              <img
                src={activeProject.images[slideIndex].imageUrl}
                alt={activeProject.title}
                className="max-h-[65vh] w-auto object-contain sm:max-h-[68vh]"
              />
              {activeProject.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepLightbox(-1)}
                    className="absolute left-2.5 rounded-full bg-black/65 p-2 text-white hover:bg-black/85 sm:left-3 sm:p-2.5"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepLightbox(1)}
                    className="absolute right-2.5 rounded-full bg-black/65 p-2 text-white hover:bg-black/85 sm:right-3 sm:p-2.5"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}
            </div>

            {activeProject.images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {activeProject.images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSlideIndex(idx)}
                    className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity ${
                      idx === slideIndex
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
      )}
    </section>
  );
}
