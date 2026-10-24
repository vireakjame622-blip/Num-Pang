import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
          <Shield className="w-5 h-5 text-[#C85A32]" />
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Privacy Policy
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1B1C22] rounded-3xl p-6 border border-[#EFE6D8] dark:border-[#2C2E38] shadow-xs space-y-4 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
          Last updated: October 2026
        </p>
        <p>
          Welcome to <strong>Num Pang</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring you have a positive experience while discovering and sharing Cambodian street food.
        </p>

        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm pt-2">
          1. Information We Collect
        </h3>
        <p>
          - <strong>Account Information:</strong> When you sign in with Google or Email, we collect your name, email address, avatar photo, and chosen username.
          <br />
          - <strong>Content & Geolocation:</strong> When you publish a food post, we collect the dish photo, caption, price, stall location name, and GPS coordinates provided by you.
        </p>

        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm pt-2">
          2. How We Use Information
        </h3>
        <p>
          We use your information solely to display food spot recommendations on the map, provide social feeds, enable comments, and enforce community moderation policies.
        </p>

        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm pt-2">
          3. Community Safety & Moderation
        </h3>
        <p>
          Users can report inappropriate content or block other users at any time. Reported content is logged in our moderation system for review.
        </p>

        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm pt-2">
          4. Contact Us
        </h3>
        <p>
          If you have questions regarding this Privacy Policy, please reach out via our community channels.
        </p>
      </div>
    </div>
  );
}
