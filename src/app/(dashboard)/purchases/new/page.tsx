import { PurchaseForm } from "@/components/purchases/purchase-form";
import { buttonClassName, pageSubtitleClassName, pageTitleClassName } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/server";

export default async function NewPurchasePage() {
  const supabase = createClient();

  const [{ data: vendors }, { data: items }] = await Promise.all([
    supabase.from("vendors").select("*").order("name"),
    supabase.from("items").select("*").order("name"),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className={pageTitleClassName}>Buying</h1>
          <p className={pageSubtitleClassName}>
            Record what you bought, from whom, and at what price
          </p>
        </div>
        <button
          type="submit"
          form="purchase-form"
          className={`${buttonClassName} hidden shrink-0 sm:inline-flex`}
        >
          Save Purchase
        </button>
      </div>
      <PurchaseForm vendors={vendors ?? []} items={items ?? []} />
    </div>
  );
}
