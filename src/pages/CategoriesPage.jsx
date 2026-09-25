import { useState } from "react";
import {
  FiCheck,
  FiEdit2,
  FiFolderPlus,
  FiPlus,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import SidebarNav from "../components/SidebarNav";

const colorOptions = [
  { name: "Teal", value: "#0f766e" },
  { name: "Amber", value: "#d97706" },
  { name: "Rose", value: "#be185d" },
  { name: "Blue", value: "#2563eb" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Slate", value: "#475569" },
];

const initialCategories = [
  {
    id: "cat-housing",
    name: "Housing",
    description: "Rent, utilities, and home essentials.",
    color: "#0f766e",
    isDefault: true,
  },
  {
    id: "cat-food",
    name: "Food",
    description: "Groceries, dining, and everyday meals.",
    color: "#d97706",
    isDefault: true,
  },
  {
    id: "cat-transport",
    name: "Transport",
    description: "Fuel, transit, and commuting costs.",
    color: "#2563eb",
    isDefault: true,
  },
  {
    id: "cat-lifestyle",
    name: "Lifestyle",
    description: "Entertainment, wellness, and personal spending.",
    color: "#be185d",
    isDefault: false,
  },
];

const defaultFormState = {
  name: "",
  description: "",
  color: colorOptions[0].value,
};

export default function CategoriesPage({ currentView, onSelectView }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState("");

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormState(defaultFormState);
    setErrorMessage("");
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormState(defaultFormState);
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const openEditForm = (category) => {
    setEditingId(category.id);
    setFormState({
      name: category.name,
      description: category.description,
      color: category.color,
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      setErrorMessage("Category name is required.");
      return;
    }

    const existingCategory =
      editingId ?
        categories.find((category) => category.id === editingId)
      : null;

    const categoryPayload = {
      id: editingId ?? `category-${Date.now()}`,
      name: trimmedName,
      description: formState.description.trim(),
      color: formState.color,
      isDefault: existingCategory?.isDefault ?? false,
    };

    setCategories((currentCategories) => {
      if (editingId) {
        return currentCategories.map((category) =>
          category.id === editingId ?
            { ...category, ...categoryPayload }
          : category,
        );
      }

      return [categoryPayload, ...currentCategories];
    });

    resetForm();
  };

  const handleDelete = (categoryId) => {
    const targetCategory = categories.find(
      (category) => category.id === categoryId,
    );
    if (!targetCategory) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${targetCategory.name}"? This only removes it from the category list in this UI.`,
    );

    if (!shouldDelete) {
      return;
    }

    setCategories((currentCategories) =>
      currentCategories.filter((category) => category.id !== categoryId),
    );

    if (editingId === categoryId) {
      resetForm();
    }
  };

  return (
    <section
      className="grid min-h-[calc(100svh-73px)] grid-cols-[216px_minmax(0,1fr)] bg-[#f8f7f3] text-left text-[#23312f] max-[980px]:grid-cols-[176px_minmax(0,1fr)] max-[680px]:block"
      aria-label="SalimSpend categories"
    >
      <SidebarNav
        currentView={currentView}
        onSelectView={onSelectView}
        footerText="Your categories are organized and ready to use."
        footerDotClassName="bg-[#0f766e] shadow-[0_0_0_4px_rgba(15,118,110,0.15)]"
      />

      <div className="min-w-0 px-[46px] pb-14 pt-[42px] max-[980px]:px-7 max-[980px]:pb-[46px] max-[680px]:px-[18px] max-[680px]:pb-[38px] max-[680px]:pt-7">
        <header className="mb-[24px] flex flex-wrap items-start justify-between gap-4 max-[860px]:flex-col max-[860px]:items-start max-[680px]:mb-6">
          <div className="min-w-0">
            <p className="block text-[11px] font-extrabold uppercase tracking-[0.12em] leading-[1.2] text-[#8b8d83]">
              Organization
            </p>
            <h1 className="mt-2 max-w-[540px] font-serif text-[clamp(32px,4vw,46px)] font-normal leading-[1.03] text-[#213b36]">
              Categories
            </h1>
            <p className="mt-2 text-sm text-[#7b8580]">
              Keep your spending grouped and easy to understand.
            </p>
          </div>

          <button
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-sm font-bold text-white transition hover:bg-[#115e59] focus-visible:outline-2 focus-visible:outline-[#0f766e] focus-visible:outline-offset-2 max-[860px]:mt-0 max-[680px]:mt-[18px]"
            type="button"
            onClick={openAddForm}
          >
            <FiPlus aria-hidden="true" />
            Add Category
          </button>
        </header>

        <div className="rounded-[10px] border border-[#e2e2db] bg-[#fffefa] p-[18px] max-[680px]:p-[14px]">
          {categories.length === 0 ?
            <div className="grid min-h-[260px] place-items-center rounded-[8px] border border-dashed border-[#d7e0dc] bg-[#f8faf8] px-6 py-10 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#edf6f1] text-[20px] text-[#0f766e]">
                  <FiFolderPlus aria-hidden="true" />
                </div>
                <h2 className="font-serif text-[26px] font-normal text-[#213b36]">
                  No categories yet
                </h2>
                <p className="mt-2 max-w-[360px] text-sm text-[#6d7974]">
                  Create your first category to begin organizing income and
                  spending.
                </p>
                <button
                  className="mt-5 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-sm font-bold text-white transition hover:bg-[#115e59]"
                  type="button"
                  onClick={openAddForm}
                >
                  <FiPlus aria-hidden="true" />
                  Add category
                </button>
              </div>
            </div>
          : <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <article
                  className="rounded-[10px] border border-[#e3e0d8] bg-[#fdfcf9] p-[18px] shadow-[0_6px_16px_rgba(36,56,53,0.03)]"
                  key={category.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: `${category.color}1a`,
                          color: category.color,
                        }}
                      >
                        <FiTag aria-hidden="true" className="text-base" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-[#213b36]">
                          {category.name}
                        </h3>
                        <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.10em] text-[#8b8d83]">
                          {category.isDefault ? "Default" : "Custom"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-[5px] border border-[#dcded7] bg-white text-[#50615b] transition hover:border-[#0f766e] hover:text-[#0f766e]"
                        type="button"
                        aria-label={`Edit ${category.name}`}
                        title={`Edit ${category.name}`}
                        onClick={() => openEditForm(category)}
                      >
                        <FiEdit2 aria-hidden="true" className="text-[14px]" />
                      </button>
                      <button
                        className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-[5px] border border-[#e7d5d5] bg-[#fff8f8] text-[#8d4953] transition hover:border-[#b65b67] hover:bg-[#fdf0f2]"
                        type="button"
                        aria-label={`Delete ${category.name}`}
                        title={`Delete ${category.name}`}
                        onClick={() => handleDelete(category.id)}
                      >
                        <FiTrash2 aria-hidden="true" className="text-[14px]" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-[14px] min-h-[42px] text-sm leading-[1.55] text-[#5f6d69]">
                    {category.description || "No description provided."}
                  </p>

                  <div className="mt-[20px] flex items-center justify-between gap-3 border-t border-[#efece4] pt-[12px] text-[10px] font-extrabold uppercase tracking-[0.10em] text-[#8b8d83]">
                    <span className="inline-flex items-center gap-[7px]">
                      <i
                        className="inline-block h-[9px] w-[9px] rounded-full"
                        style={{ backgroundColor: category.color }}
                        aria-hidden="true"
                      ></i>
                      {category.color}
                    </span>
                    <span>Category</span>
                  </div>
                </article>
              ))}
            </div>
          }
        </div>
      </div>

      {isFormOpen ?
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1d2a29]/40 p-4">
          <div className="w-full max-w-[520px] rounded-[12px] border border-[#e2e2db] bg-[#fffefa] p-[22px] shadow-[0_26px_80px_rgba(18,32,30,0.18)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8b8d83]">
                  {editingId ? "Update" : "Create"}
                </p>
                <h2 className="mt-1 font-serif text-[28px] font-normal text-[#213b36]">
                  {editingId ? "Edit category" : "Add category"}
                </h2>
              </div>
              <button
                className="grid h-[32px] w-[32px] place-items-center rounded-[6px] border border-[#dcded7] bg-[#fffefa] text-sm text-[#50615b] transition hover:border-[#0f766e] hover:text-[#0f766e]"
                type="button"
                aria-label="Close category form"
                onClick={resetForm}
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-semibold text-[#334740]">
                Category name
                <input
                  className="min-h-[42px] rounded-[8px] border border-[#dce2dd] bg-[#fff] px-3 text-[14px] text-[#213b36] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#dfeae4]"
                  type="text"
                  value={formState.name}
                  placeholder="e.g. Travel"
                  aria-label="Category name"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[#334740]">
                Description
                <textarea
                  className="min-h-[96px] rounded-[8px] border border-[#dce2dd] bg-[#fff] px-3 py-2 text-[14px] text-[#213b36] outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#dfeae4]"
                  rows="4"
                  value={formState.description}
                  placeholder="Optional details about this category"
                  aria-label="Category description"
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-[#334740]">
                  Color accent
                </span>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((option) => {
                    const isSelected = formState.color === option.value;

                    return (
                      <button
                        className={`grid h-[34px] w-[34px] place-items-center rounded-full border-2 transition ${isSelected ? "scale-105 border-[#213b36]" : "border-transparent"}`}
                        key={option.value}
                        type="button"
                        aria-label={`Select ${option.name} color`}
                        style={{ backgroundColor: option.value }}
                        onClick={() =>
                          setFormState((current) => ({
                            ...current,
                            color: option.value,
                          }))
                        }
                      >
                        {isSelected ?
                          <FiCheck
                            className="h-3 w-3 text-white"
                            aria-hidden="true"
                          />
                        : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMessage ?
                <p className="rounded-[6px] border border-[#f2d2d8] bg-[#fff5f7] px-3 py-2 text-sm text-[#8d4953]">
                  {errorMessage}
                </p>
              : null}

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  className="min-h-[40px] rounded-[6px] border border-[#dcded7] bg-[#fffefa] px-4 text-sm font-bold text-[#50615b] transition hover:border-[#0f766e] hover:text-[#0f766e]"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  className="min-h-[40px] rounded-[6px] border border-transparent bg-[#0f766e] px-4 text-sm font-bold text-white transition hover:bg-[#115e59]"
                  type="submit"
                >
                  {editingId ? "Save changes" : "Create category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      : null}
    </section>
  );
}
