"use client";

import {
  type DatePreset,
  datePresetOptions,
  formatDateRangeLabel,
  toDateInputValue,
} from "@/lib/date-filters";
import { DatePicker, DayNavigator } from "@/components/ui/date-picker";
import { labelClassName } from "@/components/ui/form";

export type DateFilterState = {
  datePreset: DatePreset;
  selectedDay: string;
  customFrom: string;
  customTo: string;
};

export function createDefaultDateFilters(): DateFilterState {
  return {
    datePreset: "all",
    selectedDay: toDateInputValue(new Date()),
    customFrom: "",
    customTo: "",
  };
}

type DateRangeFiltersProps = {
  filters: DateFilterState;
  onChange: (filters: DateFilterState) => void;
  resultCount: number;
  totalCount: number;
  countLabel?: string;
};

export function DateRangeFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
  countLabel = "purchases",
}: DateRangeFiltersProps) {
  function update(partial: Partial<DateFilterState>) {
    onChange({ ...filters, ...partial });
  }

  function selectPreset(preset: DatePreset) {
    const today = toDateInputValue(new Date());
    update({
      datePreset: preset,
      selectedDay:
        preset === "day" ? filters.selectedDay || today : filters.selectedDay,
    });
  }

  const hasActiveFilters = filters.datePreset !== "all";

  return (
    <div className="space-y-5">
      <div>
        <span className={labelClassName}>Time period</span>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {datePresetOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectPreset(option.value)}
              className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                filters.datePreset === option.value
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "border-[var(--input-border)] bg-[var(--card)] text-[var(--foreground)] hover:border-emerald-300 dark:hover:border-emerald-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {formatDateRangeLabel(
            filters.datePreset,
            filters.selectedDay,
            filters.customFrom,
            filters.customTo
          )}
        </p>
      </div>

      {filters.datePreset === "day" && (
        <DayNavigator
          value={filters.selectedDay || toDateInputValue(new Date())}
          onChange={(selectedDay) => update({ selectedDay })}
        />
      )}

      {filters.datePreset === "custom" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker
            label="From"
            value={filters.customFrom}
            onChange={(customFrom) => update({ customFrom })}
            maxDate={filters.customTo || toDateInputValue(new Date())}
          />
          <DatePicker
            label="To"
            value={filters.customTo}
            onChange={(customTo) => update({ customTo })}
            maxDate={toDateInputValue(new Date())}
            minDate={filters.customFrom || undefined}
          />
        </div>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange(createDefaultDateFilters())}
          className="min-h-11 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Clear date filters
        </button>
      )}

      <p className="text-sm text-[var(--muted)]">
        Showing {resultCount} of {totalCount} {countLabel}
      </p>
    </div>
  );
}
