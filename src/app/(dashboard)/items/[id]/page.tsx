import { notFound } from "next/navigation";

import { ItemDetailView } from "@/components/items/item-detail-view";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseWithVendor } from "@/types/database";

type ItemDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const supabase = createClient();

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!item) {
    notFound();
  }

  const { data: purchases } = await supabase
    .from("purchases")
    .select(`*, vendors (name)`)
    .eq("item_id", params.id)
    .order("purchased_at", { ascending: false });

  return (
    <ItemDetailView
      item={item}
      purchases={(purchases as PurchaseWithVendor[]) ?? []}
    />
  );
}
