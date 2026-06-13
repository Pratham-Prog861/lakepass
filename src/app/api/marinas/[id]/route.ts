import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users, marinas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { checkAndSyncUser } from "@/lib/auth-sync";

const updateMarinaSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  latitude: z.number().min(-90, "Latitude must be between -90 and 90").max(90),
  longitude: z.number().min(-180, "Longitude must be between -180 and 180").max(180),
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

    if (!dbUser || dbUser.role !== "marina_owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const marina = await db.query.marinas.findFirst({
      where: and(eq(marinas.id, id), eq(marinas.ownerId, dbUser.id)),
    });

    if (!marina) {
      return NextResponse.json({ error: "Marina not found" }, { status: 404 });
    }

    return NextResponse.json({ marina });
  } catch (error) {
    console.error("GET /api/marinas/[id] error:", error);
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

    // Verify marina belongs to this owner
    const existing = await db.query.marinas.findFirst({
      where: and(eq(marinas.id, id), eq(marinas.ownerId, dbUser.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Marina not found" }, { status: 404 });
    }

    const body = await req.json();
    const result = updateMarinaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const [updatedMarina] = await db
      .update(marinas)
      .set({
        name: result.data.name,
        description: result.data.description,
        latitude: result.data.latitude,
        longitude: result.data.longitude,
      })
      .where(eq(marinas.id, id))
      .returning();

    return NextResponse.json({ marina: updatedMarina });
  } catch (error) {
    console.error("PUT /api/marinas/[id] error:", error);
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

    // Verify marina belongs to this owner
    const existing = await db.query.marinas.findFirst({
      where: and(eq(marinas.id, id), eq(marinas.ownerId, dbUser.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Marina not found or unauthorized" }, { status: 404 });
    }

    await db.delete(marinas).where(eq(marinas.id, id));

    return NextResponse.json({ success: true, message: "Marina deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/marinas/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
