"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import dynamicMap from "next/dynamic";
import { Search, Compass, MapPin } from "lucide-react";
import { CategoryPills } from "@/components/feed/CategoryPills";
import { Post } from "@/types";
import { INITIAL_POSTS } from "@/lib/demo-data";
import { useLanguage } from "@/context/LanguageContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";


// Dynamically import map component
const ExploreFoodMap = dynamicMap(
  () => import("@/components/map/ExploreFoodMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-13rem)] min-h-[460px] rounded-3xl bg-neutral-100 dark:bg-neutral-800 animate-pulse flex flex-col items-center justify-center gap-2 text-neutral-400">
        <Compass className="w-8 h-8 animate-spin text-[#C85A32]" />
        <span className="text-xs font-semibold">Loading street food map...</span>
      </div>
    ),
  }
);

function ExploreContent() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const blockedUsers: string[] = JSON.parse(
        localStorage.getItem("numpang_blocked") || "[]"
      );
      const localPosts: Post[] = JSON.parse(
        localStorage.getItem("numpang_local_posts") || "[]"
      );

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("posts")
            .select("*, profiles(*)");

          if (data) {
            const clean = (data as Post[]).filter(
              (p) => !blockedUsers.includes(p.user_id)
            );
            setPosts(clean);
            setLoading(false);
            return;
          }
        } catch {
          // fallback
        }
      }

      const cleanLocal = localPosts.filter((p) => !blockedUsers.includes(p.user_id));
      setPosts(cleanLocal);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  // Filter by category & search query (area / dish)
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchCat =
        selectedCategory === "all" || p.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.dish_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location_name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  return (
    <div className="px-4 py-3 max-w-lg mx-auto space-y-3">
      {/* Search Header */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchMapPlaceholder}
          className="w-full pl-10 pr-10 py-2 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#C85A32] shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-neutral-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div>
        <CategoryPills
          selected={selectedCategory}
          onSelect={(cat) => setSelectedCategory(cat)}
        />
      </div>

      {/* Spots Count Badge */}
      <div className="flex items-center justify-between text-xs text-neutral-500 px-1 font-medium">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
          <span>
            {filteredPosts.length} street food {filteredPosts.length === 1 ? "spot" : "spots"} found
          </span>
        </span>
        <span className="text-[11px] text-neutral-400">
          Tap pin for dish details
        </span>
      </div>

      {/* Leaflet Map */}
      <ExploreFoodMap
        posts={filteredPosts}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading explore map...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
