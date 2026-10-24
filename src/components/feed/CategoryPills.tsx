"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

interface CategoryPillsProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  const { t } = useLanguage();

  const categories: { id: string; label: string }[] = [
    { id: "all", label: t.catAll },
    { id: "noodles", label: t.catNoodles },
    { id: "rice", label: t.catRice },
    { id: "snacks", label: t.catSnacks },
    { id: "dessert", label: t.catDessert },
    { id: "drinks", label: t.catDrinks },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-4 -mx-4">
      {categories.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isSelected
                ? "bg-[#C85A32] text-white shadow-sm shadow-[#C85A32]/30 scale-102"
                : "bg-white dark:bg-[#1B1C22] text-neutral-600 dark:text-neutral-300 border border-[#EFE6D8] dark:border-[#2C2E38] hover:border-[#C85A32]/50"
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
