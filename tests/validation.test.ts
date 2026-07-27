import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH as updateLead } from "@/app/api/leads/[leadId]/route";
import { GET as getLeads } from "@/app/api/leads/route";
import { GET as getLead } from "@/app/api/leads/[leadId]/route";
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

describe("Validation and Error Handling Tests", () => {
  beforeEach(async () => {
    await clearDb();
    mockToken = undefined;
  });

  it("Malformed JSON -> 400 Bad Request", async () => {
    const admin = await createTestUser("ADMIN");
    const lead = await createTestLead();
    await setMockUser(admin);

    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      // Malformed JSON (trailing comma or syntax error)
      body: `{"status": "CONTACTED", }`, 
    });
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });

  it("Invalid Status -> Validation Error (422 or 400)", async () => {
    const admin = await createTestUser("ADMIN");
    const lead = await createTestLead();
    await setMockUser(admin);

    const req = new Request(`http://localhost/api/leads/${lead.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "INVALID_STATUS" }),
    });
    const res = await updateLead(req, { params: Promise.resolve({ leadId: lead.id.toString() }) });
    expect([400, 422]).toContain(res.status); // Accepts either standard validation error code
    
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("Invalid Query Params -> Validation Error", async () => {
    const admin = await createTestUser("ADMIN");
    await setMockUser(admin);

    // Invalid page = 0
    const req1 = new Request(`http://localhost/api/leads?page=0`, { method: "GET" });
    const res1 = await getLeads(req1);
    expect([400, 422]).toContain(res1.status);

    // Invalid pageSize = 101
    const req2 = new Request(`http://localhost/api/leads?pageSize=101`, { method: "GET" });
    const res2 = await getLeads(req2);
    expect([400, 422]).toContain(res2.status);
    
    // Invalid assignedTo
    const req3 = new Request(`http://localhost/api/leads?assignedTo=-1`, { method: "GET" });
    const res3 = await getLeads(req3);
    expect([400, 422]).toContain(res3.status);
  });

  it("Invalid Lead IDs -> 400 Validation Error", async () => {
    const admin = await createTestUser("ADMIN");
    await setMockUser(admin);

    const invalidIds = ["abc", "12abc", "-1", "1.5"];
    
    for (const id of invalidIds) {
      const req = new Request(`http://localhost/api/leads/${id}`, { method: "GET" });
      const res = await getLead(req, { params: Promise.resolve({ leadId: id }) });
      expect([400, 404, 422]).toContain(res.status); // 400 or 422 for bad format, or 404 if parser says not found
      
      const json = await res.json();
      expect(json.success).toBe(false);
    }
  });

  it("Member Filter Bypass Attempt -> Server Enforced Isolation", async () => {
    const memberA = await createTestUser("MEMBER");
    const memberB = await createTestUser("MEMBER");
    
    await createTestLead(memberA.id);
    await createTestLead(memberB.id);
    
    await setMockUser(memberA);
    // Member A attempts to get leads assigned to Member B
    const req = new Request(`http://localhost/api/leads?assignedTo=${memberB.id}`, { method: "GET" });
    const res = await getLeads(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const leads = json.data;
    
    // Server must enforce that Member A only gets their own leads or none
    for (const lead of leads) {
      expect(lead.assignedTo).toBe(memberA.id);
    }
    // In strict implementation, member A requesting B's leads might just return []
  });
});
