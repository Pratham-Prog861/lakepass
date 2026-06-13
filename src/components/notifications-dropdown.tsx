"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Anchor, Calendar, Info, Check, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "booking" | "info" | "general";
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync read notification IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lakepass_read_notifications");
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load read notifications:", e);
    }
  }, []);

  const saveReadIds = (newIds: string[]) => {
    setReadIds(newIds);
    try {
      localStorage.setItem("lakepass_read_notifications", JSON.stringify(newIds));
    } catch (e) {
      console.error("Failed to save read notifications:", e);
    }
  };

  // Fetch actual bookings from the bookings API
  const { data, isLoading } = useQuery({
    queryKey: ["user-bookings-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
    refetchInterval: 15000, // Poll every 15 seconds to catch new bookings
    retry: false,
  });

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format bookings into notification items
  const bookingNotifications: NotificationItem[] = (data?.bookings || []).map((booking: any) => {
    const isRead = readIds.includes(booking.id);
    const start = new Date(booking.startTime);
    const dateStr = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    
    const timeStr = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const statusTitle = booking.status === "pending" 
      ? "Booking Pending" 
      : booking.status === "confirmed" 
      ? "Booking Confirmed" 
      : booking.status === "completed" 
      ? "Booking Completed" 
      : "Booking Cancelled";

    // Format relative time for creation
    const createdDate = new Date(booking.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 65));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let timeAgo = "Just now";
    if (diffDays > 0) {
      timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffMins > 0) {
      timeAgo = `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    }

    return {
      id: booking.id,
      title: statusTitle,
      description: `Your ${booking.boat?.name || "boat"} rental at ${booking.boat?.marina?.name || "local marina"} is set for ${dateStr} at ${timeStr}.`,
      time: timeAgo,
      read: isRead,
      type: "booking",
    };
  });

  // Always append a friendly welcome notification
  const welcomeNotification: NotificationItem = {
    id: "welcome",
    title: "Welcome to LakePass!",
    description: "Explore nearby boat fleets, view live lake weather conditions, and book your next water ride.",
    time: "Welcome",
    read: readIds.includes("welcome"),
    type: "general",
  };

  const notifications = [...bookingNotifications, welcomeNotification];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => setIsOpen(!isOpen);

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIds = notifications.map((n) => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    saveReadIds(newReadIds);
  };

  const handleMarkAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      saveReadIds([...readIds, id]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={handleToggle}
        className="relative rounded-full p-1.5 text-zinc-550 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-zinc-100 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800/60">
            <h3 className="font-heading text-xs font-extrabold text-zinc-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/40">
            {isLoading && notifications.length === 1 ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : null}

            {notifications.map((n) => {
              const Icon = n.type === "booking" ? Calendar : n.type === "info" ? Info : Anchor;
              return (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${
                    !n.read ? "bg-zinc-50/40 dark:bg-zinc-800/10" : ""
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    n.type === "booking" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold text-zinc-900 dark:text-white truncate ${
                        !n.read ? "font-extrabold" : ""
                      }`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-550 dark:text-zinc-400 leading-normal line-clamp-2 text-left">
                      {n.description}
                    </p>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 text-left">{n.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsDropdown;
