"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  dropdownClassName,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";

export type FilterSelectOption = {
  id: string;
  label: string;
};

type FilterSelectProps = {
  id?: string;
  label: string;
  options: FilterSelectOption[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
  placeholder?: string;
};

export function FilterSelect({
  id,
  label,
  options,
  value,
  onChange,
  allLabel = "All items",
  placeholder = "Search items…",
}: FilterSelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((option) => option.id === value) ?? null;
  }, [value, options]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const allOption = { id: "", label: allLabel };
    if (!normalized) return [allOption, ...options];
    const matches = options.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
    if (allLabel.toLowerCase().includes(normalized)) {
      return [allOption, ...matches];
    }
    return matches;
  }, [options, query, allLabel]);

  useEffect(() => {
    if (open) return;
    // When closed: show selected item name, or leave blank for "All items"
    setQuery(selectedOption?.label ?? "");
  }, [selectedOption, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery(selectedOption?.label ?? "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  function handleSelect(option: FilterSelectOption) {
    onChange(option.id);
    setQuery(option.id ? option.label : "");
    setOpen(false);
  }

  function handleFocus() {
    setOpen(true);
    // Clear so user can type immediately (don't keep "All items" or full name stuck)
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className={labelClassName}>
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          autoComplete="off"
          value={query}
          placeholder={open ? placeholder : (selectedOption?.label ?? allLabel)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) {
              onChange("");
            }
          }}
          onFocus={handleFocus}
          className={`${inputClassName} !mt-0 pr-10`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (open) {
              setOpen(false);
              setQuery(selectedOption?.label ?? "");
            } else {
              handleFocus();
            }
          }}
          aria-label={open ? "Close list" : "Open list"}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--muted)] transition-transform hover:bg-gray-100 dark:hover:bg-gray-800 ${open ? "rotate-180" : ""}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {open && (
        <div className={dropdownClassName}>
          <ul
            id={listboxId}
            role="listbox"
            className="scrollbar-thin max-h-52 overflow-y-auto overscroll-contain sm:max-h-60"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[var(--muted)]">
                No items found
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.id || "__all__"}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.id === value}
                    onClick={() => handleSelect(option)}
                    className={`block w-full min-h-11 px-4 py-2.5 text-left text-sm transition-colors ${
                      option.id === value
                        ? "bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                        : "text-[var(--foreground)] hover:bg-gray-50 dark:hover:bg-gray-800/80"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
          {filteredOptions.length > 6 && (
            <p className="border-t border-[var(--input-border)] px-3 py-1.5 text-center text-[10px] text-[var(--muted)]">
              Scroll for more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
