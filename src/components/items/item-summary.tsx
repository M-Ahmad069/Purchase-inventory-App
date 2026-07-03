import Link from "next/link";

import { cardClassName, pageSubtitleClassName } from "@/components/ui/form";
import {
  formatDateTime,
  formatQuantity,
  formatTotalAmount,
} from "@/lib/format";
import type { Item, PurchaseWithVendor } from "@/types/database";
import {
  sumPurchaseQuantities,
  sumPurchaseTotals,
} from "@/lib/purchases";

type ItemSummaryProps = {
  item: Item;
  purchases: PurchaseWithVendor[];
};

export function ItemSummary({ item, purchases }: ItemSummaryProps) {
  const totalQuantity = sumPurchaseQuantities(
    purchases,
    item.measurement_type
  );
  const totalSpent = sumPurchaseTotals(purchases);
  const lastPurchasedAt = purchases[0]?.purchased_at ?? null;

  const quantityDisplay = formatQuantity(
    item.measurement_type,
    item.measurement_type === "weight" ? totalQuantity : null,
    item.measurement_type === "piece" ? totalQuantity : null
  );

  return (
    <div className="space-y-4">
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

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className={cardClassName}>
          <p className="text-sm text-[var(--muted)]">Total quantity bought</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--foreground)] sm:text-2xl">
            {purchases.length > 0 ? quantityDisplay : "—"}
          </p>
        </div>
        <div className={cardClassName}>
          <p className="text-sm text-[var(--muted)]">Total amount spent</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 sm:text-2xl">
            {purchases.length > 0 ? formatTotalAmount(totalSpent) : "—"}
          </p>
        </div>
        <div className={cardClassName}>
          <p className="text-sm text-[var(--muted)]">Most recent purchase</p>
          <p className="mt-1 text-base font-semibold text-[var(--foreground)] sm:text-lg">
            {lastPurchasedAt ? formatDateTime(lastPurchasedAt) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
