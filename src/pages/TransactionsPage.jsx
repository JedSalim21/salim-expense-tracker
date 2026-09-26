import { useEffect, useMemo, useState } from "react";
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
import SidebarNav from "../components/SidebarNav";
import { loadCategories } from "../lib/categories";
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

const formatCurrency = (amount, type) => {
  const value = Number(amount) || 0;
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Math.abs(value));

  return type === "income" ? `+${formattedValue}` : `-${formattedValue}`;
};

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

export default function TransactionsPage({ currentView, onSelectView }) {
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
  const [errorMessage, setErrorMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyFormState);

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormState(emptyFormState);
    setErrorMessage("");
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

    if (!user?.id) {
      setErrorMessage("You must be signed in to save transactions.");
      return;
    }

    const trimmedDescription = formState.description.trim();
    const amountValue = Number(formState.amount);

    if (!trimmedDescription) {
      setErrorMessage("Description is required.");
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setErrorMessage("Amount must be greater than zero.");
      return;
    }

    if (
      !formState.category_id ||
      !formState.payment_method_id ||
      !formState.occurredAt
    ) {
      setErrorMessage("Category, payment method, and date are required.");
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
      occurred_at: new Date(formState.occurredAt).toISOString(),
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

      resetForm();
    } catch (error) {
      setErrorMessage(error?.message ?? "Unable to save this transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (transactionId) => {
    const target = transactions.find(
      (transaction) => transaction.id === transactionId,
    );
    if (!target) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${target.description}"? This removes it from your transaction history.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (error) {
        throw error;
      }

      setTransactions((currentTransactions) =>
        currentTransactions.filter(
          (transaction) => transaction.id !== transactionId,
        ),
      );

      if (editingId === transactionId) {
        resetForm();
      }
    } catch (error) {
      setErrorMessage(error?.message ?? "Unable to delete this transaction.");
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
      className="grid min-h-[calc(100svh-73px)] grid-cols-[216px_minmax(0,1fr)] bg-[var(--page-bg)] text-left text-[var(--text-primary)] max-[980px]:grid-cols-[176px_minmax(0,1fr)] max-[680px]:block"
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
          : <div className="overflow-x-auto">
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
                      {formatCurrency(transaction.amount, transaction.type)}
                    </span>
                    <span>{transaction.category?.name ?? "Unknown"}</span>
                    <span>{transaction.paymentMethod?.name ?? "Unknown"}</span>
                    <span className="text-[var(--text-secondary)]">
                      {formatDate(transaction.occurred_at ?? transaction.date)}
                    </span>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition hover:border-[#0f766e] hover:text-[#0f766e]"
                        aria-label={`Edit ${transaction.description}`}
                        onClick={() => openEditForm(transaction)}
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition hover:border-[#b45309] hover:text-[#b45309]"
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
          }
        </div>
      </div>

      {isFormOpen ?
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(17,24,39,0.45)] p-4">
          <div className="w-full max-w-[560px] rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
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

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Description</span>
                  <input
                    className="min-h-[42px] rounded-[8px] border border-[var(--border)] bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]"
                    type="text"
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Groceries, salary, rent..."
                  />
                </label>

                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Amount</span>
                  <input
                    className="min-h-[42px] rounded-[8px] border border-[var(--border)] bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formState.amount}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Type</span>
                  <select
                    className="min-h-[42px] rounded-[8px] border border-[var(--border)] bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]"
                    value={formState.type}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        type: event.target.value,
                      }))
                    }
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Date and time</span>
                  <input
                    className="min-h-[42px] rounded-[8px] border border-[var(--border)] bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]"
                    type="datetime-local"
                    value={formState.occurredAt}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        occurredAt: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Category</span>
                  <select
                    className="min-h-[42px] rounded-[8px] border border-[var(--border)] bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#dfeae4] [&_option]:bg-[var(--surface)] [&_option]:text-[var(--text-primary)] [&_option:checked]:bg-[var(--brand)] [&_option:checked]:text-[var(--surface)]"
                    value={formState.category_id}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        category_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select a category</option>
                    {orderedCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-[var(--text-primary)]">
                  <span className="font-semibold">Payment method</span>
                  <select
                    className="min-h-[42px] rounded-[8px] border border-[var(--border)] bg-[var(--page-bg)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[#0f766e]"
                    value={formState.payment_method_id}
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        payment_method_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select a payment method</option>
                    {paymentMethods.map((paymentMethod) => (
                      <option key={paymentMethod.id} value={paymentMethod.id}>
                        {paymentMethod.name}
                      </option>
                    ))}
                  </select>
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
