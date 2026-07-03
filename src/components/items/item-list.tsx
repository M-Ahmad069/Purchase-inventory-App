"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cardClassName, FormMessage, inputClassName } from "@/components/ui/form";
import { formatAppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { Item } from "@/types/database";

type ItemListProps = {
  items: Item[];
};

const measurementLabels = {
  weight: "kg",
  piece: "pieces",
} as const;

type PendingDelete = {
  id: string;
  name: string;
};

export function ItemList({ items }: ItemListProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        measurementLabels[item.measurement_type].includes(query) ||
        (item.notes?.toLowerCase().includes(query) ?? false)
    );
  }, [items, search]);

  function requestDelete(item: Item) {
    setError(null);
    setPendingDelete({ id: item.id, name: item.name });
  }

  async function confirmDelete() {
    if (!pendingDelete || deletingId) return;

    const { id } = pendingDelete;
    setDeletingId(id);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(
        formatAppError(
          deleteError,
          "Could not delete this item. Please try again."
        )
      );
      setDeletingId(null);
      setPendingDelete(null);
      return;
    }

    setDeletingId(null);
    setPendingDelete(null);
    if (openItemId === id) setOpenItemId(null);
    router.refresh();
  }

  function toggleItem(id: string) {
    setOpenItemId((current) => (current === id ? null : id));
  }

  if (items.length === 0) {
    return (
      <section className={cardClassName}>
        <p className="text-sm text-[var(--muted)]">
          No items yet. Add your first item above.
        </p>
      </section>
    );
  }

  return (
    <>
      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete item?"
        message={
          pendingDelete
            ? `Remove "${pendingDelete.name}" from your items? This cannot be undone. If it has purchase history, delete those records from History first.`
            : ""
        }
        confirmLabel="Delete item"
        cancelLabel="Keep item"
        loading={deletingId !== null}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deletingId) setPendingDelete(null);
        }}
      />

      <section className={cardClassName}>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="flex w-full min-h-12 items-center justify-between gap-3 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Your items ({items.length})
            </h2>
            {!expanded && (
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                Tap to expand, search, and manage items
              </p>
            )}
          </div>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--input-border)] bg-[var(--background)] text-[var(--muted)] transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {expanded && (
          <div className="animate-fade-in mt-4 space-y-4 border-t border-[var(--card-border)] pt-4">
            <div>
              <label htmlFor="item-search" className="sr-only">
                Search items
              </label>
              <input
                id="item-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items by name…"
                className={`${inputClassName} !mt-0`}
                autoComplete="off"
              />
            </div>

            <FormMessage error={error} />

            {filteredItems.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No items match &ldquo;{search}&rdquo;
              </p>
            ) : (
              <ul className="divide-y divide-[var(--card-border)] rounded-xl border border-[var(--card-border)]">
                {filteredItems.map((item) => {
                  const isOpen = openItemId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        aria-expanded={isOpen}
                        className="flex w-full min-h-12 items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[var(--foreground)]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {measurementLabels[item.measurement_type]}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[var(--muted)] transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>

                      {isOpen && (
                        <div className="animate-fade-in space-y-3 border-t border-[var(--card-border)] bg-[var(--background)] px-4 py-3">
                          <p className="text-sm text-[var(--muted)]">
                            Measured by {measurementLabels[item.measurement_type]}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-[var(--muted)]">{item.notes}</p>
                          )}
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Link
                              href={`/items/${item.id}`}
                              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                            >
                              View full history
                            </Link>
                            <button
                              type="button"
                              onClick={() => requestDelete(item)}
                              disabled={deletingId === item.id}
                              className="min-h-11 rounded-xl border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 sm:shrink-0"
                            >
                              {deletingId === item.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="text-center text-xs text-[var(--muted)]">
              Showing {filteredItems.length} of {items.length} items
            </p>
          </div>
        )}
      </section>
    </>
  );
}
