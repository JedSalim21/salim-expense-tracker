import { useState } from "react";
import { formatCurrency } from "../lib/reports";

const visibleCategoryCount = 5;

export default function SpendingBreakdown({
  categories,
  total,
  currency,
  periodLabel,
  isLoading = false,
  emptyMessage,
  onSeeAll,
}) {
  const [isShowingAll, setIsShowingAll] = useState(false);
  const sortedCategories = [...categories].sort(
    (left, right) => right.amount - left.amount,
  );
  const visibleCategories =
    isShowingAll ? sortedCategories : sortedCategories.slice(0, visibleCategoryCount);
  const canShowAll = sortedCategories.length > visibleCategoryCount;
  const chartBackground =
    sortedCategories.length > 0 ?
      (() => {
        let start = 0;
        const segments = sortedCategories.map((category) => {
          const end = start + (category.percent || 0);
          const segment = `${category.color} ${start}% ${end}%`;
          start = end;
          return segment;
        });

        return `conic-gradient(${segments.join(", ")})`;
      })()
    : "conic-gradient(var(--surface-alt) 0 100%)";

  return (
    <div className="grid gap-4 py-4">
      <div
        className="mx-auto grid h-[138px] w-[138px] place-items-center rounded-full"
        style={{ background: chartBackground }}
        role="img"
        aria-label={`Spending breakdown for ${periodLabel}`}
      >
        <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-[var(--surface)]">
          <strong className="font-serif text-xl font-normal text-[var(--text-heading)]">
            {isLoading ? "—" : formatCurrency(total, currency)}
          </strong>
          <span className="-mt-5 text-[10px] text-[var(--text-muted)]">
            spent
          </span>
        </div>
      </div>

      {sortedCategories.length === 0 ?
        <div className="rounded-[6px] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-3 py-4 text-center text-[11px] text-[var(--text-secondary)]">
          {isLoading ? "Loading category totals..." : emptyMessage}
        </div>
      : <div className="grid gap-3">
          {visibleCategories.map((category) => (
            <div
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-center gap-2 text-[10px] text-[var(--text-muted)]"
              key={category.id ?? `${category.label}-${category.color}`}
            >
              <span className="flex min-w-0 items-center gap-[7px] text-[var(--text-secondary)]">
                <i
                  className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                ></i>
                <span className="truncate">{category.label}</span>
              </span>
              <strong className="text-center text-[11px] text-[var(--text-primary)]">
                {Math.round(category.percent)}%
              </strong>
              <span className="whitespace-nowrap text-right">
                {formatCurrency(category.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      }

      {canShowAll ?
        <button
          className="justify-self-start text-[11px] font-extrabold text-[var(--brand)] no-underline hover:text-[var(--brand-strong)] hover:underline"
          type="button"
          onClick={
            onSeeAll ??
            (() => setIsShowingAll((currentState) => !currentState))
          }
        >
          {onSeeAll || !isShowingAll ? "See all" : "Show top 5"}{" "}
          <span aria-hidden="true">{onSeeAll || !isShowingAll ? "→" : "↑"}</span>
        </button>
      : null}
    </div>
  );
}
