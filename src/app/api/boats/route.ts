import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users, marinas, boats } from "@/db/schema";
import { eq, and, inArray, like, sql } from "drizzle-orm";
import { z } from "zod";
import { checkAndSyncUser } from "@/lib/auth-sync";
import { uploadRemoteImageToSupabase } from "@/lib/supabase-upload";

const createBoatSchema = z.object({
  marinaId: z.string().uuid("Invalid Marina ID"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  type: z.string().min(1, "Boat type is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  pricePerHour: z.number().min(0, "Price must be positive"), // price in cents
  imageUrl: z.string().url("Invalid image URL").or(z.string().length(0)).optional(),
});

export async function GET(req: NextRequest) {
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

    // Get all marinas owned by this user
    const ownerMarinas = await db.query.marinas.findMany({
      where: eq(marinas.ownerId, dbUser.id),
      columns: { id: true },
    });

    const marinaIds = ownerMarinas.map((m) => m.id);

    if (marinaIds.length === 0) {
      return NextResponse.json({ boats: [] });
    }

    // Read query parameters for searching/filtering
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const selectedMarinaId = searchParams.get("marinaId") || "";

    // Build query conditions
    const conditions = [];

    // Enforce that we only retrieve boats from the owner's marinas
    if (selectedMarinaId && marinaIds.includes(selectedMarinaId)) {
      conditions.push(eq(boats.marinaId, selectedMarinaId));
    } else {
      conditions.push(inArray(boats.marinaId, marinaIds));
    }

    if (search) {
      conditions.push(like(boats.name, `%${search}%`));
    }

    if (type && type !== "all") {
      conditions.push(eq(boats.type, type));
    }

    const list = await db.query.boats.findMany({
      where: and(...conditions),
      orderBy: (boats, { desc }) => [desc(boats.createdAt)],
      with: {
        marina: {
          columns: { name: true },
        },
      },
    });

    return NextResponse.json({ boats: list });
  } catch (error) {
    console.error("GET /api/boats error:", error);
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

    if (!dbUser || dbUser.role !== "marina_owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = createBoatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    // Verify the marina belongs to this owner
    const marinaCheck = await db.query.marinas.findFirst({
      where: and(
        eq(marinas.id, result.data.marinaId),
        eq(marinas.ownerId, dbUser.id)
      ),
    });

    if (!marinaCheck) {
      return NextResponse.json(
        { error: { marinaId: ["Marina not found or unauthorized"] } },
        { status: 400 }
      );
    }

    let finalImageUrl = result.data.imageUrl || null;
    if (finalImageUrl) {
      const supabaseUrl = await uploadRemoteImageToSupabase(finalImageUrl, "boat-images");
      if (supabaseUrl) {
        finalImageUrl = supabaseUrl;
      }
    }

    const [newBoat] = await db
      .insert(boats)
      .values({
        marinaId: result.data.marinaId,
        name: result.data.name,
        description: result.data.description,
        type: result.data.type,
        capacity: result.data.capacity,
        pricePerHour: Math.round(result.data.pricePerHour), // Price in cents
        imageUrl: finalImageUrl,
      })
      .returning();

    return NextResponse.json({ boat: newBoat }, { status: 201 });
  } catch (error) {
    console.error("POST /api/boats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
