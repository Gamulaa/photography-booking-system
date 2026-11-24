import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_WEEKDAYS_SHORT,
  ethiopianToGregorianString,
  formatEthiopianDate,
  getDaysInEthiopianMonth,
  getEthiopianWeekday,
  gregorianStringToEthiopian,
} from "../../utils/ethiopianCalendar";
import {
  formatGregorianShort,
  getTodayInputValue,
} from "../../utils/formatters";

interface EthiopianDatePickerProps {
  value: string; // YYYY-MM-DD (Gregorian ISO)
  onChange: (gregorianIso: string) => void;
  minDate?: string; // YYYY-MM-DD (Gregorian ISO)
  placeholder?: string;
}

export function EthiopianDatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Select date (Ethiopian Calendar)",
}: EthiopianDatePickerProps) {
  const todayIso = getTodayInputValue();
  const initialEth = useMemo(
    () =>
      gregorianStringToEthiopian(value || todayIso) || {
        year: 2019,
        month: 1,
        day: 1,
      },
    [value, todayIso],
  );

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialEth.year);
  const [viewMonth, setViewMonth] = useState(initialEth.month);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (value) {
      const parsed = gregorianStringToEthiopian(value);
      if (parsed) {
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
      }
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const daysInMonth = getDaysInEthiopianMonth(viewYear, viewMonth);
  const firstWeekday = getEthiopianWeekday({
    year: viewYear,
    month: viewMonth,
    day: 1,
  });

  const stepMonth = (delta: -1 | 1) => {
    let nextMonth = viewMonth + delta;
    let nextYear = viewYear;
    if (nextMonth > 13) {
      nextMonth = 1;
      nextYear += 1;
    } else if (nextMonth < 1) {
      nextMonth = 13;
      nextYear -= 1;
    }
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  };

  const handleSelectDay = (day: number) => {
    const iso = ethiopianToGregorianString({
      year: viewYear,
      month: viewMonth,
      day,
    });
    if (minDate && iso < minDate) return;
    onChange(iso);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-0.5 rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3 text-left text-sm text-stone-900 transition-colors hover:border-stone-500 focus:border-obsidian focus:outline-none focus:ring-1 focus:ring-obsidian"
      >
        <Calendar className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-accent" />
        <span
          className={value ? "font-medium text-stone-900" : "text-stone-400"}
        >
          {value ? formatEthiopianDate(value) : placeholder}
        </span>
        {value && (
          <span className="ml-2 shrink-0 text-[11px] text-stone-400">
            {formatGregorianShort(value)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 w-full max-w-[320px] rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xl sm:right-auto sm:w-80 sm:p-4">
          {/* Month / Year Navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => stepMonth(-1)}
              className="rounded-lg p-1.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-obsidian"
              aria-label="Previous Ethiopian month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-900 focus:border-accent focus:outline-none"
              >
                {ETHIOPIAN_MONTHS.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {idx + 1}. {name}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-900 focus:border-accent focus:outline-none"
              >
                {Array.from(
                  { length: 6 },
                  (_, i) => initialEth.year - 1 + i,
                ).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} E.C.
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => stepMonth(1)}
              className="rounded-lg p-1.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-obsidian"
              aria-label="Next Ethiopian month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-stone-400">
            {ETHIOPIAN_WEEKDAYS_SHORT.map((wd) => (
              <div key={wd} className="py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const iso = ethiopianToGregorianString({
                year: viewYear,
                month: viewMonth,
                day,
              });
              const isDisabled = Boolean(minDate && iso < minDate);
              const isSelected = value === iso;
              const isToday = iso === todayIso;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-accent font-semibold text-white shadow-sm"
                      : isDisabled
                        ? "cursor-not-allowed text-stone-300"
                        : isToday
                          ? "border border-accent text-obsidian font-semibold hover:bg-amber-50"
                          : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
            <span>Ethiopian Calendar (13 months)</span>
            <button
              type="button"
              onClick={() => {
                const todayEth = gregorianStringToEthiopian(todayIso);
                if (todayEth) {
                  setViewYear(todayEth.year);
                  setViewMonth(todayEth.month);
                }
              }}
              className="font-semibold text-accent hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
