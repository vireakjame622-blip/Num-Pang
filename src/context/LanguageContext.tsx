"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language } from "@/types";
import { translations } from "@/lib/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("km"); // Default to Khmer for authentic local experience

  useEffect(() => {
    const saved = localStorage.getItem("numpang_lang") as Language;
    if (saved && (saved === "en" || saved === "km")) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    } else {
      document.documentElement.lang = "km";
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("numpang_lang", lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    setLanguage(language === "km" ? "en" : "km");
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
