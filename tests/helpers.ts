import { db } from "@/db";
import { sql } from "drizzle-orm";
import { usersTable } from "@/db/schema/users";
import { leadsTable } from "@/db/schema/leads";
import bcrypt from "bcryptjs";

export async function clearDb() {
  await db.execute(sql`TRUNCATE TABLE lead_activities RESTART IDENTITY CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE lead_notes RESTART IDENTITY CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE leads RESTART IDENTITY CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE;`);
}

export async function createTestUser(role: "ADMIN" | "MEMBER", isActive: boolean = true) {
  const hash = await bcrypt.hash("password123", 10);
  const [user] = await db.insert(usersTable).values({
    name: `Test ${role}`,
    email: `test${role.toLowerCase()}${crypto.randomUUID()}@example.com`,
    passwordHash: hash,
    role,
    isActive,
  }).returning();
  return user;
}

export async function createTestLead(assignedTo?: number) {
  const [lead] = await db.insert(leadsTable).values({
    name: "Test Lead",
    email: `lead${crypto.randomUUID()}@example.com`,
    company: "Test Company",
    message: "Test message",
    source: "WEBSITE",
    status: "NEW",
    assignedTo: assignedTo || null,
  }).returning();
  return lead;
}
