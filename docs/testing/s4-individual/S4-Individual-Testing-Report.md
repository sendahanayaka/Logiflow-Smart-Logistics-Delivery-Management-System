# Individual Testing Report — S4

| Field | Details |
|-------|---------|
| **Student Name** | Aathif Azeez |
| **Student ID** | _[ADD YOUR ID]_ |
| **Group ID** | _[ADD GROUP ID]_ |
| **Project** | LogiFlow — Smart Logistics & Delivery Management |
| **GitHub Repository** | https://github.com/sendahanayaka/Logiflow-Smart-Logistics-Delivery-Management-System |
| **GitHub Username** | aathifazeez |
| **Testing Area Owned** | S4 — Delivery Execution & Tracking (driver portal, admin/operations portal excl. fleet management, routing agent, integration owner) |

> **Note:** This document covers my **individual functional testing**. Non-functional testing (performance, security, accessibility) is a **group/whole-system** deliverable and is reported separately in `nonfunctional/00-nonfunctional-testing.md`.

---

## 1. Introduction
This report presents my individual testing contribution to the LogiFlow system built for SE3090. My component is **S4 — Delivery Execution & Tracking**: the stage that takes a warehouse-grouped dispatch through agentic route planning, a human-approval gate, execution and live tracking to a completed delivery, plus the driver portal, the admin/operations portal (excluding fleet management) and the Route Planning & Notification agent. The purpose of this testing was to verify the correctness, data integrity, agent safety and authorization of my component using suitable tools and frameworks, and to record results, defects, fixes and retesting.

## 2. Assigned Component and Responsibilities
My assigned slice is **S4 — Delivery Execution & Tracking**. Testing responsibilities:
- Shipment lifecycle: start run, en-route/arrived events, proof of delivery, completion.
- Driver portal: my-runs (ownership), run detail, and **ending an assignment** (freeing driver + vehicle).
- Admin/ops portal: agent workflow run, approval/reject/revise gate, shipment tracking.
- Routing agent: stop sequencing, ETA engine, OSRM/haversine fallback, LLM narration + safe-failure, prompt-injection defence.
- Notifications and customer↔driver messaging.
- Data integrity for S4 entities (shipment, route stop, tracking event, notification, message, agent workflow).
- The integrated delivery workflow (end-to-end) and authorization boundaries.

## 3. Individual Testing Objectives
- Verify shipment/run lifecycle and tracking behaviour.
- Verify the human-approval gate and that reject/revise never execute.
- Verify the agent is safe: structured output, business-rule compliance, prompt-injection resistance, graceful fallback.
- Verify data integrity (constraints, relationships, transactions, migrations) of S4 entities.
- Verify validation and authorization (driver sees only own runs; role/auth enforced).
- Demonstrate one complete integrated workflow.
- Identify defects and perform retesting after fixes.

## 4. Testing Scope
**In scope:** driver portal (runs, run detail, start/arrive/POD, end-assignment); admin/ops portal (approvals, agent monitor, AI planning, shipment tracking); S4 services & controllers (Shipment, AgentWorkflow, Approval, Notification, Messaging); the routing agent; S4 persistence; the integrated delivery workflow.
**Out of scope (teammates / group):** fleet management CRUD (S2), customer order creation & checkout (S1), warehouse intake/inventory/dispatch internals (S3), and non-functional testing (group).

---

## 5. Test Plan

