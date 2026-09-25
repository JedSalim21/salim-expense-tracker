import { FiCheck, FiMoon, FiSun } from "react-icons/fi";
import SidebarNav from "../components/SidebarNav";

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
  onToggleTheme,
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
      </div>
    </section>
  );
}
