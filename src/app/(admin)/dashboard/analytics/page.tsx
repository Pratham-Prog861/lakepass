"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";
import {
  Loader2,
  TrendingUp,
  PieChart as PieIcon,
  DollarSign,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface RevenueItem {
  name: string;
  revenue: number;
}

interface UtilizationItem {
  name: string;
  value: number;
}

interface MonthlyItem {
  name: string;
  bookings: number;
  revenue: number;
}

interface AnalyticsData {
  revenueData: RevenueItem[];
  utilizationData: UtilizationItem[];
  monthlyGrowth: MonthlyItem[];
}

const COLORS = ["#f97316", "#0ea5e9", "#6366f1", "#10b981", "#8b5cf6", "#ec4899"];

export default function AdminAnalyticsPage() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  // Socket listener for real-time invalidation
  useEffect(() => {
    if (!socket) return;

    socket.on("booking:confirmed", (payload: { customerName: string; boatName: string; amount: string }) => {
      console.log("[Socket] Received booking:confirmed event in Analytics:", payload);
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-xs text-zinc-900">New Booking Confirmed!</span>
          <span className="text-[10px] text-zinc-500">
            Analytics updating in real-time...
          </span>
        </div>,
        {
          icon: <Award className="h-5 w-5 text-emerald-500" />,
          duration: 4000,
        }
      );

      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    });

    return () => {
      socket.off("booking:confirmed");
    };
  }, [socket, queryClient]);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs font-semibold text-zinc-500">Loading analytics...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/10 p-6 text-center text-xs font-semibold text-red-600 dark:border-red-950/20 dark:bg-red-950/10">
        Failed to load analytics reports. Please reload.
      </div>
    );
  }

  const { revenueData, utilizationData, monthlyGrowth } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Analytics & Reports
        </h1>
        <p className="text-sm text-zinc-500">Monitor your revenue, bookings, and fleet utilization trends in real-time.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Revenue Bar Chart */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Revenue</span>
              <h3 className="font-heading text-base font-bold text-zinc-800 dark:text-zinc-200">
                Weekly Revenue Performance
              </h3>
            </div>
            <div className="rounded-xl bg-orange-50 p-2 text-primary dark:bg-orange-950/25">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="h-72 w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">No revenue data available</div>
            )}
          </div>
        </div>

        {/* Fleet Utilization Pie Chart */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Fleet Occupancy</span>
              <h3 className="font-heading text-base font-bold text-zinc-800 dark:text-zinc-200">
                Boat Utilization Rates
              </h3>
            </div>
            <div className="rounded-xl bg-sky-50 p-2 text-sky-500 dark:bg-sky-950/25">
              <PieIcon className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="h-72 w-full">
            {utilizationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Avg Utilization"]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #e4e4e7",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                      fontSize: "11px",
                      color: "#18181b"
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "10px", marginTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">No utilization data available</div>
            )}
          </div>
        </div>

        {/* Monthly Performance Growth Line Chart */}
        <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Growth Trends</span>
              <h3 className="font-heading text-base font-bold text-zinc-800 dark:text-zinc-200">
                Monthly Performance & Bookings Growth
              </h3>
            </div>
            <div className="rounded-xl bg-violet-50 p-2 text-violet-500 dark:bg-violet-950/25">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="h-80 w-full">
            {monthlyGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowth} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" className="dark:stroke-zinc-850" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#a1a1aa" />
                  <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} stroke="#a1a1aa" tickFormatter={(value) => `$${value}`} />
                  <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} stroke="#a1a1aa" tickFormatter={(value) => `${value} bkgs`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #e4e4e7",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                      fontSize: "11px",
                      color: "#18181b"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} activeDot={{ r: 6 }} name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={3} name="Bookings Count" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-400">No monthly performance data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
