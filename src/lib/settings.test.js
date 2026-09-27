import test from "node:test";
import assert from "node:assert/strict";

import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  DEFAULT_THEME,
  getStoredCurrency,
  getStoredTheme,
  getSettingsExportPayload,
  normalizeCurrencyCode,
} from "./settings.js";

test("returns the default theme and currency when storage is empty", () => {
  const storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };

  assert.equal(getStoredTheme(storage), DEFAULT_THEME);
  assert.equal(getStoredCurrency(storage), DEFAULT_CURRENCY);
});

test("normalizes supported currency values and ignores invalid ones", () => {
  assert.equal(normalizeCurrencyCode("USD"), "USD");
  assert.equal(normalizeCurrencyCode("eur"), "EUR");
  assert.equal(normalizeCurrencyCode("ZAR"), DEFAULT_CURRENCY);
  assert.equal(normalizeCurrencyCode(null), DEFAULT_CURRENCY);
});

test("builds a settings export payload with current app preferences", () => {
  const payload = getSettingsExportPayload({
    theme: "light",
    currency: "USD",
    exportedAt: "2026-09-27T00:00:00.000Z",
    appVersion: "0.0.0",
  });

  assert.equal(payload.settings.theme, "light");
  assert.equal(payload.settings.currency, "USD");
  assert.equal(payload.appVersion, "0.0.0");
  assert.deepEqual(
    payload.supportedCurrencies,
    CURRENCY_OPTIONS.map((option) => option.code),
  );
});