### 5.1 Testing areas and tools
| Area | Tool / Framework | What I tested | Case types |
|------|------------------|---------------|-----------|
| Backend / API | xUnit + FluentAssertions + `WebApplicationFactory` | services + controllers: shipment lifecycle, workflow, approval, notifications, messaging, auth | normal, invalid, boundary, failure, auth |
| Database | EF Core + **SQLite in-memory** | S4 entities: FK/unique/not-null, relationships, cascade, transaction, migration | constraint, relationship, transaction, migration |
| Agentic AI | **pytest** + pytest-cov | routing agent: structured output, business rules, prompt-injection, approval, safe-failure | normal, boundary, failure, security |
| React Web | **Vitest** + React Testing Library | driver/admin/tracking/notifications components + **form validation** | component, form-validation, UI-state, auth |
| Flutter Mobile | **flutter_test** | driver runs + tracking: model parsing + widgets | unit, widget |
| Integration / E2E | **Postman + Newman** | full delivery workflow (live) + authz negatives | end-to-end, auth |

### 5.2 Test environment
| Item | Value |
|------|-------|
| OS | macOS (Darwin) |
| Backend | ASP.NET Core .NET 8 |
| Database (prod/test) | PostgreSQL 15 / EF Core SQLite in-memory + InMemory |
| Web | React + Vite; Vitest (jsdom) — **run on Node 22** |
| Agent | Python 3.11 (FastAPI/LangGraph; tests use deterministic fallbacks, no live LLM) |
| Mobile | Flutter (Android target) |
| E2E | Postman/Newman against the live deployment (Render) |
| Repository / CI | GitHub; CI runs the suites on push |

### 5.3 Responsibilities & schedule
Individual plan — I designed, implemented, executed and documented all tests below, and own the related defects/fixes. Schedule: Test Plan → Backend → Database → Agent → Web → Mobile → E2E → Defect Report → Execution Summary → evidence assembly.

**Defect severity scale:** Critical (core blocked/data loss/security) · High (major feature broken) · Medium (incorrect in some cases) · Low (minor). **Priority:** P1 immediate · P2 before submission · P3 if time.

---

## 6. Test Case Document

> Legend — **Type:** N normal · I invalid · B boundary · F failure · A auth/ownership · INT integration · Sec security.

### 6.1 Backend / API (xUnit) — 159 tests pass (156 unit + 3 integration)
| ID | Type | Feature | Steps / Input | Expected | Actual | Status |
|----|------|---------|---------------|----------|--------|--------|
| BE-SH-01 | N | Tracking timeline | GetTracking(id) | 2 stops ordered, no actuals | As expected | Pass |
| BE-SH-02 | B | Late arrival recompute | arrive s1 +10 min | s2 ETA shifts +10 | As expected | Pass |
| BE-SH-03 | N | POD completes shipment | POD s1 then s2 | Delivered + CompletedAt | As expected | Pass |
| BE-SH-04 | F | Duplicate POD | POD s1 twice | Throws | As expected | Pass |
| BE-SH-05 | F | Unknown shipment | event on bad id | Throws | As expected | Pass |
| BE-SH-06 | A | My-runs ownership | GetMyRuns as driver | Only own shipment | As expected | Pass |
| BE-SH-07 | B | My-runs no profile | no linked driver | Empty list | As expected | Pass |
| BE-SH-08 | N | Start run | status=Created | → Dispatched; first stop EnRoute | As expected | Pass |
| BE-SH-09 | F | Start finished run *(new)* | status=Delivered | Throws "can no longer be started" | As expected | Pass |
| BE-AW-01…09 | N/B/F/I | AgentWorkflowService (persist at gate, enrich stops, payload distinct+ISO, safe-failure, unreachable, no-stops throws, empty batch id, get/null, persist allocation) | per test | per test | As expected | Pass |
| BE-AP-01…06 | N/I/F | ApprovalService (approve assigns+completes, approve w/o driver throws, reject, revise no-agent-call, already-decided throws, unknown throws) | per test | per test | As expected | Pass |
| BE-ETA-01…10 | N/B/F | EtaEngine (cumulative, service time, leg mismatch throws, derive-from-distance, window bounds, late recompute, validate good/impossible/non-monotonic/window-miss) | per test | per test | As expected | Pass |
| BE-TL-01…02 | N | TimelineBuilder (merge planned+actual, order by sequence) | per test | per test | As expected | Pass |
| BE-NT-01…02 | N | NotificationService (list mine newest+unread; mark-all read) | per test | per test | As expected | Pass |
| BE-MS-01…03 | N/A/I | MessagingService (send+read; non-participant blocked; empty rejected) | per test | per test | As expected | Pass |
| BE-EA-01 | N | End my assignment *(new)* | active assignment | driver + vehicle → Available; inactive | As expected | Pass |
| BE-EA-02 | F | End — no active assignment *(new)* | no active | Throws InvalidOperation | As expected | Pass |
| BE-EA-03 | F | End — no driver profile *(new)* | user not linked | Throws KeyNotFound | As expected | Pass |
| BE-INT-01 | A | Workflow trigger needs auth | no token | 401 | As expected | Pass |
| BE-INT-02 | A | Role enforcement | DRIVER token | 403 (ADMIN only) | As expected | Pass |
| BE-INT-03 | INT | **Full flow** trigger→approve→drive→track | seeded batch | workflow completes; tracking reflects progress | As expected | Pass |

