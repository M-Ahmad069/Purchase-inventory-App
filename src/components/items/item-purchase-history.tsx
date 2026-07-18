import Link from "next/link";

import { buttonClassName, cardClassName } from "@/components/ui/form";
import {
  formatDateTime,
  formatPriceWithUnit,
  formatQuantity,
  formatTotalAmount,
} from "@/lib/format";
import { getPurchaseTotal } from "@/lib/purchases";
import type { Item, PurchaseWithVendor } from "@/types/database";

type ItemPurchaseHistoryProps = {
  item: Item;
  purchases: PurchaseWithVendor[];
};

export function ItemPurchaseHistory({
  item,
  purchases,
}: ItemPurchaseHistoryProps) {
  if (purchases.length === 0) {
    return (
      <section className={cardClassName}>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Purchase history
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          No purchases recorded for this item yet.
        </p>
        <Link href="/purchases/new" className={`${buttonClassName} mt-4 inline-flex items-center justify-center`}>
          Log a purchase
        </Link>
      </section>
    );
  }

  return (
    <section className={cardClassName}>
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Purchase history
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Every time {item.name} was bought, newest first.
      </p>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--input-border)] text-[var(--muted)]">
              <th className="py-2 pr-4 font-medium">Date & time</th>
              <th className="py-2 pr-4 font-medium">Vendor</th>
              <th className="py-2 pr-4 font-medium">Quantity</th>
              <th className="py-2 pr-4 font-medium">Cost price</th>
              <th className="py-2 pr-4 font-medium">Retail price</th>
              <th className="py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr
                key={purchase.id}
                className="border-b border-[var(--card-border)]"
              >
                <td className="py-3 pr-4 text-[var(--foreground)]">
                  {formatDateTime(purchase.purchased_at)}
                </td>
                <td className="py-3 pr-4">{purchase.vendors?.name ?? "—"}</td>
                <td className="py-3 pr-4">
                  {formatQuantity(
                    item.measurement_type,
                    purchase.quantity_kg,
                    purchase.quantity_pieces,
                    item.pieces_per_carton,
                    item.kg_per_unit
                  )}
                </td>
                <td className="py-3 pr-4">
                  {formatPriceWithUnit(
                    purchase.cost_price,
                    item.measurement_type,
                    item.kg_per_unit
                  )}
                </td>
                <td className="py-3 pr-4">
                  {formatPriceWithUnit(
                    purchase.retail_price,
                    item.measurement_type,
                    item.kg_per_unit
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
        {purchases.map((purchase) => (
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
                    purchase.quantity_pieces,
                    item.pieces_per_carton,
                    item.kg_per_unit
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Cost</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {formatPriceWithUnit(
                    purchase.cost_price,
                    item.measurement_type,
                    item.kg_per_unit
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Retail</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {formatPriceWithUnit(
                    purchase.retail_price,
                    item.measurement_type,
                    item.kg_per_unit
                  )}
                </dd>
              </div>
            </dl>
            {purchase.notes && (
              <p className="mt-2 text-sm text-[var(--muted)]">{purchase.notes}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
