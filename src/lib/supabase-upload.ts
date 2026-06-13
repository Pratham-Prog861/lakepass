import { supabase } from "./supabase";
import crypto from "crypto";

/**
 * Normalizes an image URL (e.g., Unsplash detail page) to a direct image download URL.
 */
export function getDirectImageUrl(url: string): string {
  if (!url) return url;

  try {
    // Check if the URL is an Unsplash detail webpage URL
    if (url.includes("unsplash.com/photos/")) {
      const cleanUrl = url.split("?")[0];
      const segments = cleanUrl.split("/");
      const lastSegment = segments[segments.length - 1];
      if (lastSegment) {
        const photoId = lastSegment.includes("-") 
          ? lastSegment.split("-").pop() 
          : lastSegment;
        
        if (photoId) {
          return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&q=80&w=1200`;
        }
      }
    }
  } catch (error) {
    console.error("Error normalizing image URL:", error);
  }

  return url;
}

/**
 * Downloads a remote image and uploads it to a Supabase storage bucket.
 * Returns the public URL of the uploaded image, or the original URL if the upload fails.
 */
export async function uploadRemoteImageToSupabase(
  url: string | null | undefined,
  bucket: string = "boat-images"
): Promise<string | null> {
  if (!url) return null;

  // If it's already a Supabase storage URL for this project, no need to re-upload
  if (url.includes(".supabase.co/storage/v1/object/public/")) {
    return url;
  }

  try {
    const directUrl = getDirectImageUrl(url);
    console.log(`[Supabase Upload] Fetching remote image from: ${directUrl}`);

    const response = await fetch(directUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText} (${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file extension from content-type or URL
    let fileExt = "jpg";
    if (contentType.includes("png")) fileExt = "png";
    else if (contentType.includes("webp")) fileExt = "webp";
    else if (contentType.includes("gif")) fileExt = "gif";
    else if (contentType.includes("svg")) fileExt = "svg";

    const uniqueId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const filename = `${uniqueId}.${fileExt}`;

    console.log(`[Supabase Upload] Uploading to bucket "${bucket}" as filename "${filename}"...`);

    // Ensure bucket exists in Supabase, create it if it doesn't
    try {
      const { data: bucketList, error: listError } = await supabase.storage.listBuckets();
      if (!listError && bucketList) {
        const bucketExists = bucketList.some((b) => b.id === bucket);
        if (!bucketExists) {
          console.log(`[Supabase Upload] Bucket "${bucket}" not found. Creating programmatically...`);
          await supabase.storage.createBucket(bucket, {
            public: true,
          });
        }
      }
    } catch (e) {
      console.warn("[Supabase Upload] Auto-bucket check/creation failed:", e);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType,
        duplex: "half",
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    if (publicUrlData && publicUrlData.publicUrl) {
      console.log(`[Supabase Upload] Successfully uploaded! Public URL: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    }

    return directUrl;
  } catch (error) {
    console.error(`[Supabase Upload] Failed to upload remote image (${url}) to Supabase:`, error);
    // Return the sanitized direct URL as a fallback so the image can still display
    return getDirectImageUrl(url);
  }
}

/**
 * Syncs a Clerk user avatar image to Supabase Storage.
 * Generates a deterministic filename based on the clerkId and the image URL hash.
 */
export async function syncClerkAvatarToSupabase(
  clerkId: string,
  clerkImageUrl: string | null | undefined
): Promise<string | null> {
  if (!clerkImageUrl) return null;

  try {
    const hash = crypto.createHash("md5").update(clerkImageUrl).digest("hex");
    const bucket = "profile-images";
    
    // Determine extension
    let ext = "jpg";
    if (clerkImageUrl.includes(".png") || clerkImageUrl.includes("png")) ext = "png";
    else if (clerkImageUrl.includes(".webp") || clerkImageUrl.includes("webp")) ext = "webp";
    else if (clerkImageUrl.includes(".gif") || clerkImageUrl.includes("gif")) ext = "gif";
    
    const filename = `avatar-${clerkId}-${hash}.${ext}`;
    
    // Fetch the image
    const response = await fetch(clerkImageUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Clerk avatar: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure bucket exists in Supabase
    try {
      const { data: bucketList, error: listError } = await supabase.storage.listBuckets();
      if (!listError && bucketList) {
        const bucketExists = bucketList.some((b) => b.id === bucket);
        if (!bucketExists) {
          await supabase.storage.createBucket(bucket, {
            public: true,
          });
        }
      }
    } catch (e) {
      console.warn("[Supabase Upload] Profile bucket check/creation failed:", e);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType,
        duplex: "half",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    return publicUrlData?.publicUrl || clerkImageUrl;
  } catch (error) {
    console.error(`[Supabase Upload] Failed to sync Clerk avatar to Supabase for ${clerkId}:`, error);
    return clerkImageUrl;
  }
}

