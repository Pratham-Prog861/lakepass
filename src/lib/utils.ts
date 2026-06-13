import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeImageUrl(url: string | null | undefined): string {
  if (!url) return "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&q=80&w=600";

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
          return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&q=80&w=600`;
        }
      }
    }
  } catch (error) {
    console.error("Error sanitizing image URL:", error);
  }

  return url;
}
