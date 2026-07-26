import { z } from "zod";

export const loginSchema = z.object({
  provider: z.enum(["credentials", "google"]),
  email: z.string().email("Invalid email address").optional().transform(v => v?.trim().toLowerCase()),
  password: z.string().optional(),
  googleToken: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.provider === "credentials") {
    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required for credentials login",
        path: ["email"],
      });
    }
    if (!data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required for credentials login",
        path: ["password"],
      });
    }
  } else if (data.provider === "google") {
    if (!data.googleToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Google token is required",
        path: ["googleToken"],
      });
    }
  }
});
