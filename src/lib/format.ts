export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatPrice(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatTotalAmount(value: number) {
  return formatPrice(value);
}

export function getPriceUnitLabel(measurementType: "weight" | "piece") {
  return measurementType === "weight" ? "per kg" : "per piece";
}

export function formatPriceWithUnit(
  value: number,
  measurementType: "weight" | "piece"
) {
  return `${formatPrice(value)} ${getPriceUnitLabel(measurementType)}`;
}

export function formatQuantity(
  measurementType: "weight" | "piece",
  quantityKg: number | null,
  quantityPieces: number | null
) {
  if (measurementType === "weight" && quantityKg != null) {
    return `${quantityKg} kg`;
  }
  if (measurementType === "piece" && quantityPieces != null) {
    return `${quantityPieces} pcs`;
  }
  return "—";
}

export function toDatetimeLocalValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
