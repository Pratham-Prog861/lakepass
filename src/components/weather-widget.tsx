"use client";

import { useQuery } from "@tanstack/react-query";
import { CloudSun, Loader2 } from "lucide-react";

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
}

interface WeatherResponse {
  temp: number;
  windSpeed: number;
  conditions: string;
  description: string;
}

export function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const { data, isLoading } = useQuery<WeatherResponse>({
    queryKey: ["weather", latitude, longitude],
    queryFn: async () => {
      const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
      if (!res.ok) throw new Error("Failed to fetch weather");
      return res.json();
    },
  });

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-sky-100 bg-sky-50/20 p-4 dark:border-sky-950/20 dark:bg-sky-950/10">
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-sky-500 shrink-0" />
      ) : (
        <CloudSun className="h-6 w-6 text-sky-500 shrink-0" />
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
          Lake Conditions
        </span>
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
          {isLoading
            ? "Checking conditions..."
            : `${data?.conditions || "Sunny"} • ${data?.temp ? Math.round(data.temp) : 78}°F • ${data?.windSpeed ? data.windSpeed.toFixed(1) : 6}mph Wind`}
        </span>
      </div>
    </div>
  );
}
export default WeatherWidget;
