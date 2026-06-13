import "../lib/load-env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { uploadRemoteImageToSupabase } from "../lib/supabase-upload";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/lakepass";
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Database seeding started...");

  try {
    // 1. Clear existing data in reverse order of dependencies
    console.log("🧹 Clearing existing database tables...");
    await db.delete(schema.reviews);
    await db.delete(schema.bookings);
    await db.delete(schema.boats);
    await db.delete(schema.marinas);
    await db.delete(schema.users);

    // Upload owner avatar
    console.log("📤 Uploading owner avatar to Supabase...");
    const ownerAvatarUrl = await uploadRemoteImageToSupabase(
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      "profile-images"
    );

    // 2. Insert Mock Owner User
    console.log("👤 Creating mock owner user...");
    const [owner] = await db
      .insert(schema.users)
      .values({
        clerkId: "mock_owner_clerk_id", // For local testing
        email: "owner@lakepass.com",
        fullName: "Captain John Smith",
        avatarUrl: ownerAvatarUrl,
        role: "marina_owner",
      })
      .returning();

    // Upload consumer avatar
    console.log("📤 Uploading consumer avatar to Supabase...");
    const consumerAvatarUrl = await uploadRemoteImageToSupabase(
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      "profile-images"
    );

    // 3. Insert Mock Consumer User
    console.log("👤 Creating mock consumer user...");
    const [consumer] = await db
      .insert(schema.users)
      .values({
        clerkId: "mock_consumer_clerk_id",
        email: "consumer@lakepass.com",
        fullName: "Alice Johnson",
        avatarUrl: consumerAvatarUrl,
        role: "consumer",
      })
      .returning();

    // 4. Insert Marinas (Austin & Chicago)
    console.log("📍 Creating marinas...");
    const [sunsetHarbor] = await db
      .insert(schema.marinas)
      .values({
        ownerId: owner.id,
        name: "Sunset Harbor Marina",
        description: "The premier boat rental and launching service on Lake Travis, Austin, TX. Scenic views and premium slip services.",
        latitude: 30.3667,
        longitude: -97.9000,
      })
      .returning();

    const [grandLake] = await db
      .insert(schema.marinas)
      .values({
        ownerId: owner.id,
        name: "Grand Lake Marina",
        description: "Explore Lake Michigan from our prime Chicago harbor location. Boat storage, rental fleets, and watersports equipment.",
        latitude: 42.0000,
        longitude: -87.6000,
      })
      .returning();

    // Upload boat images to Supabase
    console.log("📤 Uploading boat images to Supabase...");
    
    const pontoonImg = await uploadRemoteImageToSupabase(
      "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=600",
      "boat-images"
    );
    const mcraftImg = await uploadRemoteImageToSupabase(
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600",
      "boat-images"
    );
    const srayImg = await uploadRemoteImageToSupabase(
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&q=80&w=600",
      "boat-images"
    );
    const wrunnerImg = await uploadRemoteImageToSupabase(
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=600",
      "boat-images"
    );

    // 5. Insert Boats
    console.log("⛵ Creating boat profiles...");
    await db.insert(schema.boats).values([
      {
        marinaId: sunsetHarbor.id,
        name: "Tahoe Sport Pontoon",
        description: "Relax in luxury on this Tahoe Sport Pontoon. Perfect for family gatherings, sunset cruises, or casual swimming trips. Features premium Bluetooth speakers, a spacious bimini top for shade, dual swim ladders, and comfortable leather seating.",
        type: "pontoon",
        capacity: 10,
        pricePerHour: 8500, // $85.00
        imageUrl: pontoonImg,
      },
      {
        marinaId: sunsetHarbor.id,
        name: "MasterCraft X24",
        description: "The absolute gold standard in wakeboarding and wakesurfing. Outfitted with high-power ballast bags, active wake shaper plates, premium tower speakers, and spacious seating.",
        type: "speedboat",
        capacity: 12,
        pricePerHour: 15000, // $150.00
        imageUrl: mcraftImg,
      },
      {
        marinaId: grandLake.id,
        name: "Sea Ray Cruiser 290",
        description: "Experience the thrill of the lake on this premium Sea Ray Cruiser. Powerful engine, deep-V hull, and premium wakeboard tower make it perfect for watersports, tubing, or fast cruising.",
        type: "speedboat",
        capacity: 8,
        pricePerHour: 12000, // $120.00
        imageUrl: srayImg,
      },
      {
        marinaId: grandLake.id,
        name: "Yamaha WaveRunner VX",
        description: "Fast, agile, and incredibly fun. The WaveRunner VX is the ultimate jet ski for speed runs, carving turns, or exploring bays.",
        type: "jetski",
        capacity: 2,
        pricePerHour: 7500, // $75.00
        imageUrl: wrunnerImg,
      },
    ]);

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  }
}

seed();
