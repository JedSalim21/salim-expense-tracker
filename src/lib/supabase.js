import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function createSupabaseClient(getAccessToken) {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Missing Supabase environment configuration");
  }

  if (typeof getAccessToken !== "function") {
    throw new Error("A Clerk access-token provider is required");
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    accessToken: getAccessToken,
  });
}
