"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import MapComponent to disable SSR, preventing Leaflet window errors
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Loading Map...</span>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="relative h-[calc(100vh-8.5rem)] md:h-[calc(100vh-4rem)] w-full overflow-hidden">
      <MapComponent />
    </div>
  );
}
