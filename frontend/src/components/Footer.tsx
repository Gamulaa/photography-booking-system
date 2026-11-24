import { Camera, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useBusiness } from "../../src/context/BusinessContext";
import { formatPhoneHref } from "../../src/utils/formatters";

export function Footer() {
  const { business } = useBusiness();
  const studioName = business?.businessName || "Photography Studio";
  const socialEntries = Object.entries(business?.socialLinks || {}).filter(
    ([, url]) => Boolean(url && url.trim()),
  );

  return (
    <footer className="border-t border-stone-200 bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Studio Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5 text-white">
              <Camera className="h-5 w-5 text-accent" strokeWidth={1.75} />
              <span className="font-serif text-xl font-semibold">
                {studioName}
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-stone-400">
              {business?.description ||
                "Capturing authentic moments, timeless portraits, and stories worth keeping."}
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  to="/services"
                  className="transition-colors hover:text-white"
                >
                  Services &amp; Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/portfolio"
                  className="transition-colors hover:text-white"
                >
                  Portfolio Gallery
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="transition-colors hover:text-white"
                >
                  About the Studio
                </Link>
              </li>
              <li>
                <Link to="/book" className="transition-colors hover:text-white">
                  Book a Session
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="transition-colors hover:text-white"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              {business?.phoneNumber && (
                <li>
                  <a
                    href={formatPhoneHref(business.phoneNumber)}
                    className="inline-flex items-center gap-2.5 text-stone-200 transition-colors hover:text-white"
                  >
                    <Phone className="h-4 w-4 text-accent" />
                    <span>{business.phoneNumber}</span>
                  </a>
                </li>
              )}
              {business?.email && (
                <li>
                  <a
                    href={`mailto:${business.email}`}
                    className="inline-flex items-center gap-2.5 text-stone-300 transition-colors hover:text-white"
                  >
                    <Mail className="h-4 w-4 text-accent" />
                    <span>{business.email}</span>
                  </a>
                </li>
              )}
              {business?.location && (
                <li className="inline-flex items-start gap-2.5 text-stone-400">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{business.location}</span>
                </li>
              )}
            </ul>

            {socialEntries.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-stone-700 px-3 py-1 text-xs capitalize text-stone-300 transition-colors hover:border-white hover:text-white"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-stone-800 pt-8 text-xs text-stone-500 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {studioName}. All rights reserved.
          </p>
          <Link
            to="/admin/login"
            className="transition-colors hover:text-stone-300"
          >
            Studio Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
