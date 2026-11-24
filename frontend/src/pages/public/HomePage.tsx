import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Images,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, extractApiError } from "../../api/client";
import { AnimatedServiceSlider } from "../../components/ui/AnimatedServiceSlider";
import { HeroShowcase, HeroSlideItem } from "../../components/ui/HeroShowcase";
import { PortfolioHorizontalShowcase } from "../../components/ui/PortfolioHorizontalShowcase";
import { useBusiness } from "../../context/BusinessContext";
import { ApiResponse, PortfolioProject, Service } from "../../types";
import { formatCurrency, formatPhoneHref } from "../../utils/formatters";

const HERO_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80";

function getServicePhotoList(service: Service): string[] {
  const urls = [
    service.imageUrl,
    ...(service.images?.map((img) => img.imageUrl) || []),
    ...(service.galleryImages?.map((img) => img.imageUrl) || []),
  ].filter(Boolean);
  return Array.from(new Set(urls));
}

export function HomePage() {
  const { business } = useBusiness();
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");

  const [activeServiceGallery, setActiveServiceGallery] =
    useState<Service | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadHomeData() {
      const [servicesResult, portfolioResult] = await Promise.allSettled([
        apiClient.get<ApiResponse<Service[]>>("/services"),
        apiClient.get<ApiResponse<PortfolioProject[]>>("/portfolio"),
      ]);

      if (!active) return;

      if (servicesResult.status === "fulfilled") {
        setServices(servicesResult.value.data.data || []);
      } else {
        setServicesError(
          extractApiError(
            servicesResult.reason,
            "Unable to load photography services.",
          ),
        );
      }

      if (portfolioResult.status === "fulfilled") {
        setProjects(portfolioResult.value.data.data || []);
      }

      setLoading(false);
    }
    loadHomeData();
    return () => {
      active = false;
    };
  }, []);

  const selectedGalleryImages = useMemo(
    () =>
      projects
        .flatMap((project) =>
          project.images.map((img) => ({
            id: img.id,
            url: img.imageUrl,
            title: project.title,
            category: project.service?.name || project.category,
          })),
        )
        .slice(0, 6),
    [projects],
  );

  const heroImage =
    business?.heroImageUrl ||
    selectedGalleryImages[0]?.url ||
    HERO_FALLBACK_IMAGE;

  const heroShowcaseSlides: HeroSlideItem[] = useMemo(() => {
    if (
      business?.heroShowcaseImages &&
      business.heroShowcaseImages.length > 0
    ) {
      return business.heroShowcaseImages.map((item, idx) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        label: `${business.businessName || "Anaf Picture"} · Highlight ${idx + 1}`,
      }));
    }
    if (selectedGalleryImages.length > 0) {
      return selectedGalleryImages.slice(0, 5).map((img) => ({
        id: img.id,
        imageUrl: img.url,
        label: img.title,
      }));
    }
    if (services.length > 0) {
      return services.slice(0, 5).map((svc) => ({
        id: svc.id,
        imageUrl: svc.imageUrl,
        label: svc.name,
      }));
    }
    return [
      {
        id: "fallback",
        imageUrl: heroImage,
        label: business?.businessName || "Anaf Picture",
      },
    ];
  }, [business, selectedGalleryImages, services, heroImage]);

  const primaryFeatured = services.slice(0, 2);
  const secondaryFeatured = services.slice(2, 6);

  const openServiceGallery = (service: Service) => {
    setActiveServiceGallery(service);
    setActiveSlideIndex(0);
  };

  const closeServiceGallery = () => {
    setActiveServiceGallery(null);
    setActiveSlideIndex(0);
  };

  const activeSlides = useMemo(() => {
    if (!activeServiceGallery) return [];
    const seen = new Set<string>();
    const list: { id: string; url: string; caption: string }[] = [];

    const add = (id: string, url: string, caption: string) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      list.push({ id, url, caption });
    };

    if (activeServiceGallery.images) {
      activeServiceGallery.images.forEach((img) =>
        add(img.id, img.imageUrl, activeServiceGallery.name),
      );
    }
    if (activeServiceGallery.galleryImages) {
      activeServiceGallery.galleryImages.forEach((img) =>
        add(
          img.id,
          img.imageUrl,
          img.projectTitle || activeServiceGallery.name,
        ),
      );
    }
    add(
      activeServiceGallery.id,
      activeServiceGallery.imageUrl,
      activeServiceGallery.name,
    );
    return list;
  }, [activeServiceGallery]);

  const stepSlide = (direction: -1 | 1) => {
    if (activeSlides.length === 0) return;
    setActiveSlideIndex(
      (prev) => (prev + direction + activeSlides.length) % activeSlides.length,
    );
  };

  useEffect(() => {
    if (!activeServiceGallery) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeServiceGallery();
      if (e.key === "ArrowRight") stepSlide(1);
      if (e.key === "ArrowLeft") stepSlide(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeServiceGallery, activeSlides.length]);

  return (
    <div>
      {/* Split Cinematic Brand Hero Section */}
      <section className="relative flex min-h-[86vh] flex-col justify-center overflow-hidden bg-obsidian pt-24 pb-16 sm:min-h-[92vh] sm:pt-28 sm:pb-20">
        <img
          src={heroImage}
          alt={business?.businessName || "Anaf Picture"}
          className="animate-hero-zoom absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/95 via-obsidian/75 to-obsidian/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian/50" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
          {/* Left Side: Brand Typography & CTAs */}
          <div className="space-y-5 sm:space-y-6 lg:col-span-7">
            <div
              className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-accent/40 bg-obsidian/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-md sm:gap-2.5 sm:px-4 sm:text-xs sm:tracking-[0.25em]"
              style={{ animationDelay: "60ms" }}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span>
                {business?.businessName || "Anaf Picture"} · Signature Visual
                Storytelling
              </span>
            </div>

            <h1
              className="animate-fade-up font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "150ms" }}
            >
              {business?.businessName || "Anaf Picture"}
              <span className="mt-2 block text-xl font-normal italic text-amber-200/95 sm:text-3xl lg:text-4xl">
                Capturing moments that live forever.
              </span>
            </h1>

            <div
              className="animate-fade-up h-1 w-20 rounded-full bg-gradient-to-r from-accent to-amber-300 sm:w-24"
              style={{ animationDelay: "220ms" }}
            />

            <p
              className="animate-fade-up max-w-xl text-sm leading-relaxed text-stone-300 sm:text-lg"
              style={{ animationDelay: "280ms" }}
            >
              {business?.description ||
                "Fine art wedding, birthday, graduation, baptism, family, and corporate photography crafted with precision lighting and authentic emotion."}
            </p>

            <div
              className="animate-fade-up flex flex-wrap items-center gap-3 pt-2 sm:gap-3.5 sm:pt-3"
              style={{ animationDelay: "350ms" }}
            >
              <Link
                to="/book"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-amber-500 px-6 py-3.5 text-sm font-semibold text-obsidian shadow-xl shadow-accent/25 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 sm:px-8 sm:py-4"
              >
                <Calendar className="h-4 w-4" />
                Book Your Date
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 sm:px-7 sm:py-4"
              >
                Explore All Services
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-1.5 px-2.5 py-2.5 text-sm font-medium text-amber-200/90 transition-colors hover:text-white sm:px-3 sm:py-3"
              >
                View Portfolio
              </Link>
            </div>
          </div>

          {/* Right Side: Uploaded Animated Photo Showcase */}
          <div
            className="animate-fade-up lg:col-span-5"
            style={{ animationDelay: "260ms" }}
          >
            <HeroShowcase
              slides={heroShowcaseSlides}
              studioName={business?.businessName || "Anaf Picture"}
            />
          </div>
        </div>
      </section>

      {/* Studio Highlights Trust Bar */}
      <section className="border-y border-stone-200/80 bg-white dark:border-white/10 dark:bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-stone-200/80 px-4 py-6 sm:px-6 sm:py-7 md:grid-cols-4 md:divide-x dark:divide-white/10 lg:px-8">
          {[
            {
              value: `${services.length || 9}+`,
              label: "Photography Programs",
            },
            { value: "100%", label: "Hand-Edited High-Res Photos" },
            { value: "48 hrs", label: "Fast Sneak-Peek Delivery" },
            { value: "Direct", label: "Personal Phone Confirmation" },
          ].map((item) => (
            <div key={item.label} className="px-3 py-2.5 text-center sm:px-4">
              <p className="font-serif text-2xl font-semibold text-obsidian dark:text-amber-200 sm:text-3xl">
                {item.value}
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 sm:text-xs">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Curated Featured Services Editorial Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Signature Services
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-obsidian dark:text-white sm:text-4xl">
              Crafted for Every Milestone
            </h2>
            <p className="mt-2 max-w-xl text-sm text-stone-600 dark:text-stone-400">
              A curated preview of our signature photography programs—each
              showcasing real frames in motion.
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-obsidian px-6 py-3 text-xs font-semibold text-white transition-colors hover:bg-accent hover:text-obsidian dark:bg-accent dark:text-obsidian dark:hover:brightness-110"
          >
            View All {services.length > 0 ? `${services.length} ` : ""}Services
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {servicesError && (
          <div className="mt-8 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{servicesError}</span>
          </div>
        )}

        {loading ? (
          <div className="mt-10 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-96 animate-pulse rounded-3xl bg-stone-200/70 dark:bg-surface"
                />
              ))}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-80 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-surface"
                />
              ))}
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500 dark:border-white/10 dark:bg-surface dark:text-stone-400">
            Photography services will appear here once added from the studio
            dashboard.
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {/* Top 2 Signature Large Animated Cards */}
            <div className="grid gap-6 sm:gap-7 md:grid-cols-2">
              {primaryFeatured.map((service, idx) => {
                const photos = getServicePhotoList(service);
                const showPrice = service.showPrice !== false;
                return (
                  <article
                    key={service.id}
                    className="animate-fade-up group relative flex min-h-[410px] flex-col justify-end overflow-hidden rounded-3xl border border-stone-200/60 bg-obsidian shadow-xl transition-all duration-500 hover:-translate-y-1 hover:border-accent/40 dark:border-white/10 sm:min-h-[450px]"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div
                      onClick={() => openServiceGallery(service)}
                      className="absolute inset-0 cursor-pointer"
                    >
                      <AnimatedServiceSlider
                        images={photos}
                        alt={service.name}
                        intervalMs={4600}
                        staggerMs={idx * 1400}
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-obsidian via-obsidian/55 to-obsidian/15" />

                    {/* Top Badges */}
                    <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-2 sm:left-5 sm:right-5 sm:top-5">
                      <span className="rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-obsidian shadow-sm backdrop-blur-md dark:bg-obsidian/80 dark:text-amber-200 dark:ring-1 dark:ring-accent/40">
                        {showPrice
                          ? `From ${formatCurrency(service.price)}`
                          : "Custom Quote"}
                      </span>
                      <button
                        type="button"
                        onClick={() => openServiceGallery(service)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-obsidian/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-accent hover:text-obsidian"
                      >
                        <Images className="h-3.5 w-3.5" />
                        {photos.length}{" "}
                        {photos.length === 1 ? "Photo" : "Photos"}
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="relative z-20 p-5 pb-7 text-white sm:p-8">
                      {service.duration && (
                        <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-amber-200">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                          {service.duration}
                        </p>
                      )}
                      <h3 className="mt-1.5 font-serif text-2xl font-medium sm:text-3xl">
                        {service.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-200">
                        {service.description}
                      </p>

                      {service.includes.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-200">
                          {service.includes.slice(0, 2).map((item, i) => (
                            <li
                              key={i}
                              className="inline-flex items-center gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5 text-accent" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6">
                        <Link
                          to={`/book?service=${service.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-amber-500 px-5 py-2.5 text-xs font-semibold text-obsidian transition-all hover:brightness-110"
                        >
                          Book This Program
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openServiceGallery(service)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                        >
                          <Images className="h-3.5 w-3.5 text-amber-200" />
                          Preview Photos
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Secondary 4 Featured Services with Multi-Photo Animations */}
            {secondaryFeatured.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {secondaryFeatured.map((service, idx) => {
                  const photos = getServicePhotoList(service);
                  const showPrice = service.showPrice !== false;
                  return (
                    <article
                      key={service.id}
                      className="animate-fade-up group flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl dark:border-white/10 dark:bg-surface"
                      style={{ animationDelay: `${(idx + 2) * 80}ms` }}
                    >
                      <div
                        onClick={() => openServiceGallery(service)}
                        className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-obsidian"
                      >
                        <AnimatedServiceSlider
                          images={photos}
                          alt={service.name}
                          intervalMs={4000}
                          staggerMs={idx * 900}
                        />
                        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
                        <span className="absolute bottom-4 left-3 z-20 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-obsidian shadow-sm backdrop-blur-sm dark:bg-obsidian/85 dark:text-amber-200 dark:ring-1 dark:ring-accent/40">
                          {showPrice
                            ? formatCurrency(service.price)
                            : "Contact for Price"}
                        </span>
                        {photos.length > 1 && (
                          <span className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-obsidian/80 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                            <Images className="h-3 w-3 text-accent" />
                            {photos.length}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-serif text-lg font-medium text-obsidian dark:text-white">
                          {service.name}
                        </h3>
                        {service.duration && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                            <Clock className="h-3 w-3 text-accent" />
                            {service.duration}
                          </p>
                        )}
                        <p className="mt-2.5 line-clamp-2 flex-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                          {service.description}
                        </p>
                        <div className="mt-4 flex items-center gap-2 pt-2">
                          <Link
                            to={`/book?service=${service.id}`}
                            className="flex-1 rounded-full bg-obsidian px-3.5 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-accent hover:text-obsidian dark:bg-accent dark:text-obsidian dark:hover:brightness-110"
                          >
                            Book Now
                          </Link>
                          <button
                            type="button"
                            onClick={() => openServiceGallery(service)}
                            className="rounded-full border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-obsidian hover:text-obsidian dark:border-white/15 dark:text-stone-200 dark:hover:border-accent"
                            title="Preview photos"
                          >
                            Photos
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {services.length > 6 && (
              <div className="pt-2 text-center">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 rounded-full border border-obsidian bg-white px-6 py-3.5 text-sm font-semibold text-obsidian transition-all duration-300 hover:bg-obsidian hover:text-white dark:border-accent/50 dark:bg-surface dark:text-amber-200 dark:hover:bg-accent dark:hover:text-obsidian sm:px-7"
                >
                  <span>
                    Explore All {services.length} Photography Services &amp;
                    Packages
                  </span>
                  <ArrowRight className="h-4 w-4 text-accent" />
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Selected Portfolio Horizontal Showcase */}
      <PortfolioHorizontalShowcase projects={projects} />

      {/* Effortless 3-Step Experience */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Simple Booking Process
          </p>
          <h2 className="mt-2 font-serif text-3xl font-medium text-obsidian dark:text-white sm:text-4xl">
            From Inquiry to Timeless Memories
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:mt-12 sm:gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Choose Your Package",
              body: "Browse our photography programs and pick the coverage that matches your celebration.",
            },
            {
              step: "02",
              title: "Reserve Online in 60 Seconds",
              body: "Select your date in the Ethiopian Calendar, choose a time slot, and leave your phone number.",
            },
            {
              step: "03",
              title: "Direct Studio Confirmation",
              body: "Our photographer reviews availability and calls you personally to finalize every detail.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="h-full rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 dark:border-white/10 dark:bg-surface sm:p-7"
            >
              <span className="font-serif text-3xl font-semibold text-accent">
                {item.step}
              </span>
              <h3 className="mt-3 font-serif text-xl font-medium text-obsidian dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Short Photographer Intro */}
      <section className="border-t border-stone-200/80 bg-white py-16 dark:border-white/10 dark:bg-surface/60 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-stone-200 bg-obsidian shadow-lg dark:border-white/10">
              <img
                src={
                  business?.aboutImageUrl ||
                  "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=1200&q=80"
                }
                alt="Photographer at work"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                About {business?.businessName || "Anaf Picture"}
              </p>
              <h2 className="font-serif text-3xl font-medium text-obsidian dark:text-white sm:text-4xl">
                Calm direction, honest emotion, enduring frames.
              </h2>
              <p className="text-base leading-relaxed text-stone-600 dark:text-stone-300">
                {business?.aboutExperience || business?.description}
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-obsidian underline decoration-accent decoration-2 underline-offset-8 hover:text-accent dark:text-amber-200"
                >
                  Read our story
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Booking & Contact Strip */}
      <section className="border-t border-white/10 bg-obsidian py-14 text-white sm:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="font-serif text-2xl font-medium sm:text-3xl">
              Ready to reserve your date?
            </h2>
            <p className="mt-2 text-sm text-stone-300">
              Submit an online booking request in under two minutes or call the
              studio directly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
            {business?.phoneNumber && (
              <a
                href={formatPhoneHref(business.phoneNumber)}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-medium text-stone-100 transition-colors hover:border-accent hover:text-amber-200"
              >
                <Phone className="h-4 w-4 text-accent" />
                {business.phoneNumber}
              </a>
            )}
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-amber-500 px-6 py-3 text-sm font-semibold text-obsidian transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              Book a Session
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Service Completed Work Gallery Lightbox */}
      {activeServiceGallery && activeSlides[activeSlideIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/94 p-4 backdrop-blur-sm"
          onClick={closeServiceGallery}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-widest text-amber-300">
                  {activeServiceGallery.name}
                  {activeServiceGallery.showPrice !== false
                    ? ` · ${formatCurrency(activeServiceGallery.price)}`
                    : ""}
                </p>
                <h3 className="truncate font-serif text-base sm:text-xl">
                  {activeSlides[activeSlideIndex].caption}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <Link
                  to={`/book?service=${activeServiceGallery.id}`}
                  className="rounded-full bg-gradient-to-r from-accent to-amber-500 px-3.5 py-2 text-xs font-semibold text-obsidian transition-all hover:brightness-110 sm:px-4"
                >
                  Book
                </Link>
                <button
                  type="button"
                  onClick={closeServiceGallery}
                  className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                  aria-label="Close gallery"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-black/60">
              <img
                src={activeSlides[activeSlideIndex].url}
                alt={activeSlides[activeSlideIndex].caption}
                className="max-h-[65vh] w-auto object-contain sm:max-h-[68vh]"
              />
              {activeSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepSlide(-1)}
                    className="absolute left-2.5 rounded-full bg-black/65 p-2 text-white hover:bg-black/85 sm:left-3 sm:p-2.5"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSlide(1)}
                    className="absolute right-2.5 rounded-full bg-black/65 p-2 text-white hover:bg-black/85 sm:right-3 sm:p-2.5"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}
            </div>

            {activeSlides.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {activeSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity ${
                      idx === activeSlideIndex
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
