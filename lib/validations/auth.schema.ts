import { z } from "zod";

export const loginSchema = z.object({
  provider: z.literal("credentials").default("credentials"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