### 6.2 Database (EF Core + SQLite) — 10 tests pass
| ID | Type | Feature | Expected | Actual | Status |
|----|------|---------|----------|--------|--------|
| DB-CON-01 | Constraint (unique) | `Shipment.ShipmentCode` unique | duplicate → DbUpdateException | As expected | Pass |
| DB-CON-02 | Constraint (unique) | `(AgentWorkflowId, Sequence)` unique | duplicate seq → throws | As expected | Pass |
| DB-CON-03 | Constraint (unique) | `WorkflowKey` unique | duplicate key → throws | As expected | Pass |
| DB-CON-04 | Constraint (FK) | TrackingEvent → unknown shipment | FK violation | As expected | Pass |
| DB-REL-01 | Relationship (cascade) | delete workflow | cascades stops + shipment + tracking | As expected | Pass |
| DB-REL-02 | Relationship (nav) | load shipment graph | workflow + 2 stops + 1 tracking | As expected | Pass |
| DB-TXN-01 | Transaction | rollback | nothing persisted | As expected | Pass |
| DB-TXN-02 | Transaction | commit | row persisted | As expected | Pass |
| DB-MIG-01 | Schema/migration | EnsureCreated | all S4 tables created | As expected | Pass |
| DB-MIG-02 | Migration integrity | GetMigrations() | S4 migrations present | As expected | Pass |

### 6.3 Agentic AI (pytest) — 146 pass, 1 skipped, 1 deselected
| ID | Type | Agentic area | Expected | Actual | Status |
|----|------|--------------|----------|--------|--------|
| AG-01/02 | N | Task completion (ETAs ordered, totals consistent, run to gate) | plan computed, pauses at gate | As expected | Pass |
| AG-03 | N | Structured-output validation | output matches routing schema | As expected | Pass |
| AG-04/05 | N/B | Sequencing (nearest-neighbour, window tie-break) | correct order | As expected | Pass |
| AG-06/07/08 | N/B/F | ETA engine (cumulative, on-time, leg mismatch raises) | correct / raises | As expected | Pass |
| AG-09 | F | Tool fallback (OSRM→haversine) | never breaks | As expected | Pass |
| AG-10 | N | Business-rule compliance (fragile; deterministic overrides LLM) | respected | As expected | Pass |
| AG-11/12 | A/F | Approval enforcement (pauses at gate; reject no-execute) | gate enforced | As expected | Pass |
| AG-13 | Sec | Prompt-injection treated as data | gate still enforced | As expected | Pass |
| AG-14 | F | Safe-failure (tool raises) | flagged, not corrupted | As expected | Pass |
| AG-15/16 | N/F | LLM narration (uses text when up; fallback when down) | correct | As expected | Pass |
| AG-DM-01 | F | Driver message safe-failure *(new)* | per-stage fallback when LLM down | As expected | Pass |
| AG-DM-02 | B | Driver message unknown stage *(new)* | safe generic fallback | As expected | Pass |
| AG-DM-03 | Sec | Driver message injection *(new)* | malicious context not emitted | As expected | Pass |

