import Link from "next/link";

import { PurchaseList } from "@/components/purchases/purchase-list";
import {
  buttonClassName,
  pageSubtitleClassName,
  pageTitleClassName,
} from "@/components/ui/form";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseWithRelations } from "@/types/database";

export default async function PurchasesPage() {
  const supabase = createClient();

  const [{ data: purchases }, { data: items }] = await Promise.all([
    supabase
      .from("purchases")
      .select(
        `
        *,
        vendors (name),
        items (name, measurement_type, pieces_per_carton, kg_per_unit)
      `
      )
      .order("purchased_at", { ascending: false }),
    supabase.from("items").select("*").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={pageTitleClassName}>Purchase History</h1>
          <p className={pageSubtitleClassName}>
            Track spending by item, week, month, or custom dates
          </p>
        </div>
        <Link
          href="/purchases/new"
          className={`${buttonClassName} hidden items-center justify-center sm:inline-flex sm:shrink-0`}
        >
          Buying
        </Link>
      </div>
      <PurchaseList
        purchases={(purchases as PurchaseWithRelations[]) ?? []}
        items={items ?? []}
      />
    </div>
  );
}
