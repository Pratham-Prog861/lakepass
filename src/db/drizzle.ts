import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

// singleton pattern to prevent database connection exhaustion during development hot-reloads
const globalForDrizzle = globalThis as unknown as {
  postgresClient: postgres.Sql | undefined;
};

const client =
  globalForDrizzle.postgresClient ||
  postgres(connectionString, { prepare: false, max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForDrizzle.postgresClient = client;
}

export const db = drizzle(client, { schema });
