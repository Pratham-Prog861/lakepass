import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users, marinas, boats, bookings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { checkAndSyncUser } from "@/lib/auth-sync";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await checkAndSyncUser();

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser || dbUser.role !== "marina_owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get owner's marinas
    const ownerMarinas = await db.query.marinas.findMany({
      where: eq(marinas.ownerId, dbUser.id),
      columns: { id: true },
    });
    const marinaIds = ownerMarinas.map((m) => m.id);

    if (marinaIds.length === 0) {
      return NextResponse.json({
        revenueData: [],
        utilizationData: [],
        monthlyGrowth: [],
      });
    }

    // Get owner's boats
    const ownerBoats = await db.query.boats.findMany({
      where: inArray(boats.marinaId, marinaIds),
    });
    const boatIds = ownerBoats.map((b) => b.id);

    if (boatIds.length === 0) {
      return NextResponse.json({
        revenueData: [],
        utilizationData: [],
        monthlyGrowth: [],
      });
    }

    // Get bookings
    const dbBookings = await db.query.bookings.findMany({
      where: inArray(bookings.boatId, boatIds),
    });

    // 1. Weekly Revenue (Mon-Sun)
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyRevenueMap = new Map<string, number>();

    daysOfWeek.forEach((day) => {
      weeklyRevenueMap.set(day, 0);
    });

    // Layer actual booking totals on top
    dbBookings.forEach((booking) => {
      if (booking.status === "confirmed" || booking.status === "completed") {
        const date = new Date(booking.startTime);
        const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0... to Monday=0...Sunday=6
        const dayName = daysOfWeek[dayIndex];
        const currentVal = weeklyRevenueMap.get(dayName) || 0;
        weeklyRevenueMap.set(dayName, currentVal + (booking.totalAmount / 100));
      }
    });

    const revenueData = daysOfWeek.map((day) => ({
      name: day,
      revenue: Math.round(weeklyRevenueMap.get(day) || 0),
    }));

    const utilizationData = ownerBoats.map((boat) => {
      const boatBookings = dbBookings.filter((b) => b.boatId === boat.id);
      let bookedHours = 0;
      boatBookings.forEach((b) => {
        if (b.status !== "cancelled") {
          const diff = new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
          bookedHours += diff / (1000 * 60 * 60);
        }
      });
      // Assume 30 days operating capacity of 8 hours/day = 240 hours
      const utilizationVal = Math.min(100, (bookedHours / 240) * 100);
      return {
        name: boat.name,
        value: Math.round(utilizationVal),
      };
    });

    // 3. Monthly Growth over last 6 months (based on actual database bookings)
    const monthlyDataMap = new Map<string, { bookings: number; revenue: number }>();
    
    // Initialize last 6 months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    months.forEach((m) => monthlyDataMap.set(m, { bookings: 0, revenue: 0 }));

    dbBookings.forEach((booking) => {
      if (booking.status === "confirmed" || booking.status === "completed") {
        const date = new Date(booking.startTime);
        const monthName = date.toLocaleString("en-US", { month: "short" }); // e.g. "Jun"
        if (monthlyDataMap.has(monthName)) {
          const current = monthlyDataMap.get(monthName)!;
          monthlyDataMap.set(monthName, {
            bookings: current.bookings + 1,
            revenue: current.revenue + (booking.totalAmount / 100),
          });
        }
      }
    });

    const monthlyGrowth = months.map((month) => {
      const data = monthlyDataMap.get(month)!;
      return {
        name: month,
        bookings: data.bookings,
        revenue: Math.round(data.revenue),
      };
    });

    return NextResponse.json({
      revenueData,
      utilizationData,
      monthlyGrowth,
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
