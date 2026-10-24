"use client";

import React, { useState } from "react";
import { X, Send, Trash2 } from "lucide-react";
import { Comment } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  dishName: string;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export function CommentDrawer({
  isOpen,
  onClose,
  dishName,
  comments,
  onAddComment,
  onDeleteComment,
}: CommentDrawerProps) {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#1B1C22] rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#EFE6D8] dark:border-[#2C2E38] shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EFE6D8] dark:border-[#2C2E38]">
          <div className="min-w-0 pr-4">
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 truncate">
              {t.comments}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {dishName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-neutral-100 dark:divide-neutral-800">
          {comments.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-sm">
              {t.addCommentPlaceholder}
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="pt-3 first:pt-0 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0">
                  {c.profiles?.avatar_url || c.user?.avatar_url ? (
                    <img
                      src={c.profiles?.avatar_url || c.user?.avatar_url || ""}
                      alt={c.profiles?.username || "user"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-500">
                      {c.profiles?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      {c.profiles?.username || c.user?.username || "foodie"}
                    </span>
                    {onDeleteComment && (profile?.id === c.user_id) && (
                      <button
                        onClick={() => onDeleteComment(c.id)}
                        className="text-neutral-400 hover:text-red-500 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5 whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-[#EFE6D8] dark:border-[#2C2E38] flex items-center gap-2 bg-[#FAF7F2] dark:bg-[#15161B] rounded-b-3xl"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.addCommentPlaceholder}
            className="flex-1 bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#C85A32]"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="p-2 rounded-xl bg-[#C85A32] text-white disabled:opacity-40 hover:bg-[#B34925] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
