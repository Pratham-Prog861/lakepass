"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Loader2, Navigation, Anchor, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";

// Fix default marker icons for Webpack/Next.js dynamic rendering
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Using a custom SVG/HTML marker instead of standard image for custom styling
let UserLocationIcon: L.DivIcon | null = null;
if (typeof window !== "undefined") {
  UserLocationIcon = L.divIcon({
    className: "user-location-marker",
    html: `<div class="relative flex h-5 w-5 items-center justify-center">
      <div class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></div>
      <div class="relative inline-flex h-3 w-3 rounded-full bg-sky-500 border-2 border-white shadow-md"></div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// A component to dynamically update map center
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

interface Boat {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  capacity: number;
}

interface Marina {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  boats: Boat[];
}

export function MapComponent() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([30.3667, -97.9000]); // Default to Austin, TX
  const [zoomLevel, setZoomLevel] = useState(11);

  // Fetch all marinas
  const { data, isLoading } = useQuery<{ marinas: Marina[] }>({
    queryKey: ["marinas", "all"],
    queryFn: async () => {
      const res = await fetch("/api/marinas?all=true");
      if (!res.ok) throw new Error("Failed to fetch marinas");
      return res.json();
    },
  });

  // Check browser geolocation
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setZoomLevel(12);
        },
        (error) => {
          console.warn("Geolocation failed or was denied:", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation);
    }
  };

  const marinasList = data?.marinas || [];

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Loading map data...</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Geolocation Button */}
      {userLocation && (
        <button
          onClick={handleCenterOnUser}
          className="absolute right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-800 shadow-md transition-all hover:bg-zinc-50 active:scale-95 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 border border-zinc-150 dark:border-zinc-800"
          title="Center on my location"
        >
          <Navigation className="h-4.5 w-4.5 fill-current text-primary" />
        </button>
      )}

      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Controller to handle center updates */}
        <MapController center={mapCenter} />

        {/* User Location Marker */}
        {userLocation && UserLocationIcon && (
          <Marker position={userLocation} icon={UserLocationIcon}>
            <Popup>
              <div className="p-1 text-center font-bold text-xs">You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Marina Markers */}
        {marinasList.map((marina) => (
          <Marker
            key={marina.id}
            position={[marina.latitude, marina.longitude]}
            icon={DefaultIcon}
          >
            <Popup className="premium-map-popup">
              <div className="p-1 min-w-[220px] max-w-[280px]">
                <h3 className="font-heading font-extrabold text-sm text-zinc-950 dark:text-white mb-1 leading-snug">
                  {marina.name}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2.5 line-clamp-2 leading-relaxed">
                  {marina.description || "Scenic marina location."}
                </p>

                {/* Available Boats */}
                <div className="mb-3">
                  <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Anchor className="h-3 w-3 text-primary shrink-0" />
                    Available Fleet ({marina.boats?.length || 0})
                  </div>
                  {marina.boats && marina.boats.length > 0 ? (
                    <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                      {marina.boats.map((boat) => (
                        <Link
                          key={boat.id}
                          href={`/boats/${boat.id}`}
                          className="flex items-center justify-between rounded-lg bg-zinc-50 p-1.5 hover:bg-zinc-100 transition-colors border border-zinc-100/50 dark:bg-zinc-800/50 dark:hover:bg-zinc-850 dark:border-zinc-750 group"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-primary transition-colors">
                              {boat.name}
                            </span>
                            <span className="text-[9px] text-zinc-400 capitalize">
                              {boat.type} • Max {boat.capacity} guests
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold text-primary shrink-0">
                            ${(boat.pricePerHour / 100).toFixed(0)}/hr
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-400 italic">No boats listed at this marina.</div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                  <span className="text-[9px] text-zinc-400">
                    GPS: {marina.latitude.toFixed(4)}, {marina.longitude.toFixed(4)}
                  </span>
                  <Link
                    href={`/?marinaId=${marina.id}`}
                    className="flex items-center gap-1 text-[10px] font-extrabold text-primary hover:underline"
                  >
                    All Details <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
