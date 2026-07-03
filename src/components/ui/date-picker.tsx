"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  WEEKDAY_LABELS,
  getCalendarDays,
  isToday,
  parseDateInputValue,
  toDateInputValue,
} from "@/lib/date-filters";
import {
  dropdownClassName,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";

type DatePickerProps = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxDate?: string;
  minDate?: string;
  placeholder?: string;
  hideLabel?: boolean;
};

export function DatePicker({
  id,
  label,
  value,
  onChange,
  maxDate = toDateInputValue(new Date()),
  minDate,
  placeholder = "Select date",
  hideLabel = false,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const initialView = value ? parseDateInputValue(value) : new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  useEffect(() => {
    if (value) {
      const date = parseDateInputValue(value);
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" }
  );

  function isDisabledDay(dateStr: string) {
    if (maxDate && dateStr > maxDate) return true;
    if (minDate && dateStr < minDate) return true;
    return false;
  }

  function selectDay(date: Date) {
    const next = toDateInputValue(date);
    if (isDisabledDay(next)) return;
    onChange(next);
    setOpen(false);
  }

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
      return;
    }
    setViewMonth((m) => m - 1);
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
      return;
    }
    setViewMonth((m) => m + 1);
  }

  const displayValue = value
    ? parseDateInputValue(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : placeholder;

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={inputId}
        className={hideLabel ? "sr-only" : labelClassName}
      >
        {label}
      </label>
      <button
        id={inputId}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`${inputClassName} !mt-1 flex w-full items-center justify-between gap-2 text-left`}
      >
        <span className={value ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
          {displayValue}
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-[var(--muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${label} calendar`}
          className={`${dropdownClassName} left-0 right-0 p-3 sm:absolute sm:left-auto sm:right-auto sm:w-[min(100%,20rem)]`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goToPrevMonth}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--input-border)] text-[var(--foreground)] hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              ‹
            </button>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {monthLabel}
            </p>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--input-border)] text-[var(--foreground)] hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((day) => (
              <span
                key={day}
                className="py-1 text-[10px] font-semibold uppercase text-[var(--muted)]"
              >
                {day}
              </span>
            ))}
            {calendarDays.map(({ date, inCurrentMonth }) => {
              const dateStr = toDateInputValue(date);
              const selected = value === dateStr;
              const today = isToday(dateStr);
              const disabled = isDisabledDay(dateStr);

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(date)}
                  className={`flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors ${
                    selected
                      ? "bg-emerald-600 font-bold text-white dark:bg-emerald-500"
                      : today
                        ? "border border-emerald-300 font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                        : inCurrentMonth
                          ? "text-[var(--foreground)] hover:bg-gray-100 dark:hover:bg-gray-800"
                          : "text-[var(--muted)] opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  } disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--input-border)] pt-3">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const today = toDateInputValue(new Date());
                if (!isDisabledDay(today)) {
                  onChange(today);
                  setOpen(false);
                }
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DayNavigator({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const today = toDateInputValue(new Date());
  const dayValue = value || today;
  const atToday = isToday(dayValue) || dayValue >= today;

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => onChange(addDaysSafe(dayValue, -1))}
          aria-label="Previous day"
          className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--input-border)] bg-[var(--card)] text-lg font-bold text-[var(--foreground)] transition-all hover:bg-gray-50 active:scale-95 dark:hover:bg-gray-800"
        >
          ‹
        </button>

        <div className="min-w-0 flex-1">
          <DatePicker
            label="Selected day"
            hideLabel
            value={dayValue}
            onChange={onChange}
            maxDate={today}
          />
        </div>

        <button
          type="button"
          onClick={() => onChange(addDaysSafe(dayValue, 1))}
          disabled={atToday}
          aria-label="Next day"
          className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--input-border)] bg-[var(--card)] text-lg font-bold text-[var(--foreground)] transition-all hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
        >
          ›
        </button>
      </div>

      {!isToday(dayValue) && (
        <button
          type="button"
          onClick={() => onChange(today)}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Jump to today
        </button>
      )}
    </div>
  );
}

function addDaysSafe(value: string, delta: number) {
  const date = parseDateInputValue(value);
  date.setDate(date.getDate() + delta);
  const next = toDateInputValue(date);
  const today = toDateInputValue(new Date());
  return next > today ? today : next;
}
