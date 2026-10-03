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
import CustomDateRangeFields from "../components/CustomDateRangeFields";
import PageLayout from "../components/PageLayout";
import { loadCategories } from "../lib/categories";
import {
  buildDashboardData,
  formatCurrency,
  getCustomDateRangeError,
} from "../lib/reports";
import { formatSignedCurrency } from "../lib/currency";
import { createSupabaseClient } from "../lib/supabase";
import {
  formatDashboardDateLabel,
  formatDateInputValue,
  formatDateInUserTimeZone,
  getGreetingForDate,
} from "../lib/timezone";

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
  const [customDateRange, setCustomDateRange] = useState(() => {
    const today = formatDateInputValue();
    return { start: today, end: today };
  });
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(emptyDashboardData);
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
            dateRange: customDateRange,
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
    customDateRange,
    customRangeError,
    transactionsRevision,
  ]);

  const visibleDashboardData =
    customRangeError ? emptyDashboardData : dashboardData;
  const isCurrentRangeLoading = isLoading && !customRangeError;
  const currentDateLabel = formatDashboardDateLabel(new Date());
  const currentGreeting = getGreetingForDate(new Date());

  const summaryCards = [
    {
      label: "Income",
      value: visibleDashboardData.summary.incomeTotal,
      detail: `${selectedPeriodLabel} income`,
      tone: "blue",
    },
    {
      label: "Expenses",
      value: visibleDashboardData.summary.expensesTotal,
      detail: `${selectedPeriodLabel} spending`,
      tone: "amber",
    },
    {
      label: "Current balance",
      value: visibleDashboardData.summary.balance,
      detail: `${selectedPeriodLabel} net cash flow`,
      tone: "teal",
    },
    {
      label: "Transactions",
      value: visibleDashboardData.recentTransactions.length,
      detail: `${selectedPeriodLabel} activity`,
      tone: "rose",
    },
  ];

  const chartRangeLabel =
    selectedPeriod === "custom" && !customRangeError ?
      `${formatDateInUserTimeZone(new Date(`${customDateRange.start}T12:00:00`), { month: "short", day: "numeric", year: "numeric" })} → ${formatDateInUserTimeZone(new Date(`${customDateRange.end}T12:00:00`), { month: "short", day: "numeric", year: "numeric" })}`
    : selectedPeriod === "week" ? "This week"
    : selectedPeriod === "month" ? "This month"
    : selectedPeriod === "year" ? "This year"
    : selectedPeriod === "day" ? "Today"
    : "Custom Date Range";
  const cashFlowData = Array.isArray(visibleDashboardData.cashFlow) ?
    visibleDashboardData.cashFlow
  : [];
  const maxCashFlowValue =
    Math.max(
      ...cashFlowData.flatMap((entry) => [
        Number(entry.income) || 0,
        Number(entry.expenses) || 0,
      ]),
      0,
    ) || 1;

  const activeExpenseBreakdown = visibleDashboardData.categoryBreakdown;
  const savingsPercent =
    visibleDashboardData.summary.incomeTotal > 0 ?
      (visibleDashboardData.summary.balance / visibleDashboardData.summary.incomeTotal) * 100
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
    <PageLayout
      ariaLabel="SalimSpend dashboard"
      currentView={currentView}
      onSelectView={onSelectView}
      footerText="Everything looks steady this month."
      footerDotClassName="bg-[#e5a644] shadow-[0_0_0_4px_rgba(229,166,68,0.15)]"
      contentId="dashboard"
    >
        <header className="mb-[30px] flex items-start justify-between gap-6 max-[680px]:mb-5 max-[680px]:block">
          <div className="max-[680px]:hidden">
            <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
              {currentDateLabel}
            </p>
            <h1 className="my-2 font-serif text-[clamp(32px,4vw,48px)] font-normal leading-[1.03] text-[var(--text-heading)]">
              {currentGreeting}, Salim.
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Here is the shape of your money this {selectedPeriod}.
            </p>
          </div>
          <h1 className="hidden font-serif text-[clamp(34px,7vw,42px)] font-normal leading-[1.03] text-[var(--text-heading)] max-[680px]:mt-0 max-[680px]:mb-4 max-[680px]:block">
            Dashboard
          </h1>

          <div className="relative max-[680px]:hidden max-[680px]:mt-0 max-[680px]:w-full">
            <button
              aria-expanded={isPeriodMenuOpen}
              className="mt-2 inline-flex min-h-[38px] items-center gap-[8px] whitespace-nowrap rounded-[5px] border border-transparent bg-[#0f766e] px-3 text-xs font-bold text-white transition hover:bg-[#115e59] focus-visible:outline-2 focus-visible:outline-[#0f766e] focus-visible:outline-offset-2 max-[680px]:w-full max-[680px]:justify-between max-[680px]:px-4"
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
          <div className="relative hidden max-[680px]:block">
            <button
              aria-expanded={isPeriodMenuOpen}
              aria-label="Select dashboard period"
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
              <div
                className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[180px] overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
              >
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
            className="mb-4 rounded-[6px] border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
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
              {formatCurrency(visibleDashboardData.summary.balance, currency)}
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
                {chartRangeLabel}
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
            {cashFlowData.length === 0 ?
              <div className="mt-[18px] rounded-[8px] border border-dashed border-[var(--border)] bg-[var(--panel-soft)] p-5 text-sm text-[var(--text-secondary)]">
                No cash flow data yet for {selectedPeriodLabel.toLowerCase()}.
              </div>
            : <div
                className="mt-[18px] flex h-[204px]"
                aria-label={`Cash flow for ${selectedPeriodLabel}`}
              >
                <div className="flex w-[88px] shrink-0 flex-col justify-between pb-[23px] pt-1 font-mono text-[8px] text-[#adb2aa]">
                  {[maxCashFlowValue, maxCashFlowValue * 0.75, maxCashFlowValue * 0.5, maxCashFlowValue * 0.25, 0].map((amount, index) => (
                    <span key={`${amount}-${index}`}>
                      {formatCurrency(amount, currency)}
                    </span>
                  ))}
                </div>
                <div className="relative grid min-w-0 flex-1 grid-cols-[repeat(auto-fit,minmax(40px,1fr))] gap-[10px] border-b border-[#e4e5df]">
                  <div className="pointer-events-none absolute inset-x-0 bottom-[23px] top-0 flex flex-col justify-between">
                    <span className="border-t border-dashed border-[#e5e6e0]"></span>
                    <span className="border-t border-dashed border-[#e5e6e0]"></span>
                    <span className="border-t border-dashed border-[#e5e6e0]"></span>
                    <span className="border-t border-dashed border-[#e5e6e0]"></span>
                    <span className="border-t border-dashed border-[#e5e6e0]"></span>
                  </div>
                  {cashFlowData.map((entry) => (
                    <div
                      className="relative z-10 flex min-w-0 flex-col justify-end"
                      key={entry.month}
                    >
                      <div className="flex h-[calc(100%-23px)] items-end justify-center gap-[3px]">
                        <span
                          className="block min-h-1 w-[min(17px,40%)] rounded-t-[3px] bg-[var(--brand)]"
                          style={{
                            height: `${Math.max(((Number(entry.income) || 0) / maxCashFlowValue) * 100, 0)}%`,
                          }}
                        ></span>
                        <span
                          className="block min-h-1 w-[min(17px,40%)] rounded-t-[3px] bg-[var(--warning)]"
                          style={{
                            height: `${Math.max(((Number(entry.expenses) || 0) / maxCashFlowValue) * 100, 0)}%`,
                          }}
                        ></span>
                      </div>
                      <span className="block pt-2 text-center font-mono text-[9px] text-[#9a9d95]">
                        {entry.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            }
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
                      visibleDashboardData.summary.expensesTotal,
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
            {isCurrentRangeLoading ?
              <div className="rounded-[6px] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-4 text-center text-[11px] text-[var(--text-secondary)]">
                Loading recent transactions...
              </div>
            : visibleDashboardData.recentTransactions.length > 0 ?
              visibleDashboardData.recentTransactions.map((transaction) => (
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
    </PageLayout>
  );
}
