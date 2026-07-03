"use client";

import { inputClassName, labelClassName } from "@/components/ui/form";

type NumberInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  mode: "integer" | "decimal";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  step?: string;
  suffix?: string;
};

function sanitizeInteger(value: string) {
  return value.replace(/\D/g, "");
}

function sanitizeDecimal(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  mode,
  placeholder,
  required = false,
  disabled = false,
  min,
  step,
  suffix,
}: NumberInputProps) {
  function handleChange(raw: string) {
    if (disabled) return;
    onChange(mode === "integer" ? sanitizeInteger(raw) : sanitizeDecimal(raw));
  }

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type="text"
          inputMode={mode === "integer" ? "numeric" : "decimal"}
          pattern={mode === "integer" ? "[0-9]*" : undefined}
          autoComplete="off"
          required={required}
          disabled={disabled}
          min={min}
          step={step}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClassName} ${suffix ? "pr-14" : ""} tabular-nums disabled:cursor-not-allowed disabled:opacity-60`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--muted)]">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
