import { describe, it, expect, beforeEach, vi } from "vitest";
import { LeadRepository } from "@/server/repositories/lead.repository";
import { clearDb, createTestUser, createTestLead } from "./helpers";
import { db } from "@/db";
import { leadsTable } from "@/db/schema/leads";
import { leadActivitiesTable } from "@/db/schema/lead-activities";
import { eq } from "drizzle-orm";

describe("Transaction Atomicity Tests", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("Assignment is atomic (rollback on failure)", async () => {
    const admin = await createTestUser("ADMIN");
    const lead = await createTestLead();

    // Trigger a foreign key violation by assigning to a non-existent user
    try {
      await LeadRepository.assignLead(lead.id, 999999, admin.id);
    } catch (e: unknown) {
      // Expected to throw
    }

    // Verify rollback: lead should NOT be assigned, and NO activities should be inserted
    const [dbLead] = await db.select().from(leadsTable).where(eq(leadsTable.id, lead.id));
    expect(dbLead.assignedTo).toBeNull();

    const activities = await db.select().from(leadActivitiesTable).where(eq(leadActivitiesTable.leadId, lead.id));
    expect(activities.length).toBe(0);
  });
});
