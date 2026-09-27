import { normalizeCurrencyCode } from "./settings.js";

export function formatCurrency(value, currency) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizeCurrencyCode(currency),
    currencyDisplay: "narrowSymbol",
  }).format(safeValue);
}

export function formatSignedCurrency(value, currency) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const sign = safeValue >= 0 ? "+" : "-";

  return `${sign}${formatCurrency(Math.abs(safeValue), currency)}`;
}
