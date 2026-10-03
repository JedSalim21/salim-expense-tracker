import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { DayPicker } from "@daypicker/react";
import "@daypicker/react/style.css";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiEdit2,
  FiInbox,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import PageLayout from "../components/PageLayout";
import { loadCategories } from "../lib/categories";
import { formatSignedCurrency } from "../lib/currency";
import { createSupabaseClient } from "../lib/supabase";

const emptyFormState = {
  description: "",
  amount: "",
  type: "expense",
  category_id: "",
  payment_method_id: "",
  occurredAt: toLocalDateTimeInput(new Date()),
};

const defaultPaymentMethodNames = ["Cash", "Credit Card"];
const transactionFieldLabels = {
  description: "Description",
  amount: "Amount",
  type: "Type",
  category_id: "Category",
  payment_method_id: "Payment method",
  occurredAt: "Date and time",
};

const loadReferenceRowsWithDefaults = async (
  supabase,
  table,
  userId,
  defaultNames,
) => {
  const loadRows = () =>
    supabase.from(table).select("id, name").order("name", { ascending: true });
  const existingResult = await loadRows();

  if (existingResult.error) {
    throw existingResult.error;
  }

  if (existingResult.data?.length) {
    return existingResult.data;
  }

  const { error: seedError } = await supabase.from(table).upsert(
    defaultNames.map((name) => ({ clerk_user_id: userId, name })),
    { onConflict: "clerk_user_id,name", ignoreDuplicates: true },
  );

  if (seedError) {
    throw seedError;
  }

  const seededResult = await loadRows();
  if (seededResult.error) {
    throw seededResult.error;
  }

  return seededResult.data ?? [];
};

const formatTransactionAmount = (amount, type, currency) =>
  formatSignedCurrency(
    Math.abs(Number(amount) || 0) * (type === "income" ? 1 : -1),
    currency,
  );

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(
    value.includes("T") ? value : `${value}T00:00:00`,
  );
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(parsedDate);
};

