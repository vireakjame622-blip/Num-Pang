"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserLocation {
  latitude: number;
  longitude: number;
  name: string;
}

export const POPULAR_CITIES: { nameKm: string; nameEn: string; latitude: number; longitude: number }[] = [
  { nameKm: "ភ្នំពេញ", nameEn: "Phnom Penh", latitude: 11.5564, longitude: 104.9282 },
  { nameKm: "សៀមរាប", nameEn: "Siem Reap", latitude: 13.3671, longitude: 103.8448 },
  { nameKm: "បាត់ដំបង", nameEn: "Battambang", latitude: 13.0957, longitude: 103.2022 },
  { nameKm: "កំពត", nameEn: "Kampot", latitude: 10.6104, longitude: 104.1815 },
  { nameKm: "ព្រះសីហនុ", nameEn: "Sihanoukville", latitude: 10.6253, longitude: 103.5234 },
];

interface LocationContextType {
  userLocation: UserLocation;
  isLocating: boolean;
  gpsActive: boolean;
  requestCurrentLocation: () => Promise<UserLocation | null>;
  setCityLocation: (city: typeof POPULAR_CITIES[0]) => void;
  getDistance: (lat: number, lng: number) => { km: number; formatted: string } | null;
  getDirectionsUrl: (lat: number, lng: number, placeName?: string) => string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  // Default to Phnom Penh
  const [userLocation, setUserLocation] = useState<UserLocation>({
    latitude: 11.5564,
    longitude: 104.9282,
    name: "Phnom Penh",
  });
  const [isLocating, setIsLocating] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);

  // Restore saved location if any
  useEffect(() => {
    try {
      const saved = localStorage.getItem("numpang_user_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          setUserLocation(parsed);
          setGpsActive(!!parsed.isGps);
        }
      }
    } catch (_) {}
  }, []);

  const requestCurrentLocation = async (): Promise<UserLocation | null> => {
    if (!navigator.geolocation) {
      return null;
    }

    setIsLocating(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let placeName = "Current Location";

          // Reverse geocode via OpenStreetMap Nominatim
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
            );
            if (res.ok) {
              const data = await res.json();
              placeName =
                data.address?.suburb ||
                data.address?.city ||
                data.address?.town ||
                data.address?.county ||
                "Cambodia";
            }
          } catch (_) {}

          const newLoc: UserLocation = {
            latitude: lat,
            longitude: lng,
            name: placeName,
          };

          setUserLocation(newLoc);
          setGpsActive(true);
          setIsLocating(false);

          try {
            localStorage.setItem(
              "numpang_user_location",
              JSON.stringify({ ...newLoc, isGps: true })
            );
          } catch (_) {}

          resolve(newLoc);
        },
        () => {
          setIsLocating(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const setCityLocation = (city: typeof POPULAR_CITIES[0]) => {
    const loc: UserLocation = {
      latitude: city.latitude,
      longitude: city.longitude,
      name: city.nameEn,
    };
    setUserLocation(loc);
    setGpsActive(false);
    try {
      localStorage.setItem("numpang_user_location", JSON.stringify(loc));
    } catch (_) {}
  };

  const getDistance = (lat: number, lng: number) => {
    if (!userLocation) return null;
    const km = calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lng);
    if (km < 1) {
      return {
        km,
        formatted: `${Math.round(km * 1000)} m`,
      };
    }
    return {
      km,
      formatted: `${km.toFixed(1)} km`,
    };
  };

  const getDirectionsUrl = (lat: number, lng: number, placeName?: string) => {
    const query = encodeURIComponent(`${lat},${lng}${placeName ? ` (${placeName})` : ""}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        isLocating,
        gpsActive,
        requestCurrentLocation,
        setCityLocation,
        getDistance,
        getDirectionsUrl,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
