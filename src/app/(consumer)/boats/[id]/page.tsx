import { db } from "@/db/drizzle";
import { boats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Users, Compass, DollarSign, CloudSun, MapPin, Anchor, Star, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WeatherWidget } from "@/components/weather-widget";
import { sanitizeImageUrl } from "@/lib/utils";

export default async function BoatDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let boatDetails = null;

  try {
    const dbBoat = await db.query.boats.findFirst({
      where: eq(boats.id, id),
      with: {
        marina: true,
      },
    });

    if (dbBoat) {
      boatDetails = {
        id: dbBoat.id,
        name: dbBoat.name,
        type: dbBoat.type,
        pricePerHour: dbBoat.pricePerHour,
        capacity: dbBoat.capacity,
        rating: 4.8,
        reviews: 12,
        imageUrl: sanitizeImageUrl(dbBoat.imageUrl),
        description: dbBoat.description || "No description provided for this boat.",
        marinaName: dbBoat.marina?.name || "Local Marina",
        latitude: dbBoat.marina?.latitude || 30.3667,
        longitude: dbBoat.marina?.longitude || -97.9000,
      };
    }
  } catch (error) {
    console.error("Failed to query boat details:", error);
  }

  if (!boatDetails) {
    notFound();
  }

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 pb-24">
      {/* Boat Image Header */}
      <div className="relative h-72 w-full">
        <Image
          src={boatDetails.imageUrl}
          alt={boatDetails.name}
          fill
          className="object-cover"
          sizes="(max-w-md) 100vw"
          priority
        />
        {/* Floating Back Button */}
        <Link
          href="/"
          className="absolute top-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-md backdrop-blur-xs hover:bg-white dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
        </Link>
      </div>

      {/* Details Section */}
      <div className="flex flex-col gap-5 px-4 py-5 bg-white rounded-t-3xl -mt-6 relative z-10 shadow-xs dark:bg-zinc-900">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary capitalize">
              {boatDetails.type}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{boatDetails.rating}</span>
              <span className="text-zinc-400 font-medium">({boatDetails.reviews} reviews)</span>
            </div>
          </div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {boatDetails.name}
          </h1>
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{boatDetails.marinaName}</span>
          </div>
        </div>

        {/* Specifications Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/40 dark:bg-zinc-950/20">
            <Users className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400">Capacity</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Up to {boatDetails.capacity} guests
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5 dark:border-zinc-800/40 dark:bg-zinc-950/20">
            <Anchor className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400">Safety Gear</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Included</span>
            </div>
          </div>
        </div>

        {/* Weather Conditions */}
        <WeatherWidget latitude={boatDetails.latitude} longitude={boatDetails.longitude} />

        {/* Description */}
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-sm font-bold text-zinc-900 dark:text-white">
            About this boat
          </h2>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {boatDetails.description}
          </p>
        </div>
      </div>

      {/* Sticky Bottom Booking Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 mx-auto flex h-20 max-w-md items-center justify-between border-t border-zinc-250 bg-white/95 px-5 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-400 uppercase tracking-wide">Hourly Rate</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-extrabold text-zinc-950 dark:text-white">
              ${(boatDetails.pricePerHour / 100).toFixed(2)}
            </span>
            <span className="text-[10px] text-zinc-400 font-semibold">/ hour</span>
          </div>
        </div>

        <Link
          href={`/boats/${boatDetails.id}/book`}
          className="rounded-2xl bg-primary px-7 py-3 text-xs font-bold text-white shadow-md active:scale-98 transition-all hover:bg-primary/95"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
