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

function parseDateInput(value, endOfDay = false) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getCustomRangeBounds(dateRange) {
  const start = parseDateInput(dateRange?.start);
  const end = parseDateInput(dateRange?.end, true);
  if (!start || !end || start > end) {
    return null;
  }

  return { start, end };
}

export function getCustomDateRangeError(startDate, endDate) {
  if (!startDate || !endDate) {
    return "Select both a start date and an end date.";
  }

  if (startDate > endDate) {
    return "Start date must be on or before end date.";
  }

  return "";
}

function getPeriodBounds(referenceDate, period = "month", dateRange) {
  if (period === "custom") {
    return getCustomRangeBounds(dateRange);
  }

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

function getTrendBuckets(
  period = "month",
  referenceDate = new Date(),
  dateRange,
) {
  if (period === "custom") {
    const bounds = getCustomRangeBounds(dateRange);
    if (!bounds) {
      return [];
    }

    const start = new Date(bounds.start);
    const end = new Date(bounds.end);
    const dayCount =
      Math.floor(
        (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
          Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
          86400000,
      ) + 1;
    const bucketSize = Math.max(1, Math.ceil(dayCount / 12));
    const buckets = [];

    for (let offset = 0; offset < dayCount; offset += bucketSize) {
      const bucketStart = new Date(start);
      bucketStart.setDate(start.getDate() + offset);
      const bucketEnd = new Date(bucketStart);
      const bucketDayCount = Math.min(bucketSize, dayCount - offset);
      if (offset + bucketDayCount >= dayCount) {
        bucketEnd.setTime(end.getTime());
      } else {
        bucketEnd.setDate(bucketStart.getDate() + bucketDayCount - 1);
        bucketEnd.setHours(23, 59, 59, 999);
      }

      const dateLabelOptions = {
        month: "short",
        day: "numeric",
        timeZone: getUserTimeZone(),
      };
      const startLabel = new Intl.DateTimeFormat(
        "en-US",
        dateLabelOptions,
      ).format(bucketStart);
      const endLabel = new Intl.DateTimeFormat(
        "en-US",
        dateLabelOptions,
      ).format(bucketEnd);
      const label =
        bucketDayCount === 1 ? startLabel : `${startLabel}–${endLabel}`;

      buckets.push({
        key: `custom-${offset}`,
        label,
        start: bucketStart,
        end: bucketEnd,
      });
    }

    return buckets;
  }

  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);

  if (period === "day") {
    return Array.from({ length: 6 }, (_, index) => {
      const startHour = index * 4;
      const start = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        startHour,
        0,
        0,
        0,
      );
      const end = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        index === 5 ? 23 : startHour + 3,
        index === 5 ? 59 : 59,
        index === 5 ? 59 : 59,
        index === 5 ? 999 : 999,
      );

      return {
        key: `day-${index}`,
        label: `${String(startHour).padStart(2, "0")}:00`,
        start,
        end,
      };
    });
  }

  if (period === "week") {
    const weekStart = getStartOfWeek(date);

    return Array.from({ length: 7 }, (_, index) => {
      const start = new Date(weekStart);
      start.setDate(weekStart.getDate() + index);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      return {
        key: `week-${start.toISOString().slice(0, 10)}`,
        label: new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          timeZone: getUserTimeZone(),
        }).format(start),
        start,
        end,
      };
    });
  }

  if (period === "year") {
    return Array.from({ length: 12 }, (_, index) => {
      const start = new Date(date.getFullYear(), index, 1, 0, 0, 0, 0);
      const end = new Date(date.getFullYear(), index + 1, 0, 23, 59, 59, 999);

      return {
        key: `year-${index}`,
        label: new Intl.DateTimeFormat("en-US", {
          month: "short",
          timeZone: getUserTimeZone(),
        }).format(start),
        start,
        end,
      };
    });
  }

  const monthEnd = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  const daysInMonth = monthEnd.getDate();
  const bucketCount = 6;
  const chunkSize = Math.max(1, Math.ceil(daysInMonth / bucketCount));

  return Array.from({ length: bucketCount }, (_, index) => {
    const chunkStartDay = index * chunkSize + 1;
    const chunkEndDay = Math.min(chunkStartDay + chunkSize - 1, daysInMonth);
    const start = new Date(
      date.getFullYear(),
      date.getMonth(),
      chunkStartDay,
      0,
      0,
      0,
      0,
    );
    const end = new Date(
      date.getFullYear(),
      date.getMonth(),
      chunkEndDay,
      23,
      59,
      59,
      999,
    );

    return {
      key: `month-${index}`,
      label: `W${index + 1}`,
      start,
      end,
    };
  });
}

function buildTrendSeries(
  transactions,
  period = "month",
  asOfDate = new Date(),
  dateRange,
) {
  const buckets = getTrendBuckets(period, asOfDate, dateRange);
  const totals = new Map(
    buckets.map((bucket) => [bucket.key, { income: 0, expenses: 0 }]),
  );

  for (const transaction of transactions) {
    const value = transaction.date ?? transaction.occurred_at;
    if (!value) {
      continue;
    }

    const timestamp = new Date(`${value}T12:00:00`);
    if (Number.isNaN(timestamp.getTime())) {
      continue;
    }

    const bucket = buckets.find(
      ({ start, end }) => timestamp >= start && timestamp <= end,
    );
    if (!bucket) {
      continue;
    }

    const current = totals.get(bucket.key) ?? { income: 0, expenses: 0 };
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "income") {
      current.income += amount;
    } else if (transaction.type === "expense") {
      current.expenses += amount;
    }

    totals.set(bucket.key, current);
  }

  return buckets.map((bucket) => ({
    month: bucket.label,
    value: totals.get(bucket.key)?.expenses ?? 0,
    income: totals.get(bucket.key)?.income ?? 0,
    expenses: totals.get(bucket.key)?.expenses ?? 0,
  }));
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
  const bounds = getPeriodBounds(referenceDate, period, options.dateRange);

  const periodTransactions = safeTransactions.filter((transaction) => {
    const value = transaction.date ?? transaction.occurred_at;
    if (!value) {
      return false;
    }

    const timestamp = new Date(`${value}T00:00:00`);
    if (Number.isNaN(timestamp.getTime())) {
      return false;
    }

    return bounds && timestamp >= bounds.start && timestamp <= bounds.end;
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
    monthlyTrend: buildTrendSeries(
      periodTransactions,
      period,
      referenceDate,
      options.dateRange,
    ),
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
  const bounds = getPeriodBounds(referenceDate, period, options.dateRange);
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

      return bounds && timestamp >= bounds.start && timestamp <= bounds.end;
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
    cashFlow: buildTrendSeries(
      periodTransactions,
      period,
      referenceDate,
      options.dateRange,
    ),
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
