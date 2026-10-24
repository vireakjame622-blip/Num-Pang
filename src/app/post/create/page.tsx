"use client";

import React, { Suspense, useState } from "react";
import dynamicMap from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  MapPin,
  Crosshair,
  Sparkles,
  DollarSign,
  AlertCircle,
  CheckCircle,
  X,
  Utensils,
} from "lucide-react";
import confetti from "canvas-confetti";
import { compressAndResizeImage, CompressedImageResult } from "@/lib/image-compression";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Category, Post } from "@/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";


// Dynamically import LocationPickerMap to avoid SSR Leaflet issues
const LocationPickerMap = dynamicMap(
  () => import("@/components/map/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse flex items-center justify-center text-xs text-neutral-400">
        Loading interactive map...
      </div>
    ),
  }
);

function CreatePostContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const { profile, isDemoUser } = useAuth();

  // Form State
  const [imageResult, setImageResult] = useState<CompressedImageResult | null>(null);
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState<Category>("snacks");
  const [priceUsd, setPriceUsd] = useState("");
  const [priceKhr, setPriceKhr] = useState("");
  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState(11.5694); // Central Market default
  const [longitude, setLongitude] = useState(104.9211);
  const [showMap, setShowMap] = useState(false);

  // Status & Error
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handle Image Upload & Compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setIsCompressing(true);

    try {
      const result = await compressAndResizeImage(file);
      setImageResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process image.");
    } finally {
      setIsCompressing(false);
    }
  };

  // Convert USD to KHR helper
  const handlePriceUsdChange = (val: string) => {
    setPriceUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setPriceKhr(Math.round(num * 4000).toString());
    }
  };

  // GPS Current Location Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg(t.gpsError);
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const place =
              data.display_name?.split(",").slice(0, 3).join(",") ||
              "Current Location";
            setLocationName(place);
          }
        } catch {
          setLocationName("Current GPS Location");
        }

        setGpsLoading(false);
        setSuccessMsg(t.gpsDetected);
        setTimeout(() => setSuccessMsg(""), 3000);
      },
      (err) => {
        setGpsLoading(false);
        setErrorMsg(`${t.gpsError}: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!imageResult) {
      setErrorMsg(t.fillRequiredFields);
      return;
    }
    if (!dishName.trim()) {
      setErrorMsg("Please provide a dish name.");
      return;
    }
    if (!locationName.trim()) {
      setErrorMsg("Please specify the stall or place name.");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = imageResult.previewUrl;
      const configured = isSupabaseConfigured();

      if (configured && profile) {
        const supabase = createClient();
        const fileExt = imageResult.file.name.split(".").pop() || "jpg";
        const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(filePath, imageResult.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("posts")
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;

        // Insert into Supabase posts table
        const { error: insertError } = await supabase.from("posts").insert({
          user_id: profile.id,
          dish_name: dishName.trim(),
          category,
          price_usd: priceUsd ? parseFloat(priceUsd) : null,
          price_khr: priceKhr ? parseInt(priceKhr) : null,
          caption: caption.trim() || null,
          image_url: finalImageUrl,
          location_name: locationName.trim(),
          latitude,
          longitude,
        });

        if (insertError) {
          throw new Error(insertError.message);
        }
      } else {
        // Offline / Demo Mode Local Persistence
        const newPost: Post = {
          id: `local-${Date.now()}`,
          user_id: profile?.id || "demo-current-user",
          dish_name: dishName.trim(),
          category,
          price_usd: priceUsd ? parseFloat(priceUsd) : 1.5,
          price_khr: priceKhr ? parseInt(priceKhr) : 6000,
          caption: caption.trim() || null,
          image_url: finalImageUrl,
          location_name: locationName.trim(),
          latitude,
          longitude,
          created_at: new Date().toISOString(),
          profiles: profile || undefined,
          likes_count: 1,
          comments_count: 0,
          is_liked: true,
          is_saved: false,
        };

        const existing: Post[] = JSON.parse(
          localStorage.getItem("numpang_local_posts") || "[]"
        );
        localStorage.setItem(
          "numpang_local_posts",
          JSON.stringify([newPost, ...existing])
        );
      }

      // Celebrate with confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#C85A32", "#E5BE48", "#2D6A4F"],
      });

      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish post.");
      setIsSubmitting(false);
    }
  };

  const categories: { id: Category; label: string }[] = [
    { id: "snacks", label: t.catSnacks },
    { id: "noodles", label: t.catNoodles },
    { id: "rice", label: t.catRice },
    { id: "dessert", label: t.catDessert },
    { id: "drinks", label: t.catDrinks },
    { id: "other", label: t.catOther },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center font-bold">
          <Utensils className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {t.createTitle}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Share hidden street food spots with the foodie community
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Image Upload & Canvas Compression Preview */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
            Food Photo
          </label>

          {imageResult ? (
            <div className="relative aspect-4/3 rounded-3xl overflow-hidden border border-[#EFE6D8] dark:border-[#2C2E38] shadow-sm group">
              <img
                src={imageResult.previewUrl}
                alt="Dish preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImageResult(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Compression stats banner */}
              <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-[11px] flex items-center justify-between font-medium">
                <span>Resized to {imageResult.width}×{imageResult.height}px</span>
                <span className="text-[#E5BE48]">
                  {imageResult.originalSizeKb}KB → {imageResult.compressedSizeKb}KB
                </span>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-[#EFE6D8] dark:border-[#2C2E38] hover:border-[#C85A32] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white dark:bg-[#1B1C22]">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isCompressing}
              />
              <div className="w-14 h-14 rounded-2xl bg-[#C85A32]/10 text-[#C85A32] flex items-center justify-center mb-3">
                {isCompressing ? (
                  <div className="w-6 h-6 border-2 border-[#C85A32] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-7 h-7" />
                )}
              </div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {isCompressing ? "Compressing..." : t.uploadImagePrompt}
              </span>
              <span className="text-[11px] text-neutral-400 mt-0.5">
                {t.uploadSubtext}
              </span>
            </label>
          )}
        </div>

        {/* 2. Dish Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
            {t.dishNameLabel} *
          </label>
          <input
            type="text"
            required
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder={t.dishNamePlaceholder}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#C85A32]"
          />
        </div>

        {/* 3. Category Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
            {t.categoryLabel}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  category === cat.id
                    ? "bg-[#C85A32] text-white border-[#C85A32] shadow-xs"
                    : "bg-white dark:bg-[#1B1C22] text-neutral-700 dark:text-neutral-300 border-[#EFE6D8] dark:border-[#2C2E38]"
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Price in USD & KHR */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {t.priceInUsd}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                $
              </span>
              <input
                type="number"
                step="0.05"
                value={priceUsd}
                onChange={(e) => handlePriceUsdChange(e.target.value)}
                placeholder="1.50"
                className="w-full pl-7 pr-3 py-2 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
              {t.priceInKhr}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                ៛
              </span>
              <input
                type="number"
                step="500"
                value={priceKhr}
                onChange={(e) => setPriceKhr(e.target.value)}
                placeholder="6000"
                className="w-full pl-7 pr-3 py-2 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#C85A32]"
              />
            </div>
          </div>
        </div>

        {/* 5. Caption & Foodie Tips */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
            {t.captionLabel}
          </label>
          <textarea
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t.captionPlaceholder}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#C85A32]"
          />
        </div>

        {/* 6. Location Details & Map Pin Picker */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>{t.locationLabel} *</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={gpsLoading}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C85A32] hover:underline"
              >
                <Crosshair className={`w-3 h-3 ${gpsLoading ? "animate-spin" : ""}`} />
                <span>{gpsLoading ? "Locating..." : t.useCurrentGps}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 underline"
              >
                {showMap ? "Hide Map" : t.pickOnMap}
              </button>
            </div>
          </div>

          <input
            type="text"
            required
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder={t.locationNamePlaceholder}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#C85A32]"
          />

          {/* Interactive Leaflet Picker */}
          {showMap && (
            <div className="space-y-1">
              <p className="text-[11px] text-neutral-500">
                Tap anywhere or drag the pin to set the exact street stall position:
              </p>
              <LocationPickerMap
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng, name) => {
                  setLatitude(lat);
                  setLongitude(lng);
                  if (name && !locationName) {
                    setLocationName(name);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* 7. Publish Button */}
        <button
          type="submit"
          disabled={isSubmitting || isCompressing}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C85A32] to-[#E5BE48] text-white font-bold text-sm shadow-md shadow-[#C85A32]/30 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t.publishing}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{t.publishButton}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading editor...</div>}>
      <CreatePostContent />
    </Suspense>
  );
}
