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

export function getMeasurementShortLabel(
  measurementType: MeasurementType,
  kgPerUnit?: number | null
) {
  if (measurementType === "weight") {
    return isMaanWeight(kgPerUnit) ? "maan" : "kg";
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
    return isMaanWeight(kgPerUnit)
      ? `maan (${kgPerUnit ?? MAAN_KG} kg)`
      : "kg";
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
    return isMaanWeight(kgPerUnit) ? "per maan" : "per kg";
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
      const maans = quantityKg / unit;
      const maanLabel = Number.isInteger(maans)
        ? String(maans)
        : maans.toLocaleString(undefined, { maximumFractionDigits: 3 });
      return `${maanLabel} maan (${quantityKg} kg)`;
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
