import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
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
import SidebarNav from "../components/SidebarNav";
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
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formState, setFormState] = useState(emptyFormState);
  const categoryMenuRef = useRef(null);

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

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormState(emptyFormState);
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

  const openAddForm = () => {
    if (categories.length === 0 || paymentMethods.length === 0) {
      setErrorMessage(
        "Add at least one category and payment method before creating a transaction.",
      );
      return;
    }

    setEditingId(null);
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
    <section
      className="grid min-h-[calc(100svh-73px)] grid-cols-[216px_minmax(0,1fr)] bg-[var(--page-bg)] text-left text-[var(--text-primary)] max-[980px]:grid-cols-[176px_minmax(0,1fr)] max-[680px]:block max-[680px]:pb-[72px]"
      aria-label="SalimSpend transactions"
    >
      <SidebarNav
        currentView={currentView}
        onSelectView={onSelectView}
        footerText="Your transaction history is ready to review."
        footerDotClassName="bg-[#0f766e] shadow-[0_0_0_4px_rgba(15,118,110,0.15)]"
      />

      <div className="min-w-0 px-[46px] pb-14 pt-[42px] max-[980px]:px-7 max-[980px]:pb-[46px] max-[680px]:px-[18px] max-[680px]:pb-[38px] max-[680px]:pt-7">
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
            <div className="grid min-h-[260px] place-items-center rounded-[8px] border border-dashed border-[#d7e0dc] bg-[#f8faf8] px-6 py-10 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#edf6f1] text-[20px] text-[#0f766e]">
                  <FiInbox aria-hidden="true" />
                </div>
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
              </div>
            </div>
          : <div className="overflow-hidden">
              <div className="max-[680px]:hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[860px]">
                    <div className="grid grid-cols-[minmax(220px,1.8fr)_minmax(120px,0.8fr)_minmax(140px,1fr)_minmax(150px,1fr)_minmax(160px,1fr)_minmax(110px,0.6fr)] gap-4 border-b border-[var(--border)] px-3 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      <span>Description</span>
                      <span>Amount</span>
                      <span>Category</span>
                      <span>Payment</span>
                      <span>Date</span>
                      <span className="text-right">Actions</span>
                    </div>

                    {transactions.map((transaction) => (
                      <div
                        className="grid grid-cols-[minmax(220px,1.8fr)_minmax(120px,0.8fr)_minmax(140px,1fr)_minmax(150px,1fr)_minmax(160px,1fr)_minmax(110px,0.6fr)] items-center gap-4 border-b border-[var(--border)] px-3 py-4 text-[12px] text-[var(--text-primary)] last:border-b-0"
                        key={transaction.id}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-[34px] w-[34px] place-items-center rounded-[7px] font-serif text-sm font-bold ${transaction.type === "income" ? "bg-[#dcece1] text-[#27735f]" : "bg-[#f2e9d5] text-[#a2662d]"}`}
                          >
                            {transaction.type === "income" ?
                              <FiArrowUpRight aria-hidden="true" />
                            : <FiArrowDownLeft aria-hidden="true" />}
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate text-sm font-semibold text-[var(--text-heading)]">
                              {transaction.description}
                            </strong>
                          </div>
                        </div>

                        <span
                          className={`font-semibold ${transaction.type === "income" ? "text-[var(--brand)]" : "text-[var(--text-secondary)]"}`}
                        >
                          {formatTransactionAmount(
                            transaction.amount,
                            transaction.type,
                            currency,
                          )}
                        </span>
                        <span>{transaction.category?.name ?? "Unknown"}</span>
                        <span>
                          {transaction.paymentMethod?.name ?? "Unknown"}
                        </span>
                        <span className="text-[var(--text-secondary)]">
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
              </div>

              <div className="hidden max-[680px]:grid gap-3">
                {transactions.map((transaction) => (
                  <article
                    className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--card-shadow)]"
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

                    <dl className="mt-4 grid gap-2 text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="font-medium text-[var(--text-muted)]">
                          Category
                        </dt>
                        <dd className="text-right text-[var(--text-primary)]">
                          {transaction.category?.name ?? "Unknown"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="font-medium text-[var(--text-muted)]">
                          Payment
                        </dt>
                        <dd className="text-right text-[var(--text-primary)]">
                          {transaction.paymentMethod?.name ?? "Unknown"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="font-medium text-[var(--text-muted)]">
                          Date
                        </dt>
                        <dd className="text-right text-[var(--text-primary)]">
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
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[rgba(17,24,39,0.45)] p-4">
          <div className="w-full max-w-[560px] overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.18)] max-[680px]:max-w-full max-[680px]:p-4">
            <div className="mb-5 flex items-center justify-between gap-4">
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
                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Type</span>
                  <select
                    aria-describedby={
                      validationErrors.type ?
                        "transaction-type-error"
                      : undefined
                    }
                    aria-invalid={Boolean(validationErrors.type)}
                    className={`min-h-[42px] rounded-[8px] border ${validationErrors.type ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]`}
                    required
                    value={formState.type}
                    onChange={(event) =>
                      updateFormField("type", event.target.value)
                    }
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  {validationErrors.type ?
                    <span
                      className="text-xs text-[#8a3c26]"
                      id="transaction-type-error"
                    >
                      {validationErrors.type}
                    </span>
                  : null}
                </label>

                <div className="grid min-w-0 gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Date and time</span>
                  <input
                    aria-describedby={
                      validationErrors.occurredAt ?
                        "transaction-date-error"
                      : undefined
                    }
                    aria-invalid={Boolean(validationErrors.occurredAt)}
                    className={`block w-full min-w-0 max-w-full min-h-[42px] rounded-[8px] border ${validationErrors.occurredAt ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[#0f766e] max-[680px]:hidden`}
                    type="datetime-local"
                    required
                    value={formState.occurredAt}
                    onChange={(event) =>
                      updateFormField("occurredAt", event.target.value)
                    }
                  />
                  <div className="hidden grid-cols-2 gap-2 max-[680px]:grid">
                    <label className="grid min-w-0 gap-1 text-xs text-[var(--text-secondary)]">
                      <span>Date</span>
                      <input
                        aria-label="Date"
                        aria-invalid={Boolean(validationErrors.occurredAt)}
                        className={`w-full min-w-0 min-h-[42px] rounded-[8px] border ${validationErrors.occurredAt ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-2 text-[16px] text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]`}
                        type="date"
                        required
                        value={formState.occurredAt.slice(0, 10)}
                        onChange={(event) => {
                          const nextDate = event.target.value;
                          const currentTime =
                            formState.occurredAt.slice(11, 16) || "00:00";
                          updateFormField(
                            "occurredAt",
                            nextDate ? `${nextDate}T${currentTime}` : "",
                          );
                        }}
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-xs text-[var(--text-secondary)]">
                      <span>Time</span>
                      <input
                        aria-label="Time"
                        aria-invalid={Boolean(validationErrors.occurredAt)}
                        className={`w-full min-w-0 min-h-[42px] rounded-[8px] border ${validationErrors.occurredAt ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-2 text-[16px] text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]`}
                        type="time"
                        required
                        value={formState.occurredAt.slice(11, 16)}
                        onChange={(event) => {
                          const nextTime = event.target.value;
                          const currentDate = formState.occurredAt.slice(0, 10);
                          updateFormField(
                            "occurredAt",
                            currentDate && nextTime ?
                              `${currentDate}T${nextTime}`
                            : "",
                          );
                        }}
                      />
                    </label>
                  </div>
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

                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Payment method</span>
                  <select
                    aria-describedby={
                      validationErrors.payment_method_id ?
                        "transaction-payment-method-error"
                      : undefined
                    }
                    aria-invalid={Boolean(validationErrors.payment_method_id)}
                    className={`min-h-[42px] rounded-[8px] border ${validationErrors.payment_method_id ? "border-[#b45309]" : "border-[var(--border)]"} bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]`}
                    required
                    value={formState.payment_method_id}
                    onChange={(event) =>
                      updateFormField("payment_method_id", event.target.value)
                    }
                  >
                    <option value="">Select a payment method</option>
                    {paymentMethods.map((paymentMethod) => (
                      <option key={paymentMethod.id} value={paymentMethod.id}>
                        {paymentMethod.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.payment_method_id ?
                    <span
                      className="text-xs text-[#8a3c26]"
                      id="transaction-payment-method-error"
                    >
                      {validationErrors.payment_method_id}
                    </span>
                  : null}
                </label>
              </div>

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--text-primary)] transition hover:border-[#0f766e] hover:text-[#0f766e]"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-[42px] items-center justify-center rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-sm font-bold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:bg-[#a4b4b0]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ?
                    "Saving..."
                  : editingId ?
                    "Update transaction"
                  : "Save transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      : null}
    </section>
  );
}
