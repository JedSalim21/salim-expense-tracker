import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiChevronDown,
  FiDollarSign,
  FiPieChart,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
import CustomDateRangeFields from "../components/CustomDateRangeFields";
import PageLayout from "../components/PageLayout";
import SpendingBreakdown from "../components/SpendingBreakdown";
import { loadCategories } from "../lib/categories";
import { createSupabaseClient } from "../lib/supabase";
import {
  calculateReportMetrics,
  formatCurrency,
  getCustomDateRangeError,
  formatReportInsight,
  formatSignedCurrency,
} from "../lib/reports";
import {
  formatDateInputValue,
  formatDateInUserTimeZone,
} from "../lib/timezone";

const emptyReportMetrics = {
  summary: {
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    savingsRate: 0,
  },
  categoryBreakdown: [],
  monthlyTrend: [],
  topCategories: [],
  insights: [],
};

const toneClasses = {
  teal: "text-[#0f766e]",
  blue: "text-[#3c72a2]",
  amber: "text-[#c08222]",
  rose: "text-[#b86c83]",
};

export default function ReportsPage({
  currentView,
  onSelectView,
  currency,
  transactionsRevision,
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const supabase = useMemo(() => {
    if (!isLoaded || !isSignedIn) {
      return null;
    }

    return createSupabaseClient(getToken);
  }, [getToken, isLoaded, isSignedIn]);

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [customDateRange, setCustomDateRange] = useState(() => {
    const today = formatDateInputValue();
    return { start: today, end: today };
  });
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [reportMetrics, setReportMetrics] = useState(emptyReportMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const periodOptions = [
    { value: "day", label: "This day" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "year", label: "This year" },
    { value: "custom", label: "Custom Date Range" },
  ];
  const customRangeError =
    selectedPeriod === "custom" ?
      getCustomDateRangeError(customDateRange.start, customDateRange.end)
    : "";
  const selectedPeriodLabel =
    periodOptions.find((option) => option.value === selectedPeriod)?.label ??
    "This month";

  useEffect(() => {
    let isActive = true;

    if (selectedPeriod === "custom" && customRangeError) {
      return () => {
        isActive = false;
      };
    }

    const loadReportData = async () => {
      if (!isLoaded || !isSignedIn || !user?.id || !supabase) {
        if (isActive) {
          setReportMetrics(emptyReportMetrics);
          setIsLoading(false);
          setErrorMessage("");
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [categoryRows, transactionsResult] = await Promise.all([
          loadCategories(supabase, user.id),
          supabase
            .from("transactions")
            .select(
              "id, amount, type, description, category_id, payment_method_id, date, occurred_at, created_at, categories (id, name, color)",
            )
            .order("date", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

        if (transactionsResult.error) {
          throw transactionsResult.error;
        }

        if (!isActive) {
          return;
        }

        const normalizedTransactions = (transactionsResult.data ?? []).map(
          (transaction) => ({
            ...transaction,
            amount: Number(transaction.amount) || 0,
            date: transaction.date ?? transaction.occurred_at?.slice(0, 10),
          }),
        );

        setReportMetrics(
          calculateReportMetrics(normalizedTransactions, categoryRows, {
            period: selectedPeriod,
            dateRange: customDateRange,
          }),
        );
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error?.message ?? "Unable to load your reports right now.",
          );
          setReportMetrics(emptyReportMetrics);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadReportData();

    return () => {
      isActive = false;
    };
  }, [
    isLoaded,
    isSignedIn,
    supabase,
    user?.id,
    selectedPeriod,
    customDateRange,
    customRangeError,
    transactionsRevision,
  ]);

  const visibleReportMetrics =
    customRangeError ? emptyReportMetrics : reportMetrics;
  const isCurrentRangeLoading = isLoading && !customRangeError;
  const summaryData = [
    {
      label: "Net cash flow",
      value:
        isCurrentRangeLoading ? "—" : (
          formatSignedCurrency(visibleReportMetrics.summary.netCashFlow, currency)
        ),
      trend: visibleReportMetrics.summary.netCashFlow >= 0 ? "Healthy" : "Tight",
      icon: FiArrowUpRight,
      tone: "teal",
    },
    {
      label: "Income",
      value:
        isCurrentRangeLoading ? "—" : (
          formatCurrency(visibleReportMetrics.summary.totalIncome, currency)
        ),
      trend: selectedPeriodLabel,
      icon: FiTrendingUp,
      tone: "blue",
    },
    {
      label: "Expenses",
      value:
        isCurrentRangeLoading ? "—" : (
          formatCurrency(visibleReportMetrics.summary.totalExpenses, currency)
        ),
      trend: selectedPeriodLabel,
      icon: FiTrendingDown,
      tone: "amber",
    },
    {
      label: "Savings rate",
      value:
        isCurrentRangeLoading ? "—" : `${visibleReportMetrics.summary.savingsRate.toFixed(1)}%`,
      trend: visibleReportMetrics.summary.savingsRate >= 0 ? "Positive" : "Negative",
      icon: FiDollarSign,
      tone: "rose",
    },
  ];

  const monthlyTrend = visibleReportMetrics.monthlyTrend;
  const categoryBreakdown = visibleReportMetrics.categoryBreakdown;
  const expenseBreakdown = categoryBreakdown.filter(
    (item) => item.type === "expense",
  );
  const topCategories = visibleReportMetrics.topCategories;
  const recentInsights =
    visibleReportMetrics.insights.length > 0 ?
      visibleReportMetrics.insights
    : [{ type: "empty" }];
  const trendTitle =
    selectedPeriod === "day" ? "Daily spending" :
    selectedPeriod === "week" ? "Weekly spending" :
    selectedPeriod === "year" ? "Yearly spending" :
    selectedPeriod === "custom" ? "Custom date-range spending" :
    "Monthly spending";
  const customRangeLabel =
    selectedPeriod === "custom" && !customRangeError ?
      `${formatDateInUserTimeZone(new Date(`${customDateRange.start}T12:00:00`), { month: "short", day: "numeric", year: "numeric" })} → ${formatDateInUserTimeZone(new Date(`${customDateRange.end}T12:00:00`), { month: "short", day: "numeric", year: "numeric" })}`
    : "Custom Date Range";
  const trendViewLabel =
    selectedPeriod === "day" ? "24H view" :
    selectedPeriod === "week" ? "7D view" :
    selectedPeriod === "year" ? "Year view" :
    selectedPeriod === "custom" ? customRangeLabel :
    "Monthly view";

  const maxMonthlyValue =
    Math.max(...monthlyTrend.map((entry) => Number(entry.value) || 0), 0) || 1;

  return (
    <PageLayout
      ariaLabel="SalimSpend reports"
      currentView={currentView}
      onSelectView={onSelectView}
      footerText="Your money habits are looking steady."
      footerDotClassName="bg-[#0f766e] shadow-[0_0_0_4px_rgba(15,118,110,0.15)]"
    >
        <header className="mb-[24px] flex flex-wrap items-start justify-between gap-4 max-[860px]:flex-col max-[860px]:items-start max-[680px]:mb-6">
          <div className="min-w-0">
            <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
              Insights
            </p>
            <h1 className="mt-2 max-w-[540px] font-serif text-[clamp(32px,4vw,46px)] font-normal leading-[1.03] text-[var(--text-heading)]">
              Reports
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Track spending trends and understand where your money is going.
            </p>
          </div>

          <div className="relative">
            <button
              aria-expanded={isPeriodMenuOpen}
              aria-label="Select report period"
              className="inline-flex min-h-[42px] items-center justify-between gap-2 rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#115e59] focus-visible:outline-2 focus-visible:outline-[#0f766e] focus-visible:outline-offset-2"
              type="button"
              onClick={() =>
                setIsPeriodMenuOpen((currentState) => !currentState)
              }
            >
              <span className="inline-flex items-center gap-2">
                <FiCalendar aria-hidden="true" />
                {selectedPeriodLabel}
              </span>
              <FiChevronDown aria-hidden="true" />
            </button>

            {isPeriodMenuOpen ?
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[180px] overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                {periodOptions.map((option) => {
                  const isSelected = option.value === selectedPeriod;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition ${
                        isSelected ?
                          "bg-[#0f766e] text-white"
                        : "bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--panel-soft)]"
                      }`}
                      onClick={() => {
                        setSelectedPeriod(option.value);
                        setIsPeriodMenuOpen(false);
                      }}
                    >
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            : null}
          </div>
        </header>

        {errorMessage || customRangeError ?
          <div
            className="mb-4 rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {customRangeError || errorMessage}
          </div>
        : null}

        {selectedPeriod === "custom" ?
          <CustomDateRangeFields
            dateRange={customDateRange}
            onChange={setCustomDateRange}
            error={customRangeError}
          />
        : null}

        <div className="mb-[14px] grid grid-cols-4 gap-3 max-[980px]:grid-cols-2 max-[680px]:gap-2">
          {summaryData.map((item) => {
            const Icon = item.icon;

            return (
              <article
                className={`relative min-h-[126px] overflow-hidden rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-[18px] pb-4 max-[680px]:min-h-[116px] max-[680px]:p-[14px] ${toneClasses[item.tone]}`}
                key={item.label}
              >
                <span className="pointer-events-none absolute -bottom-10 -right-6 h-24 w-24 rounded-full border border-current opacity-10"></span>
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
                  <span>{item.label}</span>
                  <Icon className="text-base" aria-hidden="true" />
                </div>
                <strong className="mt-4 block font-serif text-[25px] font-normal tracking-[-0.01em] text-[var(--text-heading)] max-[680px]:text-xl">
                  {item.value}
                </strong>
                <span className="mt-[7px] block text-[11px] font-bold text-[var(--brand)]">
                  {item.trend}
                </span>
              </article>
            );
          })}
        </div>

        <div className="mb-[14px] grid grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)] gap-[14px] max-[980px]:grid-cols-1">
          <article className="rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-[22px] pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
                  Spend trend
                </p>
                <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                  {trendTitle}
                </h2>
              </div>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[var(--brand)]">
                <FiBarChart2 aria-hidden="true" />
                {trendViewLabel}
              </span>
            </div>

            {monthlyTrend.length === 0 ?
              <div className="mt-6 rounded-[8px] border border-dashed border-[var(--border)] bg-[var(--panel-soft)] p-5 text-sm text-[var(--text-secondary)]">
                {isCurrentRangeLoading ?
                  "Loading transactions..."
                : "No transaction data yet for this period."}
              </div>
            : <div className="mt-6 flex h-[220px] items-end gap-[10px] rounded-[8px] border border-[var(--border)] bg-[var(--panel-soft)] p-4 pt-5">
                {monthlyTrend.map((entry) => {
                  const value = Number(entry.value) || 0;
                  const barHeight =
                    maxMonthlyValue > 0 ?
                      `${Math.max((value / maxMonthlyValue) * 100, value > 0 ? 12 : 0)}%`
                    : "0%";

                  return (
                    <div
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      key={entry.month}
                    >
                      <div className="flex min-h-0 w-full flex-1 items-end justify-center">
                        <span
                          className="block w-full max-w-[26px] rounded-t-[6px] bg-[var(--brand)] shadow-[0_8px_18px_rgba(15,118,110,0.18)]"
                          style={{ height: barHeight }}
                        ></span>
                      </div>
                      <span className="font-mono text-[9px] text-[var(--text-muted)]">
                        {entry.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            }
          </article>

          <article className="rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-[22px] pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
                  Breakdown
                </p>
                <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                  By category
                </h2>
              </div>
              <FiPieChart aria-hidden="true" className="text-[var(--brand)]" />
            </div>

            <SpendingBreakdown
              categories={expenseBreakdown}
              total={visibleReportMetrics.summary.totalExpenses}
              currency={currency}
              periodLabel={selectedPeriodLabel}
              isLoading={isCurrentRangeLoading}
              emptyMessage="No expense category activity available yet."
              onSeeAll={() => onSelectView("transactions")}
            />
          </article>
        </div>

        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)] gap-[14px] max-[980px]:grid-cols-1">
          <article className="rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-[22px] pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
                  Top categories
                </p>
                <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                  Largest category activity
                </h2>
              </div>
            </div>

            {topCategories.length === 0 ?
              <div className="mt-4 text-sm text-[var(--text-secondary)]">
                {isCurrentRangeLoading ? "Loading spend areas..." : "No categories yet."}
              </div>
            : <div className="mt-4 space-y-3">
                {topCategories.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-[6px] border border-[var(--border)] bg-[var(--panel-soft)] px-3 py-2.5"
                    key={`${item.type}-${item.name}`}
                  >
                    <div>
                      <div className="text-[12px] font-bold text-[var(--text-heading)]">
                        {item.name} · {item.type}
                      </div>
                      <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                        {formatCurrency(item.amount, currency)}
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-[var(--brand)]">
                      {item.change}
                    </span>
                  </div>
                ))}
              </div>
            }
          </article>

          <article className="rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-[22px] pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
                  Signals
                </p>
                <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                  Quick insights
                </h2>
              </div>
              <FiArrowDownRight
                aria-hidden="true"
                className="text-[var(--brand)]"
              />
            </div>

            <ul className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              {recentInsights.map((insight, index) => (
                <li
                  className="flex gap-3"
                  key={`${insight.type ?? "insight"}-${index}`}
                >
                  <span className="mt-1.5 inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--brand)]"></span>
                  <span>{formatReportInsight(insight, currency)}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
    </PageLayout>
  );
}
