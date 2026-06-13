import { UserButton } from "@clerk/nextjs";
import BottomNav from "@/components/bottom-nav";
import Link from "next/link";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-zinc-200 bg-zinc-50 shadow-md dark:border-zinc-800 dark:bg-zinc-950 md:max-w-7xl md:border-none md:shadow-none">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-100 bg-white/95 px-4 shadow-sm backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/95 md:h-16 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-heading text-lg font-bold tracking-tight text-primary md:text-xl">
            LakePass
          </Link>
          
          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-xs font-bold text-zinc-650 hover:text-primary dark:text-zinc-350 dark:hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/bookings" className="text-xs font-bold text-zinc-650 hover:text-primary dark:text-zinc-350 dark:hover:text-primary transition-colors">
              Bookings
            </Link>
            <Link href="/map" className="text-xs font-bold text-zinc-650 hover:text-primary dark:text-zinc-350 dark:hover:text-primary transition-colors">
              Lake Map
            </Link>
            <Link href="/profile" className="text-xs font-bold text-zinc-650 hover:text-primary dark:text-zinc-350 dark:hover:text-primary transition-colors">
              Profile
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationsDropdown />
          <UserButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8 md:px-8 md:py-6">
        {children}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
