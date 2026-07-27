import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH as updateLead } from "@/app/api/leads/[leadId]/route";
import { clearDb, createTestUser, createTestLead } from "./helpers";
import { db } from "@/db";
import { leadsTable } from "@/db/schema/leads";
import { leadActivitiesTable } from "@/db/schema/lead-activities";
import { eq, desc } from "drizzle-orm";
import * as jose from "jose";

let mockToken: string | undefined;

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(() => (mockToken ? { value: mockToken } : undefined)),
  }),
}));

async function setMockUser(user: { id: number; email: string; role: string }) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  mockToken = await new jose.SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

describe("Lead Assignment & Reassignment Tests", () => {
  beforeEach(async () => {
    await clearDb();
    mockToken = undefined;
  });

  it("Admin assigns an active MEMBER -> success", async () => {
    const admin = await createTestUser("ADMIN");
    const member = await createTestUser("MEMBER");
    const lead = await createTestLead();
    
    await setMockUser(admin);
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: member.id }),
    });
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).toBe(200);

    const [dbLead] = await db.select().from(leadsTable).where(eq(leadsTable.id, lead.id));
    expect(dbLead.assignedTo).toBe(member.id);

    const activities = await db.select().from(leadActivitiesTable).where(eq(leadActivitiesTable.leadId, lead.id));
    expect(activities.some(a => a.type === "LEAD_ASSIGNED")).toBe(true);
  });

  it("Admin tries assigning Lead to an ADMIN -> rejected", async () => {
    const admin1 = await createTestUser("ADMIN");
    const admin2 = await createTestUser("ADMIN");
    const lead = await createTestLead();
    
    await setMockUser(admin1);
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: admin2.id }),
    });
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).not.toBe(200); // Expecting 400 or 403/422

    const [dbLead] = await db.select().from(leadsTable).where(eq(leadsTable.id, lead.id));
    expect(dbLead.assignedTo).toBeNull();
  });

  it("Admin tries assigning inactive MEMBER -> rejected", async () => {
    const admin = await createTestUser("ADMIN");
    const inactiveMember = await createTestUser("MEMBER", false);
    const lead = await createTestLead();
    
    await setMockUser(admin);
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: inactiveMember.id }),
    });
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).not.toBe(200);
  });

  it("Admin assigns user ID that does not exist -> clean domain error", async () => {
    const admin = await createTestUser("ADMIN");
    const lead = await createTestLead();
    
    await setMockUser(admin);
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: 999999 }),
    });
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).toBe(404);
  });

  it("Member tries to assign -> 403 Forbidden", async () => {
    const member1 = await createTestUser("MEMBER");
    const member2 = await createTestUser("MEMBER");
    const lead = await createTestLead();
    
    await setMockUser(member1);
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: member2.id }),
    });
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).toBe(403);
  });

  it("Reassignment Flow", async () => {
    const admin = await createTestUser("ADMIN");
    const memberA = await createTestUser("MEMBER");
    const memberB = await createTestUser("MEMBER");
    const lead = await createTestLead();
    
    await setMockUser(admin);
    
    // Assign to Member A
    const req1 = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: memberA.id }),
    });
    await updateLead(req1, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    
    // Reassign to Member B
    const req2 = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: memberB.id }),
    });
    const res2 = await updateLead(req2, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res2.status).toBe(200);

    const [dbLead] = await db.select().from(leadsTable).where(eq(leadsTable.id, lead.id));
    expect(dbLead.assignedTo).toBe(memberB.id);

    const activities = await db.select().from(leadActivitiesTable)
      .where(eq(leadActivitiesTable.leadId, lead.id))
      .orderBy(desc(leadActivitiesTable.createdAt));
      
    const reassignedActivity = activities.find(a => a.type === "LEAD_REASSIGNED");
    expect(reassignedActivity).toBeDefined();
    expect((reassignedActivity?.metadata as { previousAssigneeId?: number })?.previousAssigneeId).toBe(memberA.id);
    expect((reassignedActivity?.metadata as { newAssigneeId?: number })?.newAssigneeId).toBe(memberB.id);
  });

  it("Same-assignee NO-OP", async () => {
    const admin = await createTestUser("ADMIN");
    const member = await createTestUser("MEMBER");
    const lead = await createTestLead(member.id);
    
    await setMockUser(admin);
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: member.id }),
    });
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).toBe(200);

    const activities = await db.select().from(leadActivitiesTable)
      .where(eq(leadActivitiesTable.leadId, lead.id));
      
    // Should not create new assignment activities
    expect(activities.filter(a => a.type === "LEAD_ASSIGNED" || a.type === "LEAD_REASSIGNED").length).toBe(0);
  });
});
