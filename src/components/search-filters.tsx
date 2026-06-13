"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Compass, Anchor } from "lucide-react";

const CATEGORIES = [
  { id: "all", name: "All Boats", icon: Anchor },
  { id: "pontoon", name: "Pontoons", icon: Compass },
  { id: "speedboat", name: "Speedboats", icon: Compass },
  { id: "yacht", name: "Yachts", icon: Compass },
  { id: "jetski", name: "Jet Skis", icon: Compass },
];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read current filters from URL
  const currentSearch = searchParams.get("search") || "";
  const currentType = searchParams.get("type") || "all";

  const [search, setSearch] = useState(currentSearch);

  // Sync state if URL changes externally (e.g. going back/forward)
  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  // Debounced URL updates for search input to prevent firing requests on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(handler);
  }, [search, pathname, router, searchParams]);

  // Handler for category filter clicks
  const handleTypeChange = (typeId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (typeId && typeId !== "all") {
      params.set("type", typeId);
    } else {
      params.delete("type");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4.5 w-4.5 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lakes, boats, or marinas..."
          className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium shadow-sm transition-all focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = currentType === category.id;
          return (
            <button
              key={category.id}
              onClick={() => handleTypeChange(category.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shadow-xs transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-white text-zinc-600 border border-zinc-150 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
