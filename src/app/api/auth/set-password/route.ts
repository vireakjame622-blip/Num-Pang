import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const raw = identifier.trim().toLowerCase();
    const cleanIdentifier = raw.startsWith("@") ? raw.slice(1) : raw;

    let targetUserId: string | null = null;
    let targetEmail: string | null = null;

    // 1. If it's an email, find user by email
    if (cleanIdentifier.includes("@")) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const user = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === cleanIdentifier
      );
      if (user) {
        targetUserId = user.id;
        targetEmail = user.email || cleanIdentifier;
      }
    } else {
      // 2. Otherwise find in profiles table
      const cleanUsername = cleanIdentifier.replace(/[^a-z0-9_]/g, "");
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, username")
        .eq("username", cleanUsername)
        .single();

      if (profile) {
        targetUserId = profile.id;
        const userRes = await supabaseAdmin.auth.admin.getUserById(profile.id);
        if (userRes?.data?.user?.email) {
          targetEmail = userRes.data.user.email;
        }
      } else {
        // Search by user_metadata.username in auth.users
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const user = usersData?.users?.find(
          (u) =>
            u.user_metadata?.username === cleanUsername ||
            u.email?.split("@")[0] === cleanUsername
        );
        if (user) {
          targetUserId = user.id;
          targetEmail = user.email || `${cleanUsername}@numpang.app`;
        }
      }
    }

    if (!targetUserId || !targetEmail) {
      return NextResponse.json(
        { error: `Account "${cleanIdentifier}" was not found.` },
        { status: 404 }
      );
    }

    // 3. Update password and auto-confirm email
    const { data: updated, error: updateErr } =
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password,
        email_confirm: true,
      });

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email: targetEmail,
      userId: targetUserId,
      message: "Password set and confirmed successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update password" },
      { status: 500 }
    );
  }
}
