import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users, bookings, boats } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { checkAndSyncUser } from "@/lib/auth-sync";

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

    if (!dbUser) {
      return NextResponse.json({ error: "User profile not synced" }, { status: 400 });
    }

    const body = await req.json();
    const bookingId = body.bookingId;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Fetch booking
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        boat: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: booking.boat.name,
              description: `Rental reservation for ${new Date(booking.startTime).toLocaleDateString()}`,
            },
            unit_amount: booking.totalAmount, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        bookingId: booking.id,
      },
      success_url: `${origin}/bookings/success/${booking.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/bookings/checkout/${booking.id}`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session URL" }, { status: 550 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("POST /api/stripe/checkout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
