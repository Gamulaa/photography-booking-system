import {
  AlertCircle,
  Ban,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Eye,
  Phone,
  Plus,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiClient, extractApiError } from "../../api/client";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { EthiopianDatePicker } from "../../components/ui/EthiopianDatePicker";
import {
  ApiResponse,
  Booking,
  BookingStats,
  BookingStatus,
  Service,
} from "../../types";
import { ETHIOPIAN_TIME_SLOTS } from "../../utils/ethiopianCalendar";
import {
  formatCurrency,
  formatDate,
  formatGregorianShort,
  formatPhoneHref,
  getTodayInputValue,
} from "../../utils/formatters";

type StatusFilter = "ALL" | BookingStatus;

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CANCELLED", label: "Cancelled" },
];

interface ManualBookingForm {
  customerName: string;
  phoneNumber: string;
  serviceId: string;
  bookingDate: string;
  preferredTime: string;
  location: string;
  message: string;
  status: BookingStatus;
}

const EMPTY_BOOKING_FORM: ManualBookingForm = {
  customerName: "",
  phoneNumber: "",
  serviceId: "",
  bookingDate: "",
  preferredTime: "",
  location: "",
  message: "",
  status: "CONFIRMED",
};

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Manual booking modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ManualBookingForm>(EMPTY_BOOKING_FORM);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const todayMinDate = getTodayInputValue();

  const fetchBookings = useCallback(async (activeFilter: StatusFilter) => {
    setLoading(true);
    setError("");
    try {
      const query = activeFilter === "ALL" ? "" : `?status=${activeFilter}`;
      const response = await apiClient.get<ApiResponse<Booking[]>>(
        `/bookings${query}`,
      );
      setBookings(response.data.data);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (err) {
      setError(extractApiError(err, "Failed to load bookings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(filter);
  }, [filter, fetchBookings]);

  useEffect(() => {
    let active = true;
    async function loadServices() {
      try {
        const response =
          await apiClient.get<ApiResponse<Service[]>>("/services?all=true");
        if (active) setServices(response.data.data);
      } catch (err) {
        console.error("Failed to load services for booking form:", err);
      }
    }
    loadServices();
    return () => {
      active = false;
    };
  }, []);

  const getFilterCount = (key: StatusFilter): number => {
    switch (key) {
      case "ALL":
        return stats.total;
      case "PENDING":
        return stats.pending;
      case "CONFIRMED":
        return stats.confirmed;
      case "COMPLETED":
        return stats.completed;
      case "REJECTED":
        return stats.rejected;
      case "CANCELLED":
        return stats.cancelled;
    }
  };

  const openCreateModal = () => {
    setForm({
      ...EMPTY_BOOKING_FORM,
      bookingDate: todayMinDate,
    });
    setModalError("");
    setCreateOpen(true);
  };

  const handleCreateBooking = async (e: FormEvent) => {
    e.preventDefault();
    setModalError("");
    setNotice("");

    if (!form.customerName.trim() || form.customerName.trim().length < 2) {
      setModalError("Customer full name is required.");
      return;
    }
    if (!form.phoneNumber.trim() || form.phoneNumber.trim().length < 7) {
      setModalError("A valid customer phone number is required.");
      return;
    }
    if (!form.serviceId) {
      setModalError("Please select a photography service.");
      return;
    }
    if (!form.bookingDate) {
      setModalError("Please choose a booking date in the Ethiopian Calendar.");
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.post<ApiResponse<Booking>>(
        "/bookings/admin",
        {
          customerName: form.customerName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          serviceId: form.serviceId,
          bookingDate: form.bookingDate,
          preferredTime: form.preferredTime.trim() || undefined,
          location: form.location.trim() || undefined,
          message: form.message.trim() || undefined,
          status: form.status,
        },
      );

      setCreateOpen(false);
      setNotice(response.data.message || "Manual booking saved successfully.");
      await fetchBookings(filter);
    } catch (err) {
      setModalError(extractApiError(err, "Failed to save booking."));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    booking: Booking,
    status: BookingStatus,
  ) => {
    if (status === "REJECTED" || status === "CANCELLED") {
      const confirmed = window.confirm(
        `Mark booking for ${booking.customerName} as ${status.toLowerCase()}?`,
      );
      if (!confirmed) return;
    }

    setBusyId(booking.id);
    setError("");
    setNotice("");

    try {
      const response = await apiClient.patch<ApiResponse<Booking>>(
        `/bookings/${booking.id}/status`,
        { status },
      );
      setNotice(
        response.data.message || `Booking updated to ${status.toLowerCase()}.`,
      );
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking(response.data.data);
      }
      await fetchBookings(filter);
    } catch (err) {
      setError(extractApiError(err, "Failed to update booking status."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (booking: Booking) => {
    const confirmed = window.confirm(
      `Permanently delete the booking request from ${booking.customerName} (${formatDate(
        booking.bookingDate,
      )})? This cannot be undone.`,
    );
    if (!confirmed) return;

    setBusyId(booking.id);
    setError("");
    setNotice("");

    try {
      await apiClient.delete(`/bookings/${booking.id}`);
      setNotice("Booking deleted successfully.");
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking(null);
      }
      await fetchBookings(filter);
    } catch (err) {
      setError(extractApiError(err, "Failed to delete booking."));
    } finally {
      setBusyId(null);
    }
  };

  const allowPastDates = form.status === "COMPLETED";

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-medium text-obsidian sm:text-3xl">
            Booking Management
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Review online requests, record walk-in or phone bookings, and manage
            session statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-obsidian px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-obsidian sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Booking
        </button>
      </div>

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 sm:py-2 ${
                active
                  ? "bg-obsidian text-white"
                  : "border border-stone-200 bg-white text-stone-700 hover:border-stone-400"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] sm:px-2 ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {getFilterCount(tab.key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings List (Mobile Cards + Desktop Table) */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-stone-500 sm:p-10">
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500 sm:p-10">
            No bookings match this filter.
          </div>
        ) : (
          <>
            {/* Mobile & Small Tablet Cards */}
            <div className="divide-y divide-stone-100 lg:hidden">
              {bookings.map((booking) => {
                const isBusy = busyId === booking.id;
                return (
                  <div key={booking.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-obsidian">
                          {booking.customerName}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-600">
                          {booking.service.name} ·{" "}
                          <span className="font-medium text-stone-800">
                            {formatCurrency(booking.service.price)}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={booking.status} />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-600">
                      <a
                        href={formatPhoneHref(booking.phoneNumber)}
                        className="inline-flex items-center gap-1.5 font-medium text-stone-800 hover:text-accent"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0 text-accent" />
                        <span>{booking.phoneNumber}</span>
                      </a>

                      <div className="flex items-start gap-1.5 text-stone-600">
                        <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <div>
                          <span className="font-medium text-stone-800">
                            {formatDate(booking.bookingDate)}
                          </span>
                          <span className="block text-[11px] text-stone-400">
                            {formatGregorianShort(booking.bookingDate)}
                            {booking.preferredTime
                              ? ` · ${booking.preferredTime}`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(booking)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </button>

                      {booking.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleStatusChange(booking, "CONFIRMED")
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirm
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleStatusChange(booking, "REJECTED")
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </>
                      )}

                      {booking.status === "CONFIRMED" && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleStatusChange(booking, "COMPLETED")
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Complete
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleStatusChange(booking, "CANCELLED")
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(booking)}
                        className="ml-auto rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        title="Delete booking"
                        aria-label="Delete booking"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-5 py-3.5">Customer Name</th>
                    <th className="px-5 py-3.5">Phone Number</th>
                    <th className="px-5 py-3.5">Requested Service</th>
                    <th className="px-5 py-3.5">Booking Date (E.C.)</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bookings.map((booking) => {
                    const isBusy = busyId === booking.id;
                    return (
                      <tr key={booking.id} className="hover:bg-stone-50/70">
                        <td className="px-5 py-4 font-medium text-obsidian">
                          {booking.customerName}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <a
                            href={formatPhoneHref(booking.phoneNumber)}
                            className="inline-flex items-center gap-1.5 font-medium text-stone-800 hover:text-accent"
                            title="Call customer"
                          >
                            <Phone className="h-3.5 w-3.5 text-accent" />
                            {booking.phoneNumber}
                          </a>
                        </td>
                        <td className="px-5 py-4 text-stone-700">
                          <span className="block font-medium">
                            {booking.service.name}
                          </span>
                          <span className="text-xs text-stone-400">
                            {formatCurrency(booking.service.price)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-stone-700">
                          <span className="block font-medium">
                            {formatDate(booking.bookingDate)}
                          </span>
                          <span className="text-xs text-stone-400">
                            {formatGregorianShort(booking.bookingDate)}
                            {booking.preferredTime
                              ? ` · ${booking.preferredTime}`
                              : ""}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(booking)}
                              className="rounded-lg border border-stone-200 p-1.5 text-stone-600 hover:bg-stone-100 hover:text-obsidian"
                              title="View booking details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {booking.status === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleStatusChange(booking, "CONFIRMED")
                                  }
                                  className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 disabled:opacity-50"
                                  title="Confirm booking"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleStatusChange(booking, "REJECTED")
                                  }
                                  className="rounded-lg bg-rose-600 p-1.5 text-white hover:bg-rose-700 disabled:opacity-50"
                                  title="Reject booking"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {booking.status === "CONFIRMED" && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleStatusChange(booking, "COMPLETED")
                                  }
                                  className="rounded-lg bg-sky-600 p-1.5 text-white hover:bg-sky-700 disabled:opacity-50"
                                  title="Mark as completed"
                                >
                                  <CheckCheck className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleStatusChange(booking, "CANCELLED")
                                  }
                                  className="rounded-lg border border-stone-300 p-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-50"
                                  title="Cancel booking"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDelete(booking)}
                              className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                              title="Delete booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Manual Booking Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
              <div className="min-w-0">
                <h2 className="font-serif text-xl font-medium text-obsidian sm:text-2xl">
                  Add Manual Booking
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Record a phone call, WhatsApp, or walk-in studio reservation
                  directly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="shrink-0 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Customer Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerName: e.target.value }))
                    }
                    placeholder="e.g. Dawit Kebede"
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                    }
                    placeholder="+251 911 234 567"
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-800">
                  Photography Service <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={form.serviceId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, serviceId: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                >
                  <option value="">Select a photography package</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — {formatCurrency(service.price)}
                      {!service.isActive ? " (Inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Booking Date (Ethiopian Calendar){" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <div className="mt-1">
                    <EthiopianDatePicker
                      value={form.bookingDate}
                      onChange={(iso) =>
                        setForm((f) => ({ ...f, bookingDate: iso }))
                      }
                      minDate={allowPastDates ? undefined : todayMinDate}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Preferred Time (Ethiopian Time)
                  </label>
                  <select
                    value={form.preferredTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, preferredTime: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm focus:border-obsidian focus:outline-none"
                  >
                    <option value="">Flexible / Any time</option>
                    {ETHIOPIAN_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Initial Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status: e.target.value as BookingStatus,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-800">
                    Location{" "}
                    <span className="text-xs font-normal text-stone-400">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                    placeholder="Studio, church, hotel, or venue"
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-800">
                  Notes / Special Requests{" "}
                  <span className="text-xs font-normal text-stone-400">
                    (Optional)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder="Internal notes, deposit details, or client requests..."
                  className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-obsidian focus:outline-none"
                />
              </div>

              <div className="flex flex-col-reverse gap-2.5 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="w-full rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-obsidian px-6 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-obsidian disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Saving Booking..." : "Save Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Booking Details
                </p>
                <h2 className="mt-1 break-words font-serif text-xl font-medium text-obsidian sm:text-2xl">
                  {selectedBooking.customerName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="shrink-0 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="mt-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="shrink-0 text-stone-500">Status</dt>
                <dd>
                  <StatusBadge status={selectedBooking.status} />
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="shrink-0 text-stone-500">Phone Number</dt>
                <dd>
                  <a
                    href={formatPhoneHref(selectedBooking.phoneNumber)}
                    className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {selectedBooking.phoneNumber}
                  </a>
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <dt className="shrink-0 text-stone-500">Photography Service</dt>
                <dd className="font-medium text-obsidian sm:text-right">
                  {selectedBooking.service.name} (
                  {formatCurrency(selectedBooking.service.price)})
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <dt className="shrink-0 text-stone-500">Preferred Date</dt>
                <dd className="font-medium text-obsidian sm:text-right">
                  <span>{formatDate(selectedBooking.bookingDate)}</span>
                  <span className="block text-xs font-normal text-stone-400">
                    {formatGregorianShort(selectedBooking.bookingDate)}
                    {selectedBooking.preferredTime
                      ? ` · ${selectedBooking.preferredTime}`
                      : ""}
                  </span>
                </dd>
              </div>
              {selectedBooking.location && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <dt className="shrink-0 text-stone-500">Location</dt>
                  <dd className="break-words text-stone-800 sm:text-right">
                    {selectedBooking.location}
                  </dd>
                </div>
              )}
              {selectedBooking.message && (
                <div className="rounded-xl bg-stone-50 p-3.5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Notes / Special Request
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-700">
                    {selectedBooking.message}
                  </dd>
                </div>
              )}
            </dl>

            {/* Quick Action Bar */}
            <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-100 pt-5">
              {selectedBooking.status !== "CONFIRMED" && (
                <button
                  type="button"
                  disabled={busyId === selectedBooking.id}
                  onClick={() =>
                    handleStatusChange(selectedBooking, "CONFIRMED")
                  }
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Confirm
                </button>
              )}
              {selectedBooking.status !== "COMPLETED" && (
                <button
                  type="button"
                  disabled={busyId === selectedBooking.id}
                  onClick={() =>
                    handleStatusChange(selectedBooking, "COMPLETED")
                  }
                  className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  Mark Completed
                </button>
              )}
              {selectedBooking.status !== "REJECTED" && (
                <button
                  type="button"
                  disabled={busyId === selectedBooking.id}
                  onClick={() =>
                    handleStatusChange(selectedBooking, "REJECTED")
                  }
                  className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Reject
                </button>
              )}
              {selectedBooking.status !== "CANCELLED" && (
                <button
                  type="button"
                  disabled={busyId === selectedBooking.id}
                  onClick={() =>
                    handleStatusChange(selectedBooking, "CANCELLED")
                  }
                  className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                disabled={busyId === selectedBooking.id}
                onClick={() => handleDelete(selectedBooking)}
                className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 sm:ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
