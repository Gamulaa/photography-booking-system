import {
  Camera,
  Clock,
  Lock,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useBusiness } from "../../context/BusinessContext";
import { formatPhoneHref } from "../../utils/formatters";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services & Packages", to: "/services" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Contact", to: "/contact" },
];

export function Footer() {
  const { business } = useBusiness();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const studioName = business?.businessName || "Anaf Picture";
  const logoSrc = business?.logoUrl?.trim() || "";
  const showLogo = Boolean(logoSrc) && failedSrc !== logoSrc;

  // Safely read optional studio contact fields regardless of schema extensions
  const info = business as
    | (NonNullable<typeof business> & {
        email?: string | null;
        address?: string | null;
        workingHours?: string | null;
      })
    | null;

  return (
    <footer className="border-t border-white/10 bg-obsidian text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-5">
            <Link to="/" className="group inline-flex items-center gap-3">
              {showLogo ? (
                <img
                  key={logoSrc}
                  src={logoSrc}
                  alt={studioName}
                  onError={() => setFailedSrc(logoSrc)}
                  className="h-11 w-11 shrink-0 rounded-full border border-accent/70 bg-obsidian object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/60 bg-accent/15 text-accent">
                  <Camera className="h-5 w-5" strokeWidth={1.75} />
                </div>
              )}
              <div className="leading-tight">
                <span className="block font-serif text-xl font-semibold tracking-wide text-white">
                  {studioName}
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.25em] text-amber-200/80">
                  Photography Studio
                </span>
              </div>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-stone-400">
              {business?.description ||
                "Capturing weddings, graduations, birthdays, family milestones, and corporate stories with timeless lighting and authentic emotion."}
            </p>

            <div className="pt-1">
              <Link
                to="/book"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-amber-500 px-5 py-2.5 text-xs font-semibold text-obsidian shadow-md shadow-accent/20 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Book a Session</span>
              </Link>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {QUICK_LINKS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-stone-400 transition-colors hover:text-amber-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Studio Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-stone-400">
              {business?.phoneNumber && (
                <li>
                  <a
                    href={formatPhoneHref(business.phoneNumber)}
                    className="inline-flex items-start gap-2.5 transition-colors hover:text-white"
                  >
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{business.phoneNumber}</span>
                  </a>
                </li>
              )}

              {info?.email && (
                <li>
                  <a
                    href={`mailto:${info.email}`}
                    className="inline-flex items-start gap-2.5 break-all transition-colors hover:text-white"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{info.email}</span>
                  </a>
                </li>
              )}

              {info?.address && (
                <li className="inline-flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{info.address}</span>
                </li>
              )}

              {info?.workingHours && (
                <li className="inline-flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{info.workingHours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Subtle Studio Portal Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-stone-500 sm:flex-row">
          <p>
            &copy; {currentYear} {studioName}. All rights reserved.
          </p>

          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-stone-500 transition-colors hover:text-amber-200"
            title="Admin login for studio staff"
          >
            <Lock className="h-3 w-3" />
            <span>Studio Portal</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
