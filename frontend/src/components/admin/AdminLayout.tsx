import {
  Briefcase,
  Building2,
  CalendarCheck,
  Camera,
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";

const ADMIN_NAV = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Bookings", to: "/admin/bookings", icon: CalendarCheck, end: false },
  {
    label: "Services & Pricing",
    to: "/admin/services",
    icon: Briefcase,
    end: false,
  },
  { label: "Portfolio", to: "/admin/portfolio", icon: Images, end: false },
  {
    label: "Business Info",
    to: "/admin/business",
    icon: Building2,
    end: false,
  },
];

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const { business } = useBusiness();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-stone-950 text-stone-200">
      <div className="flex h-16 items-center justify-between border-b border-stone-800 px-5">
        <Link to="/admin" className="flex items-center gap-2.5 text-white">
          <Camera className="h-5 w-5 text-accent" />
          <span className="truncate font-serif text-base font-semibold">
            {business?.businessName || "Studio Admin"}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-md p-1 text-stone-400 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-stone-300 hover:bg-stone-800/80 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-stone-800 p-4 space-y-3">
        <div className="px-2">
          <p className="truncate text-xs font-semibold text-white">
            {admin?.name}
          </p>
          <p className="truncate text-xs text-stone-400">{admin?.email}</p>
        </div>

        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center gap-2.5 rounded-xl border border-stone-700 px-3.5 py-2 text-xs font-medium text-stone-200 transition-colors hover:border-stone-500 hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>View Public Website</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-950/60 hover:text-rose-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:fixed lg:inset-y-0 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="relative z-10 w-64 max-w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-stone-700 hover:bg-stone-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-serif text-base font-semibold text-stone-900">
            Studio Admin
          </span>
          <Link to="/" className="text-xs font-medium text-accent">
            Public Site
          </Link>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
