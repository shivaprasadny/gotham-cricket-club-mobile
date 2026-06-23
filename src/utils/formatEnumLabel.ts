/**
 * Converts API enum values such as PAYMENT_SUBMITTED into readable UI labels.
 * Non-enum text is preserved with normal title casing.
 */
export const formatEnumLabel = (value?: string | null, fallback = "") => {
  if (!value) return fallback;
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
