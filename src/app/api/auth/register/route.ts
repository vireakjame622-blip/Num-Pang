import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username, fullName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanUsername =
      (username || "").toLowerCase().replace(/[^a-z0-9_]/g, "") ||
      `foodie_${Date.now()}`;

    // 1. Check if user already exists
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      // User already exists: auto-confirm them and update password & metadata
      const { data: updated, error: updateErr } =
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: {
            username: cleanUsername,
            full_name: fullName || cleanUsername,
          },
        });

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      userId = updated.user.id;
    } else {
      // 2. Create brand new user with email_confirm: true
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            username: cleanUsername,
            full_name: fullName || cleanUsername,
          },
        });

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }

      userId = created.user.id;
    }

    // 3. Upsert profile in `profiles` table so it is instantly available
    try {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          username: cleanUsername,
          full_name: fullName || cleanUsername,
          avatar_url: "",
          bio: "Khmer food lover",
        },
        { onConflict: "id" }
      );
    } catch (profileErr) {
      console.warn("Could not upsert profile during registration:", profileErr);
    }

    return NextResponse.json({
      success: true,
      userId,
      message: "Account created and verified instantly",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to register user" },
      { status: 500 }
    );
  }
}
