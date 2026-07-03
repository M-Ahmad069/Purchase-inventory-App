"use client";

import { useEffect, useRef, useState } from "react";

import { inputClassName, labelClassName } from "@/components/ui/form";
import type { Vendor } from "@/types/database";

type VendorFieldProps = {
  vendors: Vendor[];
  value: string;
  onChange: (vendorId: string) => void;
  onCreate: (name: string) => Promise<void>;
  required?: boolean;
  disabled?: boolean;
};

export function VendorField({
  vendors,
  value,
  onChange,
  onCreate,
  required = false,
  disabled = false,
}: VendorFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const selectedVendor = vendors.find((vendor) => vendor.id === value) ?? null;

  useEffect(() => {
    if (selectedVendor) {
      setName(selectedVendor.name);
    }
  }, [selectedVendor]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) setShowSuggestions(false);
  }, [disabled]);

  const isBusy = disabled || adding;
  const trimmedName = name.trim();
  const matchingVendor =
    trimmedName.length > 0
      ? vendors.find(
          (vendor) => vendor.name.toLowerCase() === trimmedName.toLowerCase()
        )
      : null;

  const filteredVendors =
    trimmedName.length > 0
      ? vendors.filter((vendor) =>
          vendor.name.toLowerCase().includes(trimmedName.toLowerCase())
        )
      : vendors;

  async function handleAddVendor() {
    if (!trimmedName || isBusy) return;

    setError(null);

    if (matchingVendor) {
      onChange(matchingVendor.id);
      setName(matchingVendor.name);
      setShowSuggestions(false);
      return;
    }

    setAdding(true);
    try {
      await onCreate(trimmedName);
      setShowSuggestions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add vendor.");
    } finally {
      setAdding(false);
    }
  }

  function handleSelectExisting(vendor: Vendor) {
    onChange(vendor.id);
    setName(vendor.name);
    setError(null);
    setShowSuggestions(false);
  }

  function handleNameChange(nextName: string) {
    if (disabled) return;
    setName(nextName);
    setError(null);
    setShowSuggestions(true);
    if (selectedVendor && nextName !== selectedVendor.name) {
      onChange("");
    }
  }

  const showAddButton = trimmedName.length > 0 && !value && !matchingVendor;
  const listMaxHeight = expanded ? "max-h-56" : "max-h-36";

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor="vendor-name" className={labelClassName}>
          Vendor
        </label>
        {vendors.length > 0 && !disabled && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setShowSuggestions((current) => !current);
              setExpanded((current) => !current);
            }}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {showSuggestions ? "Hide list" : `Browse (${vendors.length})`}
          </button>
        )}
      </div>

      <input
        id="vendor-name"
        type="text"
        autoComplete="off"
        required={required && !value}
        disabled={disabled}
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        onFocus={() => {
          if (!disabled) setShowSuggestions(true);
        }}
        placeholder="Type vendor name"
        className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-60`}
      />

      {showSuggestions && !disabled && filteredVendors.length > 0 && !value && (
        <div className="overflow-hidden rounded-xl border border-[var(--input-border)] bg-[var(--card)] shadow-lg">
          <ul
            className={`scrollbar-thin overflow-y-auto overscroll-contain ${listMaxHeight}`}
          >
            {filteredVendors.map((vendor) => (
              <li key={vendor.id}>
                <button
                  type="button"
                  onClick={() => handleSelectExisting(vendor)}
                  className="block w-full min-h-12 px-4 py-3 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/80"
                >
                  {vendor.name}
                </button>
              </li>
            ))}
          </ul>
          {filteredVendors.length > 4 && (
            <p className="border-t border-[var(--input-border)] px-3 py-1.5 text-center text-[10px] text-[var(--muted)]">
              Scroll for more vendors
            </p>
          )}
        </div>
      )}

      {selectedVendor && (
        <p className="animate-fade-in flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white dark:bg-emerald-500">
            ✓
          </span>
          {selectedVendor.name}
        </p>
      )}

      {showAddButton && !disabled && (
        <button
          type="button"
          onClick={handleAddVendor}
          disabled={isBusy}
          className="min-h-12 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-all hover:bg-emerald-100 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
        >
          {adding ? "Adding…" : `Add vendor "${trimmedName}"`}
        </button>
      )}

      {matchingVendor && !value && !disabled && (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => handleSelectExisting(matchingVendor)}
          className="min-h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800/80"
        >
          Use existing: {matchingVendor.name}
        </button>
      )}

      {vendors.length > 0 && !value && !showSuggestions && !disabled && (
        <div>
          <p className="text-xs font-medium text-[var(--muted)]">Quick pick</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {vendors.slice(0, 8).map((vendor) => (
              <button
                key={vendor.id}
                type="button"
                disabled={isBusy}
                onClick={() => handleSelectExisting(vendor)}
                className="min-h-10 rounded-xl border border-[var(--input-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
              >
                {vendor.name}
              </button>
            ))}
            {vendors.length > 8 && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => {
                  setShowSuggestions(true);
                  setExpanded(true);
                }}
                className="min-h-10 rounded-xl border border-dashed border-[var(--input-border)] px-3 py-2 text-sm text-[var(--muted)] disabled:opacity-50"
              >
                +{vendors.length - 8} more
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
