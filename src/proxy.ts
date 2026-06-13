import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/boats/(.*)", // Allow viewing boats without logging in
  "/api/webhooks/clerk(.*)", // Clerk webhooks if needed
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.[\\w]+$|_next/image|_next/static|favicon.ico|sitemap.xml|robots.txt).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
