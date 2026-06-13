import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users, marinas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { checkAndSyncUser } from "@/lib/auth-sync";

const createMarinaSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180),
});

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await checkAndSyncUser();

    // Fetch user details
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Forbidden - User record not found" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const getAll = searchParams.get("all") === "true";

    // Consumers or explicit request for all
    if (dbUser.role === "consumer" || getAll) {
      const list = await db.query.marinas.findMany({
        orderBy: (marinas, { desc }) => [desc(marinas.createdAt)],
        with: {
          boats: true,
        },
      });
      return NextResponse.json({ marinas: list });
    }

    // Owner specific query
    if (dbUser.role !== "marina_owner") {
      return NextResponse.json({ error: "Forbidden - Owner role required" }, { status: 403 });
    }

    const list = await db.query.marinas.findMany({
      where: eq(marinas.ownerId, dbUser.id),
      orderBy: (marinas, { desc }) => [desc(marinas.createdAt)],
      with: {
        boats: true,
      },
    });

    return NextResponse.json({ marinas: list });
  } catch (error) {
    console.error("GET /api/marinas error:", error);
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

    // Fetch user and ensure role is marina_owner
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser || dbUser.role !== "marina_owner") {
      return NextResponse.json({ error: "Forbidden - Owner role required" }, { status: 403 });
    }

    const body = await req.json();
    const result = createMarinaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const [newMarina] = await db
      .insert(marinas)
      .values({
        ownerId: dbUser.id,
        name: result.data.name,
        description: result.data.description,
        latitude: result.data.latitude,
        longitude: result.data.longitude,
      })
      .returning();

    return NextResponse.json({ marina: newMarina }, { status: 201 });
  } catch (error) {
    console.error("POST /api/marinas error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
