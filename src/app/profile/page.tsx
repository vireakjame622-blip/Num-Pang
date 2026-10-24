"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";


function ProfileRedirectContent() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (profile?.username) {
        router.replace(`/profile/${profile.username}`);
      } else {
        router.replace("/login");
      }
    }
  }, [profile, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#C85A32]" />
    </div>
  );
}

export default function ProfileRedirect() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-[#C85A32]" /></div>}>
      <ProfileRedirectContent />
    </Suspense>
  );
}
