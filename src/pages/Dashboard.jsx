import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  FiArrowRight,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiDollarSign,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
import SidebarNav from "../components/SidebarNav";
import { loadCategories } from "../lib/categories";
import { buildDashboardData, formatCurrency } from "../lib/reports";
import { formatSignedCurrency } from "../lib/currency";
import { createSupabaseClient } from "../lib/supabase";

const toneClasses = {
  teal: "text-[var(--brand)]",
  blue: "text-[var(--info)]",
  amber: "text-[var(--warning)]",
  rose: "text-[var(--accent-rose)]",
};

const summaryIcons = {
  teal: FiDollarSign,
  blue: FiTrendingUp,
  amber: FiTrendingDown,
  rose: FiCreditCard,
};

const cashFlow = [
  { month: "Apr", income: 63, expenses: 36 },
  { month: "May", income: 72, expenses: 42 },
  { month: "Jun", income: 57, expenses: 35 },
  { month: "Jul", income: 82, expenses: 46 },
  { month: "Aug", income: 68, expenses: 40 },
  { month: "Sep", income: 88, expenses: 44 },
];

const emptyDashboardData = {
  summary: {
    incomeTotal: 0,
    expensesTotal: 0,
    balance: 0,
  },
  categoryBreakdown: [],
  recentTransactions: [],
};

