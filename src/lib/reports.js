import {
  formatCurrency as formatCurrencyValue,
  formatSignedCurrency as formatSignedCurrencyValue,
} from "./currency.js";
import { getUserTimeZone } from "./timezone.js";

const defaultCategoryPalette = [
  "#0f766e",
  "#f59e0b",
  "#2563eb",
  "#e879a8",
  "#8b5cf6",
  "#64748b",
  "#14b8a6",
  "#ef4444",
];

function getMonthKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getStartOfWeek(date) {
  const nextDate = new Date(date);
  const dayNumber = nextDate.getDay();
  const diffToMonday = dayNumber === 0 ? -6 : 1 - dayNumber;
  nextDate.setDate(nextDate.getDate() + diffToMonday);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getEndOfWeek(date) {
  const nextDate = getStartOfWeek(date);
  nextDate.setDate(nextDate.getDate() + 6);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

function getPeriodBounds(referenceDate, period = "month") {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);

  switch (period) {
    case "day":
      return {
        start: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          0,
          0,
          0,
          0,
        ),
        end: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          23,
          59,
          59,
          999,
        ),
      };
    case "week":
      return {
        start: getStartOfWeek(date),
        end: getEndOfWeek(date),
      };
    case "year":
      return {
        start: new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0),
        end: new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    case "month":
    default:
      return {
        start: new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0),
        end: new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      };
  }
}

function buildMonthlyTrend(transactions, asOfDate = new Date(), months = 6) {
  const monthlyTotals = new Map();
  const reference = new Date(asOfDate);
  reference.setDate(1);
  reference.setHours(0, 0, 0, 0);

  for (let index = 0; index < months; index += 1) {
    const monthDate = new Date(
      reference.getFullYear(),
      reference.getMonth() - index,
      1,
    );
    const monthKey = getMonthKey(monthDate);
    monthlyTotals.set(monthKey, 0);
  }

  for (const transaction of transactions) {
    const monthKey = getMonthKey(
      transaction.date ?? transaction.occurred_at ?? new Date(),
    );
    if (!monthKey) {
      continue;
    }

    if (!monthlyTotals.has(monthKey)) {
      monthlyTotals.set(monthKey, 0);
    }

    const amount = Number(transaction.amount) || 0;
    const signedAmount = transaction.type === "income" ? amount : -amount;
    monthlyTotals.set(
      monthKey,
      (monthlyTotals.get(monthKey) || 0) + signedAmount,
    );
  }

  const orderedEntries = [];
  for (let index = months - 1; index >= 0; index -= 1) {
    const monthDate = new Date(
      reference.getFullYear(),
      reference.getMonth() - index,
      1,
    );
    const monthKey = getMonthKey(monthDate);
    const value = monthlyTotals.get(monthKey) || 0;
    orderedEntries.push({
      month: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: getUserTimeZone(),
      }).format(monthDate),
      value: Math.abs(value),
    });
  }

  return orderedEntries;
}

function buildCategoryBreakdown(transactions, categories) {
  const categoryMap = new Map(
    (categories ?? []).map((category) => [category.id, category]),
  );
  const totals = new Map();

  for (const transaction of transactions) {
    if (!["income", "expense"].includes(transaction.type)) {
      continue;
    }

    const categoryId = transaction.category_id;
    const key = `${transaction.type}:${categoryId}`;
    const currentValue = totals.get(key) || { amount: 0 };
    totals.set(key, {
      categoryId,
      type: transaction.type,
      amount: currentValue.amount + (Number(transaction.amount) || 0),
    });
  }

  const typeTotals = new Map();
  for (const { type, amount } of totals.values()) {
    typeTotals.set(type, (typeTotals.get(type) || 0) + amount);
  }

  const entries = Array.from(totals.entries())
    .map(([key, { categoryId, type, amount }]) => {
      const category = categoryMap.get(categoryId) ?? {
        name: "Others",
        color: defaultCategoryPalette[0],
      };
      const typeTotal = typeTotals.get(type) || 0;
      const percent = typeTotal > 0 ? (amount / typeTotal) * 100 : 0;

      return {
        id: key,
        label: category.name || "Others",
        type,
        amount,
        percent,
        color: category.color || defaultCategoryPalette[0],
      };
    })
    .sort((left, right) => right.amount - left.amount);

  return entries;
}

export function calculateReportMetrics(
  transactions,
  categories = [],
  options = {},
) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const period = options.period ?? "month";
  const referenceDate =
    options.asOfDate ? new Date(options.asOfDate) : new Date();
  const bounds = getPeriodBounds(referenceDate, period);

  const periodTransactions = safeTransactions.filter((transaction) => {
    const value = transaction.date ?? transaction.occurred_at;
    if (!value) {
      return false;
    }

    const timestamp = new Date(`${value}T00:00:00`);
    if (Number.isNaN(timestamp.getTime())) {
      return false;
    }

    return timestamp >= bounds.start && timestamp <= bounds.end;
  });

  const incomeTotal = periodTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const expenseTotal = periodTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const netCashFlow = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? (netCashFlow / incomeTotal) * 100 : 0;

  const breakdown = buildCategoryBreakdown(periodTransactions, categories).map(
    (item) => ({
      ...item,
      amount: Number(item.amount) || 0,
      percent: Number(item.percent) || 0,
    }),
  );

  const topCategories = breakdown.slice(0, 4).map((item) => ({
    name: item.label,
    type: item.type,
    amount: item.amount,
    percent: item.percent,
    color: item.color,
    change: "+0.0%",
  }));

  const insights = [];
  const strongestExpenseCategory = breakdown.find(
    (item) => item.type === "expense",
  );
  if (strongestExpenseCategory) {
    insights.push({
      type: "top-category",
      category: strongestExpenseCategory.label,
      percent: strongestExpenseCategory.percent,
    });
  }

  const strongestIncomeCategory = breakdown.find(
    (item) => item.type === "income",
  );
  if (strongestIncomeCategory) {
    insights.push({
      type: "top-income-category",
      category: strongestIncomeCategory.label,
      percent: strongestIncomeCategory.percent,
    });
  }

  if (netCashFlow >= 0) {
    insights.push({ type: "positive-cash-flow", amount: netCashFlow });
  } else {
    insights.push({ type: "negative-cash-flow", amount: netCashFlow });
  }

  if (savingsRate > 0) {
    insights.push({ type: "savings-rate", rate: savingsRate });
  } else if (expenseTotal > 0) {
    insights.push({ type: "cash-flow-tightening" });
  }

  return {
    summary: {
      totalIncome: incomeTotal,
      totalExpenses: expenseTotal,
      netCashFlow,
      savingsRate: Number(savingsRate.toFixed(2)),
    },
    categoryBreakdown: breakdown,
    monthlyTrend: buildMonthlyTrend(periodTransactions, referenceDate, 6),
    topCategories,
    insights,
  };
}

