"use client";

import React, { useState } from "react";
import { X, ShieldAlert, Ban, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface ModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "report" | "block";
  postId?: string;
  targetUserId: string;
  targetUsername: string;
  onBlockSuccess?: () => void;
}

export function ModerationModal({
  isOpen,
  onClose,
  type,
  postId,
  targetUserId,
  targetUsername,
  onBlockSuccess,
}: ModerationModalProps) {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    const configured = isSupabaseConfigured();

    if (type === "report") {
      if (configured && profile) {
        const supabase = createClient();
        await supabase.from("reports").insert({
          reporter_id: profile.id,
          reported_post_id: postId || null,
          reported_user_id: targetUserId,
          reason,
          details: details.trim() || null,
        });
      }
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } else if (type === "block") {
      if (configured && profile) {
        const supabase = createClient();
        await supabase.from("blocks").insert({
          blocker_id: profile.id,
          blocked_id: targetUserId,
        });
      }
      // Save to localStorage so demo mode or client hides instantly
      const blockedList = JSON.parse(localStorage.getItem("numpang_blocked") || "[]");
      if (!blockedList.includes(targetUserId)) {
        blockedList.push(targetUserId);
        localStorage.setItem("numpang_blocked", JSON.stringify(blockedList));
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        if (onBlockSuccess) onBlockSuccess();
      }, 1200);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-[#1B1C22] rounded-3xl p-5 border border-[#EFE6D8] dark:border-[#2C2E38] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#2D6A4F] mx-auto animate-bounce" />
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {type === "report" ? t.reportSuccess : t.userBlocked}
            </p>
          </div>
        ) : type === "report" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#C85A32]">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                {t.reportTitle}
              </h3>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {t.reportReasonPrompt}
            </p>

            {/* Reasons List */}
            <div className="space-y-2">
              {Object.entries(t.reportReasons).map(([key, label]) => (
                <label
                  key={key}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    reason === key
                      ? "border-[#C85A32] bg-[#C85A32]/10 font-semibold text-[#C85A32]"
                      : "border-[#EFE6D8] dark:border-[#2C2E38] text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={key}
                    checked={reason === key}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-[#C85A32]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            {/* Optional details */}
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)..."
              rows={2}
              className="w-full bg-[#FAF7F2] dark:bg-[#121316] border border-[#EFE6D8] dark:border-[#2C2E38] rounded-xl p-2.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#C85A32]"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#C85A32] text-white font-semibold text-xs hover:bg-[#B34925] transition-colors"
            >
              {t.submitReport}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                {t.blockUser} @{targetUsername}?
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {t.blockUserConfirm}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {t.blockUser}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
