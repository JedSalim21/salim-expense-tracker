export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }

  const confirmButtonClasses =
    destructive ?
      "border-transparent bg-[#b45309] text-white hover:bg-[#92400e]"
    : "border-transparent bg-[#0f766e] text-white hover:bg-[#115e59]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.68)] p-4"
      onClick={onCancel}
      aria-hidden={!isOpen}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        className="w-full max-w-[520px] rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="confirmation-modal-title"
          className="text-center text-[1.5rem] font-bold leading-[1.4] text-[var(--text-heading)]"
        >
          {title}
        </h3>

        <div className="mt-4 text-center text-sm leading-6 text-[var(--text-secondary)]">
          {typeof message === "string" ?
            <p>{message}</p>
          : message}
        </div>

        <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex min-h-[42px] items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm font-bold text-[var(--text-heading)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`inline-flex min-h-[42px] items-center justify-center rounded-[8px] px-4 text-sm font-bold transition ${confirmButtonClasses} disabled:cursor-wait disabled:opacity-70`}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
