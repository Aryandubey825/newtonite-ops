# Engineering Decisions & Architectural Trade-offs
**Challenge:** Newtonite Software Engineering Challenge — *Operations Under Pressure*  
**System:** High-Integrity Cross-Team Operational Work Item Platform  

---

## Executive Overview
Newtonite’s evaluation framework explicitly prioritizes **engineering judgement over feature count**. In high-pressure operational systems, superficial CRUD apps inevitably fail when subject to race conditions, rapid retries, stale browser tabs, or multi-tenant authorization gaps. 

This document details the six architectural decisions that govern our design, including the options considered, our final choice, and the inherent engineering trade-offs.

---

## Decision 1: Concurrency Control Strategy (Atomic Claims vs. Optimistic Locking)

### Context:
Operational workflows suffer from two distinct concurrency hazards:
1. **The Instant Race:** Multiple operators simultaneously click "Claim" on a newly dropped `URGENT` incident.
2. **The Stale Overwrite:** Operator A opens a ticket in tab 1, Operator B modifies priority in tab 2, and Operator A subsequently clicks "Save" without refreshing, risking silent data loss (the Lost Update Anomaly).

### Options Considered:
* **Option A: Pessimistic Row Locking (`SELECT FOR UPDATE`):** Holds database locks for the duration of user inspection.
* **Option B: Pure Application-Level Checks (`if (!item.assignee) update(...)`):** Checks state in memory before issuing updates.
* **Option C: Hybrid Model: Atomic Conditional Updates for Claims + Optimistic Concurrency Control (OCC) with Integer Versioning for Edits.**

### Decision & Implementation:
We chose **Option C**.
* **For Claims:** An atomic conditional update is executed directly against the database:
  ```sql
  UPDATE work_items 
  SET assignee_id = :userId, status = 'IN_PROGRESS', version = version + 1
  WHERE id = :itemId AND assignee_id IS NULL AND status = 'OPEN';
  ```
  If 0 rows are affected, the engine immediately yields `409 Conflict` (`"Item already claimed by another operator"`). This guarantees zero double-claims without holding long-lived transactions.
* **For Edits:** Every `WorkItem` record contains a monotonically increasing integer `version` column. Clients must submit their known `version` in mutation payloads (`PATCH /items/:id`). If the version in the database has progressed, the write is aborted, returning `409 Conflict` with the latest server state so the frontend can reconcile.

### Trade-offs:
* *Positive:* Zero lock contention, scales linearly with database connection pools, completely prevents lost updates.
* *Negative:* On high write collisions, rejected operators experience retry overhead, requiring intuitive frontend error recovery.

---

## Decision 2: Historical Audit Integrity & Co-Transactional Dual-Writes

### Context:
When handling regulatory, security, and financial operations (e.g. KYC alerts, ACH settlement failures), history can never disagree with the current state of a work item.

### Options Considered:
* **Option A: Event-Driven Audit via Asynchronous Message Bus:** Work item updates commit immediately; background event handlers write to the activity table.
* **Option B: Database Triggers:** PostgreSQL triggers on `AFTER UPDATE` to insert into `activity_events`.
* **Option C: Strict Co-Transactional Application Writes (`prisma.$transaction`).**

### Decision & Implementation:
We chose **Option C**.
Every mutative action (creation, assignment, priority escalation, state transition, comment) executes inside a single ACID database transaction:
```typescript
await prisma.$transaction(async (tx) => {
  const updated = await tx.workItem.update(...);
  await recordActivityInTx(tx, { workItemId, actorId, eventType, oldState, newState });
  await createOutboxJobInTx(tx, eventType, payload);
});
```
If the activity log insertion or outbox entry fails, the work item mutation rolls back entirely.

### Trade-offs:
* *Positive:* Absolute linearizability. Discrepancy between current state and historical audit logs is mathematically impossible.
* *Negative:* Transactions hold database connections slightly longer (typically 2–5ms).

---

## Decision 3: Authorization Architecture (Resource-Level & Team-Scoped RBAC)

### Context:
Users belong to multiple teams (SecOps, Payments, Infra, Compliance) and carry distinct roles in each (`VIEWER`, `MEMBER`, `LEAD`, `ADMIN`). A SecOps operator must never be permitted to inspect or mutate confidential Payments items, and a standard Member must never pass an approval gate.

### Options Considered:
* **Option A: Client-Side UI Route Guards:** Hide buttons based on JWT claims.
* **Option B: Distributed Policy Engine (OPA / Casbin):** External authorization daemon.
* **Option C: Unified Server-Side Domain Function & Team-Scoped RBAC Middleware.**

