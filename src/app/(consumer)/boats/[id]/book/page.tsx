"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Calendar, Clock, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const bookingFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

type FormValues = z.infer<typeof bookingFormSchema>;

interface Boat {
  id: string;
  name: string;
  pricePerHour: number;
  imageUrl: string | null;
  capacity: number;
}

const TIME_SLOTS = [
  { value: "08:00", label: "08:00 AM" },
  { value: "09:00", label: "09:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "19:00", label: "07:00 PM" },
  { value: "20:00", label: "08:00 PM" },
];

export default function BookBoatPage() {
  const router = useRouter();
  const params = useParams();
  const boatId = params.id as string;
  const [duration, setDuration] = useState(0);

  // Fetch boat details
  const { data: boatData, isLoading: loadingBoat, isError } = useQuery<{ boat: Boat }>({
    queryKey: ["boat-booking-details", boatId],
    queryFn: async () => {
      const res = await fetch(`/api/boats/${boatId}`);
      if (!res.ok) throw new Error("Failed to fetch boat");
      return res.json();
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // default to tomorrow
      startTime: "09:00",
      endTime: "13:00",
    },
  });

  const selectedDate = watch("date");
  const selectedStartTime = watch("startTime");
  const selectedEndTime = watch("endTime");

  // Calculate duration in hours
  useEffect(() => {
    if (selectedStartTime && selectedEndTime) {
      const startHour = parseInt(selectedStartTime.split(":")[0]);
      const endHour = parseInt(selectedEndTime.split(":")[0]);
      if (endHour > startHour) {
        setDuration(endHour - startHour);
      } else {
        setDuration(0);
      }
    }
  }, [selectedStartTime, selectedEndTime]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Construct ISO datetime strings
      const startTimeISO = new Date(`${values.date}T${values.startTime}:00`).toISOString();
      const endTimeISO = new Date(`${values.date}T${values.endTime}:00`).toISOString();



      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId,
          startTime: startTimeISO,
          endTime: endTimeISO,
        }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("This boat is already booked during your selected time slot.");
        }
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit booking");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Booking initialized!");
      router.push(`/bookings/checkout/${data.booking.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create booking.");
    },
  });

  const onSubmit = (values: FormValues) => {
    if (duration <= 0) {
      toast.error("End time must be after start time");
      return;
    }
    mutation.mutate(values);
  };

  if (loadingBoat) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !boatData?.boat) {
    return (
      <div className="p-6 text-center text-xs font-semibold text-red-600">
        Failed to load boat specifications.
      </div>
    );
  }

  const boat = boatData.boat;
  const rateInDollars = boat.pricePerHour / 100;
  const subtotal = rateInDollars * duration;
  const serviceFee = subtotal * 0.1; // 10% fee
  const totalCost = subtotal + serviceFee;

  return (
    <div className="flex flex-col gap-6 px-4 py-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/boats/${boatId}`}
          className="rounded-xl border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-55 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-lg font-bold tracking-tight text-zinc-950 dark:text-white">
            Book Boat
          </h1>
          <span className="text-[10px] text-zinc-400 leading-none truncate max-w-[220px]">
            {boat.name}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Booking Parameters Form */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900">
          <h2 className="flex items-center gap-1.5 font-heading text-xs font-bold text-zinc-800 dark:text-zinc-200">
            <Calendar className="h-4 w-4 text-primary" />
            Schedule Details
          </h2>

          {/* Date Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
              Rental Date
            </label>
            <input
              type="date"
              {...register("date")}
              min={new Date().toISOString().split("T")[0]}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            />
            {errors.date && <span className="text-[10px] text-red-500 font-bold">{errors.date.message}</span>}
          </div>

          {/* Start and End Time dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                Start Time
              </label>
              <select
                {...register("startTime")}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-250"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                End Time
              </label>
              <select
                {...register("endTime")}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-250"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {duration <= 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-rose-50/50 p-2.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-950/10 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>End time must be after start time.</span>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        {duration > 0 && (
          <div className="flex flex-col gap-3.5 rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900">
            <h2 className="flex items-center gap-1.5 font-heading text-xs font-bold text-zinc-800 dark:text-zinc-200">
              <DollarSign className="h-4 w-4 text-primary" />
              Price Breakdown
            </h2>

            <div className="flex flex-col gap-2 text-xs border-b border-zinc-55 pb-3 dark:border-zinc-850">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span>
                  ${rateInDollars.toFixed(2)} x {duration} hour{duration > 1 ? "s" : ""}
                </span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span>Service Fee (10%)</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  ${serviceFee.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white">
              <span>Total Price</span>
              <span className="text-sm font-extrabold text-primary">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Proceed CTA */}
        <button
          type="submit"
          disabled={duration <= 0 || mutation.isPending}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-primary/95 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Proceed to Payment
        </button>
      </form>
    </div>
  );
}
export const dynamic = "force-dynamic";
