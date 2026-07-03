"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DateRangeFilters,
  createDefaultDateFilters,
  type DateFilterState,
} from "@/components/ui/date-range-filters";
import { buttonClassName, cardClassName, pageSubtitleClassName } from "@/components/ui/form";
import {
  formatDateTime,
  formatPriceWithUnit,
  formatQuantity,
  formatTotalAmount,
} from "@/lib/format";
import { getDateRange, isDateInRange } from "@/lib/date-filters";
import {
  getPurchaseTotal,
  sumPurchaseQuantities,
  sumPurchaseTotals,
} from "@/lib/purchases";
import type { Item, PurchaseWithVendor } from "@/types/database";

type ItemDetailViewProps = {
  item: Item;
  purchases: PurchaseWithVendor[];
};

export function ItemDetailView({ item, purchases }: ItemDetailViewProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState<DateFilterState>(createDefaultDateFilters);

  const filteredPurchases = useMemo(() => {
    const range = getDateRange(
      filters.datePreset,
      filters.selectedDay,
      filters.customFrom,
      filters.customTo
    );
    return purchases.filter((purchase) =>
      isDateInRange(purchase.purchased_at, range)
    );
  }, [purchases, filters]);

  const summary = useMemo(() => {
    const totalQuantity = sumPurchaseQuantities(
      filteredPurchases,
      item.measurement_type
    );
    const totalSpent = sumPurchaseTotals(filteredPurchases);
    const lastPurchasedAt = filteredPurchases[0]?.purchased_at ?? null;

    return {
      totalQuantity,
      totalSpent,
      lastPurchasedAt,
      count: filteredPurchases.length,
    };
  }, [filteredPurchases, item.measurement_type]);

  const quantityDisplay = formatQuantity(
    item.measurement_type,
    item.measurement_type === "weight" ? summary.totalQuantity : null,
    item.measurement_type === "piece" ? summary.totalQuantity : null
  );

  const hasActiveFilters = filters.datePreset !== "all";

  if (purchases.length === 0) {
    return (
      <div className="space-y-6">
        <ItemHeader item={item} />
        <section className={cardClassName}>
          <p className="text-sm text-[var(--muted)]">
            No purchases recorded for this item yet.
          </p>
          <Link
            href="/purchases/new"
            className={`${buttonClassName} mt-4 inline-flex items-center justify-center`}
          >
            Log a purchase
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ItemHeader item={item} />

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
                Date filter active — tap to adjust
              </p>
            )}
            {!filtersOpen && !hasActiveFilters && (
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                Filter by day, week, month, or custom dates
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
            <DateRangeFilters
              filters={filters}
              onChange={setFilters}
              resultCount={filteredPurchases.length}
              totalCount={purchases.length}
            />
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className={cardClassName}>
          <p className="text-sm text-[var(--muted)]">
            {hasActiveFilters ? "Quantity in view" : "Total quantity bought"}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--foreground)] sm:text-2xl">
            {summary.count > 0 ? quantityDisplay : "—"}
          </p>
        </div>
        <div className={cardClassName}>
          <p className="text-sm text-[var(--muted)]">
            {hasActiveFilters ? "Spent in view" : "Total amount spent"}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-2xl">
            {summary.count > 0 ? formatTotalAmount(summary.totalSpent) : "—"}
          </p>
        </div>
        <div className={cardClassName}>
          <p className="text-sm text-[var(--muted)]">Most recent in view</p>
          <p className="mt-1 text-base font-semibold text-[var(--foreground)] sm:text-lg">
            {summary.lastPurchasedAt
              ? formatDateTime(summary.lastPurchasedAt)
              : "—"}
          </p>
        </div>
      </div>

      <section className={cardClassName}>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Purchase history
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Every time {item.name} was bought, newest first.
        </p>

        {filteredPurchases.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No purchases match your date filter. Try a different period.
          </p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--input-border)] text-[var(--muted)]">
                    <th className="py-2 pr-4 font-medium">Date &amp; time</th>
                    <th className="py-2 pr-4 font-medium">Vendor</th>
                    <th className="py-2 pr-4 font-medium">Quantity</th>
                    <th className="py-2 pr-4 font-medium">Cost price</th>
                    <th className="py-2 pr-4 font-medium">Retail price</th>
                    <th className="py-2 font-medium">Total</th>
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
                      <td className="py-3 pr-4">
                        {formatQuantity(
                          item.measurement_type,
                          purchase.quantity_kg,
                          purchase.quantity_pieces
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {formatPriceWithUnit(
                          purchase.cost_price,
                          item.measurement_type
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {formatPriceWithUnit(
                          purchase.retail_price,
                          item.measurement_type
                        )}
                      </td>
                      <td className="py-3 font-medium text-[var(--foreground)]">
                        {formatTotalAmount(getPurchaseTotal(purchase))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ol className="mt-4 space-y-3 md:hidden">
              {filteredPurchases.map((purchase) => (
                <li
                  key={purchase.id}
                  className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--foreground)]">
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
                        {formatQuantity(
                          item.measurement_type,
                          purchase.quantity_kg,
                          purchase.quantity_pieces
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)]">Cost</dt>
                      <dd className="font-medium text-[var(--foreground)]">
                        {formatPriceWithUnit(
                          purchase.cost_price,
                          item.measurement_type
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)]">Retail</dt>
                      <dd className="font-medium text-[var(--foreground)]">
                        {formatPriceWithUnit(
                          purchase.retail_price,
                          item.measurement_type
                        )}
                      </dd>
                    </div>
                  </dl>
                  {purchase.notes && (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {purchase.notes}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}

function ItemHeader({ item }: { item: Item }) {
  return (
    <div>
      <Link
        href="/items"
        className="inline-flex min-h-10 items-center text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        ← Back to items
      </Link>
      <h1 className="mt-2 text-xl font-bold text-[var(--foreground)] sm:text-2xl">
        {item.name}
      </h1>
      <p className={pageSubtitleClassName}>
        Purchase history for this item only
      </p>
    </div>
  );
}
