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
    const lead = await createTestLead(null); // unassigned
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
});
