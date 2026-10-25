import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

export const isSupabaseConfigured = () => {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    !supabaseUrl.includes("your-project-ref") &&
    !supabaseAnonKey.includes("your-anon-key") &&
    !supabaseAnonKey.includes("dummy-anon-key")
  );
};

export const createClient = () => {
  if (!isSupabaseConfigured()) {
    // Provide a mock or safe fallback client to avoid runtime crashes during local evaluation
    return createBrowserClient(
      supabaseUrl || "https://dummy-placeholder-project.supabase.co",
      supabaseAnonKey || "dummy-anon-key-placeholder"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
