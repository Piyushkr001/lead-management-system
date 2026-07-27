import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as publicSubmit } from "@/app/api/public/leads/route";
import { PATCH as updateLead } from "@/app/api/leads/[leadId]/route";
import { POST as addNote } from "@/app/api/leads/[leadId]/notes/route";
import { clearDb, createTestUser } from "./helpers";
import * as jose from "jose";

let mockToken: string | undefined;

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(() => (mockToken ? { value: mockToken } : undefined)),
  }),
}));

async function setMockUser(user: any) {
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

  it("End-to-end: Submission -> Assignment -> Update -> Note", async () => {
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
    
    // 2. Admin assigns lead to member
    await setMockUser(admin);
    const assignReq = new Request(`http://localhost/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ assignedTo: member.id }),
    });
    const assignRes = await updateLead(assignReq, { params: Promise.resolve({ leadId }) });
    expect(assignRes.status).toBe(200);
    
    // 3. Member updates status
    await setMockUser(member);
    const statusReq = new Request(`http://localhost/api/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    const statusRes = await updateLead(statusReq, { params: Promise.resolve({ leadId }) });
    expect(statusRes.status).toBe(200);
    
    // 4. Member adds note
    const noteReq = new Request(`http://localhost/api/leads/${leadId}/notes`, {
      method: "POST",
      body: JSON.stringify({ body: "Left a voicemail." }),
    });
    const noteRes = await addNote(noteReq, { params: Promise.resolve({ leadId }) });
    expect(noteRes.status).toBe(201);
  });
});
