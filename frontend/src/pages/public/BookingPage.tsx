import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Phone,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiClient, extractApiError } from "../../api/client";
import { EthiopianDatePicker } from "../../components/ui/EthiopianDatePicker";
import { ApiResponse, Booking, Service } from "../../types";
import { ETHIOPIAN_TIME_SLOTS } from "../../utils/ethiopianCalendar";
import {
  formatCurrency,
  formatDate,
  formatGregorianShort,
  getTodayInputValue,
} from "../../utils/formatters";

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get("service") || "";

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [serviceId, setServiceId] = useState(preselectedServiceId);
  const [bookingDate, setBookingDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState("");

  const todayMinDate = getTodayInputValue();

  useEffect(() => {
    let active = true;
    async function loadActiveServices() {
      try {
        const response =
          await apiClient.get<ApiResponse<Service[]>>("/services");
        if (!active) return;
        const activeList = response.data.data;
        setServices(activeList);

        if (
          preselectedServiceId &&
          activeList.some((s) => s.id === preselectedServiceId)
        ) {
          setServiceId(preselectedServiceId);
        }
      } catch (err) {
        if (active)
          setError(extractApiError(err, "Unable to load available services."));
      } finally {
        if (active) setLoadingServices(false);
      }
    }
    loadActiveServices();
    return () => {
      active = false;
    };
  }, [preselectedServiceId]);

  const selectedService = services.find((s) => s.id === serviceId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName.trim() || customerName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 7) {
      setError(
        "A valid phone number is mandatory so we can confirm your booking.",
      );
      return;
    }
    if (!serviceId) {
      setError("Please select a photography service.");
      return;
    }
    if (!bookingDate) {
      setError(
        "Please select your preferred booking date in the Ethiopian Calendar.",
      );
      return;
    }
    if (bookingDate < todayMinDate) {
      setError("Booking date cannot be in the past.");
      return;
    }
    if (!preferredTime) {
      setError("Please select a preferred Ethiopian local time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post<ApiResponse<Booking>>("/bookings", {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        serviceId,
        bookingDate,
        preferredTime,
        location: location.trim() || undefined,
        message: message.trim() || undefined,
      });

      setSubmittedBooking(response.data.data);
      setSuccessMessage(
        response.data.message ||
          "Your booking request has been submitted and is currently pending studio confirmation.",
      );
    } catch (err) {
      setError(extractApiError(err, "Failed to submit your booking request."));
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedBooking) {
    const matchedService = services.find(
      (s) => s.id === submittedBooking.serviceId,
    );
    const shouldShowPrice = matchedService ? matchedService.showPrice : true;

    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-serif text-3xl font-medium text-obsidian">
            Booking Request Received
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {successMessage}
          </p>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900">
            <strong>Status: Pending Review.</strong> Submitting this request
            does not automatically guarantee confirmation. We will contact you
            at{" "}
            <span className="font-semibold">
              {submittedBooking.phoneNumber}
            </span>{" "}
            to confirm availability.
          </div>

          <dl className="mt-6 divide-y divide-stone-100 border-y border-stone-100 text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-stone-500">Name</dt>
              <dd className="font-medium text-obsidian">
                {submittedBooking.customerName}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-stone-500">Phone Number</dt>
              <dd className="font-medium text-obsidian">
                {submittedBooking.phoneNumber}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-stone-500">Selected Service</dt>
              <dd className="font-medium text-obsidian">
                {submittedBooking.service.name}
                {shouldShowPrice
                  ? ` (${formatCurrency(submittedBooking.service.price)})`
                  : " (Custom Quote)"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-stone-500">Preferred Date</dt>
              <dd className="text-right font-medium text-obsidian">
                <span>{formatDate(submittedBooking.bookingDate)}</span>
                <span className="block text-xs font-normal text-stone-400">
                  {formatGregorianShort(submittedBooking.bookingDate)}
                  {submittedBooking.preferredTime
                    ? ` · ${submittedBooking.preferredTime}`
                    : ""}
                </span>
              </dd>
            </div>
            {submittedBooking.location && (
              <div className="flex justify-between py-3">
                <dt className="text-stone-500">Location</dt>
                <dd className="font-medium text-obsidian">
                  {submittedBooking.location}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-full bg-obsidian px-6 py-2.5 text-sm font-medium text-white hover:bg-accent hover:text-obsidian"
            >
              Return Home
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedBooking(null);
                setCustomerName("");
                setPhoneNumber("");
                setBookingDate("");
                setPreferredTime("");
                setLocation("");
                setMessage("");
              }}
              className="rounded-full border border-stone-300 px-6 py-2.5 text-sm font-medium text-stone-700 hover:border-obsidian"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Online Reservation
        </p>
        <h1 className="mt-2 font-serif text-4xl font-medium text-obsidian sm:text-5xl">
          Book a Photography Session
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone-600">
          No account required. Select your photography package, pick your date
          in the Ethiopian Calendar, and leave your phone number below.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* Booking Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2"
        >
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="customerName"
                className="block text-sm font-medium text-stone-800"
              >
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                id="customerName"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Abebe Bikila"
                className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-obsidian focus:outline-none focus:ring-1 focus:ring-obsidian"
              />
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-stone-800"
              >
                Phone Number <span className="text-red-600">*</span>
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input
                  id="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+251 911 234 567"
                  className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-sm text-stone-900 focus:border-obsidian focus:outline-none focus:ring-1 focus:ring-obsidian"
                />
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Required so the photographer can call to confirm your session.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="serviceId"
              className="block text-sm font-medium text-stone-800"
            >
              Photography Service <span className="text-red-600">*</span>
            </label>
            <select
              id="serviceId"
              required
              disabled={loadingServices}
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:border-obsidian focus:outline-none focus:ring-1 focus:ring-obsidian disabled:bg-stone-100"
            >
              <option value="">
                {loadingServices
                  ? "Loading services..."
                  : "Select a photography package"}
              </option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                  {service.showPrice
                    ? ` — ${formatCurrency(service.price)}`
                    : " — Custom Quote"}
                  {service.duration ? ` (${service.duration})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-800">
                Preferred Date (Ethiopian Calendar){" "}
                <span className="text-red-600">*</span>
              </label>
              <div className="mt-1.5">
                <EthiopianDatePicker
                  value={bookingDate}
                  onChange={setBookingDate}
                  minDate={todayMinDate}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="preferredTime"
                className="block text-sm font-medium text-stone-800"
              >
                Preferred Time (Ethiopian Time){" "}
                <span className="text-red-600">*</span>
              </label>
              <div className="relative mt-1.5">
                <Clock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-accent" />
                <select
                  id="preferredTime"
                  required
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 focus:border-obsidian focus:outline-none focus:ring-1 focus:ring-obsidian"
                >
                  <option value="">Select Ethiopian local time</option>
                  {ETHIOPIAN_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-stone-800"
            >
              Session Location{" "}
              <span className="text-xs font-normal text-stone-400">
                (Optional)
              </span>
            </label>
            <div className="relative mt-1.5">
              <MapPin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Studio, church, hotel, park, or city"
                className="w-full rounded-xl border border-stone-300 py-2.5 pl-10 pr-4 text-sm text-stone-900 focus:border-obsidian focus:outline-none focus:ring-1 focus:ring-obsidian"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-stone-800"
            >
              Additional Message / Special Requests{" "}
              <span className="text-xs font-normal text-stone-400">
                (Optional)
              </span>
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your event, number of guests, or styling vision..."
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-obsidian focus:outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-stone-50 p-4 text-xs leading-relaxed text-stone-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>
              All new bookings start with a <strong>Pending</strong> status.
              Submitting this form does not automatically guarantee
              confirmation—our photographer will review availability and contact
              you by phone.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || loadingServices}
            className="w-full rounded-full bg-obsidian px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-obsidian disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Submitting Booking Request..."
              : "Submit Booking Request"}
          </button>
        </form>

        {/* Summary Sidebar */}
        <aside className="space-y-6">
          {selectedService ? (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="aspect-[16/10] overflow-hidden bg-stone-100">
                <img
                  src={selectedService.imageUrl}
                  alt={selectedService.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Selected Package
                </p>
                <h2 className="mt-1 font-serif text-xl font-medium text-obsidian">
                  {selectedService.name}
                </h2>
                <p className="mt-2 font-serif text-2xl font-semibold text-obsidian">
                  {selectedService.showPrice
                    ? formatCurrency(selectedService.price)
                    : "Contact for Pricing"}
                </p>
                {selectedService.duration && (
                  <p className="mt-1 text-xs text-stone-500">
                    {selectedService.duration}
                  </p>
                )}
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  {selectedService.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
              Select a photography service to preview its package details here.
            </div>
          )}

          <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
            <h3 className="font-serif text-lg font-medium text-obsidian">
              How Booking Works
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed">
              <li>
                Pick your date in the Ethiopian Calendar and choose an Ethiopian
                local time slot.
              </li>
              <li>
                Your request is recorded with a <strong>Pending</strong> status.
              </li>
              <li>
                Our studio reviews schedule availability and contacts you
                directly by phone to confirm.
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
