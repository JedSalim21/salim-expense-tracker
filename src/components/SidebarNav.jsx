import {
  FiBarChart2,
  FiGrid,
  FiSettings,
  FiTag,
  FiTrendingUp,
} from "react-icons/fi";

const navigation = [
  { id: "dashboard", number: "01", label: "Dashboard", icon: FiGrid },
  {
    id: "transactions",
    number: "02",
    label: "Transactions",
    icon: FiTrendingUp,
  },
  { id: "categories", number: "03", label: "Categories", icon: FiTag },
  { id: "reports", number: "04", label: "Reports", icon: FiBarChart2 },
  { id: "settings", number: "05", label: "Settings", icon: FiSettings },
];

export default function SidebarNav({
  currentView,
  onSelectView,
  footerText,
  footerDotClassName,
}) {
  return (
    <aside className="flex flex-col border-r border-[var(--border)] bg-[var(--surface-alt)] px-[18px] pb-6 pt-[34px] text-[var(--text-primary)] max-[680px]:block max-[680px]:border-b max-[680px]:border-r-0 max-[680px]:px-[18px] max-[680px]:pb-0 max-[680px]:pt-4">
      <div className="px-3 pb-[34px] max-[680px]:flex max-[680px]:items-baseline max-[680px]:justify-between max-[680px]:px-0 max-[680px]:pb-[14px]">
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Workspace
        </span>
        <span className="mt-2 block font-serif text-[17px] text-[var(--text-heading)] max-[680px]:mt-0 max-[680px]:text-sm">
          September 2026
        </span>
      </div>
      <nav
        className="grid gap-[5px] max-[680px]:flex max-[680px]:gap-1 max-[680px]:overflow-x-auto max-[680px]:pb-3"
        aria-label="Primary navigation"
      >
        {navigation.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              className={`flex min-h-[42px] items-center gap-[11px] rounded-[7px] px-3 text-[13px] font-bold text-left transition hover:translate-x-0.5 hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] max-[680px]:min-h-[34px] max-[680px]:shrink-0 max-[680px]:px-[9px] max-[680px]:text-[11px] ${isActive ? "bg-[var(--sidebar-active)] text-[var(--brand)]" : "text-[var(--text-secondary)]"}`}
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
            >
              <span
                className={`w-6 font-mono text-[10px] ${isActive ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}`}
              >
                {item.number}
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon className="text-[14px]" aria-hidden="true" />
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto flex items-start gap-[9px] border-t border-[var(--border)] px-3 py-[14px] text-xs leading-[1.45] text-[var(--text-secondary)] max-[680px]:hidden">
        <span
          className={`mt-1 h-[7px] w-[7px] shrink-0 rounded-full ${footerDotClassName}`}
        ></span>
        <p className="max-w-[120px]">{footerText}</p>
      </div>
    </aside>
  );
}
