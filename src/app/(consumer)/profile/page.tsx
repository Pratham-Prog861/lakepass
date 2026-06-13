import { auth, currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { User, LogOut, ChevronRight, LayoutDashboard, Shield, HelpCircle, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function ProfilePage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  let dbUser = null;
  if (userId) {
    dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });
  }

  const email = clerkUser?.emailAddresses[0]?.emailAddress || "user@example.com";
  const fullName = dbUser?.fullName || clerkUser?.firstName 
    ? `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim()
    : "LakePass Guest";
  const avatarUrl = dbUser?.avatarUrl || clerkUser?.imageUrl;
  const isOwner = dbUser?.role === "marina_owner";

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Profile
        </h1>
        <p className="text-xs text-zinc-500">Manage your profile and settings</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* User profile card & action column */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900 md:flex-col md:text-center md:py-6">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 md:h-20 md:w-20">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                  sizes="(max-w-md) 56px, 80px"
                />
              ) : (
                <User className="m-auto h-6 w-6 text-zinc-400 md:h-10 md:w-10" />
              )}
            </div>
            <div className="flex flex-col truncate md:w-full md:items-center">
              <h2 className="truncate font-heading text-sm font-bold text-zinc-950 dark:text-white md:text-base">
                {fullName}
              </h2>
              <span className="truncate text-[10px] text-zinc-400 dark:text-zinc-500 md:text-xs">{email}</span>
              <span className="mt-1 w-max rounded-md bg-zinc-50 px-2 py-0.5 text-[9px] font-bold text-zinc-500 capitalize dark:bg-zinc-800 dark:text-zinc-400">
                Role: {dbUser?.role || "consumer"}
              </span>
            </div>
          </div>

          <SignOutButton>
            <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/20 py-3.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50/50 active:scale-98 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-955/20">
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </SignOutButton>
        </div>

        {/* Settings column */}
        <div className="md:col-span-2 flex flex-col gap-2.5">
          <h3 className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Account Settings</h3>
          
          <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800/60 dark:bg-zinc-900">
            {/* Dashboard Access for Marina Owners */}
            {isOwner && (
              <Link
                href="/dashboard"
                className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-50 transition-colors hover:bg-zinc-50 dark:border-zinc-850 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-4.5 w-4.5 text-primary" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Marina Dashboard
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </Link>
            )}

            <Link
              href="/profile/security"
              className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-50 transition-colors hover:bg-zinc-50 dark:border-zinc-850 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-4.5 w-4.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Security & Privacy
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </Link>

            <Link
              href="/support"
              className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-50 transition-colors hover:bg-zinc-50 dark:border-zinc-850 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="h-4.5 w-4.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Help & Support
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </Link>

            <Link
              href="/terms"
              className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4.5 w-4.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Terms of Service
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