export function buildDashboardData(
  transactions,
  categories = [],
  options = {},
) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const period = options.period ?? "month";
  const referenceDate =
    options.asOfDate ? new Date(options.asOfDate) : new Date();
  const bounds = getPeriodBounds(referenceDate, period);
  const categoryMap = new Map(
    (categories ?? []).map((category) => [category.id, category]),
  );

  const periodTransactions = safeTransactions
    .map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount) || 0,
      date: transaction.date ?? transaction.occurred_at?.slice(0, 10),
    }))
    .filter((transaction) => {
      const value = transaction.date ?? transaction.occurred_at;
      if (!value) {
        return false;
      }

      const timestamp = new Date(`${value}T00:00:00`);
      if (Number.isNaN(timestamp.getTime())) {
        return false;
      }

      return timestamp >= bounds.start && timestamp <= bounds.end;
    })
    .sort((left, right) => {
      const leftTimestamp = new Date(
        `${left.date ?? left.occurred_at ?? "1970-01-01"}T00:00:00`,
      );
      const rightTimestamp = new Date(
        `${right.date ?? right.occurred_at ?? "1970-01-01"}T00:00:00`,
      );
      return rightTimestamp - leftTimestamp;
    });

  const incomeTotal = periodTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const expensesTotal = periodTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const expenseBreakdownMap = new Map();
  for (const transaction of periodTransactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const categoryId = transaction.category_id ?? "uncategorized";
    const category = categoryMap.get(categoryId) ?? {
      name: "Uncategorized",
      color: defaultCategoryPalette[0],
    };
    const currentValue = expenseBreakdownMap.get(categoryId) ?? {
      label: category.name || "Uncategorized",
      color: category.color || defaultCategoryPalette[0],
      amount: 0,
    };

    currentValue.amount += Number(transaction.amount) || 0;
    expenseBreakdownMap.set(categoryId, currentValue);
  }

  const categoryBreakdown = Array.from(expenseBreakdownMap.values())
    .sort((left, right) => right.amount - left.amount)
    .map((entry) => ({
      ...entry,
      amount: Number(entry.amount) || 0,
      percent:
        expensesTotal > 0 ?
          ((Number(entry.amount) || 0) / expensesTotal) * 100
        : 0,
    }));

  const recentTransactions = periodTransactions
    .slice(0, 5)
    .map((transaction) => {
      const category = categoryMap.get(transaction.category_id) ?? {
        name: "Uncategorized",
        color: defaultCategoryPalette[0],
      };
      const merchant =
        (transaction.description ?? "").trim() ||
        (transaction.type === "income" ? "Income" : "Expense");

      return {
        id:
          transaction.id ?? `${merchant}-${transaction.date ?? "transaction"}`,
        merchant,
        category: category.name || "Uncategorized",
        date: transaction.date ?? transaction.occurred_at?.slice(0, 10),
        amount:
          transaction.type === "income" ?
            Number(transaction.amount) || 0
          : -(Number(transaction.amount) || 0),
        color: category.color || defaultCategoryPalette[0],
        glyph: (category.name || merchant).charAt(0).toUpperCase() || "T",
      };
    });

  return {
    summary: {
      incomeTotal,
      expensesTotal,
      balance: incomeTotal - expensesTotal,
    },
    categoryBreakdown,
    recentTransactions,
  };
}

export function formatCurrency(value, currency) {
  return formatCurrencyValue(value, currency);
}

export function formatSignedCurrency(value, currency) {
  return formatSignedCurrencyValue(value, currency);
}

export function formatReportInsight(insight, currency) {
  switch (insight.type) {
    case "top-category":
      return `${insight.category} is your biggest spend area, accounting for ${insight.percent.toFixed(1)}% of expenses.`;
    case "top-income-category":
      return `${insight.category} is your largest income category, accounting for ${insight.percent.toFixed(1)}% of income.`;
    case "positive-cash-flow":
      return `Net cash flow is positive at ${formatSignedCurrencyValue(insight.amount, currency)} for this period.`;
    case "negative-cash-flow":
      return `You are currently below your income by ${formatSignedCurrencyValue(insight.amount, currency)} for this period.`;
    case "savings-rate":
      return `Your savings rate is ${insight.rate.toFixed(1)}% based on the selected period's income.`;
    case "cash-flow-tightening":
      return "Your expenses remain above income for this period, so cash flow is tightening.";
    default:
      return "Add transactions to start building your spending report.";
  }
}
