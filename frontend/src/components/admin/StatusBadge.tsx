import { BookingStatus } from "../../types";

const STATUS_STYLES: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  },
  CONFIRMED: {
    label: "Confirmed",
    className:
      "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-600/20",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-600/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-500/20",
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
