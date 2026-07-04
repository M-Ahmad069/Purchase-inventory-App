type ErrorLike = {
  message?: string;
  code?: string;
} | string | null | undefined;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export { isValidEmail };

export function formatAppError(
  error: ErrorLike,
  fallback = "Something went wrong. Please try again."
): string {
  const message =
    typeof error === "string" ? error : error?.message?.trim() ?? "";

  const code =
    typeof error === "object" && error?.code
      ? String(error.code).toLowerCase()
      : "";

  if (!message && !code) return fallback;

  const lower = message.toLowerCase();

  if (code === "email_address_invalid") {
    return "This email cannot be used. Try a real address (not test@).";
  }

  if (code === "email_address_not_authorized") {
    return "Email delivery is not set up for this address.";
  }

  if (code === "email_exists" || code === "user_already_exists") {
    return "That email is already in use.";
  }

  if (
    code === "reauthentication_needed" ||
    lower.includes("reauthenticate") ||
    lower.includes("recent authentication") ||
    lower.includes("requires recent login")
  ) {
    return "For security, enter your current password and try again.";
  }

  if (
    lower.includes("email change") &&
    (lower.includes("already") || lower.includes("pending"))
  ) {
    return "An email change is already pending. Check your inbox or try again later.";
  }

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
    lower.includes("same password") ||
    lower.includes("different from the old password")
  ) {
    return "Choose a password that is different from your current one.";
  }

  if (lower.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }

  if (lower.includes("unable to validate email address")) {
    return "Invalid email format.";
  }

  if (lower.includes("example and test domains")) {
    return "Test emails are not supported.";
  }

  if (lower.includes("email rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }

  if (lower.includes("user already registered")) {
    return "That email is already in use.";
  }

  if (lower.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
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
