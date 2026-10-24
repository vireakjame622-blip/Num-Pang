import type { Metadata, Viewport } from "next";
import { Kantumruy_Pro, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "leaflet/dist/leaflet.css";

import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/common/Navbar";
import { BottomNav } from "@/components/common/BottomNav";

const kantumruy = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kantumruy",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#C85A32",
};

export const metadata: Metadata = {
  title: "Num Pang (នំបុ័ង) - Street Food Discoveries in Cambodia",
  description:
    "Explore, share, and review authentic Cambodian street food, hidden stalls, and culinary gems across Phnom Penh, Siem Reap, and beyond.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Num Pang",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="km" suppressHydrationWarning className={`${kantumruy.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased bg-[#FAF7F2] dark:bg-[#121316] text-[#231F20] dark:text-[#F3F4F6] selection:bg-[#C85A32]/20 selection:text-[#C85A32]">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <div className="min-h-screen flex flex-col max-w-xl mx-auto bg-[#FAF7F2] dark:bg-[#121316] relative border-x border-[#EFE6D8]/60 dark:border-[#2C2E38]/60 shadow-sm">
                <Suspense fallback={<div className="h-15 w-full bg-[#FAF7F2] dark:bg-[#121316]" />}>
                  <Navbar />
                </Suspense>
                <main className="flex-1 pb-24 overflow-x-hidden">
                  <Suspense fallback={null}>
                    {children}
                  </Suspense>
                </main>
                <Suspense fallback={<div className="h-16 w-full" />}>
                  <BottomNav />
                </Suspense>
              </div>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
