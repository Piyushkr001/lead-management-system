import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("Must be a valid Postgres connection URL"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters long"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});
