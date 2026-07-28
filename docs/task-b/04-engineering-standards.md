# Task B — Engineering Standards

The following standards must be adhered to in order to prevent the recurrence of architectural degradation, security vulnerabilities, and testing omissions found in the inherited codebase.

## Source Control

- **Branching Strategy:** All work must be conducted on isolated feature branches.
- **Pull Requests (PRs):** Direct commits to the main branch are strictly prohibited. All changes require a Pull Request.
- **Reviews:** Merging to the protected main branch requires at least one approval from a designated reviewer for high-risk changes (e.g., auth, migrations).
- **Commit Messages:** Must be meaningful, reflecting the "why" alongside the "what".

## Code Review

Reviewers must utilise the following checklist for PRs:
- Correct business behaviour.
- Security and Authorization boundaries enforced.
- Test coverage included for new or modified functionality.
- Database migration impact verified against legacy data.
- API backwards compatibility maintained.
- Error handling verified (no leaked stack traces).
- Secrets are absent.
- Documentation updated appropriately.

## TypeScript

- **Strict Mode:** `tsconfig.json` must run with `strict: true`.
- **Typing Integrity:** Avoid `any`. The use of `as unknown as [Type]` type assertions must be heavily scrutinized and isolated entirely to test infrastructure if genuinely unavoidable.
- **Shared Domains:** Canonical domain types (e.g. `Role`, `LeadStatus`) should be defined centrally (e.g., `lib/types.ts`) and imported across the stack.
- **Compiler Obedience:** Do not silence compiler errors (`@ts-expect-error` or `@ts-ignore`) simply to merge code.

## API Design

- **REST Conventions:** Adhere to RESTful resource-oriented naming (`/api/leads/:id`).
- **Standardised Responses:** Maintain a consistent success/error payload shape across all endpoints.
- **HTTP Status Codes:** 
  - `400` Malformed Request
  - `401` Unauthenticated
  - `403` Forbidden
  - `404` Not Found
  - `422` Unprocessable Entity (Validation)
  - `500` Internal Server Error
- **Pagination:** All collection-returning endpoints must support pagination.
- **Abstraction:** No raw internal database errors should ever be returned to the client.

## Authentication and Authorization

- **Authentication (Who is the caller?):** Mandatory for all non-public routes.
- **Authorization (Can the caller perform this action on this resource?):** Must be strictly enforced on the server.
- UI restrictions (e.g., hiding a button) do not replace server authorization.
- **Resource-level Authorization:** Verifying the user's role is not enough; ownership must be verified against the requested resource (e.g., does this Member own this Lead?).

## Database Access

- **No Client DB Access:** The frontend must never perform privileged direct database access.
- **Repository Pattern:** Database calls must remain server-side, centralised within Repositories.
- **Business Logic Independence:** Domain logic should not depend directly on SQL implementation.
- **Transactions:** Must be explicitly used for any multi-write domain operations (e.g., updating a record and logging an activity).
- **Least Privilege:** The application runtime should use database credentials with the minimum required privileges.

## Database Migrations

- **Tracked Migrations:** All schema changes must go through generated, tracked migrations (e.g., Drizzle-kit migrations).
- **No Manual Alterations:** Never manually alter production schemas without a documented process and matching migration file.
- **Backward-Compatible Preference:** Prefer additive, backward-compatible migrations (e.g., adding a nullable column) rather than destructive ones (e.g., renaming a column directly).
- **Immutability:** Do not edit already-applied migration history files.
- **Automation:** Migration execution must be an automated step within the deployment process.

## Secrets Management

**NEVER commit:**
- `DATABASE_URL`
- `JWT_SECRET`
- API keys, private keys, or third-party secrets.

**Rules:**
- Use environment variables via a CI/CD secret store or a platform secret manager.
- The repository should contain only a `.env.example` file populated with placeholders or benign, local-only values.
- Automated secret scanning (e.g., GitHub Advanced Security or detect-secrets) must be active on the repository.

## Testing Strategy

Focus on risk, not arbitrary 100% code coverage.
- **Bug fix:** Include a regression test where practical.
- **New business rule:** Test both the success and explicit failure paths.
- **Authorization:** Include positive (allowed) and negative (rejected 403) tests.
- **Database transaction:** Require an integration test proving the domain state after completion (or rejection).
- **Critical flow:** Maintain integration/E2E coverage over the highest-risk customer journeys.

## CI Quality Gates

A pull request cannot merge if any mandatory CI gate fails. 
Before merging, the pipeline must enforce:
1. `bun run lint` → PASS
2. `bun run typecheck` → PASS
3. `bun run test` → PASS (Validated against a spun-up test database)
4. `bun run build` → PASS

## Error Handling

- **Structured Errors:** Use domain/application errors (e.g., `AppError`).
- **Expected Errors:** Map gracefully to known HTTP status codes.
- **Unexpected Errors:** Safely catch and return a generic `500`.
- **Data Protection:** Do not expose stack traces, SQL syntax errors, database credentials, or internal file paths to the client.

## Logging and Observability

- **Structured Logging:** Use JSON-formatted structured logging for easy ingestion by log aggregators.
- **Context:** Logs should include useful context such as the `requestId`, `operation`, `userId`, `resourceId`, duration, and standard error codes.
- **Data Masking:** NEVER log passwords, JWTs, API keys, database credentials, or sensitive PII.

## Security

- Run automated dependency updates (e.g., Dependabot) to patch known vulnerabilities.
- Enforce the principle of least privilege across services and databases.
- Validate all incoming user input explicitly using strict schema parsing.
- Use secure cookies (`HttpOnly`, `Secure`, `SameSite`) for authentication tokens.
- Separate production environments strictly from testing and staging environments.

## Deployment

- **Staging Verification:** Deploy to a staging/test environment matching production parity prior to production releases.
- **CI Gates:** Deployments only occur from green main branch builds.
- **Health Checks:** The application must expose health check endpoints for load balancers and orchestrators.
- **Rollback:** A documented rollback or forward-fix plan must exist for every release.

## Definition of Done

A feature is considered done only when:
- Requirements are fully implemented.
- Authorization boundaries are considered and enforced.
- Strict input validation is implemented.
- Behavioral and regression tests are updated and passing.
- Linting, type-checking, and the production build pass.
- Database migrations are generated (if required).
- Documentation (or API contracts) are updated if behavioural changes occurred.

*Note: AI-assisted tools were used to help structure/refine this documentation, while the architectural decisions and final content were reviewed against the assignment requirements.*
