import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json(
        { error: "Username or email is required" },
        { status: 400 }
      );
    }

    const raw = identifier.trim().toLowerCase();
    const trimmed = raw.startsWith("@") ? raw.slice(1) : raw;

    // 1. If it's already an email
    if (trimmed.includes("@")) {
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const user = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === trimmed
        );
        if (user) {
          const providers = user.app_metadata?.providers || [];
          return NextResponse.json({
            success: true,
            email: trimmed,
            userId: user.id,
            hasPassword: providers.includes("email"),
            isGoogleOnly: providers.includes("google") && !providers.includes("email"),
            providers,
          });
        }
      } catch (_) {}
      return NextResponse.json({ success: true, email: trimmed, hasPassword: true });
    }

    // 2. Otherwise look up username in `profiles` table
    const cleanUsername = trimmed.replace(/[^a-z0-9_]/g, "");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, username")
      .eq("username", cleanUsername)
      .single();

    if (profile) {
      try {
        const userRes = await supabaseAdmin.auth.admin.getUserById(profile.id);
        if (userRes?.data?.user?.email) {
          const user = userRes.data.user;
          const providers = user.app_metadata?.providers || [];
          return NextResponse.json({
            success: true,
            email: user.email,
            userId: profile.id,
            hasPassword: providers.includes("email"),
            isGoogleOnly: providers.includes("google") && !providers.includes("email"),
            providers,
          });
        }
      } catch (_) {}
    }

    // 3. Fallback to @numpang.app format
    return NextResponse.json({
      success: true,
      email: `${cleanUsername}@numpang.app`,
      hasPassword: false,
      isGoogleOnly: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Could not resolve identifier" },
      { status: 500 }
    );
  }
}
