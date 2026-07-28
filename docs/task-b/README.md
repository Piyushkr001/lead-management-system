# Task B — Inherited Codebase Modernisation

This directory contains the documentation deliverables for **Task B: Architectural Assessment and Migration Strategy**. 

The documents outline a proposed modernisation strategy for the inherited codebase scenario described in the qualification assignment. The inherited application starts from a degraded state (no tests, business logic in routes, frontend database access, committed secrets).

## Contents

1. [01-assessment.md](./01-assessment.md) — Technical assessment prioritising the highest production risks (security, DB access, testability).
2. [02-migration-plan.md](./02-migration-plan.md) — A phased, non-big-bang strategy to secure, refactor, and stabilise the application with minimal downtime.
3. [03-refactor-before-after.md](./03-refactor-before-after.md) — A concrete representative example demonstrating how a problematic HTTP Route is decoupled into a Route, Service, and Repository.
4. [04-engineering-standards.md](./04-engineering-standards.md) — Preventative guidelines spanning source control, security, testing, and observability to ensure technical debt does not return.

*Note: The LeadNexa Task A application serves as the architectural reference for the "After" target state proposed in these documents. Task A code was not modified unnecessarily to complete this documentation exercise.*
