import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { bookings, users, boats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";


export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe Signature" }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured.");
      return NextResponse.json({ error: "Webhook Configuration Error" }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle completed checkout session
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        // Update booking status in database to confirmed
        const [updatedBooking] = await db
          .update(bookings)
          .set({ status: "confirmed" })
          .where(eq(bookings.id, bookingId))
          .returning();

        if (updatedBooking) {
          // Fetch booking with boat and customer relations to emit a rich realtime event
          const bookingDetails = await db.query.bookings.findFirst({
            where: eq(bookings.id, updatedBooking.id),
            with: {
              boat: true,
              user: true,
            },
          });

          // Emit Supabase Realtime Broadcast event to all connected clients (Admin Dashboard)
          try {
            const { supabase } = await import("@/lib/supabase");
            const channel = supabase.channel("realtime_bookings");
            channel.subscribe((status, err) => {
              if (err) {
                console.error("Failed to subscribe to Supabase channel:", err);
                return;
              }
              if (status === "SUBSCRIBED") {
                console.log(`[Webhook] Emitting booking:confirmed event for booking: ${bookingId}`);
                channel.send({
                  type: "broadcast",
                  event: "booking:confirmed",
                  payload: {
                    id: updatedBooking.id,
                    customerName: bookingDetails?.user?.fullName || "Guest",
                    boatName: bookingDetails?.boat?.name || "Boat",
                    amount: (updatedBooking.totalAmount / 100).toFixed(2),
                    date: new Date(updatedBooking.startTime).toLocaleDateString(),
                  },
                }).then(() => {
                  supabase.removeChannel(channel);
                }).catch((sendErr) => {
                  console.error("Failed to send broadcast event via Supabase:", sendErr);
                });
              }
            });
          } catch (supabaseErr) {
            console.error("Failed to emit Supabase Realtime event in Webhook:", supabaseErr);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