export default function Dashboard({
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
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(emptyDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const periodOptions = [
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "year", label: "This year" },
  ];
  const selectedPeriodLabel =
    periodOptions.find((option) => option.value === selectedPeriod)?.label ??
    "This month";

  useEffect(() => {
    let isActive = true;

    const loadDashboardData = async () => {
      if (!isLoaded || !isSignedIn || !user?.id || !supabase) {
        if (isActive) {
          setDashboardData(emptyDashboardData);
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
              "id, amount, type, description, category_id, date, occurred_at, created_at, categories (id, name, color)",
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
            category_id: transaction.category_id,
            type: transaction.type,
          }),
        );

        setDashboardData(
          buildDashboardData(normalizedTransactions, categoryRows, {
            period: selectedPeriod,
          }),
        );
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error?.message ?? "Unable to load your dashboard right now.",
          );
          setDashboardData(emptyDashboardData);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isActive = false;
    };
  }, [
    isLoaded,
    isSignedIn,
    supabase,
    user?.id,
    selectedPeriod,
    transactionsRevision,
  ]);

  const summaryCards = [
    {
      label: "Income",
      value: dashboardData.summary.incomeTotal,
      detail: `${selectedPeriodLabel} income`,
      tone: "blue",
    },
    {
      label: "Expenses",
      value: dashboardData.summary.expensesTotal,
      detail: `${selectedPeriodLabel} spending`,
      tone: "amber",
    },
    {
      label: "Current balance",
      value: dashboardData.summary.balance,
      detail: `${selectedPeriodLabel} net cash flow`,
      tone: "teal",
    },
    {
      label: "Transactions",
      value: dashboardData.recentTransactions.length,
      detail: `${selectedPeriodLabel} activity`,
      tone: "rose",
    },
  ];

  const activeExpenseBreakdown = dashboardData.categoryBreakdown;
  const savingsPercent =
    dashboardData.summary.incomeTotal > 0 ?
      (dashboardData.summary.balance / dashboardData.summary.incomeTotal) * 100
    : 0;
  const chartBackground =
    activeExpenseBreakdown.length > 0 ?
      (() => {
        let start = 0;
        const segments = activeExpenseBreakdown.map((category) => {
          const end = start + (category.percent || 0);
          const segment = `${category.color} ${start}% ${end}%`;
          start = end;
          return segment;
        });

        return `conic-gradient(${segments.join(", ")})`;
      })()
    : "conic-gradient(#e9e8e0 0 100%)";

  return (
    <section
      className="grid min-h-[calc(100svh-73px)] grid-cols-[216px_minmax(0,1fr)] bg-[var(--page-bg)] text-left text-[var(--text-primary)] max-[980px]:grid-cols-[176px_minmax(0,1fr)] max-[680px]:block max-[680px]:pb-[72px]"
      aria-label="SalimSpend dashboard"
    >
      <SidebarNav
        currentView={currentView}
        onSelectView={onSelectView}
        footerText="Everything looks steady this month."
        footerDotClassName="bg-[#e5a644] shadow-[0_0_0_4px_rgba(229,166,68,0.15)]"
      />

      <div
        className="min-w-0 px-[46px] pb-14 pt-[42px] max-[980px]:px-7 max-[980px]:pb-[46px] max-[680px]:px-[18px] max-[680px]:pb-[38px] max-[680px]:pt-7"
        id="dashboard"
      >
        <header className="mb-[30px] flex items-start justify-between gap-6 max-[680px]:mb-5 max-[680px]:block">
          <div className="max-[680px]:hidden">
            <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
              Monday, September 23, 2026
            </p>
            <h1 className="my-2 font-serif text-[clamp(32px,4vw,48px)] font-normal leading-[1.03] text-[var(--text-heading)]">
              Good morning, Salim.
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Here is the shape of your money this month.
            </p>
          </div>
          <h1 className="hidden font-serif text-[clamp(34px,7vw,42px)] font-normal leading-[1.03] text-[var(--text-heading)] max-[680px]:mt-0 max-[680px]:mb-4 max-[680px]:block">
            Dashboard
          </h1>

          <div className="relative max-[680px]:hidden max-[680px]:mt-0 max-[680px]:w-full">
            <button
              aria-expanded={isPeriodMenuOpen}
              className="mt-0 inline-flex min-h-[38px] items-center gap-[8px] whitespace-nowrap rounded-[5px] border border-transparent bg-[var(--brand)] px-3 text-xs font-bold text-white transition hover:bg-[var(--brand-strong)] focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2 max-[680px]:w-full max-[680px]:justify-between max-[680px]:px-4"
              type="button"
              onClick={() =>
                setIsPeriodMenuOpen((currentState) => !currentState)
              }
            >
              <FiCalendar aria-hidden="true" />
              {periodOptions.find((option) => option.value === selectedPeriod)
                ?.label ?? "This month"}
              <FiChevronDown aria-hidden="true" />
            </button>
            {isPeriodMenuOpen ?
              <div className="absolute right-0 z-20 mt-2 w-[160px] rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg">
                {periodOptions.map((option) => (
                  <button
                    className={`block w-full rounded-[4px] px-3 py-2 text-left text-sm ${selectedPeriod === option.value ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--text-primary)] hover:bg-[var(--brand-soft)]"}`}
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSelectedPeriod(option.value);
                      setIsPeriodMenuOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            : null}
          </div>
        </header>

        {errorMessage ?
          <div className="mb-4 rounded-[6px] border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {errorMessage}
          </div>
        : null}

        <div className="mb-[14px] grid grid-cols-4 gap-3 max-[980px]:grid-cols-2 max-[680px]:grid-cols-2 max-[680px]:gap-2">
          {summaryCards.map((card) => {
            const Icon = summaryIcons[card.tone];
            const isMobileHiddenSummaryCard =
              card.label === "Transactions" || card.label === "Current balance";

            return (
              <article
                className={`relative min-h-[126px] overflow-hidden rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-[18px] pb-4 text-[var(--text-primary)] max-[680px]:min-h-[116px] max-[680px]:p-[14px] ${isMobileHiddenSummaryCard ? "max-[680px]:hidden" : ""} ${toneClasses[card.tone]}`}
                key={card.label}
              >
                <span className="pointer-events-none absolute -bottom-10 -right-6 h-24 w-24 rounded-full border border-current opacity-10"></span>
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
                  <span>{card.label}</span>
                  <Icon className="text-base" aria-hidden="true" />
                </div>
                <strong className="mt-4 block font-serif text-[25px] font-normal tracking-[-0.01em] text-[var(--text-heading)] max-[680px]:text-xl">
                  {card.label === "Transactions" ?
                    card.value
                  : formatCurrency(card.value, currency)}
                </strong>
                <span className="mt-[7px] block text-[11px] font-bold text-[var(--brand)]">
                  {card.detail}
                </span>
              </article>
            );
          })}
        </div>

        <div className="hidden max-[680px]:block">
          <div className="mb-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface-alt)] p-[14px]">
            <div className="text-[11px] font-bold text-[var(--text-muted)]">
              <span>Current Balance</span>
            </div>
            <div className="mt-3 font-serif text-[28px] font-normal leading-none text-[var(--text-heading)]">
              {formatCurrency(dashboardData.summary.balance, currency)}
            </div>
            <div className="mt-3 h-[8px] overflow-hidden rounded-full bg-[var(--surface-soft)]">
              <span
                className="block h-full rounded-full bg-[var(--brand)]"
                style={{
                  width: `${Math.min(Math.max(savingsPercent, 0), 100)}%`,
                }}
              ></span>
            </div>
            <div className="mt-2 text-[10px] font-bold text-[var(--brand)]">
              {Math.round(savingsPercent)}% of income saved
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-[6px] border border-[var(--border)] bg-[var(--surface-alt)] p-[2px]">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedPeriod(option.value)}
                className={`min-h-[30px] rounded-[4px] text-[11px] font-bold ${selectedPeriod === option.value ? "bg-[var(--brand)] text-white" : "text-[var(--text-secondary)]"}`}
              >
                {option.label.replace("This ", "")}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-[14px] grid grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)] gap-[14px] max-[980px]:grid-cols-1">
          <article className="rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-[22px] pb-5 max-[680px]:hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
                  Cash flow
                </p>
                <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                  Income vs expenses
                </h2>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                Last 6 months
              </span>
            </div>
            <div className="mt-3 flex justify-end gap-4 text-[11px] text-[var(--text-muted)] max-[680px]:justify-start">
              <span className="inline-flex items-center gap-[5px]">
                <i className="h-[7px] w-[7px] rounded-full bg-[var(--brand)]"></i>
                Income
              </span>
              <span className="inline-flex items-center gap-[5px]">
                <i className="h-[7px] w-[7px] rounded-full bg-[var(--warning)]"></i>
                Expenses
              </span>
            </div>
            <div
              className="mt-[18px] flex h-[204px]"
              aria-label="Bar chart comparing income and expenses from April to September"
            >
              <div className="flex w-[88px] shrink-0 flex-col justify-between pb-[23px] pt-1 font-mono text-[8px] text-[#adb2aa]">
                {[8000, 6000, 4000, 2000, 0].map((amount) => (
                  <span key={amount}>{formatCurrency(amount, currency)}</span>
                ))}
              </div>
              <div className="relative grid min-w-0 flex-1 grid-cols-6 gap-[10px] border-b border-[#e4e5df]">
                <div className="pointer-events-none absolute inset-x-0 bottom-[23px] top-0 flex flex-col justify-between">
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                  <span className="border-t border-dashed border-[#e5e6e0]"></span>
                </div>
                {cashFlow.map((month) => (
                  <div
                    className="relative z-10 flex min-w-0 flex-col justify-end"
                    key={month.month}
                  >
                    <div className="flex h-[calc(100%-23px)] items-end justify-center gap-[3px]">
                      <span
                        className="block min-h-1 w-[min(17px,40%)] rounded-t-[3px] bg-[var(--brand)]"
                        style={{ height: `${month.income}%` }}
                      ></span>
                      <span
                        className="block min-h-1 w-[min(17px,40%)] rounded-t-[3px] bg-[var(--warning)]"
                        style={{ height: `${month.expenses}%` }}
                      ></span>
                    </div>
                    <span className="block pt-2 text-center font-mono text-[9px] text-[#9a9d95]">
                      {month.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-[22px] pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
                  Spending breakdown
                </p>
                <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                  Where it goes
                </h2>
              </div>
            </div>
            <div className="grid gap-4 py-4 max-[680px]:hidden">
              <div
                className="mx-auto grid h-[138px] w-[138px] place-items-center rounded-full"
                style={{ background: chartBackground }}
                aria-label={`Spending breakdown for ${selectedPeriodLabel}`}
              >
                <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-[var(--surface)] max-[680px]:h-[78px] max-[680px]:w-[78px]">
                  <strong className="font-serif text-xl font-normal text-[var(--text-heading)] max-[680px]:text-[17px]">
                    {formatCurrency(
                      dashboardData.summary.expensesTotal,
                      currency,
                    )}
                  </strong>
                  <span className="-mt-5 text-[10px] text-[var(--text-muted)]">
                    spent
                  </span>
                </div>
              </div>
              <div className="grid gap-3">
                {activeExpenseBreakdown.length > 0 ?
                  activeExpenseBreakdown.map((category) => (
                    <div
                      className="flex items-center justify-between gap-3 text-[10px] text-[var(--text-muted)]"
                      key={`${category.label}-${category.color}`}
                    >
                      <span className="flex min-w-0 items-center gap-[7px] text-[var(--text-secondary)]">
                        <i
                          className="inline-block h-[7px] w-[7px] rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></i>
                        {category.label}
                      </span>
                      <strong className="text-right text-[11px] text-[var(--text-primary)]">
                        {Math.round(category.percent)}%
                      </strong>
                      <span>{formatCurrency(category.amount, currency)}</span>
                    </div>
                  ))
                : <div className="rounded-[6px] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-4 text-center text-[11px] text-[var(--text-secondary)]">
                    No expense data for {selectedPeriodLabel.toLowerCase()}.
                  </div>
                }
              </div>
            </div>
            <div className="hidden max-[680px]:block pt-2">
              {activeExpenseBreakdown.length > 0 ?
                <div className="grid gap-3">
                  {activeExpenseBreakdown.map((category) => (
                    <div
                      className="grid gap-2"
                      key={`${category.label}-${category.color}`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] text-[var(--text-secondary)]">
                        <span>{category.label}</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {formatCurrency(category.amount, currency)}
                        </span>
                      </div>
                      <div className="h-[6px] overflow-hidden rounded-full bg-[var(--surface-soft)]">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.min(category.percent || 0, 100)}%`,
                            backgroundColor: category.color,
                          }}
                        ></span>
                      </div>
                    </div>
                  ))}
                </div>
              : <div className="rounded-[6px] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-4 text-center text-[11px] text-[var(--text-secondary)]">
                  No expense data for {selectedPeriodLabel.toLowerCase()}.
                </div>
              }
            </div>
            <button
              className="text-[11px] font-extrabold text-[var(--brand)] no-underline hover:text-[var(--brand-strong)] hover:underline max-[680px]:hidden"
              type="button"
              onClick={() => onSelectView("reports")}
            >
              View full report <span aria-hidden="true">→</span>
            </button>
          </article>
        </div>

        <article
          className="rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-[22px] pb-5 max-[680px]:p-[18px] max-[680px]:pb-4"
          id="transactions"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
                Activity
              </p>
              <h2 className="mt-1.5 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                Recent transactions
              </h2>
            </div>
            <button
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[var(--brand)] no-underline hover:text-[var(--brand-strong)] hover:underline"
              type="button"
              onClick={() => onSelectView("transactions")}
            >
              See all
              <FiArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className="mt-[15px]">
            {isLoading ?
              <div className="rounded-[6px] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-4 text-center text-[11px] text-[var(--text-secondary)]">
                Loading recent transactions...
              </div>
            : dashboardData.recentTransactions.length > 0 ?
              dashboardData.recentTransactions.map((transaction) => (
                <div
                  className="grid min-h-[60px] grid-cols-[34px_minmax(160px,1fr)_minmax(110px,0.5fr)_auto] items-center gap-3 border-t border-[var(--border)] max-[680px]:grid-cols-[30px_minmax(0,1fr)_auto] max-[680px]:gap-[9px] max-[680px]:min-h-16"
                  key={`${transaction.id ?? transaction.merchant}-${transaction.date}`}
                >
                  <div
                    className="grid h-[30px] w-[30px] place-items-center rounded-[5px] font-serif text-sm font-bold bg-[var(--brand-soft)] text-[var(--brand)]"
                    style={{
                      backgroundColor: `${transaction.color}30`,
                      color: transaction.color,
                    }}
                  >
                    {transaction.glyph}
                  </div>
                  <div className="grid gap-[3px]">
                    <strong className="text-xs text-[var(--text-primary)]">
                      {transaction.merchant}
                    </strong>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {transaction.category}
                    </span>
                  </div>
                  <time className="text-right text-[10px] text-[var(--text-muted)] max-[680px]:hidden">
                    {transaction.date}
                  </time>
                  <strong
                    className={`text-right text-xs ${transaction.amount > 0 ? "text-[var(--brand)]" : "text-[var(--text-secondary)]"}`}
                  >
                    {formatSignedCurrency(transaction.amount, currency)}
                  </strong>
                </div>
              ))
            : <div className="rounded-[6px] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-4 text-center text-[11px] text-[var(--text-secondary)]">
                No transactions yet for {selectedPeriodLabel.toLowerCase()}.
              </div>
            }
          </div>
        </article>
      </div>
    </section>
  );
}