function toLocalDateTimeInput(value) {
  const date = value instanceof Date ? value : new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

const twoDigitPart = (value) => String(value).padStart(2, "0");

const dateTimeValueToDate = (value) => {
  const [year, month, day] = (value ?? "").slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
};

const dateToDateTimeValue = (date) =>
  `${date.getFullYear()}-${twoDigitPart(date.getMonth() + 1)}-${twoDigitPart(date.getDate())}`;

const formatPickerDate = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const normalizeTransaction = (record) => ({
  id: record.id,
  description: record.description,
  amount: Number(record.amount),
  type: record.type,
  category_id: record.category_id,
  payment_method_id: record.payment_method_id,
  date: record.date,
  occurred_at: record.occurred_at,
  occurredAt: toLocalDateTimeInput(
    record.occurred_at ?? `${record.date}T00:00:00`,
  ),
  category: record.categories ?? {
    id: record.category_id,
    name: "Unknown category",
  },
  paymentMethod: record.payment_methods ?? {
    id: record.payment_method_id,
    name: "Unknown payment method",
  },
});

export default function TransactionsPage({
  currentView,
  onSelectView,
  currency,
  onTransactionsChanged,
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const supabase = useMemo(() => {
    if (!isLoaded || !isSignedIn) {
      return null;
    }

    return createSupabaseClient(getToken);
  }, [getToken, isLoaded, isSignedIn]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [activePicker, setActivePicker] = useState(null);
  const [activeDateTimePicker, setActiveDateTimePicker] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formState, setFormState] = useState(emptyFormState);
  const categoryMenuRef = useRef(null);
  const typeMenuRef = useRef(null);
  const paymentMethodMenuRef = useRef(null);
  const dateTimePickerRef = useRef(null);
  const timePickerRef = useRef(null);

  useEffect(() => {
    if (!isCategoryMenuOpen) {
      return undefined;
    }

    const closeMenuOnOutsideClick = (event) => {
      if (!categoryMenuRef.current?.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeMenuOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeMenuOnOutsideClick);
  }, [isCategoryMenuOpen]);

  useEffect(() => {
    if (!activePicker) {
      return undefined;
    }

    const pickerRefs = {
      type: typeMenuRef,
      paymentMethod: paymentMethodMenuRef,
    };
    const activePickerRef = pickerRefs[activePicker];
    const closePickerOnOutsideClick = (event) => {
      if (!activePickerRef?.current?.contains(event.target)) {
        setActivePicker(null);
      }
    };

    document.addEventListener("pointerdown", closePickerOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closePickerOnOutsideClick);
  }, [activePicker]);

  useEffect(() => {
    if (!activeDateTimePicker) {
      return undefined;
    }

    const closePickerOnOutsideClick = (event) => {
      if (!dateTimePickerRef.current?.contains(event.target)) {
        setActiveDateTimePicker(null);
      }
    };

    document.addEventListener("pointerdown", closePickerOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closePickerOnOutsideClick);
  }, [activeDateTimePicker]);

  useEffect(() => {
    if (activeDateTimePicker !== "time") {
      return;
    }

    timePickerRef.current
      ?.querySelectorAll('[aria-pressed="true"]')
      .forEach((option) => option.scrollIntoView({ block: "center" }));
  }, [activeDateTimePicker, formState.occurredAt]);

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormState(emptyFormState);
    setActiveDateTimePicker(null);
    setErrorMessage("");
    setValidationErrors({});
  };

  const updateFormField = (field, value) => {
    setFormState((currentState) => ({ ...currentState, [field]: value }));
    setValidationErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const selectedDate = dateTimeValueToDate(formState.occurredAt);
  const [selectedHour = "00", selectedMinute = "00"] = formState.occurredAt
    .slice(11, 16)
    .split(":");

  const updateTimePart = (part, value) => {
    const nextHour = part === "hour" ? twoDigitPart(value) : selectedHour;
    const nextMinute = part === "minute" ? twoDigitPart(value) : selectedMinute;
    const currentDate = formState.occurredAt.slice(0, 10);

    updateFormField("occurredAt", `${currentDate}T${nextHour}:${nextMinute}`);
  };

  const openAddForm = () => {
    if (categories.length === 0 || paymentMethods.length === 0) {
      setErrorMessage(
        "Add at least one category and payment method before creating a transaction.",
      );
      return;
    }

    setEditingId(null);
    setActiveDateTimePicker(null);
    setFormState({
      ...emptyFormState,
      occurredAt: toLocalDateTimeInput(new Date()),
    });
    setErrorMessage("");
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (transaction) => {
    setEditingId(transaction.id);
    setActiveDateTimePicker(null);
    setFormState({
      description: transaction.description,
      amount: String(transaction.amount),
      type: transaction.type,
      category_id: transaction.category_id,
      payment_method_id: transaction.payment_method_id,
      occurredAt: transaction.occurredAt,
    });
    setErrorMessage("");
    setValidationErrors({});
    setIsFormOpen(true);
  };

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      if (!isLoaded || !isSignedIn || !user?.id || !supabase) {
        if (isActive) {
          setTransactions([]);
          setCategories([]);
          setPaymentMethods([]);
          setIsLoading(false);
          setErrorMessage("");
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [categoryRows, paymentMethodRows, transactionsResult] =
          await Promise.all([
            loadCategories(supabase, user.id),
            loadReferenceRowsWithDefaults(
              supabase,
              "payment_methods",
              user.id,
              defaultPaymentMethodNames,
            ),
            supabase
              .from("transactions")
              .select(
                "id, amount, type, description, category_id, payment_method_id, date, occurred_at, created_at, categories (id, name), payment_methods (id, name)",
              )
              .order("date", { ascending: false })
              .order("created_at", { ascending: false }),
          ]);

        if (transactionsResult.error) {
          throw transactionsResult.error;
        }

        if (!isActive) {
          return;
        }

        setCategories(categoryRows);
        setPaymentMethods(paymentMethodRows);
        setTransactions(
          (transactionsResult.data ?? []).map((transaction) =>
            normalizeTransaction(transaction),
          ),
        );
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error?.message ?? "Unable to load your transactions right now.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [isLoaded, isSignedIn, supabase, user?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedDescription = formState.description.trim();
    const amountValue = Number(formState.amount);
    const amountInput = event.currentTarget.elements.namedItem("amount");
    const occurredAtDate = new Date(formState.occurredAt);
    const nextValidationErrors = {};

    if (!trimmedDescription) {
      nextValidationErrors.description = "Enter a description.";
    }

    if (
      !Number.isFinite(amountValue) ||
      amountValue <= 0 ||
      !amountInput?.validity.valid
    ) {
      nextValidationErrors.amount = "Enter an amount greater than zero.";
    }

    if (!["income", "expense"].includes(formState.type)) {
      nextValidationErrors.type = "Choose income or expense.";
    }

    if (!categories.some((category) => category.id === formState.category_id)) {
      nextValidationErrors.category_id = "Choose a category.";
    }

    if (
      !paymentMethods.some(
        (paymentMethod) => paymentMethod.id === formState.payment_method_id,
      )
    ) {
      nextValidationErrors.payment_method_id = "Choose a payment method.";
    }

    if (!formState.occurredAt || Number.isNaN(occurredAtDate.getTime())) {
      nextValidationErrors.occurredAt = "Enter a valid date and time.";
    }

    setValidationErrors(nextValidationErrors);
    setErrorMessage("");

    if (Object.keys(nextValidationErrors).length > 0) {
      return;
    }

    if (!user?.id) {
      setErrorMessage("You must be signed in to save transactions.");
      return;
    }

    const payload = {
      clerk_user_id: user.id,
      description: trimmedDescription,
      amount: amountValue,
      type: formState.type,
      category_id: formState.category_id,
      payment_method_id: formState.payment_method_id,
      date: formState.occurredAt.slice(0, 10),
      occurred_at: occurredAtDate.toISOString(),
    };

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const query =
        editingId ?
          supabase
            .from("transactions")
            .update(payload)
            .eq("id", editingId)
            .select(
              "id, amount, type, description, category_id, payment_method_id, date, occurred_at, created_at, categories (id, name), payment_methods (id, name)",
            )
        : supabase
            .from("transactions")
            .insert([{ ...payload }])
            .select(
              "id, amount, type, description, category_id, payment_method_id, date, occurred_at, created_at, categories (id, name), payment_methods (id, name)",
            );

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const mutationResult = data?.[0] ?? data;

      setTransactions((currentTransactions) => {
        if (editingId) {
          return currentTransactions.map((transaction) =>
            transaction.id === editingId ?
              normalizeTransaction(mutationResult)
            : transaction,
          );
        }

        return [normalizeTransaction(mutationResult), ...currentTransactions];
      });
      onTransactionsChanged?.();

      resetForm();
    } catch (error) {
      setErrorMessage(error?.message ?? "Unable to save this transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (transactionId) => {
    const target = transactions.find(
      (transaction) => transaction.id === transactionId,
    );

    if (!target) {
      return;
    }

    setDeleteTarget(target);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !supabase) {
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) {
        throw error;
      }

      setTransactions((currentTransactions) =>
        currentTransactions.filter(
          (transaction) => transaction.id !== deleteTarget.id,
        ),
      );
      onTransactionsChanged?.();

      if (editingId === deleteTarget.id) {
        resetForm();
      }

      setDeleteTarget(null);
    } catch (error) {
      setErrorMessage(error?.message ?? "Unable to delete this transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasTransactions = transactions.length > 0;
  const hasReferenceData = categories.length > 0 && paymentMethods.length > 0;
  const orderedCategories = [...categories].sort((left, right) => {
    const leftIsOther = left.name.toLowerCase() === "others";
    const rightIsOther = right.name.toLowerCase() === "others";

    if (leftIsOther !== rightIsOther) {
      return leftIsOther ? 1 : -1;
    }

    return left.name.localeCompare(right.name);
  });

  return (
    <PageLayout
      ariaLabel="SalimSpend transactions"
      currentView={currentView}
      onSelectView={onSelectView}
      footerText="Your transaction history is ready to review."
      footerDotClassName="bg-[#0f766e] shadow-[0_0_0_4px_rgba(15,118,110,0.15)]"
    >
        <header className="mb-[24px] flex items-start justify-between gap-6 max-[680px]:mb-6 max-[680px]:block">
          <div>
            <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[var(--text-muted)]">
              Money movement
            </p>
            <h1 className="mt-2 font-serif text-[clamp(32px,4vw,46px)] font-normal leading-[1.03] text-[var(--text-heading)]">
              Transactions
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Review recent spending and income across your financial activity.
            </p>
          </div>
          <button
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-center text-sm font-bold text-white transition hover:bg-[#115e59] focus-visible:outline-2 focus-visible:outline-[#0f766e] focus-visible:outline-offset-2 max-[680px]:mt-[18px]"
            type="button"
            onClick={openAddForm}
          >
            <FiPlus aria-hidden="true" className="shrink-0" />
            <span className="inline-flex items-center justify-center">
              Add Transaction
            </span>
          </button>
        </header>

        {errorMessage ?
          <div className="mb-4 rounded-[8px] border border-[#f2d1c4] bg-[#fff3f0] px-4 py-3 text-sm text-[#8a3c26]">
            {errorMessage}
          </div>
        : null}

        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-[18px] max-[680px]:p-[14px]">
          <div className="mb-4 flex items-center justify-between gap-3 max-[680px]:block">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Overview
              </p>
              <h2 className="mt-1 font-serif text-[22px] font-normal text-[var(--text-heading)]">
                All transactions
              </h2>
            </div>
            <span className="rounded-full border border-[#dfe8e3] bg-[#f1f8f5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0f766e]">
              {transactions.length} item{transactions.length === 1 ? "" : "s"}
            </span>
          </div>

          {isLoading ?
            <div className="grid min-h-[260px] place-items-center rounded-[8px] border border-dashed border-[#d7e0dc] bg-[#f8faf8] px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
              Loading your transactions...
            </div>
          : !hasTransactions ?
            <EmptyState icon={FiInbox}>
              <h3 className="font-serif text-[26px] font-normal text-[#213b36]">
                No transactions yet
              </h3>
              <p className="mx-auto mt-2 max-w-[340px] text-center text-sm text-[#6d7974]">
                Add your first income or expense to start tracking your money.
              </p>
              {hasReferenceData ?
                <button
                  className="mt-5 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-sm font-bold text-white transition hover:bg-[#115e59]"
                  type="button"
                  onClick={openAddForm}
                >
                  <FiPlus aria-hidden="true" />
                  Add transaction
                </button>
              : <p className="mt-4 text-sm text-[#6d7974]">
                  Create at least one category and payment method before
                  recording a transaction.
                </p>
              }
            </EmptyState>
          : <div className="overflow-hidden">
              <div className="max-[680px]:hidden">
                <div className="min-w-0">
                  <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.85fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.1fr)_72px] gap-2 border-b border-[var(--border)] px-3 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    <span>Description</span>
                    <span>Amount</span>
                    <span>Category</span>
                    <span>Payment</span>
                    <span>Date</span>
                    <span className="text-right">Actions</span>
                  </div>

                  {transactions.map((transaction) => (
                    <div
                      className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.85fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.1fr)_72px] items-center gap-2 border-b border-[var(--border)] px-3 py-4 text-[12px] text-[var(--text-primary)] last:border-b-0"
                      key={transaction.id}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={`grid h-[34px] w-[34px] shrink-0 aspect-square place-items-center rounded-[7px] font-serif text-sm font-bold ${transaction.type === "income" ? "bg-[#dcece1] text-[#27735f]" : "bg-[#f2e9d5] text-[#a2662d]"}`}
                        >
                          {transaction.type === "income" ?
                            <FiArrowUpRight aria-hidden="true" />
                          : <FiArrowDownLeft aria-hidden="true" />}
                        </span>
                        <div className="min-w-0">
                          <strong className="block break-words text-sm font-semibold text-[var(--text-heading)]">
                            {transaction.description}
                          </strong>
                        </div>
                      </div>

                      <span
                        className={`min-w-0 break-words font-semibold ${transaction.type === "income" ? "text-[var(--brand)]" : "text-[var(--text-secondary)]"}`}
                      >
                        {formatTransactionAmount(
                          transaction.amount,
                          transaction.type,
                          currency,
                        )}
                      </span>
                      <span className="min-w-0 break-words">
                        {transaction.category?.name ?? "Unknown"}
                      </span>
                      <span className="min-w-0 break-words">
                        {transaction.paymentMethod?.name ?? "Unknown"}
                      </span>
                      <span className="min-w-0 break-words text-[var(--text-secondary)]">
                        {formatDate(
                          transaction.occurred_at ?? transaction.date,
                        )}
                      </span>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2 max-[680px]:h-10 max-[680px]:w-10"
                          aria-label={`Edit ${transaction.description}`}
                          onClick={() => openEditForm(transaction)}
                        >
                          <FiEdit2 aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)] transition hover:bg-[var(--danger-hover)] focus-visible:outline-2 focus-visible:outline-[var(--danger)] focus-visible:outline-offset-2 max-[680px]:h-10 max-[680px]:w-10"
                          aria-label={`Delete ${transaction.description}`}
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden min-w-0 grid-cols-[minmax(0,1fr)] gap-3 max-[680px]:grid">
                {transactions.map((transaction) => (
                  <article
                    className="min-w-0 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--card-shadow)]"
                    key={transaction.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[8px] text-sm font-bold ${transaction.type === "income" ? "bg-[#dcece1] text-[#27735f]" : "bg-[#f2e9d5] text-[#a2662d]"}`}
                        >
                          {transaction.type === "income" ?
                            <FiArrowUpRight aria-hidden="true" />
                          : <FiArrowDownLeft aria-hidden="true" />}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                            {transaction.type === "income" ?
                              "Income"
                            : "Expense"}
                          </p>
                          <h3 className="mt-1 truncate text-sm font-bold text-[var(--text-heading)]">
                            {transaction.description}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`whitespace-nowrap text-sm font-bold ${transaction.type === "income" ? "text-[var(--brand)]" : "text-[var(--text-secondary)]"}`}
                      >
                        {formatTransactionAmount(
                          transaction.amount,
                          transaction.type,
                          currency,
                        )}
                      </span>
                    </div>

                    <dl className="mt-4 grid min-w-0 gap-2 text-sm text-[var(--text-secondary)]">
                      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                        <dt className="font-medium text-[var(--text-muted)]">
                          Category
                        </dt>
                        <dd className="min-w-0 break-words text-right text-[var(--text-primary)]">
                          {transaction.category?.name ?? "Unknown"}
                        </dd>
                      </div>
                      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                        <dt className="font-medium text-[var(--text-muted)]">
                          Payment
                        </dt>
                        <dd className="min-w-0 break-words text-right text-[var(--text-primary)]">
                          {transaction.paymentMethod?.name ?? "Unknown"}
                        </dd>
                      </div>
                      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                        <dt className="font-medium text-[var(--text-muted)]">
                          Date
                        </dt>
                        <dd className="min-w-0 break-words text-right text-[var(--text-primary)]">
                          {formatDate(
                            transaction.occurred_at ?? transaction.date,
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:outline-offset-2 max-[680px]:h-10 max-[680px]:w-10"
                        aria-label={`Edit ${transaction.description}`}
                        onClick={() => openEditForm(transaction)}
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)] transition hover:bg-[var(--danger-hover)] focus-visible:outline-2 focus-visible:outline-[var(--danger)] focus-visible:outline-offset-2 max-[680px]:h-10 max-[680px]:w-10"
                        aria-label={`Delete ${transaction.description}`}
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          }
        </div>
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Delete transaction?"
        message={`Delete "${deleteTarget?.description ?? "this transaction"}"? This removes it from your transaction history.`}
        confirmLabel="Delete transaction"
        destructive
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {isFormOpen ?
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[rgba(17,24,39,0.45)] p-4 max-[680px]:items-start max-[680px]:overflow-y-auto max-[680px]:py-4">
          <div className="w-full max-w-[560px] rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.18)] max-[680px]:max-h-[calc(100dvh-2rem)] max-[680px]:min-h-0 max-[680px]:overflow-y-auto max-[680px]:overscroll-contain max-[680px]:max-w-full max-[680px]:p-4">
            <div className="mb-5 flex shrink-0 items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Transaction
                </p>
                <h3 className="mt-2 font-serif text-[28px] font-normal text-[var(--text-heading)]">
                  {editingId ? "Edit transaction" : "Add transaction"}
                </h3>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition hover:border-[#0f766e] hover:text-[#0f766e]"
                onClick={resetForm}
                aria-label="Close transaction form"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
              {Object.keys(validationErrors).length > 0 ?
                <div
                  className="rounded-[8px] border border-[#f2d1c4] bg-[#fff3f0] px-4 py-3 text-sm text-[#8a3c26]"
                  role="alert"
                >
                  <p className="font-semibold">
                    Please check the highlighted fields:
                  </p>
                  <ul className="mt-1 list-inside list-disc">
                    {Object.keys(validationErrors).map((field) => (
                      <li key={field}>{transactionFieldLabels[field]}</li>
                    ))}
                  </ul>
                </div>
              : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Description</span>
                  <input
                    aria-describedby={
                      validationErrors.description ?
                        "transaction-description-error"
                      : undefined
                    }
                    aria-invalid={Boolean(validationErrors.description)}
                    className={`min-h-[42px] rounded-[8px] border ${validationErrors.description ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]`}
                    type="text"
                    required
                    value={formState.description}
                    onChange={(event) =>
                      updateFormField("description", event.target.value)
                    }
                    placeholder="Groceries, salary, rent..."
                  />
                  {validationErrors.description ?
                    <span
                      className="text-xs text-[#8a3c26]"
                      id="transaction-description-error"
                    >
                      {validationErrors.description}
                    </span>
                  : null}
                </label>

                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Amount</span>
                  <input
                    aria-describedby={
                      validationErrors.amount ?
                        "transaction-amount-error"
                      : undefined
                    }
                    aria-invalid={Boolean(validationErrors.amount)}
                    className={`min-h-[42px] rounded-[8px] border ${validationErrors.amount ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]`}
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    required
                    value={formState.amount}
                    onChange={(event) =>
                      updateFormField("amount", event.target.value)
                    }
                    placeholder="0.00"
                  />
                  {validationErrors.amount ?
                    <span
                      className="text-xs text-[#8a3c26]"
                      id="transaction-amount-error"
                    >
                      {validationErrors.amount}
                    </span>
                  : null}
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className="relative grid min-w-0 gap-2 text-sm text-[var(--text-primary)]"
                  ref={typeMenuRef}
                >
                  <span className="font-semibold">Type</span>
                  <button
                    aria-controls="transaction-type-options"
                    aria-describedby={
                      validationErrors.type ?
                        "transaction-type-error"
                      : undefined
                    }
                    aria-invalid={Boolean(validationErrors.type)}
                    aria-expanded={activePicker === "type"}
                    aria-haspopup="menu"
                    className={`flex min-h-[42px] w-full items-center justify-between rounded-[8px] border ${validationErrors.type ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-left text-[var(--text-primary)] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#dfeae4]`}
                    onClick={() =>
                      setActivePicker((currentPicker) =>
                        currentPicker === "type" ? null : "type",
                      )
                    }
                    type="button"
                  >
                    <span>
                      {formState.type === "income" ? "Income" : "Expense"}
                    </span>
                    <span aria-hidden="true">▾</span>
                  </button>
                  {activePicker === "type" ?
                    <div
                      className="absolute top-full z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-[8px] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_12px_28px_rgba(15,23,42,0.2)]"
                      id="transaction-type-options"
                      role="menu"
                    >
                      {[
                        { value: "expense", label: "Expense" },
                        { value: "income", label: "Income" },
                      ].map((option) => (
                        <button
                          aria-checked={formState.type === option.value}
                          className="block min-h-10 w-full px-3 text-left text-[var(--text-primary)] hover:bg-[var(--brand-soft)] focus:bg-[var(--brand-soft)] focus:outline-none"
                          key={option.value}
                          onClick={() => {
                            updateFormField("type", option.value);
                            setActivePicker(null);
                          }}
                          role="menuitemradio"
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  : null}
                  {validationErrors.type ?
                    <span
                      className="text-xs text-[#8a3c26]"
                      id="transaction-type-error"
                    >
                      {validationErrors.type}
                    </span>
                  : null}
                </div>

                <div
                  className="grid min-w-0 gap-2 text-sm text-[var(--text-primary)]"
                  ref={dateTimePickerRef}
                >
                  <span className="font-semibold">Date and time</span>
                  <div className="grid min-w-0 grid-cols-2 gap-2">
                    <div className="grid min-w-0 gap-1 text-xs text-[var(--text-secondary)]">
                      <span id="transaction-date-label">Date</span>
                      <button
                        aria-controls="transaction-date-picker"
                        aria-describedby={
                          validationErrors.occurredAt ?
                            "transaction-date-error"
                          : undefined
                        }
                        aria-expanded={activeDateTimePicker === "date"}
                        aria-haspopup="dialog"
                        aria-invalid={Boolean(validationErrors.occurredAt)}
                        aria-labelledby="transaction-date-label transaction-date-value"
                        className={`flex min-h-[42px] min-w-0 w-full items-center justify-between gap-2 rounded-[8px] border ${validationErrors.occurredAt ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-left text-sm text-[var(--text-primary)] outline-none transition hover:border-[#0f766e] focus:border-[#0f766e] focus:ring-2 focus:ring-[#dfeae4]`}
                        onClick={() =>
                          setActiveDateTimePicker((currentPicker) =>
                            currentPicker === "date" ? null : "date",
                          )
                        }
                        type="button"
                      >
                        <span className="truncate" id="transaction-date-value">
                          {selectedDate ?
                            formatPickerDate(selectedDate)
                          : "Select date"}
                        </span>
                        <span aria-hidden="true">▾</span>
                      </button>
                    </div>
                    <div className="grid min-w-0 gap-1 text-xs text-[var(--text-secondary)]">
                      <span id="transaction-time-label">Time</span>
                      <button
                        aria-controls="transaction-time-picker"
                        aria-describedby={
                          validationErrors.occurredAt ?
                            "transaction-date-error"
                          : undefined
                        }
                        aria-expanded={activeDateTimePicker === "time"}
                        aria-haspopup="dialog"
                        aria-invalid={Boolean(validationErrors.occurredAt)}
                        aria-labelledby="transaction-time-label transaction-time-value"
                        className={`flex min-h-[42px] min-w-0 w-full items-center justify-between gap-2 rounded-[8px] border ${validationErrors.occurredAt ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-left text-sm text-[var(--text-primary)] outline-none transition hover:border-[#0f766e] focus:border-[#0f766e] focus:ring-2 focus:ring-[#dfeae4]`}
                        onClick={() =>
                          setActiveDateTimePicker((currentPicker) =>
                            currentPicker === "time" ? null : "time",
                          )
                        }
                        type="button"
                      >
                        <span className="truncate" id="transaction-time-value">
                          {selectedHour}:{selectedMinute}
                        </span>
                        <span aria-hidden="true">▾</span>
                      </button>
                    </div>
                  </div>
                  {activeDateTimePicker === "date" ?
                    <div
                      aria-label="Select transaction date"
                      className="w-full min-w-0 max-w-full overflow-x-auto rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                      id="transaction-date-picker"
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

                          const currentTime =
                            formState.occurredAt.slice(11, 16) || "00:00";
                          updateFormField(
                            "occurredAt",
                            `${dateToDateTimeValue(date)}T${currentTime}`,
                          );
                          setActiveDateTimePicker(null);
                        }}
                        style={{
                          "--rdp-accent-color": "var(--brand)",
                          "--rdp-accent-background-color": "var(--brand-soft)",
                          "--rdp-day-width": "36px",
                          "--rdp-day-height": "36px",
                          "--rdp-day_button-width": "34px",
                          "--rdp-day_button-height": "34px",
                          "--rdp-day_button-border-radius": "8px",
                          "--rdp-nav_button-width": "32px",
                          "--rdp-nav_button-height": "32px",
                        }}
                      />
                    </div>
                  : null}
                  {activeDateTimePicker === "time" ?
                    <div
                      aria-label="Select transaction time"
                      className="grid min-w-0 grid-cols-2 gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                      id="transaction-time-picker"
                      ref={timePickerRef}
                      role="dialog"
                      aria-modal="false"
                    >
                      <div className="grid min-w-0 gap-2">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          Hour
                        </span>
                        <div className="grid max-h-40 min-w-0 grid-cols-3 gap-1 overflow-y-auto overscroll-contain rounded-[6px] bg-[var(--page-bg)] p-1">
                          {Array.from({ length: 24 }, (_, hour) => {
                            const hourValue = twoDigitPart(hour);
                            const isSelected = selectedHour === hourValue;

                            return (
                              <button
                                aria-label={`Hour ${hourValue}`}
                                aria-pressed={isSelected}
                                className={`min-h-9 rounded-[6px] text-sm transition focus:outline-none focus:ring-2 focus:ring-[#0f766e] ${isSelected ? "bg-[var(--brand)] font-semibold text-white" : "text-[var(--text-primary)] hover:bg-[var(--brand-soft)]"}`}
                                key={hourValue}
                                onClick={() => updateTimePart("hour", hour)}
                                type="button"
                              >
                                {hourValue}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid min-w-0 gap-2">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          Minute
                        </span>
                        <div className="grid max-h-40 min-w-0 grid-cols-3 gap-1 overflow-y-auto overscroll-contain rounded-[6px] bg-[var(--page-bg)] p-1">
                          {Array.from({ length: 60 }, (_, minute) => {
                            const minuteValue = twoDigitPart(minute);
                            const isSelected = selectedMinute === minuteValue;

                            return (
                              <button
                                aria-label={`Minute ${minuteValue}`}
                                aria-pressed={isSelected}
                                className={`min-h-9 rounded-[6px] text-sm transition focus:outline-none focus:ring-2 focus:ring-[#0f766e] ${isSelected ? "bg-[var(--brand)] font-semibold text-white" : "text-[var(--text-primary)] hover:bg-[var(--brand-soft)]"}`}
                                key={minuteValue}
                                onClick={() => updateTimePart("minute", minute)}
                                type="button"
                              >
                                {minuteValue}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  : null}
                  {validationErrors.occurredAt ?
                    <span
                      className="text-xs text-[#8a3c26]"
                      id="transaction-date-error"
                    >
                      {validationErrors.occurredAt}
                    </span>
                  : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className="relative grid gap-2 text-sm text-[var(--text-primary)]"
                  ref={categoryMenuRef}
                >
                  <span className="font-semibold">Category</span>
                  <button
                    aria-controls="transaction-category-options"
                    aria-describedby={
                      validationErrors.category_id ?
                        "transaction-category-error"
                      : undefined
                    }
                    aria-expanded={isCategoryMenuOpen}
                    aria-invalid={Boolean(validationErrors.category_id)}
                    aria-haspopup="menu"
                    className={`flex min-h-[42px] w-full items-center justify-between rounded-[8px] border ${validationErrors.category_id ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-left text-[var(--text-primary)] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#dfeae4]`}
                    onClick={() => setIsCategoryMenuOpen((isOpen) => !isOpen)}
                    type="button"
                  >
                    <span>
                      {orderedCategories.find(
                        (category) => category.id === formState.category_id,
                      )?.name ?? "Select a category"}
                    </span>
                    <span aria-hidden="true">▾</span>
                  </button>
                  {isCategoryMenuOpen ?
                    <div
                      className="absolute top-full z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-[8px] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_12px_28px_rgba(15,23,42,0.2)]"
                      id="transaction-category-options"
                      role="menu"
                    >
                      <button
                        aria-checked={!formState.category_id}
                        className="block min-h-9 w-full px-3 text-left text-[var(--text-primary)] hover:bg-[var(--brand-soft)] focus:bg-[var(--brand-soft)] focus:outline-none"
                        onClick={() => {
                          updateFormField("category_id", "");
                          setIsCategoryMenuOpen(false);
                        }}
                        role="menuitemradio"
                        type="button"
                      >
                        Select a category
                      </button>
                      {orderedCategories.map((category) => (
                        <button
                          aria-checked={formState.category_id === category.id}
                          className="block min-h-9 w-full px-3 text-left text-[var(--text-primary)] hover:bg-[var(--brand-soft)] focus:bg-[var(--brand-soft)] focus:outline-none"
                          key={category.id}
                          onClick={() => {
                            updateFormField("category_id", category.id);
                            setIsCategoryMenuOpen(false);
                          }}
                          role="menuitemradio"
                          type="button"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  : null}
                  {validationErrors.category_id ?
                    <span
                      className="text-xs text-[#8a3c26]"
                      id="transaction-category-error"
                    >
                      {validationErrors.category_id}
                    </span>
                  : null}
                </div>

                <div
                  className="relative grid min-w-0 gap-2 text-sm text-[var(--text-primary)]"
                  ref={paymentMethodMenuRef}
                >
                  <span className="font-semibold">Payment method</span>
                  <button
                    aria-controls="transaction-payment-method-options"
                    aria-describedby={
                      validationErrors.payment_method_id ?
                        "transaction-payment-method-error"
                      : undefined
                    }
                    aria-invalid={Boolean(validationErrors.payment_method_id)}
                    aria-expanded={activePicker === "paymentMethod"}
                    aria-haspopup="menu"
                    className={`flex min-h-[42px] w-full items-center justify-between rounded-[8px] border ${validationErrors.payment_method_id ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-left text-[var(--text-primary)] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#dfeae4]`}
                    onClick={() =>
                      setActivePicker((currentPicker) =>
                        currentPicker === "paymentMethod" ? null : (
                          "paymentMethod"
                        ),
                      )
                    }
                    type="button"
                  >
                    <span>
                      {paymentMethods.find(
                        (paymentMethod) =>
                          paymentMethod.id === formState.payment_method_id,
                      )?.name ?? "Select a payment method"}
                    </span>
                    <span aria-hidden="true">▾</span>
                  </button>
                  {activePicker === "paymentMethod" ?
                    <div
                      className="absolute top-full z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-[8px] border border-[var(--border)] bg-[var(--surface)] py-1 shadow-[0_12px_28px_rgba(15,23,42,0.2)]"
                      id="transaction-payment-method-options"
                      role="menu"
                    >
                      <button
                        aria-checked={!formState.payment_method_id}
                        className="block min-h-10 w-full px-3 text-left text-[var(--text-primary)] hover:bg-[var(--brand-soft)] focus:bg-[var(--brand-soft)] focus:outline-none"
                        onClick={() => {
                          updateFormField("payment_method_id", "");
                          setActivePicker(null);
                        }}
                        role="menuitemradio"
                        type="button"
                      >
                        Select a payment method
                      </button>
                      {paymentMethods.map((paymentMethod) => (
                        <button
                          aria-checked={
                            paymentMethod.id === formState.payment_method_id
                          }
                          className="block min-h-10 w-full px-3 text-left text-[var(--text-primary)] hover:bg-[var(--brand-soft)] focus:bg-[var(--brand-soft)] focus:outline-none"
                          key={paymentMethod.id}
                          onClick={() => {
                            updateFormField(
                              "payment_method_id",
                              paymentMethod.id,
                            );
                            setActivePicker(null);
                          }}
                          role="menuitemradio"
                          type="button"
                        >
                          {paymentMethod.name}
                        </button>
                      ))}
                    </div>
                  : null}
                  {validationErrors.payment_method_id ?
                    <span
                      className="text-xs text-[#8a3c26]"
                      id="transaction-payment-method-error"
                    >
                      {validationErrors.payment_method_id}
                    </span>
                  : null}
                </div>
              </div>

              <div className="mt-2 flex flex-col-reverse items-stretch gap-2 min-[480px]:flex-row min-[480px]:justify-end min-[480px]:gap-3 max-[680px]:mt-0 max-[680px]:border-t max-[680px]:border-[var(--border)] max-[680px]:bg-[var(--surface)] max-[680px]:pt-3">
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--text-primary)] transition hover:border-[#0f766e] hover:text-[#0f766e] min-[480px]:min-h-[42px]"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-sm font-bold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:bg-[#a4b4b0] min-[480px]:min-h-[42px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ?
                    "Saving..."
                  : editingId ?
                    "Save Changes"
                  : "Save transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      : null}
    </PageLayout>
  );
}
