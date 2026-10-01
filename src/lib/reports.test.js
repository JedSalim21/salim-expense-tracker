import test from "node:test";
import assert from "node:assert/strict";

import { calculateReportMetrics, formatReportInsight } from "./reports.js";

const now = new Date();
const currentMonth = new Date(now.getFullYear(), now.getMonth(), 5);
const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 18);
const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 4);

const sampleTransactions = [
  {
    amount: 3000,
    type: "income",
    date: currentMonth.toISOString().slice(0, 10),
    category_id: "cat-1",
  },
  {
    amount: 500,
    type: "income",
    date: currentMonth.toISOString().slice(0, 10),
    category_id: "cat-3",
  },
  {
    amount: 200,
    type: "expense",
    date: currentMonth.toISOString().slice(0, 10),
    category_id: "cat-2",
  },
  {
    amount: 350,
    type: "expense",
    date: currentMonth.toISOString().slice(0, 10),
    category_id: "cat-2",
  },
  {
    amount: 1000,
    type: "expense",
    date: previousMonth.toISOString().slice(0, 10),
    category_id: "cat-1",
  },
  {
    amount: 150,
    type: "expense",
    date: twoMonthsAgo.toISOString().slice(0, 10),
    category_id: "cat-4",
  },
];

test("calculateReportMetrics totals current-month income, expenses, and category breakdowns from real transactions", () => {
  const metrics = calculateReportMetrics(sampleTransactions, [
    { id: "cat-1", name: "Housing" },
    { id: "cat-2", name: "Food" },
    { id: "cat-3", name: "Salary" },
    { id: "cat-4", name: "Transport" },
  ]);

  assert.equal(metrics.summary.totalIncome, 3500);
  assert.equal(metrics.summary.totalExpenses, 550);
  assert.equal(metrics.summary.netCashFlow, 2950);
  assert.equal(metrics.summary.savingsRate, 84.29);
  assert.ok(
    metrics.categoryBreakdown.some(
      (item) => item.label === "Food" && item.amount === 550,
    ),
  );
  assert.equal(metrics.monthlyTrend.length, 6);
  assert.ok(
    metrics.topCategories.some(
      (item) => item.name === "Salary" && item.type === "income",
    ),
  );
});

test("includes income categories in breakdowns, top categories, and insights", () => {
  const metrics = calculateReportMetrics(
    [
      {
        amount: 4000,
        type: "income",
        date: currentMonth.toISOString().slice(0, 10),
        category_id: "investment",
      },
      {
        amount: 2000,
        type: "expense",
        date: currentMonth.toISOString().slice(0, 10),
        category_id: "food",
      },
    ],
    [
      { id: "investment", name: "Investment" },
      { id: "food", name: "Food" },
    ],
  );

  assert.deepEqual(
    metrics.categoryBreakdown.map(({ label, type, amount, percent }) => ({
      label,
      type,
      amount,
      percent,
    })),
    [
      { label: "Investment", type: "income", amount: 4000, percent: 100 },
      { label: "Food", type: "expense", amount: 2000, percent: 100 },
    ],
  );
  assert.ok(
    metrics.topCategories.some(
      (item) => item.name === "Investment" && item.type === "income",
    ),
  );
  assert.ok(
    metrics.insights.some(
      (insight) =>
        insight.type === "top-income-category" &&
        insight.category === "Investment",
    ),
  );
});

test("calculateReportMetrics filters by the selected report period", () => {
  const asOfDate = new Date("2026-09-26T12:00:00");
  const transactions = [
    { amount: 1200, type: "income", date: "2026-09-26" },
    { amount: 400, type: "expense", date: "2026-09-25" },
    { amount: 750, type: "expense", date: "2026-09-19" },
    { amount: 320, type: "expense", date: "2026-08-14" },
    { amount: 900, type: "income", date: "2025-12-29" },
  ];

  const dayMetrics = calculateReportMetrics(transactions, [], {
    period: "day",
    asOfDate,
  });
  const weekMetrics = calculateReportMetrics(transactions, [], {
    period: "week",
    asOfDate,
  });
  const yearMetrics = calculateReportMetrics(transactions, [], {
    period: "year",
    asOfDate,
  });

  assert.equal(dayMetrics.summary.totalIncome, 1200);
  assert.equal(dayMetrics.summary.totalExpenses, 0);
  assert.equal(weekMetrics.summary.totalExpenses, 400);
  assert.equal(yearMetrics.summary.totalIncome, 1200);
  assert.equal(yearMetrics.summary.totalExpenses, 1470);
});

test("formats report insight amounts with the selected currency", () => {
  assert.equal(
    formatReportInsight({ type: "positive-cash-flow", amount: 1500 }, "USD"),
    "Net cash flow is positive at +$1,500.00 for this period.",
  );
  assert.equal(
    formatReportInsight({ type: "negative-cash-flow", amount: -1500 }, "EUR"),
    "You are currently below your income by -€1,500.00 for this period.",
  );
  assert.equal(
    formatReportInsight(
      {
        type: "top-income-category",
        category: "Investment",
        percent: 100,
      },
      "PHP",
    ),
    "Investment is your largest income category, accounting for 100.0% of income.",
  );
});
