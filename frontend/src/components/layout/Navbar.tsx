import { Camera, Menu, Moon, Phone, Sparkles, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useBusiness } from "../../context/BusinessContext";
import { useTheme } from "../../context/ThemeContext";
import { formatPhoneHref } from "../../utils/formatters";

const NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Contact", to: "/contact" },
];

export function Navbar() {
  const { business } = useBusiness();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const isHome = pathname === "/";
  const isOverHero = isHome && !scrolled;
  const studioName = business?.businessName || "Anaf Picture";
  const logoSrc = business?.logoUrl?.trim() || "";
  const showLogo = Boolean(logoSrc) && failedSrc !== logoSrc;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerClasses = isHome
    ? scrolled
      ? "fixed inset-x-0 top-0 z-40 border-b border-stone-200/80 bg-white/95 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-obsidian/92 dark:shadow-xl"
      : "fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-gradient-to-b from-obsidian/80 to-transparent backdrop-blur-[2px] transition-all duration-300"
    : "sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-obsidian/95 dark:shadow-lg";

  return (
    <header className={headerClasses}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Brand Logo & Wordmark */}
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-95 sm:gap-3"
        >
          {showLogo ? (
            <img
              key={logoSrc}
              src={logoSrc}
              alt={studioName}
              onError={() => setFailedSrc(logoSrc)}
              className="h-10 w-10 shrink-0 rounded-full border border-accent/70 bg-obsidian object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/60 bg-accent/15 text-accent sm:h-11 sm:w-11">
              <Camera className="h-5 w-5" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0 leading-tight">
            <span
              className={`block truncate font-serif text-base font-semibold tracking-wide sm:text-xl ${
                isOverHero ? "text-white" : "text-obsidian dark:text-white"
              }`}
            >
              {studioName}
            </span>
            <span
              className={`block truncate text-[9px] font-medium uppercase tracking-[0.22em] sm:text-[10px] sm:tracking-[0.25em] ${
                isOverHero
                  ? "text-amber-200/85"
                  : "text-accent-dark dark:text-amber-200/80"
              }`}
            >
              Photography Studio
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `relative py-1 text-sm font-medium tracking-wide transition-colors ${
                  isActive
                    ? isOverHero
                      ? "text-amber-200 after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-accent"
                      : "text-obsidian after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-accent dark:text-amber-200"
                    : isOverHero
                      ? "text-stone-200 hover:text-white"
                      : "text-stone-600 hover:text-obsidian dark:text-stone-200 dark:hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {business?.phoneNumber && (
            <a
              href={formatPhoneHref(business.phoneNumber)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                isOverHero
                  ? "text-stone-200 hover:text-amber-200"
                  : "text-stone-600 hover:text-obsidian dark:text-stone-300 dark:hover:text-amber-200"
              }`}
            >
              <Phone className="h-3.5 w-3.5 text-accent" />
              <span>{business.phoneNumber}</span>
            </a>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              isOverHero
                ? "border-white/20 bg-white/10 text-amber-200 hover:border-accent hover:bg-white/15"
                : "border-stone-200 bg-stone-100 text-obsidian hover:border-accent dark:border-white/15 dark:bg-white/5 dark:text-amber-200"
            }`}
            title={
              theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-amber-500 px-5 py-2.5 text-sm font-semibold text-obsidian shadow-md shadow-accent/20 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Book a Session</span>
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
              isOverHero
                ? "border-white/20 text-amber-200 hover:bg-white/10"
                : "border-stone-200 text-obsidian hover:bg-stone-100 dark:border-white/15 dark:text-amber-200 dark:hover:bg-white/10"
            }`}
            aria-label="Toggle color theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`inline-flex items-center justify-center rounded-lg border p-2 ${
              isOverHero
                ? "border-white/20 text-white hover:bg-white/10"
                : "border-stone-200 text-obsidian hover:bg-stone-100 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-stone-200 bg-white/98 px-4 pb-6 pt-3 backdrop-blur-xl dark:border-white/10 dark:bg-obsidian/98 md:hidden">
          <nav className="flex flex-col space-y-1.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-accent/15 font-semibold text-obsidian dark:bg-accent/20 dark:text-amber-200"
                      : "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/5 dark:hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="space-y-2.5 pt-3">
              {business?.phoneNumber && (
                <a
                  href={formatPhoneHref(business.phoneNumber)}
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-obsidian transition-colors hover:bg-stone-100 dark:border-white/20 dark:text-amber-200 dark:hover:bg-white/10"
                >
                  <Phone className="h-4 w-4 text-accent" />
                  <span>Call {business.phoneNumber}</span>
                </a>
              )}
              <Link
                to="/book"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-amber-500 px-5 py-3 text-center text-sm font-semibold text-obsidian"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Book a Session</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
