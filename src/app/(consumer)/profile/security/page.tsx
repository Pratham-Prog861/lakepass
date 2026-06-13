import { ArrowLeft, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SecurityPage() {
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
          Security & Privacy
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">Your account is fully secure</h3>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
          Authentication and session security are fully managed by Clerk. Your personal data is encrypted and kept private.
        </p>
      </div>

      <div className="flex flex-col gap-3.5 rounded-2xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Security Features</h3>
        
        <div className="flex items-start gap-2.5">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Google OAuth 2.0 Integration</span>
            <span className="text-[10px] text-zinc-450">Secure and standard sign-in using Google accounts.</span>
          </div>
        </div>
        
        <div className="flex items-start gap-2.5 border-t border-zinc-50 pt-3.5 dark:border-zinc-800/40">
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Role-Based Access Control</span>
            <span className="text-[10px] text-zinc-450">Strict route protection ensuring dashboard analytics are restricted to owners.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
