import { ArrowLeft, HelpCircle, Mail, Phone, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
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
          Help & Support
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">How can we help?</h3>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
          Have issues with a boat booking or marina access? Get in touch with our local Texas & Lake Michigan support agents.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <a
          href="mailto:support@lakepass.com"
          className="flex items-center gap-3.5 px-4 py-3.5 border-b border-zinc-50 hover:bg-zinc-50 dark:border-zinc-800/40 dark:hover:bg-zinc-800 transition-colors"
        >
          <Mail className="h-5 w-5 text-primary" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Email Support</span>
            <span className="text-[10px] text-zinc-450">support@lakepass.com</span>
          </div>
        </a>
        
        <a
          href="tel:+15125550199"
          className="flex items-center gap-3.5 px-4 py-3.5 border-b border-zinc-50 hover:bg-zinc-50 dark:border-zinc-800/40 dark:hover:bg-zinc-800 transition-colors"
        >
          <Phone className="h-5 w-5 text-primary" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Phone Support</span>
            <span className="text-[10px] text-zinc-450">+1 (512) 555-0199 (Austin, TX office)</span>
          </div>
        </a>

        <div className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <MessageSquare className="h-5 w-5 text-zinc-400" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Live Chat</span>
            <span className="text-[10px] text-zinc-400">Available Monday to Friday, 9am - 5pm.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
