import { ArrowRight, Camera, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useBusiness } from "../../context/BusinessContext";

export function AboutPage() {
  const { business } = useBusiness();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            About the Studio
          </p>
          <h1 className="font-serif text-4xl font-medium leading-tight text-stone-900 sm:text-5xl">
            {business?.businessName || "Our Photography Studio"}
          </h1>
          <p className="text-base leading-relaxed text-stone-600">
            {business?.description ||
              "We craft timeless, natural photographs for couples, families, graduates, and businesses."}
          </p>
          {business?.aboutExperience && (
            <p className="text-base leading-relaxed text-stone-600">
              {business.aboutExperience}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            >
              Book a Session
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-800 transition-colors hover:border-stone-900"
            >
              View Portfolio
            </Link>
          </div>
        </div>

        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-stone-200 shadow-sm">
          <img
            src={
              business?.aboutImageUrl ||
              "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=1200&q=80"
            }
            alt={business?.businessName || "Photographer portrait"}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Approach Pillars */}
      <div className="mt-24 border-t border-stone-200 pt-16">
        <h2 className="font-serif text-3xl font-medium text-stone-900">
          Our Photography Approach
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-7">
            <Camera className="h-6 w-6 text-accent" />
            <h3 className="mt-4 font-serif text-xl font-medium text-stone-900">
              Intentional Light &amp; Composition
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
              Every session is planned around flattering light and clean framing
              so your photos feel refined decades from now.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200/80 bg-white p-7">
            <Heart className="h-6 w-6 text-accent" />
            <h3 className="mt-4 font-serif text-xl font-medium text-stone-900">
              Relaxed Direction
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
              You never have to guess how to pose. Gentle guidance keeps the
              atmosphere easy so natural expressions shine through.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200/80 bg-white p-7">
            <Sparkles className="h-6 w-6 text-accent" />
            <h3 className="mt-4 font-serif text-xl font-medium text-stone-900">
              Careful Hand-Editing
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
              Every delivered photograph is individually color-graded for true
              skin tones and delivered in high resolution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
