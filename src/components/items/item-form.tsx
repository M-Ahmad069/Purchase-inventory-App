"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FormMessage,
  buttonClassName,
  cardClassName,
  fieldsetClassName,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";
import { NumberInput } from "@/components/ui/number-input";
import { SuccessBanner } from "@/components/ui/success-banner";
import { createClient } from "@/lib/supabase/client";
import { formatAppError } from "@/lib/errors";
import { getMeasurementShortLabel, isMaanWeight } from "@/lib/format";
import type { Item, MeasurementType } from "@/types/database";
import { MAAN_KG } from "@/types/database";

type ItemFormProps = {
  items: Item[];
};

type WeightUnit = "kg" | "maan";

const MEASUREMENT_OPTIONS: {
  value: MeasurementType;
  label: string;
}[] = [
  { value: "weight", label: "Weight" },
  { value: "piece", label: "Pieces" },
  { value: "carton", label: "Carton" },
];

export function ItemForm({ items }: ItemFormProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [measurementType, setMeasurementType] =
    useState<MeasurementType>("weight");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [piecesPerCarton, setPiecesPerCarton] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), 3000);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

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

  const trimmedName = name.trim();

  const matchingItems = useMemo(() => {
    const query = trimmedName.toLowerCase();
    if (!query) return [];
    return items
      .filter((item) => item.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [items, trimmedName]);

  const exactMatch = useMemo(
    () =>
      items.find(
        (item) => item.name.toLowerCase() === trimmedName.toLowerCase()
      ) ?? null,
    [items, trimmedName]
  );

  function handleSelectSuggestion(item: Item) {
    setName(item.name);
    setMeasurementType(item.measurement_type);
    setWeightUnit(isMaanWeight(item.kg_per_unit) ? "maan" : "kg");
    setPiecesPerCarton(
      item.pieces_per_carton != null ? String(item.pieces_per_carton) : ""
    );
    setShowSuggestions(false);
    setError(null);
  }

  function handleMeasurementChange(next: MeasurementType) {
    setMeasurementType(next);
    if (next !== "carton") setPiecesPerCarton("");
    if (next !== "weight") setWeightUnit("kg");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setShowSuccess(false);

    if (exactMatch) {
      setError(`"${exactMatch.name}" already exists.`);
      setShowSuggestions(false);
      return;
    }

    let packSize: number | null = null;
    if (measurementType === "carton") {
      packSize = Number(piecesPerCarton);
      if (!Number.isInteger(packSize) || packSize <= 0) {
        setError("Enter pieces per carton (e.g. 24).");
        return;
      }
    }

    const kgPerUnit =
      measurementType === "weight" && weightUnit === "maan" ? MAAN_KG : null;

    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("items").insert({
      name: trimmedName,
      measurement_type: measurementType,
      pieces_per_carton: packSize,
      kg_per_unit: kgPerUnit,
      notes: notes.trim() || null,
    });

    if (insertError) {
      setError(formatAppError(insertError, "Could not add item. Please try again."));
      setLoading(false);
      return;
    }

    setName("");
    setMeasurementType("weight");
    setWeightUnit("kg");
    setPiecesPerCarton("");
    setNotes("");
    setShowSuggestions(false);
    setShowSuccess(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <SuccessBanner message="Item added successfully" visible={showSuccess} />
      <section className={cardClassName}>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Add item
        </h2>
        <form onSubmit={handleSubmit} className="mt-4">
          <fieldset disabled={loading} className={`${fieldsetClassName} space-y-4`}>
          <div ref={containerRef} className="relative">
            <label htmlFor="item-name" className={labelClassName}>
              Item name
            </label>
            <input
              id="item-name"
              required
              autoComplete="off"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (trimmedName) setShowSuggestions(true);
              }}
              className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-60`}
              placeholder="e.g. Rice, Shampoo, Imli"
            />

            {showSuggestions && matchingItems.length > 0 && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-[var(--input-border)] bg-[var(--card)] shadow-xl dark:shadow-black/40">
                <p className="border-b border-[var(--card-border)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                  Similar items
                </p>
                <ul className="scrollbar-thin max-h-48 overflow-y-auto overscroll-contain">
                  {matchingItems.map((item) => {
                    const isExact =
                      item.name.toLowerCase() === trimmedName.toLowerCase();
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/80"
                        >
                          <span className="truncate font-medium">{item.name}</span>
                          <span className="shrink-0 text-xs text-[var(--muted)]">
                            {isExact
                              ? "Already added"
                              : item.measurement_type === "carton" &&
                                  item.pieces_per_carton
                                ? `${item.pieces_per_carton}/ctn`
                                : getMeasurementShortLabel(
                                    item.measurement_type,
                                    item.kg_per_unit
                                  )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <div>
            <span className={labelClassName}>Measured by</span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {MEASUREMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleMeasurementChange(option.value)}
                  className={`min-h-12 rounded-xl border px-2 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                    measurementType === option.value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "border-[var(--input-border)] bg-[var(--card)] text-[var(--muted)] hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {measurementType === "weight" && (
            <div>
              <span className={labelClassName}>Weight unit</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "kg" as const, label: "Per kg" },
                    { value: "maan" as const, label: `Per maan (${MAAN_KG} kg)` },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setWeightUnit(option.value)}
                    className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      weightUnit === option.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "border-[var(--input-border)] bg-[var(--card)] text-[var(--muted)] hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {measurementType === "carton" && (
            <NumberInput
              id="item-pieces-per-carton"
              label="Pieces per carton"
              mode="integer"
              required
              value={piecesPerCarton}
              onChange={setPiecesPerCarton}
              placeholder="e.g. 24"
              disabled={loading}
            />
          )}

          <div>
            <label htmlFor="item-notes" className={labelClassName}>
              Notes{" "}
              <span className="font-normal text-[var(--muted)]">(optional)</span>
            </label>
            <textarea
              id="item-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>
          <FormMessage error={error} />
          <button type="submit" disabled={loading} className={`${buttonClassName} w-full`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </span>
            ) : exactMatch ? (
              "Already exists"
            ) : (
              "Add Item"
            )}
          </button>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
