import SidebarNav from "./SidebarNav";

export default function PageLayout({
  ariaLabel,
  currentView,
  onSelectView,
  footerText,
  footerDotClassName,
  contentId,
  children,
}) {
  return (
    <section
      className="grid min-h-[calc(100svh-73px)] grid-cols-[216px_minmax(0,1fr)] bg-[var(--page-bg)] text-left text-[var(--text-primary)] max-[980px]:grid-cols-[176px_minmax(0,1fr)] max-[680px]:block max-[680px]:pb-[72px]"
      aria-label={ariaLabel}
    >
      <SidebarNav
        currentView={currentView}
        onSelectView={onSelectView}
        footerText={footerText}
        footerDotClassName={footerDotClassName}
      />

      <div
        className="min-w-0 px-[46px] pb-14 pt-[42px] max-[980px]:px-7 max-[980px]:pb-[46px] max-[680px]:px-[18px] max-[680px]:pb-[38px] max-[680px]:pt-7"
        id={contentId}
      >
        {children}
      </div>
    </section>
  );
}
