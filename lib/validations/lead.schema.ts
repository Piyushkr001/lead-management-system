import { z } from "zod";

export const publicLeadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(255),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(255),
  phone: z.string().trim().max(50, "Phone number is too long").optional(),
  company: z.string().trim().max(255, "Company name is too long").optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000, "Message is too long"),
});

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).optional(),
  assignedTo: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(200).optional(),
});
