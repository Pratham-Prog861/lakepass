import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users, marinas, boats, bookings } from "@/db/schema";
import { eq, inArray, sum, sql, and } from "drizzle-orm";
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
        stats: {
          totalRevenue: 0,
          activeBookings: 0,
          totalBoats: 0,
          utilizationRate: 0,
        },
        recentActivity: [],
      });
    }

    // Get owner's boats
    const ownerBoats = await db.query.boats.findMany({
      where: inArray(boats.marinaId, marinaIds),
      columns: { id: true, name: true },
    });
    const boatIds = ownerBoats.map((b) => b.id);

    if (boatIds.length === 0) {
      return NextResponse.json({
        stats: {
          totalRevenue: 0,
          activeBookings: 0,
          totalBoats: 0,
          utilizationRate: 0,
        },
        recentActivity: [],
      });
    }

    // 1. Total Revenue (sum of totalAmount where status is confirmed)
    const revenueQuery = await db
      .select({ val: sum(bookings.totalAmount) })
      .from(bookings)
      .where(
        and(
          inArray(bookings.boatId, boatIds),
          eq(bookings.status, "confirmed")
        )
      );
    const totalRevenueCents = Number(revenueQuery[0]?.val || 0);
    const totalRevenue = totalRevenueCents / 100;

    // 2. Active Bookings (count of bookings where status is confirmed/pending and endTime is in the future)
    const activeBookingsQuery = await db
      .select({ val: sql<number>`count(${bookings.id})::int` })
      .from(bookings)
      .where(
        and(
          inArray(bookings.boatId, boatIds),
          inArray(bookings.status, ["confirmed", "pending"])
        )
      );
    const activeBookings = activeBookingsQuery[0]?.val || 0;

    // 3. Total Boats
    const totalBoats = boatIds.length;

    // 4. Utilization rate (calculated from actual booking hours / operating capacity hours)
    // Assume 30 days operating capacity of 8 hours/day per boat = 240 hours
    let totalBookedHours = 0;
    const allBookings = await db.query.bookings.findMany({
      where: and(
        inArray(bookings.boatId, boatIds),
        inArray(bookings.status, ["confirmed", "completed"])
      )
    });
    allBookings.forEach((b) => {
      const diff = new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
      totalBookedHours += diff / (1000 * 60 * 60);
    });
    const totalCapacityHours = totalBoats * 240;
    const utilizationRateVal = totalCapacityHours > 0 
      ? Math.min(100, (totalBookedHours / totalCapacityHours) * 100) 
      : 0;
    const utilizationRate = `${utilizationRateVal.toFixed(1)}%`;

    // 5. Recent Activity (latest 5 bookings)
    const recentActivityQuery = await db.query.bookings.findMany({
      where: inArray(bookings.boatId, boatIds),
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
      limit: 5,
      with: {
        boat: {
          columns: { name: true },
        },
        user: {
          columns: { fullName: true },
        },
      },
    });

    const recentActivity = recentActivityQuery.map((act) => ({
      id: act.id,
      customer: act.user?.fullName || "Guest",
      boat: act.boat?.name || "Boat",
      date: new Date(act.createdAt).toLocaleDateString(),
      amount: `$${(act.totalAmount / 100).toFixed(2)}`,
      status: act.status,
    }));

    return NextResponse.json({
      stats: {
        totalRevenue: `$${totalRevenue.toFixed(2)}`,
        activeBookings,
        totalBoats,
        utilizationRate,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
