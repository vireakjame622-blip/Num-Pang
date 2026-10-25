"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Utensils,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const {
    user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    setPassword: setAccountPassword,
    isConfigured,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setIsSignUp(true);
    }
    const err =
      searchParams.get("error_description") || searchParams.get("error");
    if (err) {
      setErrorMsg(decodeURIComponent(err));
      setGoogleLoading(false);
    }
  }, [searchParams]);

  // Login identifier (username or email like Instagram)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Sign up fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [showSetupGuide, setShowSetupGuide] = useState(!isConfigured);

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign in failed.");
      setShowSetupGuide(true);
      setGoogleLoading(false);
    }
  };

  // 1-Click Instant Foodie Access (Instagram test mode)
  const handleQuickAccess = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const rand = Math.floor(100 + Math.random() * 900);
      const guestUsername = `foodie_khmer_${rand}`;
      const guestPass = `pass_${Date.now()}`;
      const guestEmail = `${guestUsername}@numpang.app`;

      const { error, session } = await signUpWithEmail(
        guestEmail,
        guestPass,
        guestUsername,
        "Khmer Food Lover"
      );

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessNotice(
          language === "km"
            ? `សូមស្វាគមន៍! បានចូលគណនីជា @${guestUsername}`
            : `Welcome! Logged in as @${guestUsername}`
        );
        setTimeout(() => router.push("/"), 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Quick access failed.");
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Set Password & Sign In
  const handleSetPasswordAndSignIn = async () => {
    if (!identifier || !password) {
      setErrorMsg(
        language === "km"
          ? "សូមបញ្ចូលឈ្មោះគណនី និងពាក្យសម្ងាត់ដែលចង់កំណត់"
          : "Please enter your username and password."
      );
      return;
    }
    if (password.length < 6) {
      setErrorMsg(
        language === "km"
          ? "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ"
          : "Password must be at least 6 characters."
      );
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await setAccountPassword(identifier, password);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessNotice(
          language === "km"
            ? "បានកំណត់ពាក្យសម្ងាត់ជោគជ័យ! កំពុងចូលប្រព័ន្ធ..."
            : "Password updated successfully! Logging in..."
        );
        setTimeout(() => router.push("/"), 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessNotice("");

    if (!password) {
      setErrorMsg(language === "km" ? "សូមបញ្ចូលពាក្យសម្ងាត់" : "Please fill in password.");
      return;
    }

    if (isSignUp && !username) {
      setErrorMsg(language === "km" ? "សូមជ្រើសរើសឈ្មោះគណនី (Username)" : "Please choose a username.");
      return;
    }

    if (!isSignUp && !identifier) {
      setErrorMsg(language === "km" ? "សូមបញ្ចូលឈ្មោះគណនី ឬអ៊ីមែល" : "Please enter your username or email.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const targetEmail =
          email && email.includes("@")
            ? email.trim().toLowerCase()
            : `${username.toLowerCase().replace(/[^a-z0-9_]/g, "")}@numpang.app`;

        const { error, session } = await signUpWithEmail(
          targetEmail,
          password,
          username,
          fullName
        );

        if (error) {
          setErrorMsg(error.message);
        } else if (session) {
          setSuccessNotice(
            language === "km"
              ? "បានបង្កើតគណនីជោគជ័យ! កំពុងនាំចូល..."
              : "Account created successfully! Redirecting..."
          );
          setTimeout(() => router.push("/"), 600);
        } else {
          setSuccessNotice(
            language === "km"
              ? "បានចុះឈ្មោះជោគជ័យ! កំពុងចូលប្រព័ន្ធ..."
              : "Account registered! Logging in..."
          );
          await signInWithEmail(targetEmail, password);
          router.push("/");
        }
      } else {
        // Sign In with username OR email (like Instagram!)
        const { error } = await signInWithEmail(identifier, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-5">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#C85A32] to-[#E5BE48] flex items-center justify-center text-white mx-auto shadow-lg shadow-[#C85A32]/30">
          <Utensils className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100">
          {t.appName}
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
          {t.loginSubtitle}
        </p>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-[#1B1C22] rounded-3xl p-6 border border-[#EFE6D8] dark:border-[#2C2E38] shadow-sm space-y-5">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-neutral-100 dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38]">
          <button
            id="tab-sign-in"
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg("");
              setSuccessNotice("");
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isSignUp
                ? "bg-white dark:bg-[#1B1C22] text-[#C85A32] shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            {t.signIn}
          </button>
          <button
            id="tab-sign-up"
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg("");
              setSuccessNotice("");
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isSignUp
                ? "bg-white dark:bg-[#1B1C22] text-[#C85A32] shadow-sm"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            {t.signUp}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex flex-col gap-2 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold">Authentication Notice</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
            {errorMsg.toLowerCase().includes("invalid login credentials") && !isSignUp && (
              <div className="mt-1 pt-2 border-t border-red-200/60 dark:border-red-900/50 flex flex-col gap-2">
                {password.length >= 6 ? (
                  <button
                    type="button"
                    onClick={handleSetPasswordAndSignIn}
                    disabled={loading}
                    className="w-full py-2 px-3 rounded-xl bg-[#C85A32] text-white text-[11px] font-bold hover:bg-[#B34925] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>
                      {language === "km"
                        ? `កំណត់ពាក្យសម្ងាត់នេះសម្រាប់ @${identifier.replace(/^@/, "")} & ចូលភ្លាមៗ`
                        : `Set this password for @${identifier.replace(/^@/, "")} & Sign In`}
                    </span>
                  </button>
                ) : null}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                    {language === "km" ? "មិនទាន់មានគណនីមែនទេ?" : "Don't have an account yet?"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg("");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors inline-block w-fit cursor-pointer"
                  >
                    {language === "km" ? "ចុះឈ្មោះបង្កើតគណនីថ្មី" : "Create New Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-300 text-xs">
            {successNotice}
          </div>
        )}

        {/* 1. Google OAuth Button */}
        <button
          onClick={handleGoogleAuth}
          disabled={googleLoading}
          className="w-full py-3 px-4 rounded-2xl border border-[#EFE6D8] dark:border-[#2C2E38] bg-white dark:bg-[#16171B] hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-3 transition-colors shadow-xs active:scale-98 disabled:opacity-75 cursor-pointer"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#C85A32]" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.continueWithGoogle}</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 text-neutral-400 text-xs">
          <span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          <span>{language === "km" ? "ឬចូលតាមឈ្មោះគណនី (Instagram Style)" : "Or use Username / Password"}</span>
          <span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>

        {/* Instagram-style Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp ? (
            <>
              {/* Sign Up Fields */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  {t.username} *
                </label>
                <div className="relative">
                  <span className="text-neutral-400 text-xs absolute left-3 top-2.5 font-bold">
                    @
                  </span>
                  <input
                    id="input-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="vireak_eats"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  {t.fullName} ({language === "km" ? "មិនបង្ខំ" : "Optional"})
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    id="input-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Vireak Jame"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  Email ({language === "km" ? "មិនបង្ខំ - បង្កើតស្វ័យប្រវត្តិតាម Username" : "Optional"})
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    id="input-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={username ? `${username}@numpang.app` : "youremail@gmail.com"}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Sign In Field (Username OR Email like Instagram) */
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                {language === "km" ? "ឈ្មោះគណនី ឬ អ៊ីមែល *" : "Username or Email *"}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  id="input-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={language === "km" ? "ឈ្មោះគណនី ឬ អ៊ីមែល (ឧ. @vireakjame622)" : "Username or email (e.g. vireakjame622)"}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                id="input-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
              />
            </div>
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#C85A32] text-white text-xs font-bold hover:bg-[#B34925] transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-[#C85A32]/25 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? t.signUp : t.signIn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Instant Foodie Access (Instagram guest quick access) */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={handleQuickAccess}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#C85A32]/10 to-[#E5BE48]/10 hover:from-[#C85A32]/20 hover:to-[#E5BE48]/20 border border-[#C85A32]/20 text-xs font-bold text-[#C85A32] dark:text-[#E06D44] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-[#C85A32]" />
            <span>
              {language === "km"
                ? "ចូលលេងភ្លាមៗ ១-Click (Instant Foodie Access)"
                : "Instant 1-Click Foodie Access"}
            </span>
          </button>
        </div>

        {/* Toggle Sign in / Sign up bottom link */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setSuccessNotice("");
            }}
            className="text-xs font-semibold text-[#C85A32] hover:underline cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign In (ចូលគណនី)" : `${t.signUp} (បង្កើតគណនីថ្មី)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading auth...</div>}>
      <LoginContent />
    </Suspense>
  );
}
