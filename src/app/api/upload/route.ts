import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAndSyncUser } from "@/lib/auth-sync";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await checkAndSyncUser();

    // Verify user role
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser || dbUser.role !== "marina_owner") {
      return NextResponse.json({ error: "Forbidden - Owner role required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get("bucket") || "boat-images";

    // Validate bucket name
    const validBuckets = ["boat-images", "marina-images", "profile-images"];
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json({ error: "Invalid storage bucket name" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to ArrayBuffer and then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const uniqueId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const filename = `${uniqueId}.${fileExt}`;

    // Ensure bucket exists in Supabase, create it if it doesn't
    try {
      const { data: bucketList, error: listError } = await supabase.storage.listBuckets();
      if (!listError && bucketList) {
        const bucketExists = bucketList.some((b) => b.id === bucket);
        if (!bucketExists) {
          console.log(`Bucket "${bucket}" not found in Supabase. Creating it programmatically...`);
          const { error: createError } = await supabase.storage.createBucket(bucket, {
            public: true,
          });
          if (createError) {
            console.error(`Failed to create bucket "${bucket}":`, createError);
          } else {
            console.log(`Successfully created public bucket "${bucket}"!`);
          }
        }
      }
    } catch (e) {
      console.warn("Auto-bucket check/creation failed:", e);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
        duplex: "half", // Required for node fetch stream compatibility
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return NextResponse.json({ error: "Failed to resolve public URL" }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
