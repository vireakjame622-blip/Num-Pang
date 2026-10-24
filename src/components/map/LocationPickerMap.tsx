"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { useTheme } from "@/context/ThemeContext";

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number, locationName?: string) => void;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Custom terracotta pin icon
    const customIcon = L.divIcon({
      className: "custom-map-pin-div",
      html: `
        <div style="
          background: #C85A32;
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(200, 90, 50, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: #FFFFFF;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap free tile layer
      const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([latitude, longitude], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      // Reverse geocode on pin move
      const handleLocationUpdate = async (lat: number, lng: number) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const displayName =
              data.display_name?.split(",").slice(0, 3).join(",") ||
              data.address?.road ||
              "";
            onChange(lat, lng, displayName);
            return;
          }
        } catch {
          // fallback without geocoding
        }
        onChange(lat, lng);
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        handleLocationUpdate(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        handleLocationUpdate(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([latitude, longitude]);
      markerRef.current?.setLatLng([latitude, longitude]);
    }

    return () => {
      // Map cleanup on unmount
    };
  }, [latitude, longitude, theme]);

  return (
    <div className="w-full h-56 rounded-2xl overflow-hidden border border-[#EFE6D8] dark:border-[#2C2E38] shadow-inner relative z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
