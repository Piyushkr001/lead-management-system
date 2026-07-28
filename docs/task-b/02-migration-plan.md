# Task B — Phased Migration Plan

## Migration Principles

The core objective is to modernise the inherited codebase without resorting to a high-risk "big-bang" rewrite. 
- **Security before refactoring**: Fix exposed credentials and severe authorization gaps immediately.
- **Preserve existing behaviour**: Document and test current functionality before changing it.
- **Small reversible changes**: Deploy incremental updates.
- **Tests before structural changes**: A safety net must exist before extracting logic.
- **Compatibility during migration**: The application must remain usable throughout the transition.
- **Backward-compatible database changes**: Schema updates should not break existing code.
- **Observable releases**: Ensure monitoring exists to verify the success of each phase.

---

## Phase 0 — Stabilise and Baseline

**Goals:**
- Understand the existing architecture and critical dependencies.
- Identify business-critical paths.
- Record current production behaviour.
- Establish baseline metrics.

**Actions:**
- Inventory all dependencies, endpoints, database schemas, and environments.
- Implement characterisation (integration) tests on critical endpoints.
- Establish a local build/lint/typecheck baseline.
- **Do NOT restructure the application yet.**

---

## Phase 1 — Security Containment

**Goals:** Contain the highest-priority risks outlined in the assessment.

**Actions:**
- Rotate leaked credentials across all services.
- Remove secrets from source code and Git history (where viable).
- Configure environment variables and secure secrets management.
- Add secret scanning to prevent recurrence.
- Review and restrict immediate database permissions.

**Deployment:** Release as a small, focused security patch.
**Rollback Note:** Application rollback must NOT restore compromised credentials. Database password rotations must be handled orthogonally to code deployments.

---

## Phase 2 — Introduce Server API Boundary

**Goals:** Eliminate direct frontend database access using a strangler-style approach.

**Transition Strategy:**
Transition incrementally from `Frontend → DB` to `Frontend → Server API → DB`.

Do NOT migrate everything at once. Temporarily allow the old flow and new API to coexist. Migrate the highest-risk features first (e.g., writes and mutations).

**Example:**
- **Old:** Frontend component → database client → `leads` table.
- **New:** Frontend component → `GET /api/leads` → `LeadService` → `LeadRepository` → database.

Once the new feature is verified in production, remove the old direct DB call. Repeat feature by feature.

---

## Phase 3 — Introduce Validation and Authorization

**Goals:** Secure the newly created Server API boundaries.

For each migrated endpoint, add:
- Authentication (identifying the caller).
- Server-side authorization (e.g., RBAC).
- Input validation (e.g., Zod schemas).
- Standardised error handling and response shapes.

Never rely exclusively on hidden UI buttons or frontend route guards for authorization. The server must be the ultimate authority.

---

## Phase 4 — Extract Business Logic from Routes

**Goals:** Untangle monolithic route handlers into a layered architecture.

Incrementally convert `Route → DB` to `Route → Service → Repository → DB`.

Migrate by bounded functional areas:
1. Highest-risk write flows (e.g., assignment, status changes).
2. Authentication-sensitive flows.
3. Core domain CRUD operations.
4. Read-heavy / supporting endpoints.

Migrating feature-by-feature isolates risk and allows continuous delivery of value.

---

## Phase 5 — Database and Transaction Hardening

**Goals:** Ensure data integrity and schema robustness.

**Actions:**
- Review schema nullability, indexes, and unique constraints.
- Implement database transactions where a single domain action requires multiple distinct DB writes (e.g., updating a Lead's status AND inserting an Activity log atomically).
- Enforce backward-compatible database migrations.

**Safe Migration Sequence Example:**
1. Add a new/nullable column to the database.
2. Deploy code supporting both old and new paradigms.
3. Backfill data for legacy rows.
4. Switch application reads/writes entirely to the new column.
5. Enforce strict `NOT NULL` constraints in a final migration.
This is far safer than a destructive one-step migration that causes downtime or data loss on rollback.

---

## Phase 6 — Automated Test Coverage

**Goals:** Build layered confidence in the system.

Do not chase 100% code coverage. Prioritise high-risk behaviours:
- **Security/RBAC**: Assert that unauthorised access strictly returns `401`/`403`.
- **Core-flow tests**: E2E or broad integration tests validating the customer journey.
- **Integration**: Route → Service → Repository → Database flows.
- **Unit**: Complex, pure business logic validation.

---

## Phase 7 — CI Quality Gates

**Goals:** Prevent regressions from merging into the main branch.

Introduce a Continuous Integration pipeline blocking merges unless mandatory gates pass:
1. Dependency Install
2. Lint
3. Typecheck
4. Spin up Test PostgreSQL → Run Migrations → Execute Tests
5. Production Build

---

## Phase 8 — Observability

**Goals:** Enable rapid incident diagnosis.

**Actions:**
- Introduce structured JSON logging.
- Add request correlation IDs.
- Implement error and latency monitoring.
- Audit sensitive operations (e.g., assigning leads or changing roles).
- Ensure sensitive values (passwords, tokens, PII) are explicitly masked or omitted from logs.

---

## Phase 9 — Decommission Legacy Paths

**Goals:** Clean up technical debt.

Only remove old routes and database access patterns after:
- The new path is deployed.
- Tests are passing and metrics are stable.
- Frontend clients have fully migrated.
- The rollback window has safely elapsed.

Then aggressively delete duplicated business logic, obsolete environment variables, and the old direct DB client.

---

## Zero/Minimal Downtime Strategy

Achieving minimal downtime relies on:
- Backward-compatible database migrations.
- Feature-by-feature rollouts.
- Using feature flags when justified.
- Implementing robust health checks and monitoring to catch anomalies immediately post-deployment.

The architecture remains relatively simple (monolithic API/frontend) without over-engineering into microservices, Kafka, or Kubernetes unnecessarily. 

---

## Rollback Strategy

For each deployment phase, rollback must be explicitly considered.
- **Application rollback:** In most cases, this involves reverting to the previous stable container or deployment artifact.
- **Database rollback:** Database schemas cannot always be easily rolled back (e.g. dropping a column destroys data). Database migrations must be designed so that old and new application versions can temporarily coexist. If data corruption occurs, a forward-fix is generally preferred over a destructive rollback.

---

## Definition of Done

The modernisation migration is complete when:
- No secrets exist in the repository or active source code.
- Exposed secrets have been rotated.
- Direct frontend privileged DB access is entirely eliminated.
- Server-side authentication and RBAC are strictly enforced.
- Business logic is extracted from HTTP handlers into isolated services.
- Database access is centralised in repositories.
- Critical automated tests exist and pass.
- Database migrations are tracked and reproducible.
- CI quality gates enforce standards.
- Monitoring and observability are established.
- Legacy architectural paths are fully removed.
- Engineering documentation is updated.

*Note: AI-assisted tools were used to help structure/refine this documentation, while the architectural decisions and final content were reviewed against the assignment requirements.*
