"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Map, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Bookings", href: "/bookings", icon: Calendar },
  { label: "Map", href: "/map", icon: Map },
  { label: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-16 max-w-md items-center justify-around border-t border-zinc-200 bg-white/90 px-4 pb-safe shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 md:hidden">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        // Match exact route for home, and prefix match for others
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition-colors",
              isActive
                ? "text-primary dark:text-primary-foreground font-medium"
                : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            )}
          >
            <Icon className="h-5 w-5 stroke-[2.2]" />
            <span className="text-[10px] tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
export default BottomNav;
