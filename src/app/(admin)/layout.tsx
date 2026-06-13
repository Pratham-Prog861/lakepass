import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Anchor, Calendar, BarChart3, Settings, Compass } from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Marinas", href: "/dashboard/marinas", icon: Compass },
  { label: "Boats", href: "/dashboard/boats", icon: Anchor },
  { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch user role from database
  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  // Strict role check: redirect if not marina_owner
  if (!dbUser || dbUser.role !== "marina_owner") {
    console.warn(`Access denied to user ${userId}: not marina_owner`);
    redirect("/");
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-primary" />
            <span className="font-heading text-base font-bold tracking-tight text-zinc-900 dark:text-white">
              LakePass Admin
            </span>
          </Link>
          <div className="flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            Owner
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
              >
                <Icon className="h-4.5 w-4.5 shrink-0 stroke-[2.2]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <UserButton />
            <div className="flex flex-col truncate">
              <span className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {dbUser.fullName || "Marina Owner"}
              </span>
              <span className="truncate text-[9px] text-zinc-400">
                {dbUser.email}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-end border-b border-zinc-200 bg-white px-8 dark:border-zinc-800 dark:bg-zinc-900">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-[11px] font-bold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Switch to Consumer App
          </Link>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
