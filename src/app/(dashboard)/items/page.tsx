import { ItemForm } from "@/components/items/item-form";
import { ItemList } from "@/components/items/item-list";
import { pageSubtitleClassName, pageTitleClassName } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/server";

export default async function ItemsPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageTitleClassName}>Items</h1>
        <p className={pageSubtitleClassName}>
          Add products — measured by kg or pieces
        </p>
      </div>
      <ItemForm />
      <ItemList items={items ?? []} />
    </div>
  );
}