### 6.4 React Web (Vitest + RTL) — 107 tests pass (26 files) · run on Node 22
| ID | Type | Component / Feature | Expected | Actual | Status |
|----|------|---------------------|----------|--------|--------|
| WEB-DR-01…03 | N/B | driverRun helpers (finished stops, active stop, complete) | correct | As expected | Pass |
| WEB-SB-01…02 | N | statusBadge mapping | correct class / fallback | As expected | Pass |
| WEB-RC-01…02 | N | DriverRunCard (render, onOpen) | code/status/progress; callback | As expected | Pass |
| WEB-WP-01…02 | N/F | WorkflowPipeline (6 stages; safe-failure msg) | correct | As expected | Pass |
| WEB-AP-01 | N | AIPlanningPage renders header + picker | renders | As expected | Pass |
| WEB-PR-01 | A | ProtectedRoute gating | redirects unauthenticated | As expected | Pass |
| WEB-NAV-01…02 | N | Navbar auth/logout | logout + session clear | As expected | Pass |
| WEB-DRD-01 | N | DriverRunDetail end-assignment button *(new)* | shown when complete | As expected | Pass |
| WEB-DRD-02 | N | DriverRunDetail interaction *(new)* | mutation + confirmation | As expected | Pass |
| WEB-DRD-03 | B | DriverRunDetail negative *(new)* | hidden mid-run | As expected | Pass |
| WEB-NB-01…04 | N/B | NotificationBell *(new)* | badge count / 9+ cap / no-badge / panel + mark-all | As expected | Pass |
| WEB-VAL-01…03 | I/N | OrderForm recipient validation *(new)* | required + 10-digit; valid submits | As expected | Pass |
| WEB-VAL-04…07 | I/B/N | DriverForm validation *(new)* | name letters / phone 10-digit / licence >1 month / valid submits | As expected | Pass |

### 6.5 Flutter Mobile (flutter_test) — 35 tests pass
| ID | Type | Feature | Expected | Actual | Status |
|----|------|---------|----------|--------|--------|
| MOB-DR-01…09 | N/B | Driver model parsing (run row, run detail ordered stops, approval, isActive, status labels) | parsed/mapped | As expected | Pass |
| MOB-CT-01…04 | N/B | Customer tracking models (dispatched+ETA, delivered, preparing, TimeSpan serialize) | correct | As expected | Pass |
| MOB-W-01 | Widget | DriverRunsPage renders a run *(new)* | shows `SHP-M-001`, `1 / 4` | As expected | Pass |
| MOB-W-02 | Widget | DriverRunsPage empty state *(new)* | "No delivery runs yet" | As expected | Pass |

### 6.6 Integration / E2E (Postman + Newman) — 12 requests, 16 assertions pass (live)
| ID | Type | Step | Expected | Actual | Status |
|----|------|------|----------|--------|--------|
| E2E-01 | N | Customer registers | 200/201 | As expected | Pass |
| E2E-02 | N | Customer login | 200 + JWT | As expected | Pass |
| E2E-03 | N | Create order | 201 + id | As expected | Pass |
| E2E-04 | N | Read order | 200; Pending | As expected | Pass |
| E2E-05 | N | Admin login | 200 + JWT | As expected | Pass |
| E2E-06 | N | Admin list workflows | 200 array | As expected | Pass |
| E2E-07 | N | Admin list shipments | 200 array | As expected | Pass |
| E2E-08 | N | Admin track shipment | 200 + stops | As expected | Pass |
| E2E-09 | N | Driver login | 200 + JWT | As expected | Pass |
| E2E-10 | A | Driver my-runs | 200 array (own) | As expected | Pass |
| E2E-11 | A/F | Driver triggers workflow | 403 | As expected | Pass |
| E2E-12 | A/F | Unauthenticated lists shipments | 401 | As expected | Pass |

