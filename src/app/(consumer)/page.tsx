import { Star, MapPin, Anchor } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/db/drizzle";
import { boats, marinas } from "@/db/schema";
import { desc, eq, and, or, like, inArray } from "drizzle-orm";
import { sanitizeImageUrl } from "@/lib/utils";
import { SearchFilters } from "@/components/search-filters";

interface SearchParams {
  search?: string;
  type?: string;
}

export default async function ConsumerHome({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const searchVal = params.search || "";
  const typeVal = params.type || "all";

  // Query actual marinas and boats from database based on search/filters
  let boatConditions = [];
  if (typeVal && typeVal !== "all") {
    boatConditions.push(eq(boats.type, typeVal));
  }

  if (searchVal) {
    // Search marinas first
    const matchingMarinas = await db.query.marinas.findMany({
      where: or(
        like(marinas.name, `%${searchVal}%`),
        like(marinas.description, `%${searchVal}%`)
      ),
      columns: { id: true },
    }).catch(() => []);

    const matchingMarinaIds = matchingMarinas.map((m) => m.id);

    const searchConditions = [
      like(boats.name, `%${searchVal}%`),
      like(boats.description, `%${searchVal}%`),
      like(boats.type, `%${searchVal}%`),
    ];

    if (matchingMarinaIds.length > 0) {
      searchConditions.push(inArray(boats.marinaId, matchingMarinaIds));
    }

    boatConditions.push(or(...searchConditions));
  }

  const dbBoats = await db.query.boats.findMany({
    where: boatConditions.length > 0 ? and(...boatConditions) : undefined,
    orderBy: [desc(boats.createdAt)],
    limit: 6,
    with: {
      marina: {
        columns: { name: true },
      },
    },
  }).catch((error) => {
    console.error("Failed to query boats for homepage:", error);
    return [];
  });

  let marinaConditions = [];
  if (searchVal) {
    marinaConditions.push(
      or(
        like(marinas.name, `%${searchVal}%`),
        like(marinas.description, `%${searchVal}%`)
      )
    );
  }

  const dbMarinas = await db.query.marinas.findMany({
    where: marinaConditions.length > 0 ? and(...marinaConditions) : undefined,
    orderBy: [desc(marinas.createdAt)],
    limit: 6,
    with: {
      boats: {
        columns: { id: true },
      },
    },
  }).catch((error) => {
    console.error("Failed to query marinas for homepage:", error);
    return [];
  });

  // Format DB boats to match display schema
  const displayBoats = dbBoats.map(b => ({
    id: b.id,
    name: b.name,
    type: b.type,
    pricePerHour: b.pricePerHour,
    capacity: b.capacity,
    rating: 4.8, // Static rating mock for new items
    reviews: Math.floor(Math.random() * 15) + 3,
    imageUrl: sanitizeImageUrl(b.imageUrl),
    marinaName: b.marina?.name || "Local Marina",
  }));

  // Format DB marinas to match display schema
  const displayMarinas = dbMarinas.map(m => ({
    id: m.id,
    name: m.name,
    location: m.description || "Lake Area",
    boatsCount: m.boats?.length || 0,
    imageUrl: "https://images.unsplash.com/photo-1505244208161-ba3da6d7a4c3?auto=format&fit=crop&q=80&w=600",
  }));

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      {/* Hero Search Area */}
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Find your next water adventure
        </h1>
        <SearchFilters />
      </div>

      {/* Featured Boats Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            Featured Boats
          </h2>
          <button className="text-xs font-semibold text-primary hover:underline">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayBoats.map((boat) => (
            <Link
              key={boat.id}
              href={`/boats/${boat.id}`}
              className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xs transition-all hover:shadow-md dark:border-zinc-800/60 dark:bg-zinc-900"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={boat.imageUrl}
                  alt={boat.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-103"
                  sizes="(max-w-md) 100vw"
                  priority={true}
                />
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-zinc-800 shadow-xs backdrop-blur-xs">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {boat.rating}
                </div>
                <div className="absolute bottom-3 left-3 rounded-lg bg-primary/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs capitalize">
                  {boat.type}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-zinc-900 dark:text-white">
                    {boat.name}
                  </h3>
                  <span className="text-sm font-extrabold text-primary">
                    ${(boat.pricePerHour / 100).toFixed(0)}/hr
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{boat.marinaName}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-zinc-50 pt-2 text-[11px] text-zinc-400 dark:border-zinc-800/50">
                  <span>Up to {boat.capacity} guests</span>
                  <span>{boat.reviews} reviews</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Marinas Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            Popular Marinas
          </h2>
          <button className="text-xs font-semibold text-primary hover:underline">
            See Map
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {displayMarinas.map((marina) => (
            <div
              key={marina.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900"
            >
              <div className="relative h-28 w-full">
                <Image
                  src={marina.imageUrl}
                  alt={marina.name}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              </div>
              <div className="flex flex-col gap-1 p-3">
                <h3 className="truncate font-heading text-xs font-bold text-zinc-900 dark:text-white">
                  {marina.name}
                </h3>
                <span className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                  {marina.location}
                </span>
                <span className="mt-1 text-[9px] font-semibold text-primary">
                  {marina.boatsCount} boats available
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
