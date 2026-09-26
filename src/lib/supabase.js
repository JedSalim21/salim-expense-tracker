import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseUrl =
  rawSupabaseUrl ?
    rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "")
  : "";

export function createSupabaseClient(getAccessToken) {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing Supabase environment configuration");
  }

  if (typeof getAccessToken !== "function") {
    throw new Error("A Clerk access-token provider is required");
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    accessToken: async () => {
      const token = await getAccessToken();
      return typeof token === "string" && token.trim() ? token : null;
    },
  });
}