### Decision & Implementation:
We chose **Option C**.
Client-side button toggling is treated strictly as an ergonomic UX affordance, never security. Every API endpoint enforces authorization via a centralized domain guard (`assertMinimumRole` and `validateStateTransition`):
1. **Team Isolation:** Queries enforce `WHERE team_id IN (user_team_ids)`. Cross-team queries return `403 Forbidden`.
2. **Approval Gate:** The transition `AWAITING_APPROVAL -> RESOLVED` enforces `userRole === 'LEAD' || userRole === 'ADMIN'`. Unauthorized transition attempts by Members yield `403 Forbidden`.

### Trade-offs:
* *Positive:* Eliminates IDOR (Insecure Direct Object Reference) vulnerabilities; logic is colocated with domain services and 100% testable via unit and integration tests.
* *Negative:* Every mutation requires loading team membership context.

---

## Decision 4: Synchronous vs. Asynchronous Side-Effects (The Transactional Outbox Pattern)

### Context:
When an incident is claimed or resolved, downstream systems (email notifications, webhooks, operator push alerts) must be notified. Triggering synchronous HTTP calls during request handling increases user-facing latency and risks orphaned side-effects if the downstream service is degraded.

### Options Considered:
* **Option A: Synchronous In-Line HTTP Calls:** Call webhook APIs inside the Express route handler.
* **Option B: In-Memory Background Queues (BullMQ / Redis):** Enqueue jobs to Redis.
* **Option C: PostgreSQL-Backed Transactional Outbox Pattern with Row-Level Locking (`FOR UPDATE SKIP LOCKED`).**

### Decision & Implementation:
We chose **Option C**.
An `outbox_jobs` table is updated *within the exact same database transaction* as the work item mutation. A lightweight background worker process continuously polls pending jobs using:
```sql
SELECT * FROM outbox_jobs 
WHERE status = 'PENDING' AND next_run_at <= NOW() 
ORDER BY created_at ASC LIMIT 10 
FOR UPDATE SKIP LOCKED;
```
If downstream dispatch succeeds, the job transitions to `COMPLETED`. If dispatch fails, exponential backoff is applied (`NOW() + 2^attempts * 1000ms`), capping at 5 attempts before transitioning to `FAILED` (Dead-Letter state).

### Trade-offs:
* *Positive:* 100% at-least-once delivery guarantee without introducing an external Redis dependency. Database crash or process restart loses zero notifications.
* *Negative:* Polling introduces 1–2 seconds of eventual consistency for notifications.

---

## Decision 5: Scale Awareness: Cursor Pagination vs. Offset Pagination

### Context:
Operational teams generate tens of thousands of work items and hundreds of thousands of activity events. The system must support deep scrolling without degrading database performance or introducing pagination drift.

### Options Considered:
* **Option A: Traditional Offset/Limit (`OFFSET 25000 LIMIT 25`):**
* **Option B: Keyset / Cursor-Based Pagination on Composite Tuple `(created_at, id)`.**

### Decision & Implementation:
We chose **Option B**.
* When querying a page, clients receive an opaque base64 cursor encoding `(createdAt, id)`.
* Subsequent page requests issue an index seek:
  ```sql
  WHERE (created_at, id) < (:cursorCreatedAt, :cursorId)
  ORDER BY created_at DESC, id DESC LIMIT 26;
  ```
* Backed by composite B-Tree indexes: `(team_id, status, created_at DESC, id DESC)`.

### Trade-offs:
* *Positive:* Stable $O(\log N)$ performance at 100,000+ items; immune to "page drift" when items are inserted while an operator is viewing the feed.
* *Negative:* Cannot jump directly to arbitrary page numbers (e.g., "Jump to Page 42"), which is unnecessary for operational real-time queues.

---

## Decision 6: Deliberate Non-Goals (What We Chose NOT to Build)

### Context:
Newtonite specifically advised: *"a smaller system with well-considered behaviour beats a large, half-finished one."*

### Excluded Features & Rationale:
1. **Public Signup Flow:** We seeded 10 authentic demo personas across 4 teams and built a 1-click role switcher. This allows reviewers to immediately test complex RBAC without wasting time creating test accounts.
2. **WebSockets:** Server-Sent Events or WebSockets add operational complexity. We implemented aggressive cache invalidation via TanStack Query and deterministic polling, which is sufficient for operational dashboards.
3. **File Attachments / S3 Uploads:** Adds storage dependencies without testing full-stack concurrency or systems thinking.
4. **Third-Party SSO / OAuth:** Seeded JWT authentication with bcrypt hashing provides testable security without requiring third-party credentials.

---

## Most Important Engineering Decision (Under 100 Words)

> **Our most important architectural decision was enforcing Co-Transactional Invariants across Work Items, Audit Logs, and the Outbox in a single database transaction.** 
> By binding state mutations, append-only history entries, and background event records into atomic transactions governed by Optimistic Concurrency Control (`version`), we mathematically guarantee that the system cannot produce phantom states, unrecorded mutations, or orphaned side effects. Concurrency collisions are cleanly intercepted at the database layer via atomic conditional writes, returning `409 Conflict` to trigger deterministic UI reconciliation rather than corrupting state.
