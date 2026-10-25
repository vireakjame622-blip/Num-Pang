import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Determine actual public host and protocol (resolving mobile IP, reverse proxy, localhost)
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    requestUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (requestUrl.protocol ? requestUrl.protocol.replace(":", "") : "http");
  const origin = `${proto}://${host}`;

  // If OAuth failed at provider
  if (error || errorDescription) {
    const errorMsg = errorDescription || error || "Google sign in error";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMsg)}`
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const redirectUrl = `${origin}${next}`;
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const isSecure =
                process.env.NODE_ENV === "production" &&
                !origin.startsWith("http://");

              const cookieOpts = {
                ...options,
                secure: isSecure,
                sameSite: "lax" as const,
                path: "/",
              };
              cookieStore.set(name, value, cookieOpts);
              response.cookies.set(name, value, cookieOpts);
            });
          },
        },
      }
    );

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && data?.user) {
      const user = data.user;
      const baseUsername =
        user.user_metadata?.username ||
        user.user_metadata?.user_name ||
        user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
        `foodie_${Date.now()}`;

      // Automatically ensure a real profile row exists in `public.profiles`
      try {
        const { data: existingProf } = await supabaseAdmin
          .from("profiles")
          .select("id, username")
          .eq("id", user.id)
          .single();

        let targetUsername = existingProf?.username || baseUsername;

        if (!existingProf) {
          // Check if username is taken by another user
          const { data: taken } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("username", targetUsername)
            .neq("id", user.id)
            .single();

          if (taken) {
            targetUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
          }

          await supabaseAdmin.from("profiles").upsert(
            {
              id: user.id,
              username: targetUsername,
              full_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                targetUsername,
              avatar_url:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                "",
              bio: "Khmer food lover",
            },
            { onConflict: "id" }
          );
        }
      } catch (profileErr) {
        console.warn("Could not upsert Google user profile in callback:", profileErr);
      }

      // Return the response object that has the Set-Cookie headers attached!
      return response;
    }

    if (exchangeError) {
      console.error("Auth exchange code error:", exchangeError.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }
  }

  // Fallback redirect with error
  return NextResponse.redirect(
    `${origin}/login?error=Could%20not%20complete%20Google%20authentication`
  );
}
