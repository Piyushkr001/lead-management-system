import { describe, it, expect, beforeEach } from "vitest";
import { GET as getLeads } from "@/app/api/leads/route";
import { POST as login } from "@/app/api/auth/login/route";
import { clearDb, createTestUser } from "./helpers";
import { vi } from "vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(() => undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe("Authentication Tests", () => {
  beforeEach(async () => {
    await clearDb();
  });

  it("Guest requests protected Leads API -> 401 Unauthorized", async () => {
    const req = new Request("http://localhost/api/leads", { method: "GET" });
    const res = await getLeads(req);
    expect(res.status).toBe(401);
  });

  it("Invalid login (wrong email/password) -> 401", async () => {
    await createTestUser("MEMBER", true);
    
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "wrong@example.com", password: "wrong" }),
    });
    
    const res = await login(req);
    expect(res.status).toBe(401);
  });

  it("Disabled user (isActive = false) -> login rejected", async () => {
    const disabledUser = await createTestUser("MEMBER", false);
    
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: disabledUser.email, password: "password123" }),
    });
    
    const res = await login(req);
    expect(res.status).toBe(403);
  });
});
