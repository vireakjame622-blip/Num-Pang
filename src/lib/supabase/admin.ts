import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://cizbyaoiapbuvvycxlqb.supabase.co";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
