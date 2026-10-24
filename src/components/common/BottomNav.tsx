"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, Bookmark, User as UserIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { profile } = useAuth();

  const userProfileHref = profile?.username ? `/profile/${profile.username}` : "/profile";

  const navItems = [
    {
      label: t.navHome,
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: t.navExplore,
      href: "/explore",
      icon: Compass,
      isActive: pathname.startsWith("/explore"),
    },
    {
      label: t.navPost,
      href: "/post/create",
      icon: Plus,
      isSpecial: true,
      isActive: pathname === "/post/create",
    },
    {
      label: t.navSaved,
      href: "/saved",
      icon: Bookmark,
      isActive: pathname === "/saved",
    },
    {
      label: t.navProfile,
      href: userProfileHref,
      icon: UserIcon,
      isActive: pathname.startsWith("/profile") || pathname === "/login",
      avatar: profile?.avatar_url,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 dark:bg-[#121316]/95 backdrop-blur-lg border-t border-[#EFE6D8] dark:border-[#2C2E38] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-lg transition-colors">
      <div className="max-w-md mx-auto px-4 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="group relative -top-3 flex flex-col items-center"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#C85A32] to-[#E5BE48] flex items-center justify-center text-white shadow-lg shadow-[#C85A32]/40 group-hover:scale-105 active:scale-95 transition-all">
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                item.isActive
                  ? "text-[#C85A32] dark:text-[#E06D44]"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              {item.avatar ? (
                <div
                  className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-transform ${
                    item.isActive
                      ? "border-[#C85A32] scale-110"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={item.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Icon
                  className={`w-6 h-6 transition-transform ${
                    item.isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"
                  }`}
                />
              )}
              <span
                className={`text-[10px] mt-1 transition-colors ${
                  item.isActive ? "font-bold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
