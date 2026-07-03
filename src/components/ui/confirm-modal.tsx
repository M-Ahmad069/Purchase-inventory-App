"use client";

import { useEffect } from "react";

import {
  buttonClassName,
  buttonSecondaryClassName,
} from "@/components/ui/form";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmClasses =
    variant === "danger"
      ? "min-h-12 flex-1 rounded-xl border border-red-200 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-600 dark:hover:bg-red-500"
      : `${buttonClassName} flex-1 !min-h-12`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={loading ? undefined : onCancel}
        disabled={loading}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        className="relative w-full max-w-md animate-slide-up rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-2xl sm:animate-fade-in"
      >
        <h2
          id="confirm-modal-title"
          className="text-lg font-bold text-[var(--foreground)]"
        >
          {title}
        </h2>
        <p
          id="confirm-modal-message"
          className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
        >
          {message}
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`${buttonSecondaryClassName} w-full sm:w-auto sm:min-w-[7rem]`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`${confirmClasses} w-full sm:w-auto sm:min-w-[7rem]`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Please wait…
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
