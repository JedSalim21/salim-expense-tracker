import {
  FiCheck,
  FiDownload,
  FiMoon,
  FiRefreshCcw,
  FiSun,
} from "react-icons/fi";
import SidebarNav from "../components/SidebarNav";
import { CURRENCY_OPTIONS } from "../lib/settings";

const themeOptions = [
  {
    id: "light",
    label: "Light Mode",
    description: "Optimized for bright workspace lighting.",
    icon: FiSun,
  },
  {
    id: "dark",
    label: "Dark Mode",
    description: "Comfortable for late-night budgeting sessions.",
    icon: FiMoon,
  },
];

export default function SettingsPage({
  currentView,
  onSelectView,
  theme,
  currency,
  appVersion,
  isResetting,
  resetStatus,
  onToggleTheme,
  onCurrencyChange,
  onExportData,
  onResetAllData,
}) {
  return (
    <section
      className="grid min-h-[calc(100svh-73px)] grid-cols-[216px_minmax(0,1fr)] bg-[var(--page-bg)] text-left text-[var(--text-primary)] max-[980px]:grid-cols-[176px_minmax(0,1fr)] max-[680px]:block"
      aria-label="SalimSpend settings"
    >
      <SidebarNav
        currentView={currentView}
        onSelectView={onSelectView}
        footerText="Your preferences are saved on this device."
        footerDotClassName="bg-[#0f766e] shadow-[0_0_0_4px_rgba(15,118,110,0.15)]"
      />

      <div className="min-w-0 px-[46px] pb-14 pt-[42px] max-[980px]:px-7 max-[980px]:pb-[46px] max-[680px]:px-[18px] max-[680px]:pb-[38px] max-[680px]:pt-7">
        <header className="mb-[24px] flex flex-wrap items-start justify-between gap-4 max-[860px]:flex-col max-[860px]:items-start max-[680px]:mb-6">
          <div className="min-w-0">
            <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
              Preferences
            </p>
            <h1 className="mt-2 max-w-[540px] font-serif text-[clamp(32px,4vw,46px)] font-normal leading-[1.03] text-[var(--text-heading)]">
              Settings
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Customize your workspace to match the way you like to budget.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-[18px] max-[680px]:p-[14px]">
            <div className="mb-5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Display
              </p>
              <h2 className="mt-1 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                Appearance
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.id;

                return (
                  <button
                    className={`flex items-center justify-between gap-4 rounded-[10px] border p-4 text-left transition ${isSelected ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"}`}
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onToggleTheme()}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-11 w-11 place-items-center rounded-full ${isSelected ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--text-primary)]"}`}
                      >
                        <Icon aria-hidden="true" className="text-lg" />
                      </span>
                      <div>
                        <div className="text-base font-bold text-[var(--text-heading)]">
                          {option.label}
                        </div>
                        <div className="mt-1 text-sm text-[var(--text-secondary)]">
                          {option.description}
                        </div>
                      </div>
                    </div>

                    {isSelected ?
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand)] text-white">
                        <FiCheck aria-hidden="true" className="text-xs" />
                      </span>
                    : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-[18px] max-[680px]:p-[14px]">
            <div className="mb-5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Preference
              </p>
              <h2 className="mt-1 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                Currency
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {CURRENCY_OPTIONS.map((option) => {
                const isSelected = currency === option.code;

                return (
                  <button
                    className={`flex items-center justify-between gap-4 rounded-[10px] border p-4 text-left transition ${isSelected ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"}`}
                    key={option.code}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onCurrencyChange(option.code)}
                  >
                    <div>
                      <div className="text-base font-bold text-[var(--text-heading)]">
                        {option.code} — {option.name}
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-secondary)]">
                        Preferred for future value displays.
                      </div>
                    </div>

                    {isSelected ?
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand)] text-white">
                        <FiCheck aria-hidden="true" className="text-xs" />
                      </span>
                    : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-[18px] max-[680px]:p-[14px]">
            <div className="mb-5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Data
              </p>
              <h2 className="mt-1 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                Data management
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onExportData}
                className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-bold text-[var(--text-heading)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
              >
                <FiDownload aria-hidden="true" />
                Export data
              </button>
              <button
                type="button"
                onClick={onResetAllData}
                disabled={isResetting}
                className="inline-flex items-center gap-2 rounded-[8px] border border-rose-300 bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:border-rose-500 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
              >
                <FiRefreshCcw aria-hidden="true" />
                {isResetting ? "Resetting..." : "Reset all data"}
              </button>
            </div>
            {resetStatus ?
              <p
                className={`mt-4 text-sm ${resetStatus.type === "error" ? "text-rose-700" : "text-[var(--brand)]"}`}
                role={resetStatus.type === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {resetStatus.message}
              </p>
            : null}
          </div>

          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-[18px] max-[680px]:p-[14px]">
            <div className="mb-5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                About
              </p>
              <h2 className="mt-1 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                Application
              </h2>
            </div>

            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center justify-between gap-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                <span className="font-bold text-[var(--text-heading)]">
                  Version
                </span>
                <span>{appVersion}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                <span className="font-bold text-[var(--text-heading)]">
                  Privacy Policy
                </span>
                <span>Not yet available</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                <span className="font-bold text-[var(--text-heading)]">
                  Terms of Service
                </span>
                <span>Not yet available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
