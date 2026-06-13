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
      return NextResponse.json({ bookings: [] });
    }

    // Get owner's boats
    const ownerBoats = await db.query.boats.findMany({
      where: inArray(boats.marinaId, marinaIds),
      columns: { id: true },
    });
    const boatIds = ownerBoats.map((b) => b.id);

    if (boatIds.length === 0) {
      return NextResponse.json({ bookings: [] });
    }

    // Get bookings for these boats
    const list = await db.query.bookings.findMany({
      where: inArray(bookings.boatId, boatIds),
      orderBy: (bookings, { desc }) => [desc(bookings.createdAt)],
      with: {
        boat: {
          with: {
            marina: {
              columns: { name: true },
            },
          },
        },
        user: {
          columns: { fullName: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ bookings: list });
  } catch (error) {
    console.error("GET /api/admin/bookings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
