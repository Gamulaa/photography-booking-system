export interface EthiopianDate {
  year: number;
  month: number; // 1..13
  day: number; // 1..30 (or 1..5/6 for Pagume)
}

export const ETHIOPIAN_MONTHS = [
  "Fulbaana/Meskerem",
  "Onkoloolessa/Tikimt",
  "Sadaasa/Hidar",
  "Mudde/Tahsas",
  "Amajji/Tir",
  "Guraandhala/Yekatit",
  "Bitootessa/Megabit",
  "Ebla/Miyazya",
  "Caamsaa/Ginbot",
  "Waxabajji/Sene",
  "Adoolessa/Hamle",
  "Hagayya/Nehase",
  "Pagume",
] as const;

export const ETHIOPIAN_WEEKDAYS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const ETHIOPIAN_TIME_SLOTS = [
  "2:00 Morning (8:00 AM)",
  "3:30 Morning (9:30 AM)",
  "5:00 Morning (11:00 AM)",
  "6:00 Midday (12:00 PM)",
  "8:00 Afternoon (2:00 PM)",
  "9:30 Afternoon (3:30 PM)",
  "11:00 Golden Hour (5:00 PM)",
  "12:00 Evening (6:00 PM)",
] as const;

const ETHIOPIAN_EPOCH = 1723856;

export function isEthiopianLeapYear(ethYear: number): boolean {
  return ethYear % 4 === 3;
}

export function getDaysInEthiopianMonth(
  ethYear: number,
  ethMonth: number,
): number {
  if (ethMonth === 13) {
    return isEthiopianLeapYear(ethYear) ? 6 : 5;
  }
  return 30;
}

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const yy = year + 4800 - a;
  const mm = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

function jdnToGregorian(jdn: number): {
  year: number;
  month: number;
  day: number;
} {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

export function ethiopianToJdn(
  year: number,
  month: number,
  day: number,
): number {
  return (
    ETHIOPIAN_EPOCH +
    365 +
    365 * (year - 1) +
    Math.floor(year / 4) +
    30 * month +
    day -
    31
  );
}

export function jdnToEthiopian(jdn: number): EthiopianDate {
  const r = (jdn - ETHIOPIAN_EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor((jdn - ETHIOPIAN_EPOCH) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

export function gregorianStringToEthiopian(
  dateStr: string,
): EthiopianDate | null {
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d) return null;
  return jdnToEthiopian(gregorianToJdn(y, m, d));
}

export function ethiopianToGregorianString(eth: EthiopianDate): string {
  const g = jdnToGregorian(ethiopianToJdn(eth.year, eth.month, eth.day));
  const mm = String(g.month).padStart(2, "0");
  const dd = String(g.day).padStart(2, "0");
  return `${g.year}-${mm}-${dd}`;
}

export function getEthiopianWeekday(eth: EthiopianDate): number {
  const jdn = ethiopianToJdn(eth.year, eth.month, eth.day);
  // JDN 0 was Monday; (jdn + 1) % 7 yields 0=Sunday .. 6=Saturday
  return (jdn + 1) % 7;
}

export function formatEthiopianDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const eth = gregorianStringToEthiopian(dateStr);
  if (!eth) return dateStr;
  const monthName = ETHIOPIAN_MONTHS[eth.month - 1] || `Month ${eth.month}`;
  return `${monthName} ${eth.day}, ${eth.year} E.C.`;
}
