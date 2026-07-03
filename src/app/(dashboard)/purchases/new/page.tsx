import { PurchaseForm } from "@/components/purchases/purchase-form";
import { pageSubtitleClassName, pageTitleClassName } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/server";

export default async function NewPurchasePage() {
  const supabase = createClient();

  const [{ data: vendors }, { data: items }] = await Promise.all([
    supabase.from("vendors").select("*").order("name"),
    supabase.from("items").select("*").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClassName}>Log Purchase</h1>
        <p className={pageSubtitleClassName}>
          Record what you bought, from whom, and at what price
        </p>
      </div>
      <PurchaseForm vendors={vendors ?? []} items={items ?? []} />
    </div>
  );
}
