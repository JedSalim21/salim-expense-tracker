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

const summaryData = [
  {
    label: "Net cash flow",
    value: "+₱2,845.30",
    trend: "+12.8%",
    icon: FiArrowUpRight,
    tone: "teal",
  },
  {
    label: "Income",
    value: "₱8,640.00",
    trend: "+6.4%",
    icon: FiTrendingUp,
    tone: "blue",
  },
  {
    label: "Expenses",
    value: "₱5,794.70",
    trend: "-3.9%",
    icon: FiTrendingDown,
    tone: "amber",
  },
  {
    label: "Savings rate",
    value: "32.9%",
    trend: "+4.3%",
    icon: FiDollarSign,
    tone: "rose",
  },
];

const toneClasses = {
  teal: "text-[#0f766e]",
  blue: "text-[#3c72a2]",
  amber: "text-[#c08222]",
  rose: "text-[#b86c83]",
};

const spendingBreakdown = [
  { label: "Housing", amount: "₱1,420", percent: 34, color: "#0f766e" },
  { label: "Food", amount: "₱980", percent: 24, color: "#f59e0b" },
  { label: "Transport", amount: "₱610", percent: 15, color: "#3b82f6" },
  { label: "Lifestyle", amount: "₱450", percent: 11, color: "#e879a8" },
  { label: "Utilities", amount: "₱340", percent: 8, color: "#8b5cf6" },
  { label: "Other", amount: "₱260", percent: 8, color: "#94a3b8" },
];

const monthlyTrend = [
  { month: "Apr", value: 32 },
  { month: "May", value: 28 },
  { month: "Jun", value: 36 },
  { month: "Jul", value: 42 },
  { month: "Aug", value: 38 },
  { month: "Sep", value: 46 },
];

const topCategories = [
  { name: "Housing", amount: "₱1,420.00", change: "+4.2%" },
  { name: "Food", amount: "₱980.40", change: "+2.8%" },
  { name: "Transport", amount: "₱610.80", change: "-1.1%" },
  { name: "Lifestyle", amount: "₱450.00", change: "+6.5%" },
];

const recentInsights = [
  "Spending is trending below your monthly budget in three of the last five months.",
  "Housing remains the largest single category, accounting for 34% of spending.",
  "Savings improved after reducing impulse spending in the last two weeks.",
];

export default function ReportsPage({ currentView, onSelectView }) {
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

          <button
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--text-secondary)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            type="button"
          >
            <FiCalendar aria-hidden="true" />
            This month
            <FiChevronDown aria-hidden="true" />
          </button>
        </header>

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

            <div className="mt-6 flex h-[220px] items-end gap-[10px] rounded-[8px] border border-[var(--border)] bg-[var(--panel-soft)] p-4 pt-5">
              {monthlyTrend.map((entry) => (
                <div
                  className="flex flex-1 flex-col items-center justify-end gap-2"
                  key={entry.month}
                >
                  <div className="flex h-full w-full items-end justify-center">
                    <span
                      className="block w-full max-w-[26px] rounded-t-[6px] bg-[var(--brand)] shadow-[0_8px_18px_rgba(15,118,110,0.18)]"
                      style={{ height: `${entry.value}%` }}
                    ></span>
                  </div>
                  <span className="font-mono text-[9px] text-[var(--text-muted)]">
                    {entry.month}
                  </span>
                </div>
              ))}
            </div>
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

            <div className="mt-5 grid gap-3">
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
                      {item.percent}%
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
                    {item.amount}
                  </div>
                </div>
              ))}
            </div>
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

            <div className="mt-4 space-y-3">
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
