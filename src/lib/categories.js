export const defaultCategories = [
  {
    name: "Food",
    description: "Groceries, dining, and everyday meals.",
    color: "#d97706",
  },
  {
    name: "Housing",
    description: "Rent, utilities, and home essentials.",
    color: "#0f766e",
  },
  {
    name: "Lifestyle",
    description: "Entertainment, wellness, and personal spending.",
    color: "#be185d",
  },
  {
    name: "Transport",
    description: "Fuel, transit, and commuting costs.",
    color: "#2563eb",
  },
  {
    name: "Investment",
    description: "Investments and long-term savings.",
    color: "#7c3aed",
  },
  { name: "Gift", description: "Gifts and donations.", color: "#be185d" },
  {
    name: "Refund",
    description: "Refunds and returned payments.",
    color: "#2563eb",
  },
  {
    name: "Entertainment",
    description: "Movies, events, and recreation.",
    color: "#7c3aed",
  },
  {
    name: "Utilities",
    description: "Electricity, water, and household services.",
    color: "#475569",
  },
  {
    name: "Shopping",
    description: "Clothing and personal purchases.",
    color: "#d97706",
  },
  {
    name: "Healthcare",
    description: "Medical care and wellness expenses.",
    color: "#be185d",
  },
  {
    name: "Others",
    description: "Transactions that do not fit another category.",
    color: "#475569",
  },
];

export async function loadCategories(supabase, userId) {
  const { error: seedError } = await supabase.from("categories").upsert(
    defaultCategories.map((category) => ({
      clerk_user_id: userId,
      ...category,
      is_default: true,
    })),
    { onConflict: "clerk_user_id,name", ignoreDuplicates: true },
  );

  if (seedError) {
    throw seedError;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description, color, is_default")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
