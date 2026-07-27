import { statusEnum } from "@/db/schema/leads";

export type Role = "ADMIN" | "MEMBER";

export type LeadStatus = typeof statusEnum.enumValues[number];
