export const DEFAULT_THEME = "dark";
export const DEFAULT_CURRENCY = "PHP";
export const THEME_STORAGE_KEY = "salimspend-theme";
export const CURRENCY_STORAGE_KEY = "salimspend-currency";
export const APP_STORAGE_PREFIX = "salimspend";

export const CURRENCY_OPTIONS = [
  { code: "PHP", name: "Philippine Peso" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
];

const currencyMap = new Map(
  CURRENCY_OPTIONS.map((option) => [option.code, option]),
);

export function normalizeCurrencyCode(value) {
  const normalizedValue =
    typeof value === "string" ? value.trim().toUpperCase() : "";

  if (currencyMap.has(normalizedValue)) {
    return normalizedValue;
  }

  return DEFAULT_CURRENCY;
}

export function getStoredTheme(storage = getStorage()) {
  if (!storage) {
    return DEFAULT_THEME;
  }

  const savedTheme = storage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "light" || savedTheme === "dark" ?
      savedTheme
    : DEFAULT_THEME;
}

export function getStoredCurrency(storage = getStorage()) {
  if (!storage) {
    return DEFAULT_CURRENCY;
  }

  const savedCurrency = storage.getItem(CURRENCY_STORAGE_KEY);
  return normalizeCurrencyCode(savedCurrency);
}

export function getSettingsExportPayload({
  theme,
  currency,
  exportedAt,
  appVersion,
} = {}) {
  const exportTime = exportedAt || new Date().toISOString();

  return {
    exportedAt: exportTime,
    appVersion: appVersion || "0.0.0",
    settings: {
      theme: theme === "light" || theme === "dark" ? theme : DEFAULT_THEME,
      currency: normalizeCurrencyCode(currency),
    },
    supportedCurrencies: CURRENCY_OPTIONS.map((option) => option.code),
    data: getAppStorageSnapshot(),
  };
}

export function clearAppStorage(storage = getStorage()) {
  if (!storage) {
    return;
  }

  const keys = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && key.startsWith(APP_STORAGE_PREFIX)) {
      keys.push(key);
    }
  }

  keys.forEach((key) => storage.removeItem(key));
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function getAppStorageSnapshot(storage = getStorage()) {
  if (!storage) {
    return {};
  }

  const snapshot = {};

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(APP_STORAGE_PREFIX)) {
      continue;
    }

    try {
      const rawValue = storage.getItem(key);
      snapshot[key] = rawValue === null ? null : JSON.parse(rawValue);
    } catch {
      snapshot[key] = storage.getItem(key);
    }
  }

  return snapshot;
}
