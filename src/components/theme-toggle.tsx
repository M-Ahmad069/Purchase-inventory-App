"use client";

import { buttonSecondaryClassName } from "@/components/ui/form";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ disabled = false }: { disabled?: boolean }) {
  const { theme, ready, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!ready || disabled}
      aria-label={
        !ready
          ? "Loading theme"
          : theme === "light"
            ? "Switch to dark mode"
            : "Switch to light mode"
      }
      className={`${buttonSecondaryClassName} !min-h-10 !min-w-10 !px-3 !py-2`}
    >
      {!ready ? (
        <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
      ) : theme === "light" ? (
        <span className="flex items-center gap-1.5 text-sm">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <span className="hidden sm:inline">Dark</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-sm">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span className="hidden sm:inline">Light</span>
        </span>
      )}
    </button>
  );
}
