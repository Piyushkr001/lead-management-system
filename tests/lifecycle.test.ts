import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as publicSubmit } from "@/app/api/public/leads/route";
import { PATCH as updateLead } from "@/app/api/leads/[leadId]/route";
import { POST as addNote } from "@/app/api/leads/[leadId]/notes/route";
import { GET as getLead } from "@/app/api/leads/[leadId]/route";
import { GET as getActivities } from "@/app/api/leads/[leadId]/activities/route";
import { clearDb, createTestUser } from "./helpers";
import { db } from "@/db";
import { leadsTable } from "@/db/schema/leads";
import { leadActivitiesTable } from "@/db/schema/lead-activities";
import { leadNotesTable } from "@/db/schema/lead-notes";
import { eq, sql } from "drizzle-orm";
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

describe("Lead Lifecycle & Activity Tracking", () => {
  beforeEach(async () => {
    await clearDb();
    mockToken = undefined;
  });

  it("End-to-end: Submission -> Assignment -> Update -> Note -> Timeline", async () => {
    const admin = await createTestUser("ADMIN");
    const member = await createTestUser("MEMBER");
    
    // 1. Public Submission
    const publicReq = new Request("http://localhost/api/leads/public", {
      method: "POST",
      body: JSON.stringify({
        name: "Lifecycle Tester",
        email: "lifecycle@example.com",
        message: "I am interested",
      }),
    });
    const publicRes = await publicSubmit(publicReq);
    expect(publicRes.status).toBe(201);
    const leadData = (await publicRes.json()).data;
    const leadId = leadData.id.toString();
    
    // Verify DB state for public lead
    const [dbLead1] = await db.select().from(leadsTable).where(eq(leadsTable.id, Number(leadId)));
    expect(dbLead1).toBeDefined();
    expect(dbLead1.name).toBe("Lifecycle Tester");
    expect(dbLead1.status).toBe("NEW");
    expect(dbLead1.assignedTo).toBeNull();
    
    const dbActivities1 = await db.select().from(leadActivitiesTable).where(eq(leadActivitiesTable.leadId, Number(leadId)));
    expect(dbActivities1.some(a => a.type === "LEAD_CREATED")).toBe(true);
    
    // 2. Admin assigns lead to member
    await setMockUser(admin);
    const assignReq = new Request(`http://localhost/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: member.id }),
    });
    const assignRes = await updateLead(assignReq, { params: Promise.resolve({ leadId }) });
    expect(assignRes.status).toBe(200);
    
    // Verify assignment DB state
    const [dbLead2] = await db.select().from(leadsTable).where(eq(leadsTable.id, Number(leadId)));
    expect(dbLead2.assignedTo).toBe(member.id);
    
    const dbActivities2 = await db.select().from(leadActivitiesTable).where(eq(leadActivitiesTable.leadId, Number(leadId)));
    expect(dbActivities2.some(a => a.type === "LEAD_ASSIGNED")).toBe(true);
    
    // 3. Member accesses Lead
    await setMockUser(member);
    const accessReq = new Request(`http://localhost/api/leads/${leadId}`, { method: "GET" });
    const accessRes = await getLead(accessReq, { params: Promise.resolve({ leadId }) });
    expect(accessRes.status).toBe(200);
    
    // 4. Member updates status
    const statusReq = new Request(`http://localhost/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    const statusRes = await updateLead(statusReq, { params: Promise.resolve({ leadId }) });
    expect(statusRes.status).toBe(200);
    
    // Verify status update DB state
    const [dbLead3] = await db.select().from(leadsTable).where(eq(leadsTable.id, Number(leadId)));
    expect(dbLead3.status).toBe("CONTACTED");
    
    const dbActivities3 = await db.select().from(leadActivitiesTable).where(eq(leadActivitiesTable.leadId, Number(leadId)));
    const statusChangeActivity = dbActivities3.find(a => a.type === "STATUS_CHANGED");
    expect((statusChangeActivity?.metadata as { to?: string })?.to).toBe("CONTACTED");
    
    // 5. Member adds note
    const noteReq = new Request(`http://localhost/api/leads/${leadId}/notes`, {
      method: "POST",
      body: JSON.stringify({ body: "Left a voicemail." }),
    });
    const noteRes = await addNote(noteReq, { params: Promise.resolve({ leadId }) });
    expect(noteRes.status).toBe(201);
    
    // Verify note DB state
    const dbNotes = await db.select().from(leadNotesTable).where(eq(leadNotesTable.leadId, Number(leadId)));
    expect(dbNotes.length).toBe(1);
    expect(dbNotes[0].body).toBe("Left a voicemail.");
    expect(dbNotes[0].authorId).toBe(member.id);
    
    const dbActivities4 = await db.select().from(leadActivitiesTable).where(eq(leadActivitiesTable.leadId, Number(leadId)));
    expect(dbActivities4.some(a => a.type === "NOTE_ADDED")).toBe(true);
    
    // 6. Fetch final Activity Timeline
    const activitiesReq = new Request(`http://localhost/api/leads/${leadId}/activities`, { method: "GET" });
    const activitiesRes = await getActivities(activitiesReq, { params: Promise.resolve({ leadId }) });
    expect(activitiesRes.status).toBe(200);
    const timeline = (await activitiesRes.json()).data;
    const types = timeline.map((a: { type: string }) => a.type);
    expect(types).toContain("LEAD_CREATED");
    expect(types).toContain("LEAD_ASSIGNED");
    expect(types).toContain("STATUS_CHANGED");
    expect(types).toContain("NOTE_ADDED");
  });

  it("Invalid public lead submission -> 400 Bad Request, no DB insertion", async () => {
    // get count before
    const [{ count: beforeLeadCount }] = await db.select({ count: sql`count(*)` }).from(leadsTable);
    const [{ count: beforeActivityCount }] = await db.select({ count: sql`count(*)` }).from(leadActivitiesTable);
    
    const publicReq = new Request("http://localhost/api/leads/public", {
      method: "POST",
      body: JSON.stringify({ name: "" }), // missing required fields
    });
    const publicRes = await publicSubmit(publicReq);
    expect([400, 422]).toContain(publicRes.status);
    
    const [{ count: afterLeadCount }] = await db.select({ count: sql`count(*)` }).from(leadsTable);
    const [{ count: afterActivityCount }] = await db.select({ count: sql`count(*)` }).from(leadActivitiesTable);
    
    expect(afterLeadCount).toBe(beforeLeadCount);
    expect(afterActivityCount).toBe(beforeActivityCount);
  });
});
