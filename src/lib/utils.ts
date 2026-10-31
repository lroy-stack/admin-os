export const getInitials = (str: string): string => {
  if (typeof str !== "string" || !str.trim()) return "?";

  return (
    str
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
};

export function formatCurrency(
  amount: number,
  opts?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    noDecimals?: boolean;
    /** Short form such as $258.6K or $1.4M. */
    compact?: boolean;
  },
) {
  const {
    currency = "USD",
    locale = "en-US",
    minimumFractionDigits,
    maximumFractionDigits,
    noDecimals,
    compact,
  } = opts ?? {};

  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: noDecimals ? 0 : minimumFractionDigits,
    maximumFractionDigits: noDecimals
      ? 0
      : (maximumFractionDigits ?? (compact ? Math.max(minimumFractionDigits ?? 0, 1) : undefined)),
  };

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}
