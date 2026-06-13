"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { CheckCircle, Anchor, Calendar, Clock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  totalAmount: number;
  startTime: string;
  endTime: string;
  status: string;
  boat: {
    name: string;
    marina: {
      name: string;
    };
  };
}

export default function BookingSuccessPage() {
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";

  const { data, isLoading } = useQuery<{ booking: Booking }>({
    queryKey: ["booking-success-details", id, sessionId],
    queryFn: async () => {
      const url = sessionId 
        ? `/api/bookings/${id}?session_id=${sessionId}` 
        : `/api/bookings/${id}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch booking success details");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const booking = data?.booking;
  const priceInDollars = booking ? booking.totalAmount / 100 : 0;
  const dateStr = booking
    ? new Date(booking.startTime).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  const timeStr = booking
    ? `${new Date(booking.startTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })} - ${new Date(booking.endTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "";

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      {/* Checkmark animation wrapper */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
        <CheckCircle className="h-12 w-12 stroke-[1.8]" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Booking Confirmed!
        </h1>
        <p className="max-w-[280px] text-xs text-zinc-400">
          Your rental is confirmed. The marina owner has been notified.
        </p>
      </div>

      {/* Booking Details Card */}
      {booking && (
        <div className="w-full max-w-sm rounded-2xl border border-zinc-150 bg-white p-5 text-left shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900">
          <div className="flex gap-2.5 pb-4 border-b border-zinc-50 dark:border-zinc-800">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Anchor className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Confirmed Rental</span>
              <h3 className="font-heading text-xs font-bold text-zinc-900 dark:text-white">
                {booking.boat?.name}
              </h3>
              <span className="text-[9px] text-zinc-400">
                {booking.boat?.marina?.name || "Local Marina"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-4">
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="font-semibold">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="font-semibold">{timeStr}</span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-50 pt-3.5 mt-2 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wide">Paid</span>
              <span className="text-sm font-extrabold text-primary">${priceInDollars.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Boarding instructions */}
      <div className="rounded-xl bg-zinc-50 p-4 text-left text-[11px] leading-relaxed text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
        <span className="font-bold text-zinc-800 dark:text-zinc-200">How to Check-In:</span>
        <ol className="mt-1 list-decimal pl-4 space-y-1">
          <li>Arrive at the marina 15 minutes before your rental starts.</li>
          <li>Show your confirmation email/ID to the dock master.</li>
          <li>Complete the quick safety checklist and set sail!</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex w-full flex-col gap-3">
        <Link
          href="/bookings"
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-primary/95"
        >
          View My Bookings
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-2xl border border-zinc-200 py-3.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
