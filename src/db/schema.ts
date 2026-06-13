import { pgTable, text, timestamp, uuid, pgEnum, integer, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Enums
export const roleEnum = pgEnum("user_role", ["marina_owner", "consumer"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "completed", "cancelled"]);

// 2. Tables

// Users Table (Clerk sync table)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  role: roleEnum("role").notNull().default("consumer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Marinas Table
export const marinas = pgTable("marinas", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Boats Table
export const boats = pgTable("boats", {
  id: uuid("id").primaryKey().defaultRandom(),
  marinaId: uuid("marina_id")
    .notNull()
    .references(() => marinas.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // e.g., pontoon, speedboat, jet_ski
  capacity: integer("capacity").notNull(),
  pricePerHour: integer("price_per_hour").notNull(), // Price in cents
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bookings Table
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  boatId: uuid("boat_id")
    .notNull()
    .references(() => boats.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  totalAmount: integer("total_amount").notNull(), // Amount in cents
  status: bookingStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reviews Table
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  boatId: uuid("boat_id")
    .notNull()
    .references(() => boats.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1 to 5
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 3. Relationships

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const marinasRelations = relations(marinas, ({ one, many }) => ({
  owner: one(users, {
    fields: [marinas.ownerId],
    references: [users.id],
  }),
  boats: many(boats),
}));

export const boatsRelations = relations(boats, ({ one, many }) => ({
  marina: one(marinas, {
    fields: [boats.marinaId],
    references: [marinas.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  boat: one(boats, {
    fields: [bookings.boatId],
    references: [boats.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  boat: one(boats, {
    fields: [reviews.boatId],
    references: [boats.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));
