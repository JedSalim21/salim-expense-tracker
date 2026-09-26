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
import SidebarNav from "../components/SidebarNav";
import { loadCategories } from "../lib/categories";
import { createSupabaseClient } from "../lib/supabase";
import {
  calculateReportMetrics,
  formatCurrency,
  formatSignedCurrency,
} from "../lib/reports";

const emptyReportMetrics = {
  summary: {
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    savingsRate: 0,
  },
  spendingBreakdown: [],
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

export default function ReportsPage({ currentView, onSelectView }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const supabase = useMemo(() => {
    if (!isLoaded || !isSignedIn) {
      return null;
    }

    return createSupabaseClient(getToken);
  }, [getToken, isLoaded, isSignedIn]);

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [reportMetrics, setReportMetrics] = useState(emptyReportMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const periodOptions = [
    { value: "day", label: "This day" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "year", label: "This year" },
  ];
  const selectedPeriodLabel =
    periodOptions.find((option) => option.value === selectedPeriod)?.label ??
    "This month";

  useEffect(() => {
    let isActive = true;

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
  }, [isLoaded, isSignedIn, supabase, user?.id, selectedPeriod]);

  const summaryData = [
    {
      label: "Net cash flow",
      value:
        isLoading ? "—" : (
          formatSignedCurrency(reportMetrics.summary.netCashFlow)
        ),
      trend: reportMetrics.summary.netCashFlow >= 0 ? "Healthy" : "Tight",
      icon: FiArrowUpRight,
      tone: "teal",
    },
    {
      label: "Income",
      value:
        isLoading ? "—" : formatCurrency(reportMetrics.summary.totalIncome),
      trend: selectedPeriodLabel,
      icon: FiTrendingUp,
      tone: "blue",
    },
    {
      label: "Expenses",
      value:
        isLoading ? "—" : formatCurrency(reportMetrics.summary.totalExpenses),
      trend: selectedPeriodLabel,
      icon: FiTrendingDown,
      tone: "amber",
    },
    {
      label: "Savings rate",
      value:
        isLoading ? "—" : `${reportMetrics.summary.savingsRate.toFixed(1)}%`,
      trend: reportMetrics.summary.savingsRate >= 0 ? "Positive" : "Negative",
      icon: FiDollarSign,
      tone: "rose",
    },
  ];

  const monthlyTrend = reportMetrics.monthlyTrend;
  const spendingBreakdown = reportMetrics.spendingBreakdown;
  const topCategories = reportMetrics.topCategories;
  const recentInsights =
    reportMetrics.insights.length > 0 ?
      reportMetrics.insights
    : ["Add transactions to start building your spending report."];

  const maxMonthlyValue =
    Math.max(...monthlyTrend.map((entry) => Number(entry.value) || 0), 0) || 1;

  return (
    <section
      className="grid min-h-[calc(100svh-73px)] grid-cols-[216px_minmax(0,1fr)] bg-[var(--page-bg)] text-left text-[var(--text-primary)] max-[980px]:grid-cols-[176px_minmax(0,1fr)] max-[680px]:block"
      aria-label="SalimSpend reports"
    >
      <SidebarNav
        currentView={currentView}
        onSelectView={onSelectView}
        footerText="Your money habits are looking steady."
        footerDotClassName="bg-[#0f766e] shadow-[0_0_0_4px_rgba(15,118,110,0.15)]"
      />

      <div className="min-w-0 px-[46px] pb-14 pt-[42px] max-[980px]:px-7 max-[980px]:pb-[46px] max-[680px]:px-[18px] max-[680px]:pb-[38px] max-[680px]:pt-7">
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

        {errorMessage ?
          <div className="mb-4 rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
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
                  Monthly spending
                </h2>
              </div>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[var(--brand)]">
                <FiBarChart2 aria-hidden="true" />
                6M view
              </span>
            </div>

            {monthlyTrend.length === 0 ?
              <div className="mt-6 rounded-[8px] border border-dashed border-[var(--border)] bg-[var(--panel-soft)] p-5 text-sm text-[var(--text-secondary)]">
                {isLoading ?
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
                      className="flex flex-1 flex-col items-center justify-end gap-2"
                      key={entry.month}
                    >
                      <div className="flex h-full w-full items-end justify-center">
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

            {spendingBreakdown.length === 0 ?
              <div className="mt-5 text-sm text-[var(--text-secondary)]">
                {isLoading ?
                  "Loading category totals..."
                : "No expense breakdown available yet."}
              </div>
            : <div className="mt-5 grid gap-3">
                {spendingBreakdown.map((item) => (
                  <div className="grid gap-1.5" key={item.label}>
                    <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-[7px]">
                        <i
                          className="inline-block h-[7px] w-[7px] rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></i>
                        {item.label}
                      </span>
                      <span className="font-bold text-[var(--text-heading)]">
                        {item.percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-[7px] overflow-hidden rounded-full bg-[var(--surface-alt)]">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.color,
                        }}
                      ></span>
                    </div>
                    <div className="text-right text-[10px] font-bold text-[var(--text-secondary)]">
                      {item.formattedAmount}
                    </div>
                  </div>
                ))}
              </div>
            }
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
                  Biggest spend areas
                </h2>
              </div>
            </div>

            {topCategories.length === 0 ?
              <div className="mt-4 text-sm text-[var(--text-secondary)]">
                {isLoading ? "Loading spend areas..." : "No categories yet."}
              </div>
            : <div className="mt-4 space-y-3">
                {topCategories.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-[6px] border border-[var(--border)] bg-[var(--panel-soft)] px-3 py-2.5"
                    key={item.name}
                  >
                    <div>
                      <div className="text-[12px] font-bold text-[var(--text-heading)]">
                        {item.name}
                      </div>
                      <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                        {item.amount}
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
              {recentInsights.map((insight) => (
                <li className="flex gap-3" key={insight}>
                  <span className="mt-1.5 inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--brand)]"></span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
