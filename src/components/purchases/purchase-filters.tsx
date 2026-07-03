"use client";

import { FilterSelect } from "@/components/ui/filter-select";
import {
  DateRangeFilters,
  createDefaultDateFilters,
  type DateFilterState,
} from "@/components/ui/date-range-filters";
import type { Item } from "@/types/database";

export type PurchaseFilterState = DateFilterState & {
  itemId: string;
};

export function createDefaultPurchaseFilters(): PurchaseFilterState {
  return {
    itemId: "",
    ...createDefaultDateFilters(),
  };
}

type PurchaseFiltersProps = {
  items: Item[];
  filters: PurchaseFilterState;
  onChange: (filters: PurchaseFilterState) => void;
  resultCount: number;
  totalCount: number;
};

export function PurchaseFilters({
  items,
  filters,
  onChange,
  resultCount,
  totalCount,
}: PurchaseFiltersProps) {
  const itemOptions = items.map((item) => ({
    id: item.id,
    label: item.name,
  }));

  function update(partial: Partial<PurchaseFilterState>) {
    onChange({ ...filters, ...partial });
  }

  const hasActiveFilters =
    filters.itemId !== "" || filters.datePreset !== "all";

  return (
    <div className="space-y-5">
      <FilterSelect
        label="Filter by item"
        options={itemOptions}
        value={filters.itemId}
        onChange={(itemId) => update({ itemId })}
        allLabel="All items"
        placeholder="Search items…"
      />

      <DateRangeFilters
        filters={filters}
        onChange={(dateFilters) => onChange({ ...filters, ...dateFilters })}
        resultCount={resultCount}
        totalCount={totalCount}
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange(createDefaultPurchaseFilters())}
          className="min-h-11 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
