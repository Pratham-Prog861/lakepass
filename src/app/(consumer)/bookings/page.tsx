"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, Anchor, Clock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  totalAmount: number; // in cents
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  boat: {
    name: string;
    marina: {
      name: string;
    };
  };
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "history">("all");

  const { data, isLoading, isError } = useQuery<{ bookings: Booking[] }>({
    queryKey: ["user-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  const bookingsList = data?.bookings || [];

  // Categorize bookings dynamically
  const now = new Date();
  const upcomingBookings = bookingsList.filter((b) => {
    const start = new Date(b.startTime);
    return (b.status === "confirmed" || b.status === "pending") && start > now;
  });

  const historyBookings = bookingsList.filter((b) => {
    const start = new Date(b.startTime);
    return b.status === "completed" || b.status === "cancelled" || start <= now;
  });

  // Decide which list to display
  const displayList =
    activeTab === "upcoming"
      ? upcomingBookings
      : activeTab === "history"
        ? historyBookings
        : bookingsList;

  // Helpers to render status badges
  const getStatusBadge = (status: Booking["status"], startTimeStr: string) => {
    const start = new Date(startTimeStr);
    
    if (status === "cancelled") {
      return {
        label: "cancelled",
        classes: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400",
      };
    }
    if (status === "pending") {
      return {
        label: "pending payment",
        classes: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400",
      };
    }
    if (status === "confirmed" && start > now) {
      return {
        label: "upcoming",
        classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400",
      };
    }
    return {
      label: "completed",
      classes: "bg-zinc-150 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350",
    };
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          My Bookings
        </h1>
        <p className="text-xs text-zinc-500">Manage your reservations and rentals</p>
      </div>

      {/* Booking Filter Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800/80">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 pb-2.5 text-center text-xs font-bold transition-all ${
            activeTab === "all"
              ? "border-b-2 border-primary text-primary"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          All ({bookingsList.length})
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 pb-2.5 text-center text-xs font-bold transition-all ${
            activeTab === "upcoming"
              ? "border-b-2 border-primary text-primary"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 pb-2.5 text-center text-xs font-bold transition-all ${
            activeTab === "history"
              ? "border-b-2 border-primary text-primary"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          History ({historyBookings.length})
        </button>
      </div>

      {/* Bookings Content */}
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50/10 p-5 text-center text-xs font-semibold text-red-655">
          Failed to load bookings. Please try again.
        </div>
      ) : displayList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mt-4 text-xs font-bold text-zinc-800 dark:text-zinc-200">No bookings found</h3>
          <p className="mt-1 max-w-[220px] text-[10px] text-zinc-400 leading-normal">
            {activeTab === "upcoming"
              ? "You don't have any scheduled rentals at the moment."
              : activeTab === "history"
                ? "Your booking history is empty."
                : "Explore available boats and schedule your first rental!"}
          </p>
          {activeTab === "all" && (
            <Link
              href="/"
              className="mt-5 rounded-2xl bg-primary px-4 py-2 text-[10px] font-bold text-white shadow-xs"
            >
              Explore Boats
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayList.map((booking) => {
            const badge = getStatusBadge(booking.status, booking.startTime);
            const priceInDollars = booking.totalAmount / 100;
            const dateStr = new Date(booking.startTime).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeStr = `${new Date(booking.startTime).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })} - ${new Date(booking.endTime).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}`;

            return (
              <div
                key={booking.id}
                className="flex flex-col gap-3.5 rounded-2xl border border-zinc-100 bg-white p-4 shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Anchor className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col truncate max-w-[160px]">
                      <h3 className="truncate font-heading text-sm font-bold text-zinc-950 dark:text-white">
                        {booking.boat?.name}
                      </h3>
                      <span className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                        {booking.boat?.marina?.name || "Local Marina"}
                      </span>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold capitalize ${badge.classes}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 border-y border-zinc-50 py-2.5 dark:border-zinc-800/40">
                  <div className="flex items-center gap-2 text-xs text-zinc-605 dark:text-zinc-400">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-605 dark:text-zinc-400">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{timeStr}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-400">Total Price</span>
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                      ${priceInDollars.toFixed(2)}
                    </span>
                  </div>
                  
                  {booking.status === "pending" ? (
                    <Link
                      href={`/bookings/checkout/${booking.id}`}
                      className="flex items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-[10px] font-bold text-white shadow-xs transition-all hover:bg-primary/95"
                    >
                      Checkout
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <Link
                      href={`/bookings/success/${booking.id}`}
                      className="flex items-center gap-1 rounded-xl bg-zinc-50 px-3.5 py-2 text-[10px] font-bold text-zinc-700 transition-colors hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Details
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
