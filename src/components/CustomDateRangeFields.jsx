import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import "@daypicker/react/style.css";
import { getUserTimeZone } from "../lib/timezone";

const parseDateInput = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");

  if (!match) {
    return undefined;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
};

const formatDateInput = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatPickerDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: getUserTimeZone(),
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

const pickerStyle = {
  "--rdp-accent-color": "var(--brand)",
  "--rdp-accent-background-color": "var(--brand-soft)",
  "--rdp-day-width": "36px",
  "--rdp-day-height": "36px",
  "--rdp-day_button-width": "34px",
  "--rdp-day_button-height": "34px",
  "--rdp-day_button-border-radius": "8px",
  "--rdp-nav_button-width": "32px",
  "--rdp-nav_button-height": "32px",
};

export default function CustomDateRangeFields({
  dateRange,
  onChange,
  error,
}) {
  const componentId = useId();
  const containerRef = useRef(null);
  const [activeField, setActiveField] = useState(null);

  useEffect(() => {
    if (!activeField) {
      return undefined;
    }

    const closePickerOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setActiveField(null);
      }
    };

    document.addEventListener("pointerdown", closePickerOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closePickerOnOutsideClick);
  }, [activeField]);

  const fields = [
    { key: "start", label: "Start Date" },
    { key: "end", label: "End Date" },
  ];

  return (
    <div
      className="mb-4 grid grid-cols-2 gap-3 rounded-[7px] border border-[var(--border)] bg-[var(--surface)] p-4 max-[680px]:grid-cols-1 max-[680px]:p-3"
      ref={containerRef}
    >
      {fields.map(({ key, label }) => {
        const fieldId = `${componentId}-${key}`;
        const pickerId = `${fieldId}-picker`;
        const selectedDate = parseDateInput(dateRange[key]);
        const isInvalid = Boolean(error);

        return (
          <div
            className="grid min-w-0 gap-1 text-xs text-[var(--text-secondary)]"
            key={key}
          >
            <span id={`${fieldId}-label`}>{label}</span>
            <button
              aria-controls={pickerId}
              aria-describedby={isInvalid ? `${fieldId}-error` : undefined}
              aria-expanded={activeField === key}
              aria-haspopup="dialog"
              aria-invalid={isInvalid}
              aria-labelledby={`${fieldId}-label ${fieldId}-value`}
              className={`flex min-h-[42px] min-w-0 w-full items-center justify-between gap-2 rounded-[8px] border ${isInvalid ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-left text-sm text-[var(--text-primary)] outline-none transition hover:border-[#0f766e] focus:border-[#0f766e] focus:ring-2 focus:ring-[#dfeae4]`}
              onClick={() =>
                setActiveField((currentField) =>
                  currentField === key ? null : key,
                )
              }
              type="button"
            >
              <span className="truncate" id={`${fieldId}-value`}>
                {selectedDate ? formatPickerDate(selectedDate) : "Select date"}
              </span>
              <span aria-hidden="true">▾</span>
            </button>
            {activeField === key ?
              <div
                aria-label={`Select ${label.toLowerCase()}`}
                className="w-full min-w-0 max-w-full overflow-x-auto rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                id={pickerId}
                role="dialog"
                aria-modal="false"
              >
                <DayPicker
                  className="mx-auto max-w-full"
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) {
                      return;
                    }

                    onChange({
                      ...dateRange,
                      [key]: formatDateInput(date),
                    });
                    setActiveField(null);
                  }}
                  style={pickerStyle}
                />
              </div>
            : null}
            {isInvalid ?
              <span className="sr-only" id={`${fieldId}-error`}>
                {error}
              </span>
            : null}
          </div>
        );
      })}
    </div>
  );
}
