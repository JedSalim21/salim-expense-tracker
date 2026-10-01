import { useEffect, useRef, useState } from "react";
import {
  FiBarChart2,
  FiGrid,
  FiMoreHorizontal,
  FiSettings,
  FiTag,
  FiTrendingUp,
} from "react-icons/fi";

const navigation = [
  { id: "dashboard", label: "Dashboard", compactLabel: "Dash", icon: FiGrid },
  {
    id: "transactions",
    label: "Transactions",
    compactLabel: "Trans.",
    icon: FiTrendingUp,
  },
  {
    id: "categories",
    label: "Categories",
    compactLabel: "Categories",
    icon: FiTag,
  },
  {
    id: "reports",
    label: "Reports",
    compactLabel: "Reports",
    icon: FiBarChart2,
  },
  {
    id: "settings",
    label: "Settings",
    compactLabel: "Settings",
    icon: FiSettings,
  },
];

export default function SidebarNav({
  currentView,
  onSelectView,
  footerText,
  footerDotClassName,
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreButtonRef = useRef(null);
  const moreMenuRef = useRef(null);
  const desktopNavigation = navigation;
  const mobileNavigation = navigation.filter((item) =>
    ["dashboard", "transactions"].includes(item.id),
  );
  const moreNavigation = navigation.filter((item) =>
    ["categories", "reports", "settings"].includes(item.id),
  );
  const isMoreActive = moreNavigation.some((item) => item.id === currentView);

  useEffect(() => {
    if (!isMoreOpen) {
      return undefined;
    }

    const closeOnOutsidePress = (event) => {
      if (
        !moreButtonRef.current?.contains(event.target) &&
        !moreMenuRef.current?.contains(event.target)
      ) {
        setIsMoreOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMoreOpen]);

  const selectView = (viewId) => {
    setIsMoreOpen(false);
    onSelectView(viewId);
  };

  return (
    <aside className="flex flex-col border-r border-[var(--border)] bg-[var(--surface-alt)] px-[18px] pb-6 pt-[34px] text-[var(--text-primary)] max-[680px]:fixed max-[680px]:inset-x-0 max-[680px]:bottom-0 max-[680px]:z-30 max-[680px]:block max-[680px]:border-b-0 max-[680px]:border-r-0 max-[680px]:border-t max-[680px]:px-1 max-[680px]:pb-[max(8px,env(safe-area-inset-bottom))] max-[680px]:pt-2 max-[680px]:shadow-[0_-4px_16px_rgba(15,23,42,0.08)]">
      <div className="px-3 pb-[34px] max-[680px]:hidden">
        <span className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Workspace
        </span>
        <span className="mt-2 block font-serif text-[17px] text-[var(--text-heading)] max-[680px]:mt-0 max-[680px]:text-sm">
          September 2026
        </span>
      </div>
      <nav
        className="grid gap-[5px] max-[680px]:hidden"
        aria-label="Primary navigation"
      >
        {desktopNavigation.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              className={`flex min-h-[52px] w-full items-center justify-start gap-[11px] rounded-[8px] border px-3 text-left text-[13px] font-bold transition focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2 max-[680px]:min-h-[56px] max-[680px]:min-w-0 max-[680px]:flex-col max-[680px]:justify-center max-[680px]:gap-1 max-[680px]:rounded-[6px] max-[680px]:px-0 max-[680px]:py-1 max-[680px]:text-[11px] ${isActive ? "border-[var(--brand)] bg-[var(--sidebar-active)] text-[var(--brand)] shadow-[inset_0_0_0_1px_rgba(15,118,110,0.08)]" : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--brand-soft)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"}`}
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
              onClick={() => selectView(item.id)}
            >
              <span className="inline-flex min-w-0 items-center gap-2 max-[680px]:w-full max-[680px]:flex-col max-[680px]:gap-1">
                <Icon
                  className="text-[14px] max-[680px]:text-[16px]"
                  aria-hidden="true"
                />
                <span className="max-[680px]:max-w-full max-[680px]:whitespace-nowrap max-[680px]:text-center max-[360px]:hidden">
                  {item.label}
                </span>
                <span className="hidden whitespace-nowrap text-center max-[360px]:inline">
                  {item.compactLabel}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
      <nav
        className="hidden max-[680px]:grid max-[680px]:grid-cols-3 max-[680px]:gap-1"
        aria-label="Primary navigation"
      >
        {mobileNavigation.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              className={`flex min-h-[56px] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-[6px] border px-0 py-1 text-center text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2 ${isActive ? "border-[var(--brand)] bg-[var(--sidebar-active)] text-[var(--brand)] shadow-[inset_0_0_0_1px_rgba(15,118,110,0.08)]" : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--brand-soft)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"}`}
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => selectView(item.id)}
            >
              <Icon className="text-[16px]" aria-hidden="true" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}

        <div className="relative">
          <button
            className={`flex min-h-[56px] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-[6px] border px-0 py-1 text-center text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2 ${isMoreActive ? "border-[var(--brand)] bg-[var(--sidebar-active)] text-[var(--brand)] shadow-[inset_0_0_0_1px_rgba(15,118,110,0.08)]" : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--brand-soft)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"}`}
            ref={moreButtonRef}
            type="button"
            aria-expanded={isMoreOpen}
            aria-controls="mobile-more-menu"
            aria-label="More sections"
            aria-current={isMoreActive ? "page" : undefined}
            onClick={() => setIsMoreOpen((isOpen) => !isOpen)}
          >
            <FiMoreHorizontal className="text-[16px]" aria-hidden="true" />
            <span>More</span>
          </button>

          {isMoreOpen ?
            <div
              className="absolute bottom-[calc(100%+8px)] right-0 z-50 max-h-[min(60svh,240px)] min-w-[176px] overflow-y-auto rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[0_12px_28px_rgba(15,23,42,0.2)]"
              ref={moreMenuRef}
              id="mobile-more-menu"
              role="menu"
              aria-label="More navigation"
            >
              {moreNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-[6px] px-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2 ${isActive ? "bg-[var(--sidebar-active)] text-[var(--brand)]" : "text-[var(--text-primary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"}`}
                    key={item.id}
                    type="button"
                    role="menuitem"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => selectView(item.id)}
                  >
                    <Icon aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          : null}
        </div>
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
