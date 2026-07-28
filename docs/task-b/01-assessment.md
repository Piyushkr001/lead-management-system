# Task B — Technical Assessment

The scenario states that I have inherited an application with no automated tests, business logic embedded in route handlers, direct database access from the frontend, and secrets committed to the repository. Before changing the architecture or introducing new features, the first objective is to understand production risk, contain immediate threats, and stabilise the system.

## Executive Summary

The inherited application exhibits significant risks across four major areas:
1. **Security**: Exposed secrets and missing boundaries.
2. **Data integrity and architecture**: Client-side database queries and coupled business logic.
3. **Reliability and testability**: Zero automated testing.
4. **Maintainability and delivery**: No quality gates or standardised error handling.

Security issues rank highest. Immediate remediation must focus on containing exposed secrets, moving database access to the server, enforcing authentication/authorization boundaries, and ensuring production stability before attempting large-scale refactoring.

## Risk Prioritisation

| Issue | Severity | Impact | Immediate Action |
|---|---|---|---|
| Secrets committed to repository | Critical | Credential compromise | Rotate/revoke immediately |
| Frontend direct DB access | Critical | Data exposure / bypassed authorization | Move DB access server-side |
| Missing server authorization | Critical/High | Unauthorized data access | Add server-side RBAC |
| Business logic in routes | High | Tight coupling / difficult testing | Extract service layer |
| No automated tests | High | Regression risk | Add behavioural tests |
| No CI quality gates | Medium/High | Broken code can merge | Introduce CI |
| Inconsistent error handling | Medium | Poor reliability/debugging | Standardise errors |
| Missing observability | Medium | Hard incident diagnosis | Add structured logging/monitoring |

## Security Findings

The scenario explicitly identifies that secrets have been committed to the repository. This represents a critical risk as it exposes API keys, database credentials, JWT secrets, and third-party tokens to anyone with access to the source code (or anyone who has previously had access).

Deleting a secret from the latest commit is NOT enough, as it remains in the Git history.

**Recommended immediate response:**
1. Identify all exposed secrets.
2. Revoke and rotate the compromised secrets immediately across affected third-party providers.
3. Generate new credentials.
4. Move secrets to environment variables (e.g. `.env`) and a secure platform secrets manager.
5. Remove all secrets from active source files.
6. Purge sensitive Git history (e.g., using BFG Repo-Cleaner) if appropriate for the team's operational context.
7. Review available access/audit logs to determine if the compromised credentials were actively exploited.
8. Add automated secret scanning and pre-commit checks to prevent recurrence.

## Direct Database Access from Frontend

The scenario states that the frontend accesses the database directly. This architecture pattern (Browser → Database) is inherently dangerous.

- **Exposed Credentials**: To access the database from the browser, database credentials or connection strings must be exposed to the client.
- **Bypassed Authorization**: Client-side code cannot be trusted. Malicious users can intercept the database connection or modify queries to bypass intended UI restrictions.
- **Data Integrity**: Centralised business rules cannot be enforced reliably if clients perform raw SQL writes.
- **Schema Leakage**: The database schema is fully exposed to the public.

**Target Architecture:**
All privileged database operations must execute in a trusted server environment:
`Browser → Server API → Auth / Validation → Service → Repository → Database`

## Business Logic in Route Handlers

The scenario explicitly mentions business logic embedded in route handlers. When a single route handler is responsible for parsing requests, validating input, checking authorization, applying business rules, writing SQL, handling transactions, and formatting responses, it leads to:
- Tight coupling of HTTP concerns and business domain rules.
- Extremely difficult unit testing (requiring mocked HTTP contexts).
- Duplicated rules across different routes.
- Inconsistent error handling.
- Increased risk of transaction management failures.

**Proposed Solution:**
Adopt a tiered architecture separating responsibilities:
- **Route**: HTTP concerns (request extraction, response formatting).
- **Service**: Domain business rules and authorization orchestration.
- **Repository**: Database queries and persistence.

*(The LeadNexa Task A implementation demonstrates the target separation proposed here.)*

## No Automated Tests

Immediate large-scale refactoring of a system without automated tests is highly dangerous. Without tests, any structural change risks introducing silent regressions.

**Important Principle:** Do NOT start by rewriting everything.

First, add **characterisation and behavioural tests** around the most critical, existing behaviours. Examples include:
- Authentication and authorization flows.
- High-risk API endpoints.
- Critical data-changing workflows (e.g. Lead assignment or status changes).

These integration tests provide a safety net, allowing developers to refactor the internals with confidence that the external API contract remains intact.

## Other Assessment Areas

Beyond the explicitly stated issues, I would inspect the following areas to fully assess system health:
- **Dependency health**: Are there known CVEs in third-party packages?
- **Framework versions**: Is the runtime outdated or deprecated?
- **Database schema**: Are migrations tracked? Are foreign keys and constraints properly enforced?
- **Error handling**: Are raw SQL errors leaking to the frontend?
- **Monitoring/Logging**: Are critical operations audited? Is there enough context to diagnose a production outage?
- **CI/CD**: Is there an automated deployment and rollback capability?
- **Performance**: Are there obvious N+1 query patterns or missing database indexes?

## First 24 Hours

A practical operational sequence upon taking ownership:

**0–2 hours:**
- Freeze risky deployments if necessary.
- Identify all exposed credentials in the repository.
- Rotate and revoke critical secrets (DB passwords, JWT secrets, payment API keys).

**2–6 hours:**
- Map the architecture and critical API endpoints.
- Inspect authentication and database boundaries.
- Understand production dependencies and environment configurations.

**6–12 hours:**
- Add initial smoke and characterisation tests around critical business flows.
- Capture and lock in the current API behaviour to establish a regression baseline.

**12–24 hours:**
- Introduce a safe server boundary for the highest-risk direct DB access points.
- Establish a basic CI baseline (linting/type-checking).
- Document a detailed migration plan for the wider team.

*Note: AI-assisted tools were used to help structure/refine this documentation, while the architectural decisions and final content were reviewed against the assignment requirements.*
