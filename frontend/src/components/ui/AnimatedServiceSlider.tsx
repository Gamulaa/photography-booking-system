import { useEffect, useState } from "react";

interface AnimatedServiceSliderProps {
  images: string[];
  alt: string;
  intervalMs?: number;
  staggerMs?: number;
  className?: string;
}

export function AnimatedServiceSlider({
  images,
  alt,
  intervalMs = 4200,
  staggerMs = 0,
  className = "",
}: AnimatedServiceSliderProps) {
  const uniqueImages = Array.from(new Set(images.filter(Boolean)));
  const imagesKey = uniqueImages.join("|");

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset to first frame when image list changes and preload all slides in background
  useEffect(() => {
    setActiveIndex(0);
    uniqueImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [imagesKey]);

  // Smooth staggered auto-cycle across cards
  useEffect(() => {
    if (paused || uniqueImages.length <= 1) return;

    let intervalId: number | undefined;
    const startTimer = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % uniqueImages.length);
      }, intervalMs);
    }, staggerMs);

    return () => {
      window.clearTimeout(startTimer);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [paused, uniqueImages.length, intervalMs, staggerMs, imagesKey]);

  if (uniqueImages.length === 0) return null;

  const safeIndex = activeIndex < uniqueImages.length ? activeIndex : 0;

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-obsidian ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {uniqueImages.map((src, idx) => {
        const isActive = idx === safeIndex;
        return (
          <img
            key={`${src}-${idx}`}
            src={src}
            alt={alt}
            loading="lazy"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
              isActive
                ? "z-10 scale-105 opacity-100"
                : "z-0 scale-100 opacity-0"
            }`}
          />
        );
      })}

      {/* Bottom Progress Indicators for Multi-Photo Services */}
      {uniqueImages.length > 1 && (
        <div
          className="absolute inset-x-3 bottom-2 z-20 flex gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {uniqueImages.map((src, idx) => (
            <button
              key={`${src}-dot-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                idx === safeIndex
                  ? "bg-accent shadow-sm"
                  : "bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
