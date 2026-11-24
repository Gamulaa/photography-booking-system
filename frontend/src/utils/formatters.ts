import { formatEthiopianDate } from "./ethiopianCalendar";

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
  return `${formatted} Birr`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "";
  return formatEthiopianDate(dateString);
}

export function formatGregorianShort(dateString?: string | null): string {
  if (!dateString) return "";
  const datePart = dateString.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getTodayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
