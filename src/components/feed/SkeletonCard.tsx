import React from "react";

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#1B1C22] rounded-3xl p-4 border border-[#EFE6D8] dark:border-[#2C2E38] shadow-xs space-y-3.5 mb-4 animate-pulse">
      {/* User Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="space-y-1.5 flex-1">
          <div className="w-28 h-3.5 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="w-36 h-2.5 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>

      {/* Image Container */}
      <div className="w-full aspect-4/3 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>

      {/* Text Lines */}
      <div className="space-y-2">
        <div className="w-24 h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="w-full h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="w-4/5 h-3 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
