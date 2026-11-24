import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Images,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, extractApiError } from "../../api/client";
import { useBusiness } from "../../context/BusinessContext";
import { ApiResponse, Service } from "../../types";
import { formatCurrency, formatPhoneHref } from "../../utils/formatters";

export function ServicesPage() {
  const { business } = useBusiness();
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // In-page Lightbox so customers can preview real photos for any package right here
  const [lightboxService, setLightboxService] = useState<Service | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadServices() {
      try {
        const response =
          await apiClient.get<ApiResponse<Service[]>>("/services");
        if (active) setServices(response.data.data || []);
      } catch (err) {
        if (active)
          setError(
            extractApiError(err, "Unable to load photography services."),
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    loadServices();
    return () => {
      active = false;
    };
  }, []);

  const visibleServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.includes.some((inc) => inc.toLowerCase().includes(q)),
    );
  }, [services, searchTerm]);

  const openLightbox = (service: Service) => {
    setLightboxService(service);
    setSlideIndex(0);
  };

  const closeLightbox = () => {
    setLightboxService(null);
    setSlideIndex(0);
  };

  const lightboxSlides = lightboxService
    ? lightboxService.galleryImages && lightboxService.galleryImages.length > 0
      ? lightboxService.galleryImages.map((img) => ({
          id: img.id,
          url: img.imageUrl,
          caption: img.projectTitle,
        }))
      : [
          {
            id: lightboxService.id,
            url: lightboxService.imageUrl,
            caption: lightboxService.name,
          },
        ]
    : [];

  const stepSlide = (direction: -1 | 1) => {
    if (lightboxSlides.length === 0) return;
    setSlideIndex(
      (prev) =>
        (prev + direction + lightboxSlides.length) % lightboxSlides.length,
    );
  };

  useEffect(() => {
    if (!lightboxService) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") stepSlide(1);
      if (e.key === "ArrowLeft") stepSlide(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxService, lightboxSlides.length]);

  return (
    <div>
      {/* Editorial Header Banner */}
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
              Complete Photography Catalog
            </p>
            <h1
              className="animate-fade-up mt-5 font-serif text-4xl font-medium leading-tight sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "90ms" }}
            >
              All Photography Services &amp; Packages
            </h1>
            <p
              className="animate-fade-up mt-4 max-w-2xl text-base leading-relaxed text-stone-300 sm:text-lg"
              style={{ animationDelay: "180ms" }}
            >
              Every celebration deserves artful, unhurried coverage. Explore all
              of our photography programs below—preview completed work and
              reserve your preferred date online.
            </p>
          </div>
        </div>
      </section>

      {/* Studio Guarantees Strip */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 text-xs font-medium text-stone-700 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
            <span>Transparent packages with flexible custom options</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Camera className="h-4 w-4 shrink-0 text-accent" />
            <span>Individually color-graded high-resolution delivery</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 shrink-0 text-accent" />
            <span>
              Ethiopian Calendar booking with direct studio confirmation
            </span>
          </div>
        </div>
      </section>

      {/* All Services Grid */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Filter & Count Bar */}
        {!loading && services.length > 0 && (
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-sm font-medium text-stone-600">
              Showing{" "}
              <span className="font-semibold text-obsidian">
                {visibleServices.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-obsidian">
                {services.length}
              </span>{" "}
              photography programs
            </p>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search wedding, birthday, graduation..."
                className="w-full rounded-full border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-obsidian placeholder:text-stone-400 focus:border-obsidian focus:outline-none"
              />
            </div>
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
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-[520px] animate-pulse rounded-2xl bg-stone-200/70"
              />
            ))}
          </div>
        ) : visibleServices.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-500">
            {searchTerm
              ? `No photography services match "${searchTerm}".`
              : "No photography services are currently available. Please check back soon."}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {visibleServices.map((service, index) => {
              const photoCount = service.galleryImages?.length || 0;
              const showPrice = service.showPrice !== false;
              return (
                <article
                  key={service.id}
                  className="animate-fade-up group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                  style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
                >
                  {/* Cover Image */}
                  <div
                    onClick={() => openLightbox(service)}
                    className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-stone-100"
                  >
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/65 via-transparent to-obsidian/15" />

                    {/* Price Pill */}
                    <div className="absolute bottom-3.5 left-3.5 rounded-full bg-white/95 px-3.5 py-1.5 shadow-sm backdrop-blur-sm">
                      {showPrice ? (
                        <>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                            From{" "}
                          </span>
                          <span className="font-serif text-base font-bold text-obsidian">
                            {formatCurrency(service.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-obsidian">
                          Contact for Pricing
                        </span>
                      )}
                    </div>

                    {/* Photo Count Pill */}
                    {photoCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLightbox(service);
                        }}
                        className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-obsidian/75 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-accent hover:text-obsidian"
                      >
                        <Images className="h-3.5 w-3.5" />
                        <span>{photoCount} Photos</span>
                      </button>
                    )}
                  </div>

                  {/* Package Details */}
                  <div className="flex flex-1 flex-col p-6">
                    <div>
                      <h2 className="font-serif text-2xl font-medium text-obsidian">
                        {service.name}
                      </h2>
                      {service.duration && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-stone-500">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                          {service.duration}
                        </p>
                      )}
                    </div>

                    <p className="mt-3.5 text-sm leading-relaxed text-stone-600">
                      {service.description}
                    </p>

                    {service.includes.length > 0 && (
                      <div className="mt-5 border-t border-stone-100 pt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                          Package Highlights
                        </p>
                        <ul className="mt-2.5 space-y-2">
                          {service.includes.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs leading-relaxed text-stone-700 sm:text-sm"
                            >
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-auto flex items-center gap-2.5 pt-6">
                      {photoCount > 0 && (
                        <button
                          type="button"
                          onClick={() => openLightbox(service)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-700 transition-colors hover:border-obsidian hover:text-obsidian"
                        >
                          <Images className="h-3.5 w-3.5 text-accent" />
                          Gallery
                        </button>
                      )}
                      <Link
                        to={`/book?service=${service.id}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-obsidian px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-obsidian"
                      >
                        <span>Book Package</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Custom Package / Bundle Consultation Banner */}
        <div className="mt-20 flex flex-col items-start justify-between gap-6 rounded-3xl bg-obsidian p-8 text-white shadow-lg sm:p-12 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Need a Custom Bundle?
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium">
              Planning a multi-day event or custom shoot?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-300">
              Combine Pre-Wedding + Wedding coverage or tailor hours for large
              celebrations. Call our studio or send a note in your booking
              request.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {business?.phoneNumber && (
              <a
                href={formatPhoneHref(business.phoneNumber)}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-accent hover:text-amber-200"
              >
                <Phone className="h-4 w-4 text-accent" />
                {business.phoneNumber}
              </a>
            )}
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-amber-500 px-6 py-3 text-sm font-semibold text-obsidian transition-all hover:brightness-110"
            >
              Request Custom Date
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* In-Page Service Work Gallery Lightbox */}
      {lightboxService && lightboxSlides[slideIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-300">
                  {lightboxService.name}
                  {lightboxService.showPrice !== false
                    ? ` · ${formatCurrency(lightboxService.price)}`
                    : ""}
                </p>
                <h3 className="font-serif text-lg sm:text-xl">
                  {lightboxSlides[slideIndex].caption}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/book?service=${lightboxService.id}`}
                  className="rounded-full bg-gradient-to-r from-accent to-amber-500 px-4 py-2 text-xs font-semibold text-obsidian transition-all hover:brightness-110"
                >
                  Book This Service
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

            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/60">
              <img
                src={lightboxSlides[slideIndex].url}
                alt={lightboxSlides[slideIndex].caption}
                className="max-h-[68vh] w-auto object-contain"
              />
              {lightboxSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepSlide(-1)}
                    className="absolute left-3 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/85"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSlide(1)}
                    className="absolute right-3 rounded-full bg-black/60 p-2.5 text-white hover:bg-black/85"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {lightboxSlides.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {lightboxSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setSlideIndex(idx)}
                    className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity ${
                      idx === slideIndex
                        ? "border-accent opacity-100"
                        : "border-transparent opacity-55 hover:opacity-90"
                    }`}
                  >
                    <img
                      src={slide.url}
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
    </div>
  );
}
