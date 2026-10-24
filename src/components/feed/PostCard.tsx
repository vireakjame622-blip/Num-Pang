"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MapPin,
  MoreHorizontal,
  Trash2,
  ShieldAlert,
  Ban,
  Check,
  Navigation,
} from "lucide-react";
import { Post, Comment } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLocation } from "@/context/LocationContext";
import { CommentDrawer } from "./CommentDrawer";
import { ModerationModal } from "../common/ModerationModal";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onPostUpdate?: (updatedPost: Post) => void;
}

export function PostCard({ post, onDelete, onPostUpdate }: PostCardProps) {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const { getDistance, getDirectionsUrl } = useLocation();

  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [copied, setCopied] = useState(false);
  const [modModal, setModModal] = useState<{
    isOpen: boolean;
    type: "report" | "block";
  }>({ isOpen: false, type: "report" });

  const isOwner = profile?.id === post.user_id;
  const author = post.profiles || post.user;

  // Optimistic Like Handler
  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    if (nextState) {
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 600);
    }

    if (isSupabaseConfigured() && profile) {
      const supabase = createClient();
      if (nextState) {
        await supabase.from("likes").insert({ post_id: post.id, user_id: profile.id });
      } else {
        await supabase
          .from("likes")
          .delete()
          .match({ post_id: post.id, user_id: profile.id });
      }
    }
  };

  // Double tap photo to like
  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    } else {
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 600);
    }
  };

  // Optimistic Save / Bookmark Handler
  const handleSave = async () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    if (isSupabaseConfigured() && profile) {
      const supabase = createClient();
      if (nextSaved) {
        await supabase.from("saves").insert({ post_id: post.id, user_id: profile.id });
      } else {
        await supabase
          .from("saves")
          .delete()
          .match({ post_id: post.id, user_id: profile.id });
      }
    } else {
      // Demo save local storage
      const savedList = JSON.parse(localStorage.getItem("numpang_saved") || "[]");
      if (nextSaved) {
        if (!savedList.includes(post.id)) savedList.push(post.id);
      } else {
        const idx = savedList.indexOf(post.id);
        if (idx !== -1) savedList.splice(idx, 1);
      }
      localStorage.setItem("numpang_saved", JSON.stringify(savedList));
    }
  };

  // Share post
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.dish_name} - Num Pang`,
          text: `Check out this delicious ${post.dish_name} at ${post.location_name}!`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Comments loading & submission
  const openComments = async () => {
    setIsCommentOpen(true);
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(*)")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });
      if (data) setComments(data as Comment[]);
    } else if (comments.length === 0) {
      // Default demo comments
      setComments([
        {
          id: `c-demo-${post.id}-1`,
          post_id: post.id,
          user_id: "demo-user-1",
          content: "The flavor here is unbeatable! Must try with hot tea.",
          created_at: new Date().toISOString(),
          profiles: {
            id: "demo-user-1",
            username: "street_eats_kh",
            full_name: "Chhaya",
            avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
            bio: null,
          },
        },
      ]);
    }
  };

  const handleAddComment = async (content: string) => {
    const newC: Comment = {
      id: `c-${Date.now()}`,
      post_id: post.id,
      user_id: profile?.id || "demo-user",
      content,
      created_at: new Date().toISOString(),
      profiles: profile || undefined,
    };

    setComments((prev) => [...prev, newC]);
    setCommentsCount((prev) => prev + 1);

    if (isSupabaseConfigured() && profile) {
      const supabase = createClient();
      await supabase.from("comments").insert({
        post_id: post.id,
        user_id: profile.id,
        content,
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t.confirmDeletePost)) return;

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("posts").delete().eq("id", post.id);
    }
    if (onDelete) onDelete(post.id);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return t.now;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${t.postedAgo}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ${t.postedAgo}`;
    return `${Math.floor(diff / 86400)}d ${t.postedAgo}`;
  };

  return (
    <article className="bg-white dark:bg-[#1B1C22] rounded-3xl overflow-hidden border border-[#EFE6D8] dark:border-[#2C2E38] shadow-sm mb-4 transition-all">
      {/* 1. Header (Author, Location, Menu) */}
      <div className="p-3.5 flex items-center justify-between">
        <Link
          href={`/profile/${author?.username || "foodie"}`}
          className="flex items-center gap-2.5 group min-w-0"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 border border-[#EFE6D8] dark:border-[#2C2E38] flex-shrink-0">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.username}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#C85A32]">
                {author?.username?.[0]?.toUpperCase() || "N"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-[#C85A32] transition-colors truncate">
              {author?.full_name || author?.username || "Khmer Foodie"}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                @{author?.username || "foodie"}
              </span>
              <span>•</span>
              <span>{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </Link>

        {/* More options menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-[#1B1C22] rounded-2xl border border-[#EFE6D8] dark:border-[#2C2E38] shadow-xl py-1.5 text-xs animate-in fade-in duration-150">
              {isOwner ? (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.deletePost}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setModModal({ isOpen: true, type: "report" });
                    }}
                    className="w-full px-3.5 py-2 text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-[#C85A32]" />
                    <span>{t.reportPost}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setModModal({ isOpen: true, type: "block" });
                    }}
                    className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{t.blockUser}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Photo with double-tap heart pop */}
      <div
        onDoubleClick={handleDoubleTap}
        className="relative w-full aspect-4/3 bg-neutral-100 dark:bg-neutral-900 cursor-pointer overflow-hidden select-none"
      >
        <img
          src={post.image_url}
          alt={post.dish_name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-101"
          loading="lazy"
        />

        {/* Floating Heart Pop Animation */}
        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-white fill-red-500 drop-shadow-2xl animate-heart-pop" />
          </div>
        )}

        {/* Category & Price Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold shadow-xs">
            {post.dish_name}
          </span>
          {(post.price_usd || post.price_khr) && (
            <span className="px-2 py-1 rounded-full bg-[#C85A32]/90 backdrop-blur-md text-white text-xs font-bold shadow-xs">
              {post.price_usd ? `$${post.price_usd.toFixed(2)}` : ""}
              {post.price_usd && post.price_khr ? " • " : ""}
              {post.price_khr ? `${post.price_khr.toLocaleString()} ៛` : ""}
            </span>
          )}
        </div>
      </div>

      {/* 3. Action Toolbar */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Like */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200 group active:scale-90 transition-transform"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isLiked
                    ? "fill-red-500 text-red-500 animate-heart-pop"
                    : "group-hover:text-red-500"
                }`}
              />
              <span className="text-xs font-bold">
                {likesCount > 0 ? likesCount : ""}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={openComments}
              className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200 group active:scale-90 transition-transform"
            >
              <MessageCircle className="w-6 h-6 group-hover:text-[#C85A32]" />
              <span className="text-xs font-bold">
                {commentsCount > 0 ? commentsCount : ""}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-1 text-neutral-700 dark:text-neutral-200 hover:text-[#C85A32] active:scale-90 transition-transform relative"
              title={t.sharePost}
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Save / Bookmark */}
          <button
            onClick={handleSave}
            className="p-1 text-neutral-700 dark:text-neutral-200 hover:text-[#C85A32] active:scale-90 transition-transform"
          >
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                isSaved ? "fill-[#C85A32] text-[#C85A32]" : ""
              }`}
            />
          </button>
        </div>

        {/* 4. Dish Title & Location */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <Link
              href={`/explore?lat=${post.latitude}&lng=${post.longitude}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C85A32] dark:text-[#E06D44] hover:underline"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{post.location_name}</span>
              {(() => {
                const dist = getDistance(post.latitude, post.longitude);
                if (!dist) return null;
                return (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#C85A32]/10 text-[#C85A32] dark:bg-[#C85A32]/20">
                    {dist.formatted}
                  </span>
                );
              })()}
            </Link>

            <a
              href={getDirectionsUrl(post.latitude, post.longitude, post.dish_name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-[#C85A32] dark:hover:text-[#E06D44] transition-colors"
              title="Open in Google Maps"
            >
              <Navigation className="w-3 h-3 text-[#C85A32]" />
              <span>{language === "km" ? "មើលផ្លូវ" : "Directions"}</span>
            </a>
          </div>

          {post.caption && (
            <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
              <span className="font-bold mr-1.5 text-neutral-900 dark:text-neutral-100">
                @{author?.username}
              </span>
              {post.caption}
            </p>
          )}
        </div>

        {/* 5. Comments preview prompt */}
        {commentsCount > 0 && (
          <button
            onClick={openComments}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium"
          >
            {t.viewAllComments} ({commentsCount})
          </button>
        )}
      </div>

      {/* Comment Drawer Component */}
      <CommentDrawer
        isOpen={isCommentOpen}
        onClose={() => setIsCommentOpen(false)}
        postId={post.id}
        dishName={post.dish_name}
        comments={comments}
        onAddComment={handleAddComment}
      />

      {/* Moderation Modal (Report & Block) */}
      <ModerationModal
        isOpen={modModal.isOpen}
        onClose={() => setModModal({ ...modModal, isOpen: false })}
        type={modModal.type}
        postId={post.id}
        targetUserId={post.user_id}
        targetUsername={author?.username || "user"}
        onBlockSuccess={() => {
          if (onDelete) onDelete(post.id);
        }}
      />
    </article>
  );
}
