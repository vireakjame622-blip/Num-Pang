"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import Link from "next/link";
import { Post } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "@/context/LocationContext";
import { MapPin, Navigation, Compass, X, ChevronRight, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ExploreFoodMapProps {
  posts: Post[];
  selectedCategory: string;
}

export default function ExploreFoodMap({ posts, selectedCategory }: ExploreFoodMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { userLocation, isLocating, requestCurrentLocation, getDistance, getDirectionsUrl } =
    useLocation();

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === "all") return true;
    return p.category === selectedCategory;
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = userLocation?.latitude || 11.5564;
      const initialLng = userLocation?.longitude || 104.9282;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    // Refresh food markers
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

  // Update user live location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
    } else {
      const userDotHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: rgba(59, 130, 246, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background: #2563EB; border: 2px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: userDotHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(
        `<div style="font-weight: 700; font-size: 12px; color: #2563EB;">${
          language === "km" ? "ទីតាំងបច្ចុប្បន្នរបស់អ្នក" : "Your Current Location"
        }</div>`
      );

      userMarkerRef.current = marker;
    }
  }, [userLocation, language]);

  const handleLocateMe = async () => {
    const loc = await requestCurrentLocation();
    if (loc && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 15, {
        animate: true,
        duration: 1.2,
      });
    } else if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.latitude, userLocation.longitude], 15, {
        animate: true,
      });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-12rem)] min-h-[460px] rounded-3xl overflow-hidden shadow-sm border border-[#EFE6D8] dark:border-[#2C2E38]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating GPS Locate Me Button on the Map */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          title={language === "km" ? "ស្វែងរកទីតាំងខ្ញុំលើផែនទី" : "Locate my position on map"}
          className="p-2.5 rounded-2xl bg-white/95 dark:bg-[#1B1C22]/95 backdrop-blur-md border border-[#EFE6D8] dark:border-[#2C2E38] text-[#C85A32] hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          {isLocating ? (
            <Compass className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          <span className="text-[11px] font-bold hidden sm:inline text-neutral-800 dark:text-neutral-200">
            {language === "km" ? "ទីតាំងខ្ញុំ" : "My Location"}
          </span>
        </button>
      </div>

      {/* Selected Food Spot Preview Card */}
      {activePost && (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white/95 dark:bg-[#1B1C22]/95 backdrop-blur-md rounded-2xl p-3 border border-[#EFE6D8] dark:border-[#2C2E38] shadow-2xl flex gap-3 relative">
            {/* Close button */}
            <button
              onClick={() => setActivePost(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
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
                  {(() => {
                    const dist = getDistance(activePost.latitude, activePost.longitude);
                    if (!dist) return null;
                    return (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#C85A32]/10 text-[#C85A32] dark:bg-[#C85A32]/20 flex-shrink-0">
                        {dist.formatted}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
                <a
                  href={getDirectionsUrl(
                    activePost.latitude,
                    activePost.longitude,
                    activePost.dish_name
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:text-[#C85A32] transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#C85A32]" />
                  <span>{language === "km" ? "មើលផ្លូវ Google Maps" : "Directions"}</span>
                </a>

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
