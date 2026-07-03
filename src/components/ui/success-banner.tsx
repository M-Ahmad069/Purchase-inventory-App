"use client";

type SuccessBannerProps = {
  message: string;
  visible: boolean;
};

export function SuccessBanner({ message, visible }: SuccessBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      className="animate-success-in flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white animate-check-pop dark:bg-emerald-500">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <div>
        <p className="font-semibold text-emerald-900 dark:text-emerald-200">{message}</p>
        <p className="text-sm text-emerald-700 dark:text-emerald-400">Ready for the next entry</p>
      </div>
    </div>
  );
}
