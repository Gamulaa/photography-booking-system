import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export interface HeroSlideItem {
  id: string;
  imageUrl: string;
  label?: string;
}

interface HeroShowcaseProps {
  slides: HeroSlideItem[];
  studioName: string;
}

export function HeroShowcase({ slides, studioName }: HeroShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slidesKey = slides.map((s) => s.imageUrl).join("|");

  // Reset index only when the actual image URLs change, and preload all slides in background
  useEffect(() => {
    setActiveIndex(0);
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.imageUrl;
    });
  }, [slidesKey]);

  // Smooth auto-cycle every 4.5 seconds
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length, slidesKey]);

  if (slides.length === 0) return null;

  const safeIndex = activeIndex < slides.length ? activeIndex : 0;
  const nextPreviewIndex = (safeIndex + 1) % slides.length;

  const step = (delta: -1 | 1) => {
    setActiveIndex((prev) => (prev + delta + slides.length) % slides.length);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-[440px] lg:ml-auto lg:mr-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient Gold Glow Behind Frame */}
      <div className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-accent/25 via-amber-400/10 to-transparent blur-2xl" />

      {/* Stacked Depth Card Peeking Behind */}
      {slides.length > 1 && (
        <div className="pointer-events-none absolute -right-3 top-5 hidden h-[90%] w-full rotate-3 overflow-hidden rounded-[2rem] border border-accent/25 bg-obsidian/80 opacity-60 shadow-2xl sm:block">
          <img
            src={slides[nextPreviewIndex].imageUrl}
            alt=""
            className="h-full w-full object-cover opacity-50 blur-[1px]"
          />
        </div>
      )}

      {/* Primary Editorial Frame */}
      <div className="animate-float-slow relative overflow-hidden rounded-[2rem] border border-white/15 bg-obsidian/90 p-2.5 shadow-2xl shadow-black/70 backdrop-blur-md">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-obsidian">
          {slides.map((slide, idx) => {
            const isActive = idx === safeIndex;
            return (
              <div
                key={`${slide.id}-${idx}`}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? "z-10 opacity-100" : "z-0 opacity-0"
                }`}
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.label || `${studioName} showcase ${idx + 1}`}
                  className={`h-full w-full object-cover ${
                    isActive ? "animate-ken-burns" : ""
                  }`}
                />
              </div>
            );
          })}

          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-obsidian/85 via-transparent to-obsidian/20" />

          {/* Top Floating Tag */}
          <div className="absolute left-3.5 right-3.5 top-3.5 z-20 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-obsidian/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-accent" />
              Featured Frame
            </span>
            {slides.length > 1 && (
              <span className="rounded-full bg-obsidian/70 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
                {String(safeIndex + 1).padStart(2, "0")} /{" "}
                {String(slides.length).padStart(2, "0")}
              </span>
            )}
          </div>

          {/* Bottom Caption & Controls */}
          <div className="absolute bottom-3.5 left-3.5 right-3.5 z-20 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-medium text-white">
                {slides[safeIndex]?.label || studioName}
              </p>
              {slides.length > 1 && (
                <div className="mt-2 flex items-center gap-1.5">
                  {slides.map((s, idx) => (
                    <button
                      key={`${s.id}-dot-${idx}`}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`View slide ${idx + 1}`}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        idx === safeIndex
                          ? "w-6 bg-accent"
                          : "w-2 bg-white/35 hover:bg-white/65"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {slides.length > 1 && (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="rounded-full border border-white/20 bg-obsidian/70 p-1.5 text-white backdrop-blur-md transition-colors hover:border-accent hover:text-amber-200"
                  aria-label="Previous hero frame"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="rounded-full border border-white/20 bg-obsidian/70 p-1.5 text-white backdrop-blur-md transition-colors hover:border-accent hover:text-amber-200"
                  aria-label="Next hero frame"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
