import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("Must be a valid Postgres connection URL"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
});
