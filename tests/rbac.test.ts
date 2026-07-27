import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as getLeads } from "@/app/api/leads/route";
import { clearDb, createTestUser, createTestLead } from "./helpers";
import * as jose from "jose";

// Global mock token for next/headers
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

describe("RBAC Tests", () => {
  beforeEach(async () => {
    await clearDb();
    mockToken = undefined;
  });

  it("MEMBER requests GET /api/leads -> Only sees assigned leads", async () => {
    const member = await createTestUser("MEMBER");
    const otherMember = await createTestUser("MEMBER");
    
    await createTestLead(member.id); // Assigned to Member
    await createTestLead(otherMember.id); // Assigned to Other
    await createTestLead(null); // Unassigned (MEMBER should see this or not? Currently MEMBER sees NEW unassigned leads if business logic allows, wait. Actually MEMBER only sees assigned to them according to the query. Let's see the exact API return)
    
    await setMockUser(member);
    
    const req = new Request("http://localhost/api/leads", { method: "GET" });
    const res = await getLeads(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    console.log("MEMBER LEADS JSON:", json);
    
    // Verify only assigned lead is returned
    expect(json.data).toBeDefined();
    // Usually a MEMBER sees leads assigned to them. Let's check length.
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    json.data.forEach((lead: any) => {
      expect(lead.assignedTo).toBe(member.id);
    });
  });

  it("ADMIN requests GET /api/leads -> Sees all leads", async () => {
    const admin = await createTestUser("ADMIN");
    const otherMember = await createTestUser("MEMBER");
    
    await createTestLead(otherMember.id); 
    await createTestLead(null);
    
    await setMockUser(admin);
    
    const req = new Request("http://localhost/api/leads", { method: "GET" });
    const res = await getLeads(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    console.log("ADMIN LEADS JSON:", json);
    
    // Admin should see both leads
    expect(json.data.length).toBe(2);
  });
});
