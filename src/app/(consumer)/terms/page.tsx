import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 py-5 max-w-md mx-auto md:max-w-2xl md:py-8">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm border border-zinc-150 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <h1 className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-white md:text-xl">
          Terms of Service
        </h1>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm text-left">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
          <FileText className="h-5 w-5" />
        </div>
        
        <div className="space-y-4 text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">
          <section>
            <h3 className="font-bold text-zinc-850 dark:text-zinc-200 text-sm mb-1.5">1. Acceptance of Terms</h3>
            <p>
              By accessing and using LakePass, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.
            </p>
          </section>

          <section className="border-t border-zinc-50 pt-4 dark:border-zinc-800/40">
            <h3 className="font-bold text-zinc-850 dark:text-zinc-200 text-sm mb-1.5">2. Booking and Rental Policies</h3>
            <p>
              All boat rentals require a valid booking, payment authorization, and adherence to safety guidelines set by the marina managers. Operators must possess any necessary licenses required by local state laws.
            </p>
          </section>

          <section className="border-t border-zinc-50 pt-4 dark:border-zinc-800/40">
            <h3 className="font-bold text-zinc-850 dark:text-zinc-200 text-sm mb-1.5">3. Cancellation & Refunds</h3>
            <p>
              Cancellations made 24 hours prior to the start time are eligible for a full refund. Cancellations due to severe weather constraints will be rescheduled or refunded at the marina owner's discretion.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
