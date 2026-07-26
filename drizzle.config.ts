import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config(); // ✅ correct way for CLI context

export default defineConfig({
  schema: "./config/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
