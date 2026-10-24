import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const cleanUsername =
        user.user_metadata?.username ||
        user.user_metadata?.user_name ||
        user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
        `foodie_${Date.now()}`;

      // Automatically ensure a real profile row exists in `public.profiles`
      try {
        await supabaseAdmin.from("profiles").upsert(
          {
            id: user.id,
            username: cleanUsername,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              cleanUsername,
            avatar_url:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              "",
            bio: "Khmer food lover",
          },
          { onConflict: "id" }
        );
      } catch (profileErr) {
        console.warn("Could not upsert Google user profile in callback:", profileErr);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    if (error) {
      console.error("Auth exchange code error:", error.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  // Return the user to login with instructions
  return NextResponse.redirect(`${origin}/login?error=Could%20not%20authenticate`);
}
