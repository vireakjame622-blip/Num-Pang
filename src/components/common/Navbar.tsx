"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils, Moon, Sun, Globe, Search, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isConfigured, isDemoUser } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF7F2]/95 dark:bg-[#121316]/95 backdrop-blur-md border-b border-[#EFE6D8] dark:border-[#2C2E38] transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-15 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C85A32] to-[#E5BE48] flex items-center justify-center text-white shadow-sm shadow-[#C85A32]/30 group-hover:rotate-6 transition-transform">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight flex items-center gap-1 text-[#231F20] dark:text-[#F3F4F6]">
              <span>Num Pang</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#C85A32]/10 text-[#C85A32] dark:bg-[#C85A32]/25 dark:text-[#E06D44]">
                នំបុ័ង
              </span>
            </div>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Button */}
          <Link
            href="/search"
            aria-label={t.navSearch}
            className={`p-2 rounded-xl transition-colors ${
              pathname === "/search"
                ? "bg-[#C85A32]/10 text-[#C85A32] dark:bg-[#C85A32]/20"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800"
            }`}
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-neutral-700 dark:text-neutral-200 hover:border-[#C85A32] transition-colors shadow-xs"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>{language === "km" ? "EN" : "ខ្មែរ"}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-4.5 h-4.5 text-[#E5BE48]" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-[#6B635B]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
