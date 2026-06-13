import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users, marinas, boats } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { checkAndSyncUser } from "@/lib/auth-sync";
import { uploadRemoteImageToSupabase } from "@/lib/supabase-upload";

const updateBoatSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  type: z.string().min(1, "Boat type is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  pricePerHour: z.number().min(0, "Price must be positive"), // price in cents
  imageUrl: z.string().url("Invalid image URL").or(z.string().length(0)).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await checkAndSyncUser();

    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the boat
    const boat = await db.query.boats.findFirst({
      where: eq(boats.id, id),
    });

    if (!boat) {
      return NextResponse.json({ error: "Boat not found" }, { status: 404 });
    }

    return NextResponse.json({ boat });
  } catch (error) {
    console.error("GET /api/boats/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get owner's marinas to verify ownership
    const ownerMarinas = await db.query.marinas.findMany({
      where: eq(marinas.ownerId, dbUser.id),
      columns: { id: true },
    });
    const marinaIds = ownerMarinas.map((m) => m.id);

    // Fetch the boat and check if it belongs to one of the owner's marinas
    const existingBoat = await db.query.boats.findFirst({
      where: eq(boats.id, id),
    });

    if (!existingBoat || !marinaIds.includes(existingBoat.marinaId)) {
      return NextResponse.json({ error: "Boat not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const result = updateBoatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    let finalImageUrl = result.data.imageUrl || null;
    if (finalImageUrl) {
      const supabaseUrl = await uploadRemoteImageToSupabase(finalImageUrl, "boat-images");
      if (supabaseUrl) {
        finalImageUrl = supabaseUrl;
      }
    }

    const [updatedBoat] = await db
      .update(boats)
      .set({
        name: result.data.name,
        description: result.data.description,
        type: result.data.type,
        capacity: result.data.capacity,
        pricePerHour: Math.round(result.data.pricePerHour),
        imageUrl: finalImageUrl,
      })
      .where(eq(boats.id, id))
      .returning();

    return NextResponse.json({ boat: updatedBoat });
  } catch (error) {
    console.error("PUT /api/boats/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get owner's marinas to verify ownership
    const ownerMarinas = await db.query.marinas.findMany({
      where: eq(marinas.ownerId, dbUser.id),
      columns: { id: true },
    });
    const marinaIds = ownerMarinas.map((m) => m.id);

    // Fetch the boat
    const existingBoat = await db.query.boats.findFirst({
      where: eq(boats.id, id),
    });

    if (!existingBoat || !marinaIds.includes(existingBoat.marinaId)) {
      return NextResponse.json({ error: "Boat not found or unauthorized" }, { status: 404 });
    }

    await db.delete(boats).where(eq(boats.id, id));

    return NextResponse.json({ success: true, message: "Boat deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/boats/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
