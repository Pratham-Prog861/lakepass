"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { Calendar, Anchor, Clock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  totalAmount: number; // in cents
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  boat: {
    name: string;
    type: string;
    marina: {
      name: string;
    };
  };
  user: {
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data, isLoading, isError } = useQuery<{ bookings: Booking[] }>({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bookings");
      if (!res.ok) throw new Error("Failed to fetch admin bookings");
      return res.json();
    },
  });

  // Socket listener for real-time invalidation when bookings are completed/updated
  useEffect(() => {
    if (!socket) return;

    socket.on("booking:confirmed", (payload: { customerName: string; boatName: string }) => {
      toast.success(`New booking confirmed for ${payload.boatName} by ${payload.customerName}!`);
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    });

    return () => {
      socket.off("booking:confirmed");
    };
  }, [socket, queryClient]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-105 bg-red-50/10 p-6 text-center text-xs font-semibold text-red-600">
        Failed to load bookings. Please try reloading.
      </div>
    );
  }

  const bookingsList = data.bookings;

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return {
          label: "Confirmed",
          classes: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
        };
      case "pending":
        return {
          label: "Pending Payment",
          classes: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
        };
      case "completed":
        return {
          label: "Completed",
          classes: "bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/50",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          classes: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
        };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-955 dark:text-white">
          Bookings Management
        </h1>
        <p className="text-sm text-zinc-500">Track and manage upcoming and past rentals.</p>
      </div>

      {bookingsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 dark:bg-zinc-800">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-800 dark:text-zinc-200">No bookings found</h3>
          <p className="mt-1.5 max-w-sm text-xs leading-normal text-zinc-400">
            Reservations made by consumers will appear here in real-time. Make sure your boats are published and active!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {bookingsList.map((booking) => {
            const badge = getStatusBadge(booking.status);
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
                className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* Header: Boat & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Anchor className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-heading text-sm font-bold text-zinc-950 dark:text-white">
                        {booking.boat?.name}
                      </span>
                      <span className="truncate text-[10px] text-zinc-405 uppercase tracking-wide">
                        {booking.boat?.type} • {booking.boat?.marina?.name}
                      </span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold ${badge.classes}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Date & Time */}
                <div className="flex flex-col gap-2 border-y border-zinc-100 py-3 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium">{timeStr}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Customer</span>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {booking.user?.fullName || "Guest"}
                      </span>
                      <span className="truncate text-[9px] text-zinc-400">
                        {booking.user?.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing info */}
                <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-400">Total Revenue</span>
                    <span className="text-xs font-extrabold text-primary">
                      ${(booking.totalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-400">
                    Booked {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
