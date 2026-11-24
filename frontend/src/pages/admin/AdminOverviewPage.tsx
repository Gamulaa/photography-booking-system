import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Images,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, extractApiError } from "../../api/client";
import { StatusBadge } from "../../components/admin/StatusBadge";
import {
  ApiResponse,
  Booking,
  BookingStats,
  PortfolioProject,
  Service,
} from "../../types";
import { formatDate, formatPhoneHref } from "../../utils/formatters";

export function AdminOverviewPage() {
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [serviceCount, setServiceCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      try {
        const [bookingsRes, servicesRes, portfolioRes] = await Promise.all([
          apiClient.get<ApiResponse<Booking[]>>("/bookings"),
          apiClient.get<ApiResponse<Service[]>>("/services?all=true"),
          apiClient.get<ApiResponse<PortfolioProject[]>>("/portfolio"),
        ]);
        if (!active) return;

        if (bookingsRes.data.stats) {
          setStats(bookingsRes.data.stats);
        }
        setRecentBookings(bookingsRes.data.data.slice(0, 6));
        setServiceCount(servicesRes.data.data.length);
        setProjectCount(portfolioRes.data.data.length);
      } catch (err) {
        if (active)
          setError(extractApiError(err, "Failed to load dashboard overview."));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  const statCards = [
    {
      label: "Total Bookings",
      value: stats.total,
      icon: Calendar,
      accentClass: "bg-stone-100 text-stone-800",
    },
    {
      label: "Pending Bookings",
      value: stats.pending,
      icon: Clock,
      accentClass: "bg-amber-50 text-amber-700",
    },
    {
      label: "Confirmed Bookings",
      value: stats.confirmed,
      icon: CalendarCheck,
      accentClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Completed Bookings",
      value: stats.completed,
      icon: CheckCircle2,
      accentClass: "bg-sky-50 text-sky-700",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium text-stone-900 sm:text-3xl">
          Studio Overview
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Track booking requests and manage your photography business from one
          place.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 4 Required Statistic Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 sm:text-xs">
                  {card.label}
                </p>
                <span
                  className={`shrink-0 rounded-xl p-1.5 sm:p-2 ${card.accentClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 font-serif text-3xl font-semibold text-stone-900 sm:mt-4 sm:text-4xl">
                {loading ? "—" : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <Link
          to="/admin/services"
          className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-stone-400 sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="shrink-0 rounded-xl bg-stone-100 p-2.5 text-stone-800">
              <Briefcase className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">
                Services &amp; Pricing
              </p>
              <p className="truncate text-xs text-stone-500">
                {serviceCount} photography packages
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-stone-400" />
        </Link>

        <Link
          to="/admin/portfolio"
          className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-stone-400 sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="shrink-0 rounded-xl bg-stone-100 p-2.5 text-stone-800">
              <Images className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">
                Portfolio Projects
              </p>
              <p className="truncate text-xs text-stone-500">
                {projectCount} published galleries
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-stone-400" />
        </Link>

        <Link
          to="/admin/business"
          className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-stone-400 sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="shrink-0 rounded-xl bg-stone-100 p-2.5 text-stone-800">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-900">
                Brand &amp; Studio Info
              </p>
              <p className="truncate text-xs text-stone-500">
                Hero image, bio &amp; phone
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-stone-400" />
        </Link>
      </div>

      {/* Recent Booking Requests */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-stone-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2 className="font-serif text-lg font-medium text-stone-900 sm:text-xl">
            Recent Booking Requests
          </h2>
          <Link
            to="/admin/bookings"
            className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            Manage all bookings
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-center text-sm text-stone-500 sm:p-8">
            Loading bookings...
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="p-6 text-center text-sm text-stone-500 sm:p-8">
            No booking requests yet. Bookings submitted from the public website
            will appear here.
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="divide-y divide-stone-100 md:hidden">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="space-y-2.5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-stone-900">
                        {booking.customerName}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        {booking.service.name}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
                    <a
                      href={formatPhoneHref(booking.phoneNumber)}
                      className="inline-flex items-center gap-1.5 text-stone-700 hover:text-accent"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>{booking.phoneNumber}</span>
                    </a>
                    <span className="inline-flex items-center gap-1.5 text-stone-500">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatDate(booking.bookingDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-100 bg-stone-50/70 text-xs uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Service</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-stone-50/60">
                      <td className="px-6 py-3.5 font-medium text-stone-900">
                        {booking.customerName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <a
                          href={formatPhoneHref(booking.phoneNumber)}
                          className="inline-flex items-center gap-1.5 text-stone-700 hover:text-accent"
                        >
                          <Phone className="h-3.5 w-3.5 text-accent" />
                          {booking.phoneNumber}
                        </a>
                      </td>
                      <td className="px-6 py-3.5 text-stone-600">
                        {booking.service.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5 text-stone-600">
                        {formatDate(booking.bookingDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
