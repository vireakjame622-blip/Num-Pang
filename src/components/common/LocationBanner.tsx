"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Compass, ChevronDown, Check } from "lucide-react";
import { useLocation, POPULAR_CITIES } from "@/context/LocationContext";
import { useLanguage } from "@/context/LanguageContext";

export function LocationBanner() {
  const { userLocation, isLocating, gpsActive, requestCurrentLocation, setCityLocation } =
    useLocation();
  const { language } = useLanguage();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="mb-3.5">
      <div className="p-2.5 px-3.5 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] shadow-xs flex items-center justify-between gap-2">
        {/* Current Location Display & Dropdown trigger */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-2 text-left min-w-0 flex-1 hover:opacity-85 transition-opacity cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#C85A32]/10 dark:bg-[#C85A32]/20 flex items-center justify-center text-[#C85A32] flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {language === "km" ? "ទីតាំងបច្ចុប្បន្ន" : "Current Location"}
              </span>
              {gpsActive && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  GPS
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-neutral-900 dark:text-neutral-100 truncate">
              <span className="truncate">{userLocation.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            </div>
          </div>
        </button>

        {/* GPS Locate Me Button */}
        <button
          onClick={requestCurrentLocation}
          disabled={isLocating}
          title={language === "km" ? "កំណត់ទីតាំង GPS ផ្ទាល់" : "Detect live GPS location"}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#C85A32] text-white text-xs font-bold hover:bg-[#B34925] active:scale-95 transition-all shadow-xs cursor-pointer flex-shrink-0 disabled:opacity-75"
        >
          {isLocating ? (
            <>
              <Compass className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">{language === "km" ? "កំពុងរក..." : "Locating..."}</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span className="text-[11px]">{language === "km" ? "រកទីតាំងខ្ញុំ" : "My GPS"}</span>
            </>
          )}
        </button>
      </div>

      {/* City Switcher Modal / Popdown */}
      {showPicker && (
        <div className="mt-2 p-3 rounded-2xl bg-white dark:bg-[#1B1C22] border border-[#EFE6D8] dark:border-[#2C2E38] shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {language === "km" ? "ជ្រើសរើសខេត្ត/ក្រុងដើម្បីស្វែងរកម្ហូប" : "Select City / Province"}
            </span>
            <button
              onClick={() => setShowPicker(false)}
              className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-700"
            >
              {language === "km" ? "បិទ" : "Close"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {POPULAR_CITIES.map((city) => {
              const isSelected =
                !gpsActive &&
                Math.abs(userLocation.latitude - city.latitude) < 0.05 &&
                Math.abs(userLocation.longitude - city.longitude) < 0.05;

              return (
                <button
                  key={city.nameEn}
                  onClick={() => {
                    setCityLocation(city);
                    setShowPicker(false);
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#C85A32]/10 dark:bg-[#C85A32]/20 text-[#C85A32] border border-[#C85A32]/30"
                      : "bg-neutral-50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <span>{language === "km" ? city.nameKm : city.nameEn}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#C85A32]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
