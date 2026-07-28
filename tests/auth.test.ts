import { describe, it, expect, beforeEach } from "vitest";
import { GET as getLeads } from "@/app/api/leads/route";
import { POST as login } from "@/app/api/auth/login/route";
import { clearDb, createTestUser } from "./helpers";
import { vi } from "vitest";

import * as jose from "jose";

let mockToken: string | undefined;

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(() => (mockToken ? { value: mockToken } : undefined)),
    set: vi.fn(),
    delete: vi.fn(),
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

  it("Valid JWT but DB query fails -> Infrastructure Error (500)", async () => {
    const user = await createTestUser("MEMBER");
    await setMockUser(user);

    const { db } = await import("@/db");
    const originalSelect = db.select;
    
    // Mocking for DB failure
    db.select = vi.fn().mockImplementation(() => {
      throw new Error("Simulated database connection failure");
    });

    const req = new Request("http://localhost/api/leads", { method: "GET" });
    
    try {
      const res = await getLeads(req);
      expect(res.status).toBe(500);
    } finally {
      db.select = originalSelect;
    }
  });

  it("DB Role revalidation -> JWT claims do not override DB source of truth", async () => {
    const adminUser = await createTestUser("ADMIN");
    await setMockUser(adminUser); // Admin gets an ADMIN JWT

    // Simulate DB role downgrade
    const { db } = await import("@/db");
    const { usersTable } = await import("@/db/schema/users");
    const { eq } = await import("drizzle-orm");
    await db.update(usersTable).set({ role: "MEMBER" }).where(eq(usersTable.id, adminUser.id));

    // Next request to an Admin endpoint should be rejected, even though JWT says ADMIN
    // But we need an admin endpoint to test against. We will use a mock handler.
    const { requireAdmin } = await import("@/lib/auth");
    
    try {
      await requireAdmin();
      expect(true).toBe(false); // Should not reach here
    } catch (e: unknown) {
      if (e instanceof Error) {
        // AppError formatting can be complex but the status or message should indicate forbidden
        expect(e.message).toContain("Admin access required");
      }
    }
  });

  it("DB isActive revalidation -> Valid JWT no longer grants access if deactivated", async () => {
    const member = await createTestUser("MEMBER");
    await setMockUser(member);

    // Simulate user deactivation
    const { db } = await import("@/db");
    const { usersTable } = await import("@/db/schema/users");
    const { eq } = await import("drizzle-orm");
    await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, member.id));

    const req = new Request("http://localhost/api/leads", { method: "GET" });
    const res = await getLeads(req);
    expect(res.status).toBe(401);
  });
});
