"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { Post } from "@/types";
import { PostCard } from "@/components/feed/PostCard";
import { SkeletonCard } from "@/components/feed/SkeletonCard";
import { INITIAL_POSTS } from "@/lib/demo-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";


function PostContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);

      // Check local user posts first
      const localPosts: Post[] = JSON.parse(
        localStorage.getItem("numpang_local_posts") || "[]"
      );
      const foundLocal = localPosts.find((p) => p.id === id);
      if (foundLocal) {
        setPost(foundLocal);
        setLoading(false);
        return;
      }

      // Check Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("posts")
            .select("*, profiles(*)")
            .eq("id", id)
            .single();

          if (data) {
            setPost(data as Post);
            setLoading(false);
            return;
          }
        } catch {
          // fallback to demo data
        }
      }

      // Check demo seed posts
      const foundDemo = INITIAL_POSTS.find((p) => p.id === id);
      if (foundDemo) {
        setPost(foundDemo);
      }
      setLoading(false);
    };

    if (id) fetchPost();
  }, [id]);

  return (
    <div className="max-w-lg mx-auto px-4 py-3 space-y-4">
      {/* Top Back Nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-neutral-700 dark:text-neutral-300 hover:text-[#C85A32]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
          {post?.dish_name || "Food Spot"}
        </h1>
      </div>

      {loading ? (
        <SkeletonCard />
      ) : post ? (
        <div className="space-y-4">
          <PostCard
            post={post}
            onDelete={() => router.push("/")}
          />

          {/* Quick directions link */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {post.location_name}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Lat: {post.latitude.toFixed(4)}, Lng: {post.longitude.toFixed(4)}
                </p>
              </div>
            </div>

            <Link
              href={`/explore?lat=${post.latitude}&lng=${post.longitude}`}
              className="px-3 py-1.5 rounded-xl bg-[#C85A32] text-white text-xs font-bold hover:bg-[#B34925] transition-colors flex-shrink-0"
            >
              Open Map
            </Link>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-neutral-500">
          Post not found or has been removed.
        </div>
      )}
    </div>
  );
}

export default function SinglePostPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto p-4"><SkeletonCard /></div>}>
      <PostContent />
    </Suspense>
  );
}
