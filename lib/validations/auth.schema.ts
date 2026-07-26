import { z } from "zod";

export const loginSchema = z.object({
  provider: z.literal("credentials").default("credentials"),
  email: z.string().email("Invalid email address").transform(v => v.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});
