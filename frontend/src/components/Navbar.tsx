import { Camera, Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useBusiness } from "../../src/context/BusinessContext";
import { formatPhoneHref } from "../../src/utils/formatters";

const NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Contact", to: "/contact" },
];

export function Navbar() {
  const { business } = useBusiness();
  const [mobileOpen, setMobileOpen] = useState(false);

  const studioName = business?.businessName || "Photography Studio";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-canvas/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-stone-900 transition-opacity hover:opacity-80"
        >
          <Camera className="h-5 w-5 text-accent" strokeWidth={1.75} />
          <span className="font-serif text-lg font-semibold tracking-tight sm:text-xl">
            {studioName}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium tracking-wide transition-colors ${
                  isActive
                    ? "text-stone-950 underline decoration-accent decoration-2 underline-offset-8"
                    : "text-stone-600 hover:text-stone-950"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 md:flex">
          {business?.phoneNumber && (
            <a
              href={formatPhoneHref(business.phoneNumber)}
              className="inline-flex items-center gap-1.5 text-sm text-stone-600 transition-colors hover:text-stone-950"
            >
              <Phone className="h-3.5 w-3.5 text-accent" />
              <span>{business.phoneNumber}</span>
            </a>
          )}
          <Link
            to="/book"
            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            Book a Session
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-md p-2 text-stone-700 hover:bg-stone-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-stone-200 bg-canvas px-4 pb-6 pt-3 md:hidden">
          <nav className="flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-stone-900 text-white"
                      : "text-stone-700 hover:bg-stone-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3">
              <Link
                to="/book"
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-full bg-accent px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-stone-900"
              >
                Book a Session
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
