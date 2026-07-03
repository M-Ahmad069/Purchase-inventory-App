type ErrorLike = {
  message?: string;
  code?: string;
} | string | null | undefined;

export function formatAppError(
  error: ErrorLike,
  fallback = "Something went wrong. Please try again."
): string {
  const message =
    typeof error === "string" ? error : error?.message?.trim() ?? "";

  if (!message) return fallback;

  const lower = message.toLowerCase();

  if (
    lower.includes("purchases_item_id_fkey") ||
    (lower.includes("foreign key") && lower.includes('"items"'))
  ) {
    return "This item has purchase records. Delete those purchases from History first, then you can remove the item.";
  }

  if (
    lower.includes("purchases_vendor_id_fkey") ||
    (lower.includes("foreign key") && lower.includes('"vendors"'))
  ) {
    return "This vendor has purchase records. Delete those purchases from History first.";
  }

  if (lower.includes("duplicate key") || lower.includes("already exists")) {
    return "This name already exists.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (
    lower.includes("foreign key constraint") ||
    lower.includes("violates") ||
    lower.includes("pgrst") ||
    lower.includes("postgres")
  ) {
    return fallback;
  }

  return message;
}
