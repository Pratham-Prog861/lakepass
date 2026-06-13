import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users, bookings, boats, marinas } from "@/db/schema";
import { eq, and, or, inArray, lte, gte, lt, gt } from "drizzle-orm";
import { z } from "zod";
import { checkAndSyncUser } from "@/lib/auth-sync";

const createBookingSchema = z.object({
  boatId: z.string().uuid("Invalid Boat ID"),
  startTime: z.string().datetime("Invalid Start Time"),
  endTime: z.string().datetime("Invalid End Time"),
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await checkAndSyncUser();

    // Get database user
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all bookings for this user
    const list = await db.query.bookings.findMany({
      where: eq(bookings.userId, dbUser.id),
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
      with: {
        boat: {
          with: {
            marina: {
              columns: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ bookings: list });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await checkAndSyncUser();

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User profile not synced" }, { status: 400 });
    }

    const body = await req.json();
    const result = createBookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const start = new Date(result.data.startTime);
    const end = new Date(result.data.endTime);

    if (start <= new Date()) {
      return NextResponse.json({ error: { startTime: ["Start time must be in the future"] } }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: { endTime: ["End time must be after start time"] } }, { status: 400 });
    }

    // Fetch boat details
    const boat = await db.query.boats.findFirst({
      where: eq(boats.id, result.data.boatId),
    });

    if (!boat) {
      return NextResponse.json({ error: "Boat not found" }, { status: 404 });
    }

    // Check for double bookings (overlaps)
    // Overlap condition: existing.startTime < new.endTime AND existing.endTime > new.startTime
    // and status is either confirmed or pending (still active)
    const overlaps = await db.query.bookings.findMany({
      where: and(
        eq(bookings.boatId, boat.id),
        inArray(bookings.status, ["confirmed", "pending"]),
        lt(bookings.startTime, end),
        gt(bookings.endTime, start)
      ),
    });

    if (overlaps.length > 0) {
      return NextResponse.json(
        { error: "This boat is already booked during your selected time slot." },
        { status: 409 }
      );
    }

    // Calculate total pricing based on duration (hourly rate)
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60))); // Minimum 1 hour
    const totalAmount = diffHours * boat.pricePerHour;

    // Create the pending booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        boatId: boat.id,
        userId: dbUser.id,
        startTime: start,
        endTime: end,
        totalAmount,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ booking: newBooking }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
