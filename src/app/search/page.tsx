"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Utensils, Users, MapPin, ChevronRight, UserPlus, Check } from "lucide-react";
import { Post, Profile } from "@/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";


function SearchContent() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "dishes" | "users">("all");
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
  const [dbPosts, setDbPosts] = useState<Post[]>([]);
  const [dbUsers, setDbUsers] = useState<Profile[]>([]);

  const localPosts: Post[] = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("numpang_local_posts") || "[]")
    : [];

  useEffect(() => {
    const fetchData = async () => {
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data: postsData } = await supabase
            .from("posts")
            .select("*, profiles(*)")
            .limit(40);
          if (postsData) setDbPosts(postsData as Post[]);

          const { data: usersData } = await supabase
            .from("profiles")
            .select("*")
            .limit(40);
          if (usersData) setDbUsers(usersData as Profile[]);
        } catch {}
      }
    };
    fetchData();
  }, []);

  const allPosts = useMemo(() => [...localPosts, ...dbPosts], [localPosts, dbPosts]);
  const allUsers = useMemo(() => dbUsers, [dbUsers]);

  // Filter dishes
  const matchedPosts = useMemo(() => {
    if (!query.trim()) return allPosts.slice(0, 6);
    const q = query.toLowerCase();
    return allPosts.filter(
      (p) =>
        p.dish_name.toLowerCase().includes(q) ||
        p.location_name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [allPosts, query]);

  // Filter users
  const matchedUsers = useMemo(() => {
    if (!query.trim()) return allUsers;
    const q = query.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q)
    );
  }, [allUsers, query]);

  const toggleFollow = (userId: string) => {
    setFollowedMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-3 space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#C85A32] shadow-xs"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-3 text-xs text-neutral-400 hover:text-neutral-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "all"
              ? "bg-[#C85A32] text-white"
              : "bg-white dark:bg-[#1B1C22] text-neutral-600 dark:text-neutral-400 border border-[#EFE6D8] dark:border-[#2C2E38]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType("dishes")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "dishes"
              ? "bg-[#C85A32] text-white"
              : "bg-white dark:bg-[#1B1C22] text-neutral-600 dark:text-neutral-400 border border-[#EFE6D8] dark:border-[#2C2E38]"
          }`}
        >
          Dishes ({matchedPosts.length})
        </button>
        <button
          onClick={() => setFilterType("users")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "users"
              ? "bg-[#C85A32] text-white"
              : "bg-white dark:bg-[#1B1C22] text-neutral-600 dark:text-neutral-400 border border-[#EFE6D8] dark:border-[#2C2E38]"
          }`}
        >
          Foodies ({matchedUsers.length})
        </button>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {/* Users / Foodies matching */}
        {(filterType === "all" || filterType === "users") && matchedUsers.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Foodies & Locals</span>
            </h3>

            <div className="bg-white dark:bg-[#1B1C22] rounded-3xl p-2 border border-[#EFE6D8] dark:border-[#2C2E38] divide-y divide-neutral-100 dark:divide-neutral-800 shadow-xs">
              {matchedUsers.map((user) => {
                const isFollowing = !!followedMap[user.id];
                return (
                  <div
                    key={user.id}
                    className="p-3 flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 border border-[#EFE6D8] dark:border-[#2C2E38] flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[#C85A32]">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-[#C85A32] truncate">
                          {user.full_name || user.username}
                        </h4>
                        <p className="text-[11px] text-neutral-500 truncate">
                          @{user.username} • {user.followers_count || 120} followers
                        </p>
                      </div>
                    </Link>

                    <button
                      onClick={() => toggleFollow(user.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        isFollowing
                          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                          : "bg-[#C85A32] text-white hover:bg-[#B34925]"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dishes matching */}
        {(filterType === "all" || filterType === "dishes") && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Street Food Dishes</span>
            </h3>

            {matchedPosts.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                {t.noResults}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {matchedPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="group bg-white dark:bg-[#1B1C22] rounded-3xl overflow-hidden border border-[#EFE6D8] dark:border-[#2C2E38] shadow-xs hover:border-[#C85A32]/60 transition-all flex flex-col"
                  >
                    <div className="w-full aspect-square relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      <img
                        src={post.image_url}
                        alt={post.dish_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                        ${post.price_usd?.toFixed(2) || "1.50"}
                      </span>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-[#C85A32] transition-colors">
                          {post.dish_name}
                        </h4>
                        <p className="text-[10px] text-neutral-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#C85A32] flex-shrink-0" />
                          <span>{post.location_name}</span>
                        </p>
                      </div>

                      <div className="text-[10px] text-[#C85A32] font-semibold mt-2 pt-1 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <span>{post.price_khr ? `${post.price_khr.toLocaleString()} ៛` : ""}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs text-neutral-400">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
