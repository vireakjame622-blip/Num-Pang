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
  signUpWithEmail: (email: string, password: string, username: string, fullName: string) => Promise<{ error: Error | null }>;
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
      // In demo mode without configured Supabase credentials, provide demo user by default
      const demoActive = localStorage.getItem("numpang_demo_active") !== "false";
      if (demoActive) {
        setIsDemoUser(true);
        setProfile(DEMO_USER);
      }
      setLoading(false);
      return;
    }

    // Live Supabase Authentication
    const fetchUser = async () => {
      try {
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
            // Fallback profile if trigger hasn't fired yet
            setProfile({
              id: user.id,
              username: user.email?.split("@")[0] || "user",
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
              avatar_url: user.user_metadata?.avatar_url || "",
              bio: "Khmer food lover",
            });
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

          if (prof) setProfile(prof as Profile);
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
          prompt: "consent",
        },
      },
    });
    if (error) {
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!configured) {
      toggleDemoLogin();
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    username: string,
    fullName: string
  ) => {
    if (!configured) {
      toggleDemoLogin();
      return { error: null };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
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