---

## 7. Defect / Bug Report

| ID | Title | Severity/Priority | Status |
|----|-------|-------------------|--------|
| DEF-01 | S3 dispatch validation fails on first use after idle (12s timeout vs ~43s cold start) | High / P1 | Fixed & retested |
| DEF-02 | Order checkout broken in deployment (hardcoded `localhost:5000`) | High / P1 | Fixed & retested |
| DEF-03 | Browser calls the internal agent directly (`localhost:8000`) | High / P1 | Fixed & retested |
| DEF-04 | Agent cannot reach backend — `BACKEND_API_BASE_URL` unset | High / P1 | Fixed & retested |
| DEF-05 | Inventory "Edit package" modal unstable | Medium / P2 | Fixed & retested |
| DEF-06 | Duplicate `CreateDeliveryOrderRequestValidator` (DI ambiguity) | Medium / P2 | Fixed & retested |
| DEF-07 | Vitest crashes on repo's Node 20.20 (`markAsUncloneable`) | Medium / P2 | Workaround (Node 22) |
| DEF-08 | Agent integration test not self-contained offline | Low / P3 | Open (mitigated) |

**Evidence & retest traceability** (commit links = contribution evidence; screenshots in `evidence/`):

| ID | Fix commit / PR | Retest proof | Evidence (before → after) |
|----|-----------------|--------------|----------------------------|
| DEF-01 | `e69c843` (merge `7b7de66`) | dispatch succeeds; 159 backend tests pass | `def-01-before.png` → `def-01-after.png` |
| DEF-02 | PR #27 (`f2027c6`,`d846b24`) | web build clean; checkout reaches backend | `def-02-before.png` → `def-02-after.png` |
| DEF-03 | PR #27 | agent reachable via `/api/agent/*`; 159 tests | `def-03-before.png` → `def-03-after.png` |
| DEF-04 | Render env vars | S3 resolves real context | `def-04-before.png` → `def-04-after.png` |
| DEF-05 | `feature/validation-ux-pass` *(pending)* | web build clean; modal stable | `def-05-before.png` → `def-05-after.png` |
| DEF-06 | `feature/validation-ux-pass` *(pending)* | 159 tests pass (single validator) | `def-06-before.png` → `def-06-after.png` |
| DEF-07 | env workaround (Node 22) | 107 web tests pass on Node 22 | `def-07-before.png` → `def-07-after.png` |
| DEF-08 | open (mitigated by deselect) | 146 agent tests pass | `def-08-after.png` |

**Representative detail (full report in `03-defect-report.md`):**
- **DEF-01** — *Repro:* idle >15 min, then dispatch. *Cause:* backend S3 client timeout 12s < agent cold start (~43s, verified: warm 0.9s). *Fix:* timeouts 12s/30s → 60s (`Program.cs`, commit `e69c843`). *Retest:* dispatch succeeds; 159 tests pass.
- **DEF-02/03** — *Cause:* hardcoded `localhost`; browser can't reach deployed services / present the internal key. *Fix:* use `API_BASE_URL`; add backend `/api/agent/*` passthrough (PR #27). *Retest:* web build clean; agent reachable via backend.
- **DEF-05/06** — *Fix:* portal-render the modal; remove duplicate validator (branch `feature/validation-ux-pass`). *Retest:* build + 159 tests pass.
- **DEF-07** — *Cause:* jsdom v30 `undici` needs Node 22. *Workaround:* run web tests on Node 22. *Retest:* 107 web tests pass.

---

## 8. Test Execution Summary

