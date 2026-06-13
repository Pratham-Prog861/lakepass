import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { syncClerkAvatarToSupabase } from "./supabase-upload";

export async function checkAndSyncUser() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    // Check if user exists in our database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (existingUser) {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (email) {
          const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;
          const role = (clerkUser.publicMetadata?.role as "marina_owner" | "consumer") || "consumer";
          
          let avatarUrl = existingUser.avatarUrl;
          const clerkAvatarUrl = clerkUser.imageUrl || null;

          if (clerkAvatarUrl) {
            const hash = crypto.createHash("md5").update(clerkAvatarUrl).digest("hex");
            const isAvatarSynced = existingUser.avatarUrl && existingUser.avatarUrl.includes(`avatar-${userId}-${hash}`);
            
            if (!isAvatarSynced) {
              const syncedUrl = await syncClerkAvatarToSupabase(userId, clerkAvatarUrl);
              if (syncedUrl) {
                avatarUrl = syncedUrl;
              }
            }
          } else {
            avatarUrl = null;
          }

          if (
            existingUser.email !== email ||
            existingUser.fullName !== fullName ||
            existingUser.avatarUrl !== avatarUrl ||
            existingUser.role !== role
          ) {
            const [updatedUser] = await db
              .update(users)
              .set({
                email,
                fullName,
                avatarUrl,
                role,
                updatedAt: new Date(),
              })
              .where(eq(users.clerkId, userId))
              .returning();
            return updatedUser;
          }
        }
      }
      return existingUser;
    }

    // Fetch full user details from Clerk on the server (first time sync)
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error(`User ${userId} does not have a primary email address in Clerk.`);
      return null;
    }

    const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;
    let avatarUrl = null;
    if (clerkUser.imageUrl) {
      avatarUrl = await syncClerkAvatarToSupabase(userId, clerkUser.imageUrl);
    }
    const role = (clerkUser.publicMetadata?.role as "marina_owner" | "consumer") || "consumer";

    // Insert the user into our database.
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: userId,
        email,
        fullName,
        avatarUrl,
        role,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
          fullName,
          avatarUrl,
          role,
          updatedAt: new Date(),
        },
      })
      .returning();

    return newUser;
  } catch (error) {
    console.error("Error in checkAndSyncUser:", error);
    return null;
  }
}

