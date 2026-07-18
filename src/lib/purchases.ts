import type { MeasurementType, Purchase } from "@/types/database";

type PurchaseLike = Pick<
  Purchase,
  "quantity_kg" | "quantity_pieces" | "cost_price"
>;

export function getUnitLabel(measurementType: MeasurementType) {
  switch (measurementType) {
    case "weight":
      return "kg";
    case "piece":
      return "piece";
    case "carton":
      return "carton";
  }
}

export function getPurchaseQuantity(
  purchase: PurchaseLike,
  measurementType: MeasurementType
) {
  if (measurementType === "weight") {
    return purchase.quantity_kg ?? 0;
  }
  return purchase.quantity_pieces ?? 0;
}

export function getPurchaseTotal(purchase: PurchaseLike) {
  const quantity =
    purchase.quantity_kg != null
      ? purchase.quantity_kg
      : (purchase.quantity_pieces ?? 0);
  return quantity * purchase.cost_price;
}

export function sumPurchaseQuantities(
  purchases: PurchaseLike[],
  measurementType: MeasurementType
) {
  return purchases.reduce(
    (sum, purchase) => sum + getPurchaseQuantity(purchase, measurementType),
    0
  );
}

export function sumPurchaseTotals(purchases: PurchaseLike[]) {
  return purchases.reduce((sum, purchase) => sum + getPurchaseTotal(purchase), 0);
}