| Area | Tool | Executed | Passed | Failed |
|------|------|----------|--------|--------|
| Backend / API | xUnit + WebApplicationFactory | 159 (156 unit + 3 integration) | 159 | 0 |
| Database | EF Core + SQLite *(within the 156 unit)* | 10 | 10 | 0 |
| Agentic AI | pytest | 146 (+1 skipped, 1 deselected) | 146 | 0 |
| React Web | Vitest + RTL | 107 (26 files) | 107 | 0 |
| Flutter Mobile | flutter_test | 35 | 35 | 0 |
| Integration / E2E | Postman + Newman | 16 assertions / 12 requests | 16 | 0 |

**Totals:** **447 automated tests + 16 E2E assertions — all passing, 0 failed.** 125 documented test cases. **33 tests personally authored** this assessment + the E2E collection. **Coverage:** backend S4 ~63%, agent 85% (routing agent 100%), web helpers 100% / NotificationBell 57% / DriverRunDetail 75%.

**Defects:** 8 recorded — 6 fixed & retested, 1 workaround, 1 deferred-with-mitigation; the three P1 deployment defects are resolved and retested.

**Conclusion:** The S4 slice is tested in a planned, tool-based way across backend, database, agentic AI, web, mobile and a live end-to-end workflow, with meaningful normal/invalid/boundary/failure/authorization coverage. Defects found during testing (including three production-blocking deployment defects) were fixed and retested. The evidence (test source, coverage, Newman output, git history) is reproducible and demonstrable for the viva.

---

## 9. Tool-Generated Evidence

> **How to use this section:** each item has (a) a one-line caption of exactly what to capture, (b) the command to run, and (c) an image link to the file you drop into `evidence/`. Replace the placeholder by saving the screenshot at the given path.

### 9.1 Backend / API (xUnit)
📷 **`evidence/be-01-suite.png`** — terminal: `dotnet test LogiFlow.sln` → `Passed! … 156` (unit) and `Passed! … 3` (integration), 0 failed.
`![Backend test suite](evidence/be-01-suite.png)`
> command: `cd backend && dotnet test LogiFlow.sln`

📷 **`evidence/be-02-newtests.png`** — terminal: the 4 new tests passing.
`![Backend new tests](evidence/be-02-newtests.png)`
> command: `dotnet test tests/LogiFlow.UnitTests/LogiFlow.UnitTests.csproj --filter "FullyQualifiedName~DriverEndAssignmentTests|FullyQualifiedName~StartRun_WhenShipmentAlreadyDelivered"`

📷 **`evidence/be-03-coverage.png`** — coverage summary (ShipmentService 68%, EtaEngine 92%, …).
`![Backend coverage](evidence/be-03-coverage.png)`
> command: `cat docs/testing/s4-individual/evidence/coverage-backend/Summary.txt` (or open `coverage-backend/index.html`)

📷 **`evidence/be-file-endassignment.png`** — **test file**: `DriverEndAssignmentTests.cs` open in the editor (my new BE-EA tests).
`![Backend test file](evidence/be-file-endassignment.png)`

### 9.2 Database (SQLite)
📷 **`evidence/db-01-suite.png`** — terminal: `--filter DeliveryDatabaseTests` → `Passed! … 10`.
`![Database tests](evidence/db-01-suite.png)`
> command: `cd backend && dotnet test tests/LogiFlow.UnitTests/LogiFlow.UnitTests.csproj --filter "FullyQualifiedName~DeliveryDatabaseTests"`

📷 **`evidence/db-file.png`** — **test file**: `DeliveryDatabaseTests.cs` (constraint/relationship/transaction/migration tests).
`![Database test file](evidence/db-file.png)`

### 9.3 Agentic AI (pytest)
📷 **`evidence/ag-01-suite.png`** — terminal: pytest run `146 passed, 1 skipped` **with the coverage table**.
`![Agent tests + coverage](evidence/ag-01-suite.png)`
> command: `cd agent-service && .venv/bin/python -m pytest --deselect tests/test_routing_integration.py::test_graph_resume_with_approval_completes --cov=app --cov-report=term-missing`

