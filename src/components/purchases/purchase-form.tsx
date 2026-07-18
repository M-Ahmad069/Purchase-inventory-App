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
  isMaanWeight,
  toDatetimeLocalValue,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { formatAppError } from "@/lib/errors";
import type { Item, Vendor } from "@/types/database";
import { MAAN_KG } from "@/types/database";

type PurchaseFormProps = {
  vendors: Vendor[];
  items: Item[];
};

function parseOptionalPrice(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parsed = Number(trimmed);
  return parsed;
}

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
  /** For maan items: enter quantity as maans or as kg. */
  const [weightInputMode, setWeightInputMode] = useState<"maan" | "kg">("maan");

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
  const maanItem = measurementType === "weight" && isMaanWeight(selectedItem?.kg_per_unit);
  const kgPerUnit = selectedItem?.kg_per_unit ?? MAAN_KG;
  const unitLabel = measurementType
    ? getPriceUnitLabel(measurementType, selectedItem?.kg_per_unit)
    : "";

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), 3500);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  useEffect(() => {
    setWeightInputMode(maanItem ? "maan" : "kg");
  }, [itemId, maanItem]);

  const resolvedWeightKg = useMemo(() => {
    const amount = Number(quantityKg);
    if (Number.isNaN(amount) || amount <= 0) return null;
    if (maanItem && weightInputMode === "maan") {
      return amount * kgPerUnit;
    }
    return amount;
  }, [quantityKg, maanItem, weightInputMode, kgPerUnit]);

  const liveTotal = useMemo(() => {
    const cost = Number(costPrice);
    if (Number.isNaN(cost) || cost < 0) return null;

    if (measurementType === "weight") {
      if (resolvedWeightKg == null) return null;
      // Maan items: cost is entered per maan → convert to per-kg for total
      const costPerKg = maanItem ? cost / kgPerUnit : cost;
      return resolvedWeightKg * costPerKg;
    }

    if (measurementType === "piece" || measurementType === "carton") {
      const pieces = Number(quantityPieces);
      if (Number.isNaN(pieces) || pieces <= 0) return null;
      return pieces * cost;
    }

    return null;
  }, [
    costPrice,
    measurementType,
    quantityPieces,
    resolvedWeightKg,
    maanItem,
    kgPerUnit,
  ]);

  const cartonPreview = useMemo(() => {
    if (measurementType !== "carton" || !selectedItem?.pieces_per_carton) {
      return null;
    }
    const cartons = Number(quantityPieces);
    if (!Number.isInteger(cartons) || cartons <= 0) return null;
    return cartons * selectedItem.pieces_per_carton;
  }, [measurementType, quantityPieces, selectedItem]);

  const itemOptions = useMemo(
    () =>
      items.map((item) => {
        let unit = "pcs";
        if (item.measurement_type === "weight") {
          unit = isMaanWeight(item.kg_per_unit) ? "maan" : "kg";
        }
        if (item.measurement_type === "carton") {
          unit = item.pieces_per_carton
            ? `${item.pieces_per_carton}/ctn`
            : "carton";
        }
        return {
          id: item.id,
          label: `${item.name} (${unit})`,
        };
      }),
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
      setError(formatAppError(insertError?.message ?? insertError, "Could not add vendor."));
      throw new Error(formatAppError(insertError, "Could not add vendor."));
    }

    setVendorList((current) =>
      [...current, data].sort((a, b) => a.name.localeCompare(b.name))
    );
    setFormState((current) => ({ ...current, vendorId: data.id }));
    router.refresh();
  }

  async function handleDeleteVendor(vendorId: string) {
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("vendors")
      .delete()
      .eq("id", vendorId);

    if (deleteError) {
      const message = formatAppError(
        deleteError,
        "Could not delete vendor. Please try again."
      );
      setError(message);
      throw new Error(message);
    }

    setVendorList((current) => current.filter((vendor) => vendor.id !== vendorId));
    if (vendorId === formState.vendorId) {
      setFormState((current) => ({ ...current, vendorId: "" }));
    }
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

    const cost = parseOptionalPrice(costPrice);
    const retail = parseOptionalPrice(retailPrice);

    if (Number.isNaN(cost) || cost < 0 || Number.isNaN(retail) || retail < 0) {
      setError("Enter valid prices or leave them blank.");
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
      if (resolvedWeightKg == null || resolvedWeightKg <= 0) {
        setError(
          maanItem && weightInputMode === "maan"
            ? "Enter a valid maan count."
            : "Enter a valid total weight in kg."
        );
        return;
      }

      // Always store kg + per-kg prices so history totals stay correct
      const costPerKg = maanItem ? cost / kgPerUnit : cost;
      const retailPerKg = maanItem ? retail / kgPerUnit : retail;

      insertData = {
        vendor_id: vendorId,
        item_id: itemId,
        purchased_at: new Date(purchasedAt).toISOString(),
        quantity_kg: resolvedWeightKg,
        cost_price: costPerKg,
        retail_price: retailPerKg,
        notes: notes.trim() || null,
      };
    } else if (measurementType === "piece" || measurementType === "carton") {
      const count = Number(quantityPieces);
      if (!Number.isInteger(count) || count <= 0) {
        setError(
          measurementType === "carton"
            ? "Enter a valid carton count."
            : "Enter a valid total piece count."
        );
        return;
      }
      insertData = {
        vendor_id: vendorId,
        item_id: itemId,
        purchased_at: new Date(purchasedAt).toISOString(),
        quantity_pieces: count,
        cost_price: cost,
        retail_price: retail,
        notes: notes.trim() || null,
      };
    } else {
      setError("Select a valid item.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("purchases")
      .insert(insertData);

    if (insertError) {
      setError(formatAppError(insertError, "Could not save purchase. Please try again."));
      setLoading(false);
      return;
    }

    setFormState(resetFormState());
    setShowSuccess(true);
    setLoading(false);
    router.refresh();
  }

  const saveButtonClassName =
    "w-full min-h-14 rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[var(--background)] active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-emerald-500 dark:hover:bg-emerald-400";

  const mobileStickySaveClassName =
    "w-full min-h-10 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[var(--background)] active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-emerald-500 dark:hover:bg-emerald-400";

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
        <form id="purchase-form" onSubmit={handleSubmit}>
          <div className="sticky top-14 z-20 -mx-1 mb-3 border-b border-[var(--card-border)] bg-[var(--card)]/95 py-2 backdrop-blur-sm md:hidden">
            <button type="submit" disabled={loading} className={mobileStickySaveClassName}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : (
                "Save Purchase"
              )}
            </button>
          </div>

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
            <div key="weight-qty" className="animate-field-in space-y-2">
              {maanItem && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWeightInputMode("maan");
                      setFormState((current) => ({ ...current, quantityKg: "" }));
                    }}
                    className={`min-h-9 flex-1 rounded-lg border px-3 text-xs font-semibold ${
                      weightInputMode === "maan"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "border-[var(--input-border)] text-[var(--muted)]"
                    }`}
                  >
                    Enter maans
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWeightInputMode("kg");
                      setFormState((current) => ({ ...current, quantityKg: "" }));
                    }}
                    className={`min-h-9 flex-1 rounded-lg border px-3 text-xs font-semibold ${
                      weightInputMode === "kg"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "border-[var(--input-border)] text-[var(--muted)]"
                    }`}
                  >
                    Enter kg
                  </button>
                </div>
              )}

              {maanItem && weightInputMode === "maan" ? (
                <NumberInput
                  id="purchase-maans"
                  label="Total Maans"
                  mode="decimal"
                  suffix="maan"
                  required
                  value={quantityKg}
                  onChange={(value) =>
                    setFormState((current) => ({ ...current, quantityKg: value }))
                  }
                  placeholder="e.g. 2"
                  disabled={loading}
                />
              ) : (
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
              )}

              {maanItem && resolvedWeightKg != null && (
                <p className="text-xs text-[var(--muted)]">
                  1 maan = {kgPerUnit} kg
                  {weightInputMode === "maan"
                    ? ` · = ${resolvedWeightKg} kg`
                    : ` · = ${(resolvedWeightKg / kgPerUnit).toLocaleString(undefined, { maximumFractionDigits: 3 })} maan`}
                </p>
              )}
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

          {measurementType === "carton" && (
            <div key="carton-qty" className="animate-field-in space-y-2">
              <NumberInput
                id="purchase-cartons"
                label="Total Cartons"
                mode="integer"
                suffix="ctn"
                required
                value={quantityPieces}
                onChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    quantityPieces: value,
                  }))
                }
                placeholder="e.g. 3"
                disabled={loading}
              />
              {selectedItem?.pieces_per_carton && (
                <p className="text-xs text-[var(--muted)]">
                  {selectedItem.pieces_per_carton} pcs per carton
                  {cartonPreview != null ? ` · = ${cartonPreview} pcs` : ""}
                </p>
              )}
            </div>
          )}

          <VendorField
            vendors={vendorList}
            value={vendorId}
            onChange={(nextVendorId) =>
              setFormState((current) => ({ ...current, vendorId: nextVendorId }))
            }
            onCreate={handleCreateVendor}
            onDelete={handleDeleteVendor}
            required
            disabled={loading}
          />

          {measurementType && (
            <div className="animate-field-in grid gap-4 md:grid-cols-2">
              <NumberInput
                id="purchase-cost"
                label={
                  <>
                    Cost Price ({unitLabel}){" "}
                    <span className="font-normal text-[var(--muted)]">(optional)</span>
                  </>
                }
                mode="decimal"
                value={costPrice}
                onChange={(value) =>
                  setFormState((current) => ({ ...current, costPrice: value }))
                }
                placeholder="0.00"
                disabled={loading}
              />
              <NumberInput
                id="purchase-retail"
                label={
                  <>
                    Retail Price ({unitLabel}){" "}
                    <span className="font-normal text-[var(--muted)]">(optional)</span>
                  </>
                }
                mode="decimal"
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
              {costPrice.trim() ? "Quantity × cost price" : "Add cost price to see total"}
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
            className={saveButtonClassName}
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
