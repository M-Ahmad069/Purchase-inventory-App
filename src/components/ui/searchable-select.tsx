"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  dropdownClassName,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";

export type SearchableSelectOption = {
  id: string;
  label: string;
};

type SearchableSelectProps = {
  id?: string;
  label: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onCreate?: (name: string) => void | Promise<void>;
  createLabel?: (query: string) => string;
};

export function SearchableSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Search…",
  required = false,
  disabled = false,
  onCreate,
  createLabel = (query) => `Add "${query}"`,
}: SearchableSelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setExpanded(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label);
    } else if (!open) {
      setQuery("");
    }
  }, [selectedOption, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setExpanded(false);
        if (selectedOption) {
          setQuery(selectedOption.label);
        } else {
          setQuery("");
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  function handleSelect(option: SearchableSelectOption) {
    onChange(option.id);
    setQuery(option.label);
    setOpen(false);
    setExpanded(false);
  }

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some(
    (option) => option.label.toLowerCase() === trimmedQuery.toLowerCase()
  );
  const canCreate = Boolean(onCreate) && trimmedQuery.length > 0 && !hasExactMatch;

  async function handleCreate() {
    if (!onCreate) return;
    await onCreate(trimmedQuery);
    setOpen(false);
    setExpanded(false);
  }

  function handleInputChange(nextQuery: string) {
    setQuery(nextQuery);
    setOpen(true);
    setExpanded(true);
    if (selectedOption && nextQuery !== selectedOption.label) {
      onChange("");
    }
  }

  function toggleExpanded() {
    if (disabled) return;
    setOpen((current) => !current);
    setExpanded((current) => !current);
  }

  const listMaxHeight = expanded ? "max-h-60 sm:max-h-72" : "max-h-40 sm:max-h-48";

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={inputId} className={`${labelClassName} flex-1`}>
          {label}
        </label>
        {options.length > 0 && !disabled && (
          <button
            type="button"
            onClick={toggleExpanded}
            disabled={disabled}
            className="mb-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {open ? "Hide list" : `Show all (${options.length})`}
          </button>
        )}
      </div>

      <div className="relative mt-1">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          required={required && !value}
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            if (options.length > 0) setExpanded(true);
          }}
          className={`${inputClassName} !mt-0 pr-10 disabled:cursor-not-allowed disabled:opacity-60`}
        />
        {!disabled && (
        <button
          type="button"
          tabIndex={-1}
          onClick={toggleExpanded}
          aria-label={open ? "Collapse list" : "Expand list"}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 transition-transform hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 ${open ? "rotate-180" : ""}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        )}
      </div>

      {open && !disabled && (
        <div className={dropdownClassName}>
          <div className={`scrollbar-thin overflow-y-auto overscroll-contain ${listMaxHeight}`}>
            <ul id={listboxId} role="listbox">
              {filteredOptions.length === 0 && !canCreate ? (
                <li className="px-4 py-3 text-sm text-[var(--muted)]">
                  No matches found
                </li>
              ) : (
                filteredOptions.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={option.id === value}
                      onClick={() => handleSelect(option)}
                      className={`block w-full min-h-12 px-4 py-3 text-left text-sm transition-colors ${
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
          </div>
          {canCreate && (
            <div className="border-t border-[var(--input-border)]">
              <button
                type="button"
                onClick={handleCreate}
                className="block w-full min-h-12 px-4 py-3 text-left text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
              >
                {createLabel(trimmedQuery)}
              </button>
            </div>
          )}
          {filteredOptions.length > 5 && (
            <p className="border-t border-[var(--input-border)] px-3 py-1.5 text-center text-[10px] text-[var(--muted)]">
              Scroll for more items
            </p>
          )}
        </div>
      )}
    </div>
  );
}
