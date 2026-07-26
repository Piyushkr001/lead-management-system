import { z } from "zod";

export const publicLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255).trim(),
  email: z.string().email("Invalid email address").max(255).trim().toLowerCase(),
  phone: z.string().max(50, "Phone number is too long").trim().optional(),
  company: z.string().max(255, "Company name is too long").trim().optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message is too long").trim(),
});

export const leadQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).optional(),
  assignedTo: z.coerce.number().optional(),
  search: z.string().trim().optional(),
});
