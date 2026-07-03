"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FormMessage,
  buttonClassName,
  cardClassName,
  fieldsetClassName,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";
import { SuccessBanner } from "@/components/ui/success-banner";
import { createClient } from "@/lib/supabase/client";
import type { MeasurementType } from "@/types/database";

export function ItemForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [measurementType, setMeasurementType] =
    useState<MeasurementType>("weight");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), 3000);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setShowSuccess(false);
    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("items").insert({
      name: name.trim(),
      measurement_type: measurementType,
      notes: notes.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setName("");
    setMeasurementType("weight");
    setNotes("");
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
          <div>
            <label htmlFor="item-name" className={labelClassName}>
              Item name
            </label>
            <input
              id="item-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-60`}
              placeholder="e.g. Rice, Shampoo, Imli"
            />
          </div>
          <div>
            <span className={labelClassName}>Measured by</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  { value: "weight" as const, label: "Weight (kg)" },
                  { value: "piece" as const, label: "Pieces" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMeasurementType(option.value)}
                  className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
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
