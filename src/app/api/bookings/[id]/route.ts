import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users, bookings, boats, marinas } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkAndSyncUser } from "@/lib/auth-sync";
import { stripe } from "@/lib/stripe";

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
      return NextResponse.json({ error: "User profile not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    let booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
      with: {
        boat: {
          with: {
            marina: true,
          },
        },
        user: {
          columns: { fullName: true, email: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Auto-confirm if there's a paid Stripe session
    if (booking.status === "pending" && sessionId) {
      try {
        console.log(`[Stripe Auto-Confirm] Verifying Stripe session ${sessionId}...`);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid") {
          console.log(`[Stripe Auto-Confirm] Session paid! Updating booking ${id} to confirmed...`);
          const [updatedBooking] = await db
            .update(bookings)
            .set({ status: "confirmed" })
            .where(eq(bookings.id, id))
            .returning();

          if (updatedBooking) {
            // Update local object to return updated status
            booking.status = "confirmed";

            // Emit Supabase Realtime Broadcast event for real-time admin dashboard update
            try {
              const { supabase } = await import("@/lib/supabase");
              const channel = supabase.channel("realtime_bookings");
              channel.subscribe((status, err) => {
                if (err) {
                  console.error("Failed to subscribe to Supabase channel:", err);
                  return;
                }
                if (status === "SUBSCRIBED") {
                  console.log(`[Stripe Auto-Confirm] Emitting booking:confirmed event`);
                  channel.send({
                    type: "broadcast",
                    event: "booking:confirmed",
                    payload: {
                      id: updatedBooking.id,
                      customerName: booking.user?.fullName || "Guest",
                      boatName: booking.boat?.name || "Boat",
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
              console.error("Failed to emit Supabase Realtime event in bookings route:", supabaseErr);
            }
          }
        }
      } catch (stripeErr) {
        console.error("Stripe session check failed:", stripeErr);
      }
    }

    // Auth check: Must be the customer who booked it OR the owner of the marina where the boat is located
    const isCustomer = booking.userId === dbUser.id;
    const isMarinaOwner = dbUser.role === "marina_owner" && booking.boat?.marina?.ownerId === dbUser.id;

    if (!isCustomer && !isMarinaOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("GET /api/bookings/[id] error:", error);
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

    if (!dbUser) {
      return NextResponse.json({ error: "User profile not found" }, { status: 400 });
    }

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const status = body.status;

    if (status !== "confirmed" && status !== "cancelled") {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();

    if (updatedBooking && status === "confirmed") {
      try {
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
              console.log(`[API PUT] Emitting booking:confirmed event for booking: ${id}`);
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
          console.error("Failed to emit Supabase Realtime event in bookings PUT:", supabaseErr);
        }
      } catch (e) {
        console.error("Failed to emit socket event in bookings PUT:", e);
      }
    }

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error("PUT /api/bookings/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
