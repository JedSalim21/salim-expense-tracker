export default function EmptyState({ icon: Icon, children }) {
  return (
    <div className="grid min-h-[260px] place-items-center rounded-[8px] border border-dashed border-[#d7e0dc] bg-[#f8faf8] px-6 py-10 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#edf6f1] text-[20px] text-[#0f766e]">
          <Icon aria-hidden="true" />
        </div>
        {children}
      </div>
    </div>
  );
}
