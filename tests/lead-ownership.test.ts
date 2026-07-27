import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH as updateLead } from "@/app/api/leads/[leadId]/route";
import { clearDb, createTestUser, createTestLead } from "./helpers";
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

describe("Assignment and Ownership Tests", () => {
  beforeEach(async () => {
    await clearDb();
    mockToken = undefined;
  });

  it("MEMBER modifies their own assigned lead -> 200 OK", async () => {
    const member = await createTestUser("MEMBER");
    const lead = await createTestLead(member.id);
    await setMockUser(member);
    
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).toBe(200);
  });

  it("MEMBER attempts to modify unassigned lead -> 403 Forbidden", async () => {
    const member = await createTestUser("MEMBER");
    const lead = await createTestLead(); // unassigned
    await setMockUser(member);
    
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).toBe(403);
  });

  it("MEMBER attempts to modify another's lead -> 403 Forbidden", async () => {
    const member = await createTestUser("MEMBER");
    const otherMember = await createTestUser("MEMBER");
    const lead = await createTestLead(otherMember.id);
    await setMockUser(member);
    
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).toBe(403);
  });

  it("Reassignment Security Test", async () => {
    const admin = await createTestUser("ADMIN");
    const memberA = await createTestUser("MEMBER");
    const memberB = await createTestUser("MEMBER");
    const lead = await createTestLead(memberA.id);
    
    // Admin reassigns: Member A -> Member B
    await setMockUser(admin);
    const reassignReq = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: memberB.id }),
    });
    await updateLead(reassignReq, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    
    // Member A attempts GET -> 403
    await setMockUser(memberA);
    const { GET: getLead } = await import("@/app/api/leads/[leadId]/route");
    const getReqA = new Request(`http://localhost/api/leads/${lead.id}`, { method: "GET" });
    const getResA = await getLead(getReqA, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(getResA.status).toBe(403);
    
    // Member A attempts PATCH status -> 403
    const patchReqA = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    const patchResA = await updateLead(patchReqA, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(patchResA.status).toBe(403);
    
    // Member A attempts POST note -> 403
    const { POST: addNote } = await import("@/app/api/leads/[leadId]/notes/route");
    const noteReqA = new Request(`http://localhost/api/leads/${lead.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ body: "Note from Member A" }),
    });
    const noteResA = await addNote(noteReqA, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(noteResA.status).toBe(403);
    
    // Member B attempts GET -> 200
    await setMockUser(memberB);
    const getReqB = new Request(`http://localhost/api/leads/${lead.id}`, { method: "GET" });
    const getResB = await getLead(getReqB, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(getResB.status).toBe(200);
    
    // Member B attempts PATCH status -> 200
    const patchReqB = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    const patchResB = await updateLead(patchReqB, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(patchResB.status).toBe(200);
    
    // Member B attempts POST note -> 201
    const noteReqB = new Request(`http://localhost/api/leads/${lead.id}/notes`, {
      method: "POST",
      body: JSON.stringify({ body: "Note from Member B" }),
    });
    const noteResB = await addNote(noteReqB, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(noteResB.status).toBe(201);
  });

  it("Status No-Op", async () => {
    const member = await createTestUser("MEMBER");
    const lead = await createTestLead(member.id);
    
    // Set initial status to CONTACTED
    const { db } = await import("@/db");
    const { leadsTable } = await import("@/db/schema/leads");
    const { leadActivitiesTable } = await import("@/db/schema/lead-activities");
    const { eq } = await import("drizzle-orm");
    await db.update(leadsTable).set({ status: "CONTACTED" }).where(eq(leadsTable.id, lead.id));
    
    await setMockUser(member);
    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).toBe(200);

    const activities = await db.select().from(leadActivitiesTable).where(eq(leadActivitiesTable.leadId, lead.id));
    expect(activities.filter((a) => a.type === "STATUS_CHANGED").length).toBe(0);
  });
});
