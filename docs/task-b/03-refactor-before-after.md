# Task B — Refactor Example: Before and After

*Note: This is a representative inherited implementation demonstrating the architectural flaws outlined in the assessment. It is not an excerpt from the current LeadNexa application, which already models the "After" target state.*

## Before Example (Representative Inherited Code)

The following represents a problematic Route Handler that directly couples HTTP parsing, authorization, business rules, raw SQL execution, and response formatting in a single block.

### `PATCH /api/leads/:id`

```typescript
// Inherited BAD Route Handler
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Parsing and implicit validation (no strict schema)
    const body = await req.json();
    const { status, noteBody } = body;
    
    // 2. Manual pseudo-authorization
    const sessionCookie = req.headers.get("cookie")?.includes("session=");
    if (!sessionCookie) {
      return new Response("Unauthorized", { status: 401 });
    }
    const userId = getUserIdFromCookie(req);
    const userRole = getUserRoleFromCookie(req);

    // 3. Raw Database Access & Domain Logic
    const lead = await db.query(`SELECT * FROM leads WHERE id = ${params.id}`);
    
    if (!lead) {
      return new Response("Not Found", { status: 404 });
    }

    // 4. Repeated, fragile permission logic
    if (userRole === "MEMBER" && lead.assigned_to !== userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // 5. Database mutations (non-atomic)
    await db.query(`UPDATE leads SET status = '${status}' WHERE id = ${params.id}`);
    
    // 6. Activity log insert (risks silent failure if previous line succeeded)
    await db.query(`INSERT INTO activities (lead_id, type) VALUES (${params.id}, 'STATUS_CHANGED')`);

    // 7. Ad-hoc response formatting
    return new Response(JSON.stringify({ success: true, newStatus: status }), { status: 200 });

  } catch (err) {
    // 8. Raw error leakage
    return new Response(err.message, { status: 500 });
  }
}
```

**Problems with the "Before" state:**
- **Route knows the database schema**: Tight coupling makes refactoring impossible without touching HTTP logic.
- **Business rules tied to HTTP**: Domain rules cannot be reused by background jobs or other services.
- **Duplicated permission logic**: Developers must manually remember to add `lead.assigned_to !== userId` in every route.
- **No transactions**: The `UPDATE` and `INSERT` are not atomic. If the second query fails, the database is left in a corrupted state.
- **Difficult testing**: Requires spinning up an HTTP server and mocking cookies just to test a database write.
- **Inconsistent error handling**: Raw database errors leak into the frontend.

---

## After — Route

The modernised route handler acts solely as an HTTP boundary.

```typescript
// app/api/leads/[id]/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { leadStatusSchema } from "@/lib/validations/lead";
import { LeadService } from "@/server/services/lead.service";
import { AppError, formatResponse } from "@/lib/api-response";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate
    const user = await getCurrentUser();
    
    // 2. Strict Zod Validation
    const body = await req.json();
    const { status } = leadStatusSchema.parse(body);
    
    // 3. Delegate to Service Layer
    const updatedLead = await LeadService.updateStatus(Number(params.id), status, user);
    
    // 4. Standard Response
    return NextResponse.json(formatResponse(true, updatedLead));

  } catch (error) {
    // Centralised Error Handling
    return AppError.handleError(error);
  }
}
```

---

## After — Service

The Service orchestrates business rules and delegates data operations.

```typescript
// server/services/lead.service.ts
import { LeadRepository } from "@/server/repositories/lead.repository";
import { AppError } from "@/lib/errors";

export class LeadService {
  static async updateStatus(leadId: number, status: LeadStatus, user: User) {
    // Authorize (Centralised Domain Rule)
    const canMutate = await LeadRepository.canUserMutateLead(leadId, user);
    if (!canMutate) {
      throw new AppError("FORBIDDEN", "You do not have permission to modify this lead.");
    }

    // Delegate Persistence
    const updatedLead = await LeadRepository.updateStatus(leadId, status, user.id);
    if (!updatedLead) {
      throw new AppError("NOT_FOUND", "Lead not found.");
    }
    return updatedLead;
  }
}
```

---

## After — Repository

The Repository encapsulates database interaction, taking advantage of transactions.

```typescript
// server/repositories/lead.repository.ts
import { db } from "@/db";
import { leads, activities } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class LeadRepository {
  static async updateStatus(leadId: number, newStatus: LeadStatus, actorId: number) {
    // Atomic Database Transaction
    return db.transaction(async (tx) => {
      // 1. Update the Lead
      const [updatedLead] = await tx
        .update(leads)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(leads.id, leadId))
        .returning();

      if (!updatedLead) return null;

      // 2. Insert the Audit Activity
      await tx.insert(activities).values({
        leadId,
        type: "STATUS_CHANGED",
        actorId,
        metadata: { to: newStatus }
      });

      return updatedLead;
    });
  }

  static async canUserMutateLead(leadId: number, user: User): Promise<boolean> {
    if (user.role === "ADMIN") return true;
    
    // Strong Ownership Condition in SQL
    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, leadId), eq(leads.assignedTo, user.id))
    });
    return !!lead;
  }
}
```
*Note: Using an ownership-aware SQL query (`AND lead.assignedTo = user.id`) is stronger and safer than pulling the entire object into memory and evaluating it, as it naturally prevents race conditions and limits data exfiltration.*

---

## After — Validation and Errors

### Validation
Input validation relies on `zod` for type-safety and immediate early rejection.

- **Malformed JSON:** Caught inherently by `req.json()` → returns `400`.
- **Syntactically valid but invalid domain payload:** Caught by `leadStatusSchema.parse(body)` → returns `422`.

### Error Handling
Instead of throwing generic strings, the application uses structured `AppError` payloads.

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to modify this lead."
  }
}
```

---

## Before vs After Table

| Concern | Before | After |
|---|---|---|
| HTTP | Mixed with everything | Route only |
| Validation | Ad hoc | Zod schema |
| Authorization | Duplicated | Central rules |
| Business logic | Route | Service |
| DB access | Route/frontend | Repository |
| Transactions | Missing/inconsistent | Explicit |
| Errors | Ad hoc | Structured |
| Testing | Hard | Layered/testable |
| Security | Client/server mixed | Trusted server boundary |

---

## Test Example

With the new architecture, integration and unit tests become highly robust. 
By focusing on API endpoints via Supertest/Vitest, we can prove RBAC and side-effects:

**Scenario:** Member A assigned to Lead. Admin reassigns to Member B.
- **Member A** → `PATCH /api/leads/1` → Returns `403 Forbidden`
- **Member B** → `PATCH /api/leads/1` → Returns `200 OK`

**Atomic Side-effect Verification:**
After a successful `PATCH`, tests can query the database directly to assert:
- `Lead.status` matches new value.
- `activities` table contains exactly one `STATUS_CHANGED` record with `metadata: { to: "NEW" }`.

*Note: AI-assisted tools were used to help structure/refine this documentation, while the architectural decisions and final content were reviewed against the assignment requirements.*