📷 **`evidence/ag-02-newtests.png`** — terminal: the 3 new driver-message tests passing.
`![Agent new tests](evidence/ag-02-newtests.png)`
> command: `.venv/bin/python -m pytest tests/test_driver_message.py -v`

📷 **`evidence/ag-file.png`** — **test file**: `tests/test_driver_message.py` (safe-failure / injection tests).
`![Agent test file](evidence/ag-file.png)`

### 9.4 React Web (Vitest)
📷 **`evidence/web-01-suite.png`** — terminal: `Test Files 26 passed · Tests 107 passed` (Node 22).
`![Web test suite](evidence/web-01-suite.png)`
> command: `cd web && /usr/local/bin/node ./node_modules/vitest/vitest.mjs run`

📷 **`evidence/web-02-newtests.png`** — terminal: the new component + form-validation tests passing.
`![Web new tests](evidence/web-02-newtests.png)`
> command: `/usr/local/bin/node ./node_modules/vitest/vitest.mjs run src/features/delivery/components/DriverRunDetail.test.tsx src/features/notifications/NotificationBell.test.tsx src/features/orders/components/OrderForm.test.tsx src/features/fleet/components/DriverForm.test.tsx`

📷 **`evidence/web-03-coverage.png`** — terminal/HTML: web coverage table (helpers 100%, NotificationBell 57%).
`![Web coverage](evidence/web-03-coverage.png)`

📷 **`evidence/web-file.png`** — **test file**: `DriverRunDetail.test.tsx` and/or `DriverForm.test.tsx` open in the editor.
`![Web test file](evidence/web-file.png)`

### 9.5 Flutter Mobile (flutter_test)
📷 **`evidence/mob-01-suite.png`** — terminal: `flutter test` → `All tests passed!` (35).
`![Mobile suite](evidence/mob-01-suite.png)`
> command: `cd mobile && flutter test`

📷 **`evidence/mob-02-widget.png`** — terminal: the new widget test file passing (`+2`).
`![Mobile widget tests](evidence/mob-02-widget.png)`
> command: `flutter test test/features/driver/driver_runs_page_test.dart`

📷 **`evidence/mob-file.png`** — **test file**: `driver_runs_page_test.dart` open in the editor.
`![Mobile test file](evidence/mob-file.png)`

### 9.6 Integration / E2E (Postman + Newman)
📷 **`evidence/e2e-01-newman-cli.png`** — terminal: Newman summary (12 requests, 16 assertions, 0 failed).
`![Newman CLI](evidence/e2e-01-newman-cli.png)`
> command: `newman run docs/testing/s4-individual/postman/LogiFlow-S4-E2E.postman_collection.json -e docs/testing/s4-individual/postman/LogiFlow-Render.postman_environment.json -r cli,htmlextra --reporter-htmlextra-export docs/testing/s4-individual/evidence/newman-report.html`

📷 **`evidence/e2e-02-newman-html.png`** — the Newman **HTML report** dashboard (open `evidence/newman-report.html`).
`![Newman HTML report](evidence/e2e-02-newman-html.png)`

📷 **`evidence/e2e-03-collection.png`** — **the collection** in Postman (or the collection JSON) showing the 12 requests.
`![E2E collection](evidence/e2e-03-collection.png)`

---

### Appendix — repository paths (git contribution evidence)
- Backend tests: `backend/tests/LogiFlow.UnitTests/…` (incl. `Fleet/DriverEndAssignmentTests.cs`, `Database/DeliveryDatabaseTests.cs`), `backend/tests/LogiFlow.IntegrationTests/…`
- Agent tests: `agent-service/tests/…` (incl. `test_driver_message.py`)
- Web tests: `web/src/features/**/**.test.tsx`
- Mobile tests: `mobile/test/features/driver/driver_runs_page_test.dart`
- E2E: `docs/testing/s4-individual/postman/`
