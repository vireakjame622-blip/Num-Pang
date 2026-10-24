import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-neutral-700 dark:text-neutral-300 hover:text-[#C85A32]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#C85A32]" />
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Terms of Service
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1B1C22] rounded-3xl p-6 border border-[#EFE6D8] dark:border-[#2C2E38] shadow-xs space-y-4 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
          Last updated: October 2026
        </p>
        <p>
          By creating an account or using <strong>Num Pang</strong>, you agree to these Terms of Service.
        </p>

        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm pt-2">
          1. Community Guidelines
        </h3>
        <p>
          Num Pang is a respectful community for Khmer food lovers. Users must not upload offensive content, spam stalls with fraudulent reviews, or harass other foodies. Violation of these guidelines may result in immediate suspension or content removal.
        </p>

        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm pt-2">
          2. User Generated Content
        </h3>
        <p>
          You retain ownership of the photos and reviews you publish. You grant Num Pang a non-exclusive license to display this content on the food discovery feed and interactive maps.
        </p>

        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm pt-2">
          3. Accuracy of Food Spot Locations
        </h3>
        <p>
          While we strive for accurate stall coordinates, street food vendors in Cambodia may change timings or locations. Num Pang is not liable for vendor relocations or pricing adjustments.
        </p>
      </div>
    </div>
  );
}
