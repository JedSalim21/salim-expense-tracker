import test from "node:test";
import assert from "node:assert/strict";

import { formatCurrency, formatSignedCurrency } from "./currency.js";

test("formats supported currencies with their symbols and decimal rules", () => {
  assert.equal(formatCurrency(1500, "PHP"), "₱1,500.00");
  assert.equal(formatCurrency(1500, "USD"), "$1,500.00");
  assert.equal(formatCurrency(1500, "EUR"), "€1,500.00");
  assert.equal(formatCurrency(1500, "JPY"), "¥1,500");
});

test("formats positive and negative signed values", () => {
  assert.equal(formatSignedCurrency(1250, "PHP"), "+₱1,250.00");
  assert.equal(formatSignedCurrency(-86.24, "USD"), "-$86.24");
});

test("falls back to the default currency and zero for invalid inputs", () => {
  assert.equal(formatCurrency(12, "unsupported"), "₱12.00");
  assert.equal(formatCurrency(Number.NaN, "PHP"), "₱0.00");
});
