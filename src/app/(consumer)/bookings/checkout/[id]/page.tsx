"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { CreditCard, ArrowLeft, Loader2, Calendar, ShieldCheck, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Booking {
  id: string;
  totalAmount: number; // in cents
  startTime: string;
  endTime: string;
  status: string;
  boat: {
    name: string;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Fetch pending booking details
  const { data, isLoading, isError } = useQuery<{ booking: Booking }>({
    queryKey: ["booking-checkout", id],
    queryFn: async () => {


      const res = await fetch(`/api/bookings/${id}`);
      if (!res.ok) throw new Error("Failed to fetch booking details");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {


      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to initialize Stripe checkout");
      }
      return res.json();
    },
    onSuccess: (resData) => {
      if (resData?.url) {
        toast.info("Redirecting to Stripe secure checkout...");
        window.location.href = resData.url;
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to complete payment checkout.");
    },
  });

  const handlePay = () => {
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !data?.booking) {
    return (
      <div className="p-6 text-center text-xs font-semibold text-red-600">
        Failed to load checkout details.
      </div>
    );
  }

  const booking = data.booking;
  const priceInDollars = booking.totalAmount / 100;
  const dateStr = new Date(booking.startTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-xl border border-zinc-200 p-2 text-zinc-505 hover:bg-zinc-55 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-lg font-bold tracking-tight text-zinc-950 dark:text-white">
            Secure Payment
          </h1>
          <span className="text-[10px] text-zinc-400 leading-none truncate max-w-[220px]">
            Stripe checkout environment
          </span>
        </div>
      </div>

      {/* Booking summary card */}
      <div className="flex flex-col gap-3.5 rounded-2xl border border-zinc-150 bg-white p-5 shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Reservation Specs</span>
            <h3 className="font-heading text-xs font-bold text-zinc-900 dark:text-white">
              {booking.boat?.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-50 pt-3 text-xs text-zinc-650 dark:border-zinc-800 dark:text-zinc-400">
          <span>Date</span>
          <span className="font-bold text-zinc-850 dark:text-zinc-200">{dateStr}</span>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-50 pt-3 text-xs text-zinc-650 dark:border-zinc-800 dark:text-zinc-400">
          <span>Amount due</span>
          <span className="text-sm font-extrabold text-primary">${priceInDollars.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment info block */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-150 bg-white p-5 shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900">
        <h2 className="flex items-center gap-1.5 font-heading text-xs font-bold text-zinc-800 dark:text-zinc-200">
          <CreditCard className="h-4 w-4 text-primary" />
          Stripe Secure Checkout
        </h2>

        <p className="text-xs text-zinc-505 leading-relaxed dark:text-zinc-400">
          You will be redirected to Stripe's secure hosted payment page to enter your credit card details safely. Once payment is completed, Stripe will redirect you back to LakePass to finalize your booking.
        </p>

        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/30 p-3 text-[10px] text-emerald-700 dark:bg-emerald-950/10 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Payments are encrypted end-to-end and processed securely by Stripe.</span>
        </div>
      </div>

      {/* Pay CTA */}
      <button
        onClick={handlePay}
        disabled={mutation.isPending}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-primary/95 cursor-pointer disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
      >
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {mutation.isPending ? "Redirecting..." : "Proceed to Stripe Payment"}
      </button>
    </div>
  );
}
