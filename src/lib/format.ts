import type { MeasurementType } from "@/types/database";
import { MAAN_KG } from "@/types/database";

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

export function isMaanWeight(kgPerUnit: number | null | undefined) {
  return kgPerUnit != null && kgPerUnit > 1;
}

/** Short name for a bulk weight unit: "maan" for the 40kg maan, otherwise "Nkg". */
export function getBulkUnitName(kgPerUnit: number | null | undefined) {
  return kgPerUnit === MAAN_KG ? "maan" : `${kgPerUnit}kg`;
}

export function getMeasurementShortLabel(
  measurementType: MeasurementType,
  kgPerUnit?: number | null
) {
  if (measurementType === "weight") {
    return isMaanWeight(kgPerUnit) ? getBulkUnitName(kgPerUnit) : "kg";
  }
  switch (measurementType) {
    case "piece":
      return "pcs";
    case "carton":
      return "carton";
  }
}

export function getMeasurementLabel(
  measurementType: MeasurementType,
  kgPerUnit?: number | null
) {
  if (measurementType === "weight") {
    if (kgPerUnit === MAAN_KG) return `maan (${MAAN_KG} kg)`;
    return isMaanWeight(kgPerUnit) ? `${kgPerUnit} kg unit` : "kg";
  }
  switch (measurementType) {
    case "piece":
      return "pieces";
    case "carton":
      return "carton";
  }
}

export function getPriceUnitLabel(
  measurementType: MeasurementType,
  kgPerUnit?: number | null
) {
  if (measurementType === "weight") {
    return isMaanWeight(kgPerUnit) ? `per ${getBulkUnitName(kgPerUnit)}` : "per kg";
  }
  switch (measurementType) {
    case "piece":
      return "per piece";
    case "carton":
      return "per carton";
  }
}

export function formatPriceWithUnit(
  value: number,
  measurementType: MeasurementType,
  kgPerUnit?: number | null
) {
  // DB stores weight prices per kg; show per maan when item uses maan.
  const displayValue =
    measurementType === "weight" && isMaanWeight(kgPerUnit)
      ? value * (kgPerUnit as number)
      : value;
  return `${formatPrice(displayValue)} ${getPriceUnitLabel(measurementType, kgPerUnit)}`;
}

/** Cost/retail as bought, plus piece/kg breakdown when useful. */
export function formatBuyingPrice(
  value: number,
  measurementType: MeasurementType,
  piecesPerCarton?: number | null,
  kgPerUnit?: number | null
) {
  if (measurementType === "carton" && piecesPerCarton != null && piecesPerCarton > 0) {
    const perPiece = value / piecesPerCarton;
    return `${formatPrice(value)} /ctn · ${formatPrice(perPiece)} /pc`;
  }

  if (measurementType === "weight" && isMaanWeight(kgPerUnit)) {
    const perUnit = value * (kgPerUnit as number);
    return `${formatPrice(perUnit)} /${getBulkUnitName(kgPerUnit)} · ${formatPrice(value)} /kg`;
  }

  return formatPriceWithUnit(value, measurementType, kgPerUnit);
}

export function formatQuantity(
  measurementType: MeasurementType,
  quantityKg: number | null,
  quantityPieces: number | null,
  piecesPerCarton?: number | null,
  kgPerUnit?: number | null
) {
  if (measurementType === "weight" && quantityKg != null) {
    if (isMaanWeight(kgPerUnit)) {
      const unit = kgPerUnit as number;
      const count = quantityKg / unit;
      const countLabel = Number.isInteger(count)
        ? String(count)
        : count.toLocaleString(undefined, { maximumFractionDigits: 3 });
      const unitName =
        unit === MAAN_KG ? "maan" : `${unit}kg unit${count === 1 ? "" : "s"}`;
      return `${countLabel} ${unitName} (${quantityKg} kg)`;
    }
    return `${quantityKg} kg`;
  }
  if (measurementType === "piece" && quantityPieces != null) {
    return `${quantityPieces} pcs`;
  }
  if (measurementType === "carton" && quantityPieces != null) {
    if (piecesPerCarton != null && piecesPerCarton > 0) {
      return `${quantityPieces} cartons (${quantityPieces * piecesPerCarton} pcs)`;
    }
    return `${quantityPieces} cartons`;
  }
  return "—";
}

export function toDatetimeLocalValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
