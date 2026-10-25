"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { DEMO_USER } from "@/lib/demo-data";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoUser: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, username: string, fullName: string) => Promise<{ error: Error | null; session?: any }>;
  setPassword: (identifier: string, newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  toggleDemoLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  const configured = isSupabaseConfigured();
  const supabase = createClient();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    // Live Supabase Authentication
    const fetchUser = async () => {
      try {
        // Exchange code if redirected to any client page (e.g. /?code=... or /login?code=...)
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get("code");
          if (code) {
            try {
              const { error: exchangeErr } =
                await supabase.auth.exchangeCodeForSession(code);
              if (!exchangeErr) {
                // Remove code from query string without page reload
                const cleanUrl = new URL(window.location.href);
                cleanUrl.searchParams.delete("code");
                cleanUrl.searchParams.delete("state");
                window.history.replaceState(
                  {},
                  document.title,
                  cleanUrl.pathname +
                    (cleanUrl.searchParams.toString()
                      ? `?${cleanUrl.searchParams.toString()}`
                      : "")
                );
              }
            } catch (exchangeEx) {
              console.warn("Client exchangeCodeForSession failed:", exchangeEx);
            }
          }
        }

        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (prof) {
            setProfile(prof as Profile);
          } else {
            const cleanUsername =
              user.user_metadata?.username ||
              user.user_metadata?.user_name ||
              user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
              `foodie_${Date.now()}`;

            const newProf: Profile = {
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
            };

            try {
              await supabase.from("profiles").upsert(newProf, { onConflict: "id" });
            } catch (_) {}

            setProfile(newProf);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          if (prof) {
            setProfile(prof as Profile);
          } else {
            const cleanUsername =
              currentUser.user_metadata?.username ||
              currentUser.user_metadata?.user_name ||
              currentUser.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
              `foodie_${Date.now()}`;

            const newProf: Profile = {
              id: currentUser.id,
              username: cleanUsername,
              full_name:
                currentUser.user_metadata?.full_name ||
                currentUser.user_metadata?.name ||
                cleanUsername,
              avatar_url:
                currentUser.user_metadata?.avatar_url ||
                currentUser.user_metadata?.picture ||
                "",
              bio: "Khmer food lover",
            };

            try {
              await supabase.from("profiles").upsert(newProf, { onConflict: "id" });
            } catch (_) {}

            setProfile(newProf);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [configured]);

  const signInWithGoogle = async () => {
    if (!configured) {
      throw new Error(
        "Supabase credentials are not configured in .env.local yet. Please provide your real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to connect real Google accounts."
      );
    }
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
    if (error) {
      throw error;
    }
  };

  const signInWithEmail = async (identifier: string, password: string) => {
    if (!configured) {
      toggleDemoLogin();
      return { error: null };
    }

    // Resolve username to email (Instagram-style username login)
    const raw = identifier.trim().toLowerCase();
    let targetEmail = raw.startsWith("@") ? raw.slice(1) : raw;
    let isGoogleOnly = false;

    try {
      const resolveRes = await fetch("/api/auth/resolve-identifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetEmail }),
      });
      const resolveData = await resolveRes.json();
      if (resolveData?.email) {
        targetEmail = resolveData.email;
        isGoogleOnly = !!resolveData.isGoogleOnly;
      }
    } catch (_) {}

    let { data, error } = await supabase.auth.signInWithPassword({ email: targetEmail, password });

    // If this account was registered via Google and has no password yet:
    // Auto-link this password so they can log in seamlessly!
    if (error && isGoogleOnly && password.length >= 6) {
      try {
        const linkRes = await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: targetEmail, password }),
        });
        if (linkRes.ok) {
          const retry = await supabase.auth.signInWithPassword({ email: targetEmail, password });
          if (!retry.error) {
            return { error: null };
          }
        }
      } catch (_) {}
    }

    // If Supabase returned "Email not confirmed", auto-confirm via admin endpoint and retry
    if (error && error.message?.toLowerCase().includes("email not confirmed")) {
      try {
        const confirmRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: targetEmail,
            password,
            username: targetEmail.split("@")[0],
            fullName: "",
          }),
        });

        if (confirmRes.ok) {
          const retry = await supabase.auth.signInWithPassword({ email: targetEmail, password });
          if (!retry.error) {
            return { error: null };
          }
        }
      } catch (_) {}
    }

    return { error: error as Error | null };
  };

  const setPassword = async (identifier: string, newPassword: string) => {
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: new Error(data.error || "Failed to set password") };
      }
      const signInRes = await supabase.auth.signInWithPassword({
        email: data.email,
        password: newPassword,
      });
      if (signInRes.data?.session?.user) {
        setUser(signInRes.data.session.user);
      }
      return { error: (signInRes.error as Error) || null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    username: string,
    fullName: string
  ) => {
    if (!configured) {
      return { error: new Error("Supabase is not configured yet"), session: null };
    }
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "") || `user_${Date.now()}`;

    // 1. First try creating an auto-confirmed user via our server admin endpoint
    try {
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username: cleanUsername,
          fullName: fullName || cleanUsername,
        }),
      });

      const regData = await regRes.json();

      if (regRes.ok) {
        // Automatically sign in immediately with credentials
        const signInRes = await supabase.auth.signInWithPassword({ email, password });
        if (signInRes.data?.session?.user) {
          setUser(signInRes.data.session.user);
          return { error: null, session: signInRes.data.session };
        }
      } else if (regData.error && !regData.error.includes("already registered")) {
        return { error: new Error(regData.error), session: null };
      }
    } catch (_) {}

    // Fallback: standard supabase signUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error: error as Error | null, session: null };
    }

    if (data?.session?.user) {
      setUser(data.session.user);
      try {
        await supabase.from("profiles").upsert({
          id: data.session.user.id,
          username: cleanUsername,
          full_name: fullName || cleanUsername,
          avatar_url: "",
          bio: "Khmer food lover",
        });
      } catch (_) {}
    }

    return { error: null, session: data?.session };
  };

  const signOut = async () => {
    if (!configured || isDemoUser) {
      setIsDemoUser(false);
      setProfile(null);
      setUser(null);
      localStorage.setItem("numpang_demo_active", "false");
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!configured || isDemoUser) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return { error: null };
    }

    if (!user) return { error: new Error("User not logged in") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { error: error as Error | null };
  };

  const toggleDemoLogin = () => {
    if (isDemoUser) {
      setIsDemoUser(false);
      setProfile(null);
      localStorage.setItem("numpang_demo_active", "false");
    } else {
      setIsDemoUser(true);
      setProfile(DEMO_USER);
      localStorage.setItem("numpang_demo_active", "true");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: configured,
        isDemoUser,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        setPassword,
        signOut,
        updateProfile,
        toggleDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
