import {
  Calendar,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useBusiness } from "../../context/BusinessContext";
import { formatPhoneHref } from "../../utils/formatters";

export function ContactPage() {
  const { business } = useBusiness();
  const socialEntries = Object.entries(business?.socialLinks || {}).filter(
    ([, url]) => Boolean(url && url.trim()),
  );

  const locationQuery = business?.location || "Addis Ababa, Ethiopia";
  const mapEmbedSrc =
    business?.mapEmbedUrl ||
    `https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Get in Touch
        </p>
        <h1 className="mt-2 font-serif text-3xl font-medium text-obsidian sm:text-5xl">
          Contact {business?.businessName || "Anaf Picture"}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
          Have questions about packages, custom quotes, or availability? Call us
          directly, visit our studio, or request a date online.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:mt-12 sm:gap-8 md:grid-cols-2">
        {/* Direct Phone Card */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-accent">
            <Phone className="h-5 w-5" />
          </div>
          <h2 className="mt-5 font-serif text-2xl font-medium text-obsidian">
            Direct Phone
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Tap below to call the studio directly for urgent dates, custom
            packages, or inquiries.
          </p>
          {business?.phoneNumber ? (
            <a
              href={formatPhoneHref(business.phoneNumber)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-obsidian px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-obsidian"
            >
              <Phone className="h-4 w-4" />
              {business.phoneNumber}
            </a>
          ) : (
            <p className="mt-4 text-sm text-stone-400">
              Phone number coming soon.
            </p>
          )}
        </div>

        {/* Studio Details Card */}
        <div className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          {business?.email && (
            <div className="flex items-start gap-3.5">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Email
                </p>
                <a
                  href={`mailto:${business.email}`}
                  className="mt-0.5 block break-all text-base font-medium text-obsidian hover:text-accent"
                >
                  {business.email}
                </a>
              </div>
            </div>
          )}

          {business?.location && (
            <div className="flex items-start gap-3.5">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Studio Location
                </p>
                <p className="mt-0.5 text-base text-stone-800">
                  {business.location}
                </p>
              </div>
            </div>
          )}

          {socialEntries.length > 0 && (
            <div className="border-t border-stone-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Social Media
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-1.5 text-sm capitalize text-stone-700 transition-colors hover:border-obsidian hover:text-obsidian"
                  >
                    {platform}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Studio Location Map */}
      <div className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm sm:mt-10">
        <div className="flex flex-col justify-between gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-accent">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-medium text-obsidian">
                Find Our Studio
              </h2>
              <p className="text-xs text-stone-500">{locationQuery}</p>
            </div>
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-800 transition-colors hover:border-obsidian hover:bg-stone-50"
          >
            <Navigation className="h-3.5 w-3.5 text-accent" />
            Open in Google Maps
          </a>
        </div>
        <div className="h-[280px] w-full bg-stone-100 sm:h-[380px]">
          <iframe
            title="Anaf Picture Studio Map"
            src={mapEmbedSrc}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>

      {/* Booking CTA */}
      <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-3xl bg-obsidian p-6 text-white sm:mt-12 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 className="font-serif text-2xl font-medium">
            Prefer to book online?
          </h2>
          <p className="mt-1 text-sm text-stone-300">
            Choose your date in the Ethiopian Calendar, select your package, and
            leave your phone number.
          </p>
        </div>
        <Link
          to="/book"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-accent to-amber-500 px-6 py-3 text-sm font-semibold text-obsidian transition-all hover:brightness-110"
        >
          <Calendar className="h-4 w-4" />
          Request a Booking
        </Link>
      </div>
    </div>
  );
}
