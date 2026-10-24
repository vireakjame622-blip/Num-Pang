"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import Link from "next/link";
import { Post } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { MapPin, Navigation, DollarSign, X, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ExploreFoodMapProps {
  posts: Post[];
  selectedCategory: string;
}

export default function ExploreFoodMap({ posts, selectedCategory }: ExploreFoodMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const { theme } = useTheme();
  const { t } = useLanguage();

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === "all") return true;
    return p.category === selectedCategory;
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around Phnom Penh, Cambodia (11.5564, 104.9282)
      const map = L.map(mapContainerRef.current, {
        center: [11.5564, 104.9282],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileUrl =
        theme === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    // Refresh markers
    if (markersLayerRef.current && mapInstanceRef.current) {
      markersLayerRef.current.clearLayers();

      filteredPosts.forEach((post) => {
        const pinHtml = `
          <div style="
            position: relative;
            cursor: pointer;
            width: 44px;
            height: 44px;
            border-radius: 9999px;
            background: #FFFFFF;
            padding: 2px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            border: 2px solid ${
              post.category === "noodles"
                ? "#E06D44"
                : post.category === "rice"
                ? "#D4AF37"
                : post.category === "dessert"
                ? "#EC4899"
                : "#2D6A4F"
            };
            overflow: hidden;
            transition: transform 0.2s ease;
          ">
            <img 
              src="${post.image_url}" 
              style="width: 100%; height: 100%; object-fit: cover; border-radius: 9999px;" 
              alt="${post.dish_name}" 
            />
          </div>
        `;

        const icon = L.divIcon({
          className: "food-spot-div-icon",
          html: pinHtml,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const marker = L.marker([post.latitude, post.longitude], { icon });
        marker.on("click", () => {
          setActivePost(post);
          mapInstanceRef.current?.panTo([post.latitude, post.longitude], {
            animate: true,
          });
        });

        marker.addTo(markersLayerRef.current!);
      });

      // Fit bounds if markers exist
      if (filteredPosts.length > 0) {
        const bounds = L.latLngBounds(filteredPosts.map((p) => [p.latitude, p.longitude]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [filteredPosts.length, selectedCategory, theme]);

  return (
    <div className="relative w-full h-[calc(100vh-12rem)] min-h-[460px] rounded-2xl overflow-hidden shadow-sm border border-[#EFE6D8] dark:border-[#2C2E38]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Selected Food Spot Preview Card */}
      {activePost && (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white/95 dark:bg-[#1B1C22]/95 backdrop-blur-md rounded-2xl p-3 border border-[#EFE6D8] dark:border-[#2C2E38] shadow-2xl flex gap-3 relative">
            {/* Close button */}
            <button
              onClick={() => setActivePost(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Thumbnail */}
            <div className="w-22 h-22 rounded-xl overflow-hidden flex-shrink-0 relative">
              <img
                src={activePost.image_url}
                alt={activePost.dish_name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">
                ${activePost.price_usd?.toFixed(2) || "1.50"}
              </span>
            </div>

            {/* Dish Info */}
            <div className="flex-1 min-w-0 pr-6 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                  {activePost.dish_name}
                </h4>
                <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#C85A32] flex-shrink-0" />
                  <span className="truncate">{activePost.location_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <div className="text-[11px] font-medium text-[#C85A32] dark:text-[#E06D44]">
                  {activePost.price_khr
                    ? `${activePost.price_khr.toLocaleString()} ៛`
                    : "$1.50"}
                </div>
                <Link
                  href={`/post/${activePost.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#C85A32] text-white hover:bg-[#B34925] transition-colors"
                >
                  <span>{t.viewDishDetails}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
