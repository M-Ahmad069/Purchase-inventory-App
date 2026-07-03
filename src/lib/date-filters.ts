export type DatePreset =
  | "all"
  | "day"
  | "week"
  | "month"
  | "last_month"
  | "custom";

export type DateRange = {
  from: Date | null;
  to: Date | null;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: string, delta: number) {
  const date = parseDateInputValue(value);
  date.setDate(date.getDate() + delta);
  return toDateInputValue(date);
}

export function isToday(value: string) {
  return value === toDateInputValue(new Date());
}

export function isFutureDay(value: string) {
  const date = parseDateInputValue(value);
  const today = startOfDay(new Date());
  return date > today;
}

export function getDateRange(
  preset: DatePreset,
  selectedDay?: string,
  customFrom?: string,
  customTo?: string
): DateRange {
  const now = new Date();

  if (preset === "day") {
    const dayValue = selectedDay || toDateInputValue(now);
    const day = parseDateInputValue(dayValue);
    return { from: startOfDay(day), to: endOfDay(day) };
  }

  if (preset === "week") {
    const from = new Date(now);
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    from.setDate(now.getDate() - diffToMonday);
    return { from: startOfDay(from), to: endOfDay(now) };
  }

  if (preset === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: startOfDay(from), to: endOfDay(now) };
  }

  if (preset === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  if (preset === "custom" && customFrom && customTo) {
    const from = parseDateInputValue(customFrom);
    const to = parseDateInputValue(customTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return { from: null, to: null };
    }
    return { from: startOfDay(from), to: endOfDay(to) };
  }

  return { from: null, to: null };
}

export function isDateInRange(isoDate: string, range: DateRange): boolean {
  if (!range.from && !range.to) return true;
  const date = new Date(isoDate);
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

export function formatDisplayDate(value: string) {
  return parseDateInputValue(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRangeLabel(
  preset: DatePreset,
  selectedDay?: string,
  customFrom?: string,
  customTo?: string
): string {
  const range = getDateRange(preset, selectedDay, customFrom, customTo);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  switch (preset) {
    case "all":
      return "All time";
    case "day":
      return selectedDay
        ? formatDisplayDate(selectedDay)
        : formatDisplayDate(toDateInputValue(new Date()));
    case "week":
      return range.from
        ? `This week · ${fmt(range.from)} – ${fmt(range.to!)}`
        : "This week";
    case "month":
      return range.from
        ? `This month · ${fmt(range.from)} – ${fmt(range.to!)}`
        : "This month";
    case "last_month":
      return range.from && range.to
        ? `Last month · ${fmt(range.from)} – ${fmt(range.to)}`
        : "Last month";
    case "custom":
      if (customFrom && customTo) {
        return `${fmt(parseDateInputValue(customFrom))} – ${fmt(parseDateInputValue(customTo))}`;
      }
      return "Pick a date range";
    default:
      return "All time";
  }
}

export const datePresetOptions: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "day", label: "By day" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom", label: "Custom" },
];

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: {
    date: Date;
    inCurrentMonth: boolean;
  }[] = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      inCurrentMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - startOffset - daysInMonth + 1;
    cells.push({
      date: new Date(year, month + 1, nextDay),
      inCurrentMonth: false,
    });
  }

  return cells;
}
