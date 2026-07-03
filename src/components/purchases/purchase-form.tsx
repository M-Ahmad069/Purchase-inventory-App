"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FormMessage,
  cardClassName,
  fieldsetClassName,
  inputClassName,
  labelClassName,
} from "@/components/ui/form";
import { NumberInput } from "@/components/ui/number-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SuccessBanner } from "@/components/ui/success-banner";
import { VendorField } from "@/components/purchases/vendor-field";
import {
  formatTotalAmount,
  getPriceUnitLabel,
  toDatetimeLocalValue,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Item, Vendor } from "@/types/database";

type PurchaseFormProps = {
  vendors: Vendor[];
  items: Item[];
};

function resetFormState() {
  return {
    itemId: "",
    vendorId: "",
    purchasedAt: toDatetimeLocalValue(),
    quantityKg: "",
    quantityPieces: "",
    costPrice: "",
    retailPrice: "",
    notes: "",
  };
}

export function PurchaseForm({ vendors, items }: PurchaseFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(resetFormState);
  const [vendorList, setVendorList] = useState<Vendor[]>(vendors);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    itemId,
    vendorId,
    purchasedAt,
    quantityKg,
    quantityPieces,
    costPrice,
    retailPrice,
    notes,
  } = formState;

  const selectedItem = useMemo(
    () => items.find((item) => item.id === itemId) ?? null,
    [items, itemId]
  );

  const measurementType = selectedItem?.measurement_type ?? null;
  const unitLabel = measurementType ? getPriceUnitLabel(measurementType) : "";

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), 3500);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  const liveTotal = useMemo(() => {
    const cost = Number(costPrice);
    if (Number.isNaN(cost) || cost < 0) return null;

    if (measurementType === "weight") {
      const kg = Number(quantityKg);
      if (Number.isNaN(kg) || kg <= 0) return null;
      return kg * cost;
    }

    if (measurementType === "piece") {
      const pieces = Number(quantityPieces);
      if (Number.isNaN(pieces) || pieces <= 0) return null;
      return pieces * cost;
    }

    return null;
  }, [costPrice, measurementType, quantityKg, quantityPieces]);

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        label: `${item.name} (${item.measurement_type === "weight" ? "kg" : "pcs"})`,
      })),
    [items]
  );

  function handleItemChange(nextItemId: string) {
    setFormState((current) => ({
      ...current,
      itemId: nextItemId,
      quantityKg: "",
      quantityPieces: "",
    }));
  }

  async function handleCreateVendor(name: string) {
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("vendors")
      .insert({ name: name.trim() })
      .select()
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Could not add vendor.");
      throw new Error(insertError?.message ?? "Could not add vendor.");
    }

    setVendorList((current) =>
      [...current, data].sort((a, b) => a.name.localeCompare(b.name))
    );
    setFormState((current) => ({ ...current, vendorId: data.id }));
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setShowSuccess(false);

    if (!itemId || !vendorId || !measurementType) {
      setError("Select an item and vendor.");
      return;
    }

    const cost = Number(costPrice);
    const retail = Number(retailPrice);

    if (Number.isNaN(cost) || cost < 0 || Number.isNaN(retail) || retail < 0) {
      setError("Enter valid prices.");
      return;
    }

    let insertData: {
      vendor_id: string;
      item_id: string;
      purchased_at: string;
      cost_price: number;
      retail_price: number;
      notes: string | null;
      quantity_kg?: number;
      quantity_pieces?: number;
    };

    if (measurementType === "weight") {
      const kg = Number(quantityKg);
      if (Number.isNaN(kg) || kg <= 0) {
        setError("Enter a valid total weight in kg.");
        return;
      }
      insertData = {
        vendor_id: vendorId,
        item_id: itemId,
        purchased_at: new Date(purchasedAt).toISOString(),
        quantity_kg: kg,
        cost_price: cost,
        retail_price: retail,
        notes: notes.trim() || null,
      };
    } else {
      const pieces = Number(quantityPieces);
      if (!Number.isInteger(pieces) || pieces <= 0) {
        setError("Enter a valid total piece count.");
        return;
      }
      insertData = {
        vendor_id: vendorId,
        item_id: itemId,
        purchased_at: new Date(purchasedAt).toISOString(),
        quantity_pieces: pieces,
        cost_price: cost,
        retail_price: retail,
        notes: notes.trim() || null,
      };
    }

    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("purchases")
      .insert(insertData);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setFormState(resetFormState());
    setShowSuccess(true);
    setLoading(false);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <section className={cardClassName}>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Log purchase</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Add at least one{" "}
          <Link href="/items" className="font-medium text-emerald-700 underline dark:text-emerald-400">
            item
          </Link>{" "}
          first. Vendors can be added right in this form.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <SuccessBanner message="Purchase saved successfully" visible={showSuccess} />

      <section className={`${cardClassName} animate-slide-up`}>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={loading} className={`${fieldsetClassName} space-y-5`}>
          <SearchableSelect
            label="Item"
            options={itemOptions}
            value={itemId}
            onChange={handleItemChange}
            placeholder="Search items…"
            required
            disabled={loading}
          />

          {measurementType === "weight" && (
            <div key="weight-qty" className="animate-field-in">
              <NumberInput
                id="purchase-kg"
                label="Total Weight"
                mode="decimal"
                suffix="kg"
                required
                value={quantityKg}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, quantityKg: value }))
                }
                placeholder="e.g. 25"
                disabled={loading}
              />
            </div>
          )}

          {measurementType === "piece" && (
            <div key="piece-qty" className="animate-field-in">
              <NumberInput
                id="purchase-pieces"
                label="Total Pieces"
                mode="integer"
                suffix="pcs"
                required
                value={quantityPieces}
                onChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    quantityPieces: value,
                  }))
                }
                placeholder="e.g. 12"
                disabled={loading}
              />
            </div>
          )}

          <VendorField
            vendors={vendorList}
            value={vendorId}
            onChange={(nextVendorId) =>
              setFormState((current) => ({ ...current, vendorId: nextVendorId }))
            }
            onCreate={handleCreateVendor}
            required
            disabled={loading}
          />

          {measurementType && (
            <div className="animate-field-in grid gap-4 md:grid-cols-2">
              <NumberInput
                id="purchase-cost"
                label={`Cost Price (${unitLabel})`}
                mode="decimal"
                required
                value={costPrice}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, costPrice: value }))
                }
                placeholder="0.00"
                disabled={loading}
              />
              <NumberInput
                id="purchase-retail"
                label={`Retail Price (${unitLabel})`}
                mode="decimal"
                required
                value={retailPrice}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, retailPrice: value }))
                }
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          )}

          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-4 transition-all dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-teal-950/30">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Total Amount</p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-emerald-900 transition-all dark:text-emerald-200">
              {liveTotal != null ? formatTotalAmount(liveTotal) : "—"}
            </p>
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Quantity × cost price
            </p>
          </div>

          <div>
            <label htmlFor="purchase-date" className={labelClassName}>
              Date &amp; time
            </label>
            <input
              id="purchase-date"
              type="datetime-local"
              required
              value={purchasedAt}
              onChange={(e) =>
                setFormState((current) => ({
                  ...current,
                  purchasedAt: e.target.value,
                }))
              }
              className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div>
            <label htmlFor="purchase-notes" className={labelClassName}>
              Notes <span className="font-normal text-[var(--muted)]">(optional)</span>
            </label>
            <textarea
              id="purchase-notes"
              rows={2}
              value={notes}
              onChange={(e) =>
                setFormState((current) => ({ ...current, notes: e.target.value }))
              }
              className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-60`}
              placeholder="Any extra details…"
            />
          </div>

          <FormMessage error={error} />

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-14 rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[var(--background)] active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </span>
            ) : (
              "Save Purchase"
            )}
          </button>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
