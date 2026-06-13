import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // During build or local code generation, load from .env file
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/lakepass",
  },
});
