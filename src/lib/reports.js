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

function toCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function toSignedCurrency(value) {
  const formattedValue = toCurrency(Math.abs(Number(value) || 0));
  return value >= 0 ? `+${formattedValue}` : `-${formattedValue}`;
}

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
      month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(
        monthDate,
      ),
      value: Math.abs(value),
    });
  }

  return orderedEntries;
}

function buildSpendingBreakdown(transactions, categories) {
  const categoryMap = new Map(
    (categories ?? []).map((category) => [category.id, category]),
  );
  const totals = new Map();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const categoryId = transaction.category_id;
    const currentValue = totals.get(categoryId) || 0;
    totals.set(categoryId, currentValue + (Number(transaction.amount) || 0));
  }

  const expenseTotal = Array.from(totals.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  const entries = Array.from(totals.entries())
    .map(([categoryId, amount]) => {
      const category = categoryMap.get(categoryId) ?? {
        name: "Others",
        color: defaultCategoryPalette[0],
      };
      const percent = expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0;

      return {
        id: categoryId,
        label: category.name || "Others",
        amount,
        percent,
        color: category.color || defaultCategoryPalette[0],
      };
    })
    .sort((left, right) => right.amount - left.amount);

  return {
    entries,
    total: expenseTotal,
  };
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

  const spending = buildSpendingBreakdown(periodTransactions, categories);
  const breakdown = spending.entries.map((item) => ({
    ...item,
    amount: Number(item.amount) || 0,
    percent: Number(item.percent) || 0,
    formattedAmount: toCurrency(item.amount),
  }));

  const topCategories = breakdown.slice(0, 4).map((item) => ({
    name: item.label,
    amount: toCurrency(item.amount),
    percent: item.percent,
    color: item.color,
    change: "+0.0%",
  }));

  const insights = [];
  if (breakdown.length > 0) {
    const strongestCategory = breakdown[0];
    insights.push(
      `${strongestCategory.label} is your biggest spend area, accounting for ${strongestCategory.percent.toFixed(1)}% of expenses.`,
    );
  }

  if (netCashFlow >= 0) {
    insights.push(
      `Net cash flow is positive at ${toSignedCurrency(netCashFlow)} for this period.`,
    );
  } else {
    insights.push(
      `You are currently below your income by ${toSignedCurrency(netCashFlow)} for this period.`,
    );
  }

  if (savingsRate > 0) {
    insights.push(
      `Your savings rate is ${savingsRate.toFixed(1)}% based on the selected period's income.`,
    );
  } else if (expenseTotal > 0) {
    insights.push(
      "Your expenses remain above income for this period, so cash flow is tightening.",
    );
  }

  return {
    summary: {
      totalIncome: incomeTotal,
      totalExpenses: expenseTotal,
      netCashFlow,
      savingsRate: Number(savingsRate.toFixed(2)),
    },
    spendingBreakdown: breakdown,
    monthlyTrend: buildMonthlyTrend(periodTransactions, referenceDate, 6),
    topCategories,
    insights,
  };
}

export function formatCurrency(value) {
  return toCurrency(value);
}

export function formatSignedCurrency(value) {
  return toSignedCurrency(value);
}
