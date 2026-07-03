type FormMessageProps = {
  error?: string | null;
  success?: string | null;
};

export function FormMessage({ error, success }: FormMessageProps) {
  if (!error && !success) return null;

  return (
    <p
      className={`animate-fade-in rounded-lg px-3 py-2 text-sm ${
        error
          ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          : "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300"
      }`}
      role={error ? "alert" : "status"}
    >
      {error ?? success}
    </p>
  );
}

export const inputClassName =
  "mt-1 block w-full min-h-12 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-base text-[var(--foreground)] shadow-sm transition-all placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:placeholder:text-gray-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20 [color-scheme:light] dark:[color-scheme:dark]";

export const labelClassName =
  "block text-sm font-semibold text-gray-700 dark:text-gray-200";

export const buttonClassName =
  "min-h-12 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[var(--background)] active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-emerald-500 dark:hover:bg-emerald-400";

export const buttonSecondaryClassName =
  "min-h-12 rounded-xl border border-[var(--input-border)] bg-[var(--card)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:hover:bg-gray-800/80 dark:focus:ring-gray-700";

export const fieldsetClassName = "space-y-4 border-0 p-0 m-0 min-w-0 disabled:opacity-60";

export const cardClassName =
  "rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 sm:p-5 shadow-sm";

export const pageTitleClassName =
  "text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl";

export const pageSubtitleClassName = "mt-1 text-sm text-[var(--muted)]";

export const dropdownClassName =
  "absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[var(--input-border)] bg-[var(--card)] shadow-xl dark:shadow-black/40";

export const dropdownScrollClassName =
  "scrollbar-thin max-h-48 overflow-y-auto overscroll-contain sm:max-h-60";
