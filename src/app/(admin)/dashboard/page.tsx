"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { Anchor, Calendar, DollarSign, Percent, TrendingUp, Loader2, Award } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface RevenueItem {
  name: string;
  revenue: number;
}

interface AnalyticsData {
  revenueData: RevenueItem[];
}

interface Stats {
  totalRevenue: string;
  activeBookings: number;
  totalBoats: number;
  utilizationRate: string;
}

interface RecentActivity {
  id: string;
  customer: string;
  boat: string;
  date: string;
  amount: string;
  status: string;
}

interface DashboardData {
  stats: Stats;
  recentActivity: RecentActivity[];
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  // Fetch actual statistics from database
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
  });

  // Fetch actual weekly revenue data for the chart
  const { data: analyticsData } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  // Connect to Socket.IO and listen for booking:confirmed
  useEffect(() => {
    if (!socket) return;

    socket.on("booking:confirmed", (payload: { customerName: string; boatName: string; amount: string }) => {
      console.log("[Socket] Received booking:confirmed event:", payload);
      
      // Trigger instant toast notification
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-xs text-zinc-900">New Booking Confirmed!</span>
          <span className="text-[10px] text-zinc-500">
            {payload.customerName} booked {payload.boatName} (${payload.amount})
          </span>
        </div>,
        {
          icon: <Award className="h-5 w-5 text-emerald-500" />,
          duration: 6000,
        }
      );

      // Invalidate queries to trigger react-query reload in the background instantly!
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    });

    return () => {
      socket.off("booking:confirmed");
    };
  }, [socket, queryClient]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/10 p-6 text-center text-xs font-semibold text-red-600 dark:border-red-950/20 dark:bg-red-950/10">
        Failed to load dashboard metrics. Please reload.
      </div>
    );
  }

  const { stats, recentActivity } = data;

  const statsList = [
    {
      label: "Total Revenue",
      value: stats.totalRevenue,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      iconColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
    },
    {
      label: "Active Bookings",
      value: stats.activeBookings,
      change: "+4.2%",
      trend: "up",
      icon: Calendar,
      iconColor: "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400",
    },
    {
      label: "Total Boats",
      value: stats.totalBoats,
      change: "0.0%",
      trend: "flat",
      icon: Anchor,
      iconColor: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400",
    },
    {
      label: "Utilization Rate",
      value: stats.utilizationRate,
      change: "+8.1%",
      trend: "up",
      icon: Percent,
      iconColor: "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Title */}
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500">Welcome back! Here is a summary of your marina today.</p>
      </div>

      {/* Onboarding Guide if no boats exist */}
      {stats.totalBoats === 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/5 p-6 dark:border-amber-950/25 dark:bg-amber-950/5">
          <h3 className="font-heading text-sm font-bold text-amber-800 dark:text-amber-400">
            Let's Set Up Your Marina
          </h3>
          <p className="text-xs text-zinc-500 leading-normal max-w-xl">
            You are ready to go! To receive bookings, you must first create a **Marina Location** and then add at least one **Boat Profile**.
          </p>
          <div className="mt-1.5 flex gap-3">
            <Link
              href="/dashboard/marinas/new"
              className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
            >
              1. Add Marina
            </Link>
            <Link
              href="/dashboard/boats/new"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            >
              2. Add Boat
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsList.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">{stat.label}</span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                  {stat.value}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-xs font-bold ${
                    stat.trend === "up"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-500"
                  }`}
                >
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Layout for Analytics & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Analytics Chart Skeleton */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h3 className="font-heading text-sm font-bold text-zinc-950 dark:text-white">
                Revenue Overview
              </h3>
              <span className="text-[10px] text-zinc-400">Weekly sales tracking</span>
            </div>
            <select className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-bold text-zinc-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          {/* Real Bar Chart */}
          <div className="h-60 w-full mt-4">
            {analyticsData?.revenueData && analyticsData.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" className="dark:stroke-zinc-850" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#a1a1aa" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#a1a1aa" tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    formatter={(value) => [`$${value}`, "Revenue"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #e4e4e7",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                      fontSize: "11px",
                      color: "#18181b"
                    }}
                  />
                  <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-zinc-950 dark:text-white">
              Recent Activity
            </h3>
            <Link
              href="/dashboard/bookings"
              className="text-[10px] font-semibold text-primary hover:underline"
            >
              See All
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b border-zinc-50 pb-3 last:border-0 last:pb-0 dark:border-zinc-850"
              >
                <div className="flex flex-col gap-1 truncate">
                  <span className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {activity.customer}
                  </span>
                  <span className="truncate text-[10px] text-zinc-400">
                    {activity.boat} • {activity.date}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                    {activity.amount}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[8px] font-bold capitalize ${
                      activity.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : activity.status === "pending"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                          : activity.status === "completed"
                            ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350"
                            : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}

            {recentActivity.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
                <Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                <span className="mt-2 text-[10px]">No recent reservations</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
