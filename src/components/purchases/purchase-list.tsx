"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  PurchaseFilters,
  createDefaultPurchaseFilters,
  type PurchaseFilterState,
} from "@/components/purchases/purchase-filters";
import { cardClassName } from "@/components/ui/form";
import {
  formatDateTime,
  formatPrice,
  formatQuantity,
  formatTotalAmount,
} from "@/lib/format";
import { getDateRange, isDateInRange } from "@/lib/date-filters";
import { getPurchaseTotal, sumPurchaseQuantities } from "@/lib/purchases";
import { createClient } from "@/lib/supabase/client";
import type { Item, PurchaseWithRelations } from "@/types/database";

type PurchaseListProps = {
  purchases: PurchaseWithRelations[];
  items: Item[];
};

const defaultFilters: PurchaseFilterState = createDefaultPurchaseFilters();

export function PurchaseList({ purchases, items }: PurchaseListProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<PurchaseFilterState>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredPurchases = useMemo(() => {
    const range = getDateRange(
      filters.datePreset,
      filters.selectedDay,
      filters.customFrom,
      filters.customTo
    );

    return purchases.filter((purchase) => {
      if (filters.itemId && purchase.item_id !== filters.itemId) {
        return false;
      }
      if (!isDateInRange(purchase.purchased_at, range)) {
        return false;
      }
      return true;
    });
  }, [purchases, filters]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === filters.itemId) ?? null,
    [items, filters.itemId]
  );

  const summary = useMemo(() => {
    const totalSpent = filteredPurchases.reduce(
      (sum, purchase) => sum + getPurchaseTotal(purchase),
      0
    );

    const uniqueItems = new Set(
      filteredPurchases.map((purchase) => purchase.item_id)
    ).size;

    let totalQuantity: number | null = null;
    if (selectedItem) {
      totalQuantity = sumPurchaseQuantities(
        filteredPurchases,
        selectedItem.measurement_type
      );
    }

    return {
      count: filteredPurchases.length,
      totalSpent,
      uniqueItems,
      totalQuantity,
      measurementType: selectedItem?.measurement_type ?? null,
    };
  }, [filteredPurchases, selectedItem]);

  const hasActiveFilters =
    filters.itemId !== "" || filters.datePreset !== "all";

  async function handleDelete(id: string) {
    if (!confirm("Delete this purchase?")) return;

    setDeletingId(id);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("purchases")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    router.refresh();
  }

  if (purchases.length === 0) {
    return (
      <section className={cardClassName}>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Purchase history
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          No purchases logged yet.
        </p>
        <Link
          href="/purchases/new"
          className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          Log your first purchase
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className={cardClassName}>
        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
          className="flex w-full min-h-12 items-center justify-between gap-3 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Filters &amp; tracking
            </h2>
            {!filtersOpen && hasActiveFilters && (
              <p className="mt-0.5 text-sm text-emerald-600 dark:text-emerald-400">
                Filters active — tap to adjust
              </p>
            )}
            {!filtersOpen && !hasActiveFilters && (
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                Filter by item, week, month, or custom dates
              </p>
            )}
          </div>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--input-border)] bg-[var(--background)] text-[var(--muted)] transition-transform ${
              filtersOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {filtersOpen && (
          <div className="animate-fade-in mt-4 border-t border-[var(--card-border)] pt-4">
            <PurchaseFilters
              items={items}
              filters={filters}
              onChange={setFilters}
              resultCount={filteredPurchases.length}
              totalCount={purchases.length}
            />
          </div>
        )}
      </section>

      <div className={`grid gap-3 ${selectedItem ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <div className={`${cardClassName} !p-4`}>
          <p className="text-sm text-[var(--muted)]">Purchases</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {summary.count}
          </p>
        </div>
        <div className={`${cardClassName} !p-4`}>
          <p className="text-sm text-[var(--muted)]">Total spent</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatTotalAmount(summary.totalSpent)}
          </p>
        </div>
        {selectedItem && summary.totalQuantity != null && (
          <div className={`${cardClassName} !p-4`}>
            <p className="text-sm text-[var(--muted)]">
              {selectedItem.name} qty
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--foreground)]">
              {formatQuantity(
                selectedItem.measurement_type,
                selectedItem.measurement_type === "weight"
                  ? summary.totalQuantity
                  : null,
                selectedItem.measurement_type === "piece"
                  ? summary.totalQuantity
                  : null
              )}
            </p>
          </div>
        )}
      </div>

      {!selectedItem && summary.count > 0 && (
        <p className="text-sm text-[var(--muted)]">
          {summary.uniqueItems} different item{summary.uniqueItems === 1 ? "" : "s"} in this view
        </p>
      )}

      <section className={cardClassName}>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {selectedItem ? `${selectedItem.name} purchases` : "All purchases"}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Newest first — tap a row on mobile to review details
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {filteredPurchases.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No purchases match your filters. Try a different item or date range.
          </p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--input-border)] text-[var(--muted)]">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Vendor</th>
                    {!selectedItem && (
                      <th className="py-2 pr-4 font-medium">Item</th>
                    )}
                    <th className="py-2 pr-4 font-medium">Qty</th>
                    <th className="py-2 pr-4 font-medium">Cost</th>
                    <th className="py-2 pr-4 font-medium">Retail</th>
                    <th className="py-2 pr-4 font-medium">Total</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-[var(--card-border)]"
                    >
                      <td className="py-3 pr-4 text-[var(--foreground)]">
                        {formatDateTime(purchase.purchased_at)}
                      </td>
                      <td className="py-3 pr-4">
                        {purchase.vendors?.name ?? "—"}
                      </td>
                      {!selectedItem && (
                        <td className="py-3 pr-4">
                          {purchase.items?.name ?? "—"}
                        </td>
                      )}
                      <td className="py-3 pr-4">
                        {purchase.items
                          ? formatQuantity(
                              purchase.items.measurement_type,
                              purchase.quantity_kg,
                              purchase.quantity_pieces
                            )
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {formatPrice(purchase.cost_price)}
                      </td>
                      <td className="py-3 pr-4">
                        {formatPrice(purchase.retail_price)}
                      </td>
                      <td className="py-3 pr-4 font-medium text-[var(--foreground)]">
                        {formatTotalAmount(getPurchaseTotal(purchase))}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(purchase.id)}
                          disabled={deletingId === purchase.id}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          {deletingId === purchase.id ? "…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-4 space-y-3 md:hidden">
              {filteredPurchases.map((purchase) => (
                <li
                  key={purchase.id}
                  className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {!selectedItem && (
                        <p className="truncate font-semibold text-[var(--foreground)]">
                          {purchase.items?.name ?? "Unknown item"}
                        </p>
                      )}
                      <p className="truncate text-sm text-[var(--muted)]">
                        {purchase.vendors?.name ?? "Unknown vendor"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {formatDateTime(purchase.purchased_at)}
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatTotalAmount(getPurchaseTotal(purchase))}
                    </p>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-[var(--muted)]">Qty</dt>
                      <dd className="font-medium text-[var(--foreground)]">
                        {purchase.items
                          ? formatQuantity(
                              purchase.items.measurement_type,
                              purchase.quantity_kg,
                              purchase.quantity_pieces
                            )
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)]">Cost</dt>
                      <dd className="font-medium text-[var(--foreground)]">
                        {formatPrice(purchase.cost_price)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)]">Retail</dt>
                      <dd className="font-medium text-[var(--foreground)]">
                        {formatPrice(purchase.retail_price)}
                      </dd>
                    </div>
                  </dl>
                  {purchase.notes && (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {purchase.notes}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(purchase.id)}
                    disabled={deletingId === purchase.id}
                    className="mt-3 min-h-11 w-full rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    {deletingId === purchase.id ? "Deleting…" : "Delete purchase"}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
