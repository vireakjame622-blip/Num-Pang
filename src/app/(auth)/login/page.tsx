"use client";

import React, { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

function LoginContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    isConfigured,
    toggleDemoLogin,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessNotice("");

    if (!email || !password) {
      setErrorMsg("Please fill in email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!username) {
          setErrorMsg("Please choose a username.");
          setLoading(false);
          return;
        }
        const { error, session } = await signUpWithEmail(email, password, username, fullName);
        if (error) {
          setErrorMsg(error.message);
        } else if (session) {
          setSuccessNotice("Account created successfully! Redirecting...");
          setTimeout(() => router.push("/"), 700);
        } else {
          setSuccessNotice("Account registered! Please log in with your new account credentials.");
          setIsSignUp(false);
        }
      } else {
        const { error } = await signInWithEmail(email, password);
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

  const handleDemoSignIn = () => {
    toggleDemoLogin();
    router.push("/");
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
              <div className="mt-1 pt-2 border-t border-red-200/60 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                  មិនទាន់មានគណនីមែនទេ?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMsg("");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#C85A32] text-white text-[11px] font-bold hover:bg-[#B34925] transition-colors inline-block w-fit cursor-pointer"
                >
                  ចុចទីនេះដើម្បីចុះឈ្មោះបង្កើតគណនីថ្មី
                </button>
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
          <span>{t.orContinueWithEmail}</span>
          <span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>

        {/* Email Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  {t.fullName}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sokha Chea"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  {t.username} *
                </label>
                <div className="relative">
                  <span className="text-neutral-400 text-xs absolute left-3 top-2.5 font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="sokha_eats"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
              Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
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


      {/* Google OAuth & Supabase Setup Instructions */}
      <div className="rounded-3xl border border-[#EFE6D8] dark:border-[#2C2E38] bg-white dark:bg-[#1B1C22] overflow-hidden shadow-xs">
        <button
          onClick={() => setShowSetupGuide(!showSetupGuide)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
        >
          <span className="flex items-center gap-2 text-[#C85A32]">
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            <span>Why Google Sign-In needs setup (How to enable)</span>
          </span>
          {showSetupGuide ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </button>

        {showSetupGuide && (
          <div className="px-4 pb-4 pt-1 space-y-3 text-xs text-neutral-600 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 leading-relaxed">
            <p>
              Google OAuth is an external security protocol. For Google to verify who you are, it requires linking your Google Cloud OAuth Client to your Supabase project:
            </p>

            <ol className="list-decimal pl-4 space-y-2 text-[11px]">
              <li>
                <strong>Supply your Supabase keys:</strong> Create a project at{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#C85A32] underline"
                >
                  supabase.com
                </a>{" "}
                and copy your Project URL & Anon Key into <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">.env.local</code>.
              </li>
              <li>
                <strong>Create Google OAuth Client ID:</strong> In{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#C85A32] underline"
                >
                  Google Cloud Console
                </a>
                , create a Web Application credential. Set Authorized redirect URI to:
                <br />
                <code className="block mt-1 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 select-all font-mono text-[10px] text-[#C85A32] break-all">
                  https://&lt;your-project-id&gt;.supabase.co/auth/v1/callback
                </code>
              </li>
              <li>
                <strong>Enable Google in Supabase:</strong> In Supabase Dashboard, go to <strong>Authentication &gt; Providers &gt; Google</strong>, toggle it to <strong>Enabled</strong>, and paste your Google Client ID & Secret.
              </li>
            </ol>

            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 text-[11px]">
              Complete step-by-step instructions with screenshots and URLs are provided in{" "}
              <strong>README.md</strong>.
            </div>
          </div>
        )}
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
