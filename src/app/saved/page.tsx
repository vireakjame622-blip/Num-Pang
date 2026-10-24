"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Bookmark, Compass } from "lucide-react";
import Link from "next/link";
import { Post } from "@/types";
import { PostCard } from "@/components/feed/PostCard";
import { SkeletonCard } from "@/components/feed/SkeletonCard";
import { INITIAL_POSTS } from "@/lib/demo-data";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";


function SavedContent() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);

      // Local storage saved IDs for demo or client-side
      const localSavedIds: string[] = JSON.parse(
        localStorage.getItem("numpang_saved") || "[]"
      );

      // If Supabase configured and user logged in
      if (isSupabaseConfigured() && profile) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("saves")
            .select("post_id, posts(*, profiles(*))")
            .eq("user_id", profile.id);

          if (data && data.length > 0) {
            const list = data
              .map((d: any) => d.posts)
              .filter(Boolean) as Post[];
            setSavedPosts(list);
            setLoading(false);
            return;
          }
        } catch {
          // fallback
        }
      }

      // Fallback: check INITIAL_POSTS that match localSavedIds or default marked ones
      const localPosts: Post[] = JSON.parse(
        localStorage.getItem("numpang_local_posts") || "[]"
      );
      const all = [...localPosts, ...INITIAL_POSTS];

      const filtered = all.filter(
        (p) => localSavedIds.includes(p.id) || p.is_saved
      );

      setSavedPosts(filtered);
      setLoading(false);
    };

    fetchSaved();
  }, [profile]);

  return (
    <div className="max-w-lg mx-auto px-4 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center font-bold">
          <Bookmark className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {t.tabSaved}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Your saved street food stalls and bookmark collection
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : savedPosts.length === 0 ? (
        <div className="bg-white dark:bg-[#1B1C22] rounded-3xl p-8 border border-[#EFE6D8] dark:border-[#2C2E38] text-center my-8 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
            No saved food spots yet
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
            Tap the bookmark icon on any delicious dish to save it here for your next food crawl!
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-[#C85A32] text-white text-xs font-bold hover:bg-[#B34925] shadow-sm transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Map</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={{ ...post, is_saved: true }}
              onDelete={(id) => setSavedPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto p-4"><SkeletonCard /></div>}>
      <SavedContent />
    </Suspense>
  );
}
