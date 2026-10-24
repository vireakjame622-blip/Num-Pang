"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Sparkles, Users, UtensilsCrossed, Plus } from "lucide-react";
import Link from "next/link";
import { Post } from "@/types";
import { PostCard } from "@/components/feed/PostCard";
import { CategoryPills } from "@/components/feed/CategoryPills";
import { SkeletonCard } from "@/components/feed/SkeletonCard";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { INITIAL_POSTS } from "@/lib/demo-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";


function FeedContent() {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<"discover" | "following">("discover");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Load posts
  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      setLoading(true);

      // Blocked users filter from localStorage
      const blockedUsers: string[] = JSON.parse(
        localStorage.getItem("numpang_blocked") || "[]"
      );

      // User created posts from localStorage for offline demo mode
      const localNewPosts: Post[] = JSON.parse(
        localStorage.getItem("numpang_local_posts") || "[]"
      );

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          let query = supabase
            .from("posts")
            .select("*, profiles(*)")
            .order("created_at", { ascending: false });

          if (selectedCategory !== "all") {
            query = query.eq("category", selectedCategory);
          }

          const { data, error } = await query;

          if (!error && data) {
            const cleanData = (data as Post[]).filter(
              (p) => !blockedUsers.includes(p.user_id)
            );
            if (isMounted) setPosts(cleanData);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Supabase fetch error:", err);
        }
      }

      // Show real user created local posts if any
      const combined = [...localNewPosts];
      let filtered = combined.filter((p) => !blockedUsers.includes(p.user_id));

      if (selectedCategory !== "all") {
        filtered = filtered.filter((p) => p.category === selectedCategory);
      }

      if (activeTab === "following") {
        // In demo mode or following tab, filter by followed creators
        filtered = filtered.filter(
          (p) => p.profiles?.is_following || p.user_id === "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
        );
      }

      if (isMounted) {
        setPosts(filtered);
        setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedCategory]);

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    // Also remove from local storage if created locally
    const localPosts: Post[] = JSON.parse(
      localStorage.getItem("numpang_local_posts") || "[]"
    );
    const updated = localPosts.filter((p) => p.id !== postId);
    localStorage.setItem("numpang_local_posts", JSON.stringify(updated));
  };

  return (
    <div className="px-4 py-3 max-w-lg mx-auto">
      {/* 1. Feed Tabs: Discover vs Following */}
      <div className="flex items-center justify-center p-1 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-2xl mb-3">
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "discover"
              ? "bg-white dark:bg-[#1B1C22] text-[#C85A32] dark:text-[#E06D44] shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.tabDiscover}</span>
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "following"
              ? "bg-white dark:bg-[#1B1C22] text-[#C85A32] dark:text-[#E06D44] shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{t.tabFollowing}</span>
        </button>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="mb-4">
        <CategoryPills
          selected={selectedCategory}
          onSelect={(cat) => setSelectedCategory(cat)}
        />
      </div>

      {/* 3. Feed List / Loading Skeletons */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : posts.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#1B1C22] rounded-3xl p-8 border border-[#EFE6D8] dark:border-[#2C2E38] text-center my-6 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center mx-auto mb-3">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
            {t.noSpotsFound}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
            Be the first food lover to discover and recommend a street food stall in this category!
          </p>
          <Link
            href="/post/create"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-[#C85A32] text-white text-xs font-bold hover:bg-[#B34925] shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.publishButton}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDeletePost}
            />
          ))}

          {/* End of feed indicator */}
          <div className="py-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
            <span className="w-12 h-px bg-neutral-200 dark:bg-neutral-800" />
            <span>You're all caught up with Khmer food spots</span>
            <span className="w-12 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomeFeed() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto p-4 space-y-4"><SkeletonCard /><SkeletonCard /></div>}>
      <FeedContent />
    </Suspense>
  );
}
