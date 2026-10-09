# Test Case Document — S4 (Individual)

**Project:** LogiFlow — Smart Logistics & Delivery Management
**Member / Slice:** Aathif Azeez — S4: Delivery Execution & Tracking
**Legend — Status:** Pass / Fail · **Type:** N = normal, I = invalid, B = boundary, F = failure, A = auth/ownership, INT = integration

> This document grows area-by-area. Section 1 (Backend/API) is complete. Database, Agent, Web, Mobile and E2E sections are appended as those steps are executed.

---

## Section 1 — Backend / API Testing (xUnit)

**Tool:** xUnit 2.9 + FluentAssertions + `WebApplicationFactory` · **How executed:** `dotnet test LogiFlow.sln`
**Result:** **149 tests passed, 0 failed** (146 unit + 3 integration) · **S4 line coverage:** 63.1% (report in `evidence/coverage-backend/`)
**Environment:** .NET 8, EF Core InMemory/SQLite test DB, macOS.

### 1.1 ShipmentService — tracking, run lifecycle, POD, ownership

| ID | Type | Feature | Preconditions | Steps / Input | Expected Result | Actual Result | Status |
|----|------|---------|---------------|---------------|-----------------|---------------|--------|
| BE-SH-01 | N | Get tracking timeline | Shipment with 2 ordered stops | `GetTrackingAsync(id)` | Returns 2 stops ordered by sequence; no actuals yet | As expected | Pass |
| BE-SH-02 | B | Late arrival recomputes ETAs | Stops planned 09:00/09:20 | Record ARRIVED at s1 10 min late | s2 planned ETA shifts +10 min | As expected | Pass |
| BE-SH-03 | N | POD completes shipment | Shipment in transit, 2 stops | Record POD for s1 then s2 | After s1: InTransit; after s2: Delivered + `CompletedAt` set | As expected | Pass |
| BE-SH-04 | F | Duplicate POD rejected | s1 already delivered | Record POD for s1 again | Throws `InvalidOperationException` | As expected | Pass |
| BE-SH-05 | F | Unknown shipment | — | Record stop event for random id | Throws (not found) | As expected | Pass |
| BE-SH-06 | A | My-runs ownership | 2 shipments: mine + another driver's | `GetMyRunsAsync()` as signed-in driver | Returns only the signed-in driver's shipment | As expected | Pass |
| BE-SH-07 | B | My-runs, no driver profile | Signed in but no linked Driver row | `GetMyRunsAsync()` | Returns empty list (no error) | As expected | Pass |
| BE-SH-08 | N | Start run | Shipment status = Created | `StartRunAsync(id)` | Status → Dispatched; first stop → EnRoute; Dispatched event added | As expected | Pass |
| BE-SH-09 | F | Start a finished run *(new)* | Shipment status = Delivered | `StartRunAsync(id)` | Throws `InvalidOperationException` ("can no longer be started") | As expected | Pass |

### 1.2 AgentWorkflowService — routing workflow orchestration

| ID | Type | Feature | Preconditions | Steps / Input | Expected Result | Actual Result | Status |
|----|------|---------|---------------|---------------|-----------------|---------------|--------|
| BE-AW-01 | N | Persist workflow at approval gate | Valid run command | `RunWorkflowAsync` | Persisted AWAITING_APPROVAL with ordered stops | As expected | Pass |
| BE-AW-02 | N | Enrich agent stops with request data | Stops with addresses/windows | `RunWorkflowAsync` | Agent stops enriched from request | As expected | Pass |
| BE-AW-03 | B | Build payload: distinct orders + ISO windows | Duplicate order ids in input | `RunWorkflowAsync` | Payload has distinct order ids + ISO-8601 windows | As expected | Pass |
| BE-AW-04 | F | Agent safe-failure | Agent returns failure result | `RunWorkflowAsync` | Row persisted as Failed with error; no throw | As expected | Pass |
| BE-AW-05 | F | Agent unreachable | Agent client throws | `RunWorkflowAsync` | Failed row recorded, then exception propagated | As expected | Pass |
| BE-AW-06 | I | No stops | Command with empty stops | `RunWorkflowAsync` | Throws `ArgumentException` | As expected | Pass |
| BE-AW-07 | B | Empty dispatch batch id | Batch id empty | `RunWorkflowAsync` | Does not invent a batch id | As expected | Pass |
| BE-AW-08 | N | Get workflow / null | Persisted workflow + unknown id | `GetWorkflowAsync` | Returns persisted; null for unknown | As expected | Pass |
| BE-AW-09 | N | Persist agent allocation | Agent returns allocation | `RunWorkflowAsync` | Allocation persisted | As expected | Pass |

### 1.3 ApprovalService — human approval gate

| ID | Type | Feature | Preconditions | Steps / Input | Expected Result | Actual Result | Status |
|----|------|---------|---------------|---------------|-----------------|---------------|--------|
| BE-AP-01 | N | Approve assigns + completes | Workflow awaiting approval | Approve with driver+vehicle | Shipment created/assigned; workflow completed | As expected | Pass |
| BE-AP-02 | I | Approve without driver/vehicle | Awaiting approval | Approve, no driver/vehicle | Throws | As expected | Pass |
| BE-AP-03 | N | Reject | Awaiting approval | Reject | Marked Rejected; no shipment | As expected | Pass |
| BE-AP-04 | N | Revise keeps awaiting | Awaiting approval | Revise | Stays awaiting; no shipment; no agent call | As expected | Pass |
| BE-AP-05 | F | Decide when already decided | Already approved/rejected | Decide again | Throws | As expected | Pass |
| BE-AP-06 | F | Decide unknown workflow | — | Decide random id | Throws (not found) | As expected | Pass |

### 1.4 EtaEngine — ETA computation & plan validation

| ID | Type | Feature | Steps / Input | Expected Result | Actual Result | Status |
|----|------|---------|---------------|-----------------|---------------|--------|
| BE-ETA-01 | N | Cumulative ETA (no service time) | Leg durations | ETAs accumulate correctly | As expected | Pass |
| BE-ETA-02 | N | Service time between stops | Legs + service time | Service time added between stops | As expected | Pass |
| BE-ETA-03 | F | Leg/stop count mismatch | Mismatched counts | Throws | As expected | Pass |
| BE-ETA-04 | N | Derive legs from distance+speed | Distances | Legs derived from speed | As expected | Pass |
| BE-ETA-05 | B | Window bounds honoured | Stop windows | Both bounds respected | As expected | Pass |
| BE-ETA-06 | B | Recompute on late start | Later start time | Downstream ETAs shift | As expected | Pass |
| BE-ETA-07 | N | Validate good plan | Feasible plan | Validation OK | As expected | Pass |
| BE-ETA-08 | F | Impossible distance | Infeasible plan | Validation fails | As expected | Pass |
| BE-ETA-09 | F | Non-monotonic ETAs | Out-of-order ETAs | Validation fails | As expected | Pass |
| BE-ETA-10 | B | Window miss = warning | Slightly missed window | Warning, not a hard issue | As expected | Pass |

### 1.5 TimelineBuilder · NotificationService · MessagingService

| ID | Type | Feature | Steps / Input | Expected Result | Actual Result | Status |
|----|------|---------|---------------|-----------------|---------------|--------|
| BE-TL-01 | N | Merge planned stops with latest actual event | Planned + events | Timeline merges latest actual per stop | As expected | Pass |
| BE-TL-02 | N | Order timeline by sequence | Unordered input | Ordered by sequence | As expected | Pass |
| BE-NT-01 | N/A | List my notifications newest-first + unread count | Mixed notifications | Only mine, newest first, correct unread count | As expected | Pass |
| BE-NT-02 | N | Mark all read | Unread notifications | Unread count → 0 | As expected | Pass |
| BE-MS-01 | N | Customer send + read conversation | Customer + driver conversation | Message sent and readable by participant | As expected | Pass |
| BE-MS-02 | A | Non-participant cannot read | Third-party user | Read denied | As expected | Pass |
| BE-MS-03 | I | Empty message rejected | Blank message | Rejected | As expected | Pass |

### 1.6 Driver end-assignment — `FleetService.EndActiveAssignmentForUserAsync` *(new, my feature)*

| ID | Type | Feature | Preconditions | Steps / Input | Expected Result | Actual Result | Status |
|----|------|---------|---------------|---------------|-----------------|---------------|--------|
| BE-EA-01 | N | End my active assignment frees driver + vehicle | Driver(OnDelivery)+Vehicle(InTransit)+active assignment | `EndActiveAssignmentForUserAsync(userId)` | Assignment inactive; driver **and** vehicle → Available; `UnassignedAt` set | As expected | Pass |
| BE-EA-02 | F | No active assignment | Driver exists, no active assignment | `EndActiveAssignmentForUserAsync(userId)` | Throws `InvalidOperationException` | As expected | Pass |
| BE-EA-03 | F | No linked driver profile | User id not linked to any Driver | `EndActiveAssignmentForUserAsync(userId)` | Throws `KeyNotFoundException` | As expected | Pass |

### 1.7 API integration (`WebApplicationFactory`)

| ID | Type | Feature | Preconditions | Steps / Input | Expected Result | Actual Result | Status |
|----|------|---------|---------------|---------------|-----------------|---------------|--------|
| BE-INT-01 | A | Workflow trigger requires auth | No token | `POST /api/workflows` | 401 Unauthorized | As expected | Pass |
| BE-INT-02 | A | Role enforcement | DRIVER token | `POST /api/workflows` | 403 Forbidden (ADMIN only) | As expected | Pass |
| BE-INT-03 | INT | **Full delivery flow** | Seeded batch, ADMIN+DRIVER tokens | Trigger → approve → start/drive → track | Workflow completes; shipment dispatched; tracking reflects progress | As expected | Pass |

**Section 1 totals:** 42 cases documented here, executed via the backend suite (149 tests incl. parameterised cases) — **all Pass**. Coverage evidence: `evidence/coverage-backend/index.html`.

---

## Section 2 — Database Testing (EF Core + SQLite in-memory)

**Tool:** EF Core 8 + **SQLite in-memory** (`Microsoft.EntityFrameworkCore.Sqlite`) · **How executed:** `dotnet test --filter FullyQualifiedName~DeliveryDatabaseTests`
**Why SQLite:** unlike the EF Core in-memory provider, SQLite enforces **foreign keys, unique indexes, NOT NULL and real transactions**, so these test the actual schema generated from the model — without Docker/PostgreSQL.
**Result:** **10 tests passed, 0 failed.**

| ID | Type | Feature | Preconditions | Steps / Input | Expected Result | Actual Result | Status |
|----|------|---------|---------------|---------------|-----------------|---------------|--------|
| DB-CON-01 | Constraint (unique) | `Shipment.ShipmentCode` unique | 2 workflows seeded | Insert 2 shipments with the same `ShipmentCode` | `SaveChanges` throws `DbUpdateException` | As expected | Pass |
| DB-CON-02 | Constraint (unique composite) | `(AgentWorkflowId, Sequence)` unique | 1 workflow seeded | Insert 2 route stops with the same sequence in that workflow | Throws `DbUpdateException` | As expected | Pass |
| DB-CON-03 | Constraint (unique) | `AgentWorkflow.WorkflowKey` unique | fresh DB | Insert 2 workflows with the same key | Throws `DbUpdateException` | As expected | Pass |
| DB-CON-04 | Constraint (FK) | `TrackingEvent.ShipmentId` FK | fresh DB | Insert a tracking event for a non-existent shipment | FK violation → `DbUpdateException` | As expected | Pass |
| DB-REL-01 | Relationship (cascade) | Delete cascade across the S4 graph | workflow + 2 stops + shipment + tracking event | Delete the workflow (children untracked) | Stops, shipment **and** its tracking events all removed (counts → 0) | As expected | Pass |
| DB-REL-02 | Relationship (navigation) | Graph loads via navigations | full graph seeded | Reload shipment with `Include`s | `AgentWorkflow` loaded, 2 route stops, 1 tracking event | As expected | Pass |
| DB-TXN-01 | Transaction (rollback) | Atomicity on rollback | fresh DB | Begin tx, insert workflow+shipment, **rollback** | Fresh context shows 0 rows persisted | As expected | Pass |
| DB-TXN-02 | Transaction (commit) | Durability on commit | fresh DB | Begin tx, insert, **commit** | Fresh context shows the row persisted | As expected | Pass |
| DB-MIG-01 | Migration/schema | Model creates all S4 tables | fresh DB (`EnsureCreated`) | Query `sqlite_master` for table names | Shipments, AgentWorkflows, RouteStops, TrackingEvents, Notifications, Messages all exist | As expected | Pass |
| DB-MIG-02 | Migration integrity | S4 migrations tracked | — | `Database.GetMigrations()` | Contains `AddAgentWorkflowAllocation`, `AddNotifications`, `AddMessages` | As expected | Pass |

> **Note on migration *application*:** the committed migrations target PostgreSQL (Npgsql), so applying the raw migration SQL requires a real PostgreSQL instance (Testcontainers/Docker) — tracked as a group/non-functional activity. Here the model-generated schema and migration presence are verified offline via SQLite.

**Section 2 totals:** 10 cases — **all Pass** (constraint ×4, relationship ×2, transaction ×2, schema/migration ×2).

---

## Section 3 — Agentic AI Testing (pytest)

**Tool:** pytest 8.3 + pytest-cov · **How executed:** `python -m pytest` (deselecting one backend-dependent integration test — see note)
**Result:** **146 passed, 1 skipped, 1 deselected** · **Coverage:** 85% overall (`routing_agent.py` 100%, `routing_tools.py` 100%, `schemas/routing.py` 100%, `llm.py` 89%) — report in `evidence/coverage-agent/`.
**Approach:** fully offline/deterministic — LLM and OSRM calls are driven down their fallback paths, so results are reproducible without Ollama or a live routing server.

| ID | Type | Agentic area | Representative test(s) | Expected Result | Actual | Status |
|----|------|--------------|------------------------|-----------------|--------|--------|
| AG-01 | N | Task completion | `test_graph_runs_real_agent_to_gate_with_real_etas`, `test_run_etas_are_ordered_and_stamped` | Agent sequences stops, computes ordered ETAs, pauses at gate | As expected | Pass |
| AG-02 | N | Task completion | `test_run_totals_are_consistent` | Total distance/duration match the per-leg sums | As expected | Pass |
| AG-03 | N | Structured-output validation | `test_run_produces_schema_valid_output`, `test_stub_nodes_emit_schema_valid_output` | Output validates against the routing schema | As expected | Pass |
| AG-04 | N | Business logic (sequencing) | `test_sequencer_nearest_neighbour_order_from_depot`, `test_sequencer_visits_every_stop_once_with_contiguous_sequence` | Nearest-neighbour order; every stop visited once | As expected | Pass |
| AG-05 | B | Business logic (sequencing) | `test_sequencer_window_tiebreak_prefers_earlier_deadline` | Distance ties broken toward the earlier delivery deadline | As expected | Pass |
| AG-06 | N | ETA engine | `test_eta_basic_cumulative_no_service`, `test_eta_recompute_shifts_downstream_on_late_start` | Cumulative ETAs; late start shifts downstream | As expected | Pass |
| AG-07 | B | ETA engine | `test_eta_on_time_true_and_false`, `test_eta_early_arrival_flagged_not_on_time` | On-time flag honours both window bounds | As expected | Pass |
| AG-08 | F | ETA engine | `test_eta_leg_count_mismatch_raises` | Leg/stop count mismatch raises | As expected | Pass |
| AG-09 | F | Tool-selection / fallback | `test_network_error_falls_back_to_haversine`, `test_osrm_non_ok_code_falls_back` | OSRM unreachable/non-OK → haversine fallback (never breaks) | As expected | Pass |
| AG-10 | N | Business-rule compliance | `test_run_notifications_reflect_fragile`, `test_deterministic_overrides_llm` | Fragile handling reflected; deterministic values override LLM | As expected | Pass |
| AG-11 | A | Approval enforcement | `test_full_graph_pauses_at_human_gate`, `test_routing_node_pauses_at_gate_with_llm_summary` | Workflow pauses at the human-approval gate (no auto-execute) | As expected | Pass |
| AG-12 | F | Approval enforcement | `test_reject_does_not_execute` | Reject → no execution/dispatch | As expected | Pass |
| AG-13 | Sec | Prompt-injection | `test_prompt_injection_is_treated_as_data`, `test_graph_prompt_injection_still_pauses` | Customer-note instructions treated as data; gate still enforced | As expected | Pass |
| AG-14 | F | Safe-failure / recovery | `test_graph_safe_failure_when_a_tool_raises`, `test_safe_failure_flags_for_manual_handling` | Tool error → safe-failure flagged, workflow not corrupted | As expected | Pass |
| AG-15 | F | LLM narration fallback | `test_summarize_plan_falls_back_when_llm_unavailable`, `test_summarize_plan_empty_llm_text_falls_back` | LLM down/empty → deterministic summary template | As expected | Pass |
| AG-16 | N | LLM narration | `test_summarize_plan_uses_llm_text_when_available` | Uses LLM text when the model answers | As expected | Pass |
| AG-DM-01 | F | Driver message safe-failure *(new)* | `test_driver_message_falls_back_per_stage_when_llm_unavailable` | LLM unreachable → correct deterministic message per stage (PickedUp/InTransit/Delivered) | As expected | Pass |
| AG-DM-02 | B | Driver message boundary *(new)* | `test_driver_message_unknown_stage_returns_generic_fallback` | Unknown stage → safe non-empty generic message | As expected | Pass |
| AG-DM-03 | Sec | Driver message injection *(new)* | `test_driver_message_ignores_injection_in_context` | Malicious city/name context never appears in the message | As expected | Pass |

> **Deselected (environmental):** `test_graph_resume_with_approval_completes` performs the post-approval *execute* phase, which calls the backend (`localhost:5000`) to fetch order data — it needs the live backend and is validated in **Section 6 (Integration/E2E)**. **Skipped:** the live-LLM summary test runs only when Ollama is available.

**Section 3 totals:** 19 documented cases covering 9 agentic areas (task-completion, structured-output, business-rule, tool-fallback, approval-enforcement, prompt-injection, safe-failure, LLM-narration, driver-messaging). Executed via the agent suite (146 passed). 3 tests are new (driver messaging).

---

## Section 4 — React Web Testing (Vitest + React Testing Library)

**Tool:** Vitest 2.0 + React Testing Library + jsdom · **Coverage:** `@vitest/coverage-v8`
**How executed:** `node ./node_modules/vitest/vitest.mjs run` — **⚠ must run under Node ≥ 22** (jsdom v30's `undici` needs `webidl.util.markAsUncloneable`, absent in Node 20; use `/usr/local/bin/node` which is v22).
**Result:** **107 tests passed, 26 files.** S4-focused coverage report in `evidence/coverage-web/` (helpers 100%, `NotificationBell` 57%, `DriverRunDetail` 75%).

| ID | Type | Component / Feature | Steps / Input | Expected Result | Actual | Status |
|----|------|---------------------|---------------|-----------------|--------|--------|
| WEB-DR-01 | N | `driverRun` — finished stops | `isOpenStop` for Pending/Delivered/Skipped | Pending open; Delivered/Skipped finished | As expected | Pass |
| WEB-DR-02 | N | `driverRun` — active stop | `activeStopSequence` on mixed stops | First unfinished by sequence | As expected | Pass |
| WEB-DR-03 | B | `driverRun` — complete run | all stops delivered | `activeStopSequence` null; `deliveredCount` full | As expected | Pass |
| WEB-SB-01 | N | `statusBadge` — shipment | known + unknown status | Correct class; unknown → planned | As expected | Pass |
| WEB-SB-02 | N | `statusBadge` — stop | known + unknown status | Correct class; unknown → pending | As expected | Pass |
| WEB-RC-01 | N | `DriverRunCard` render | render with a run | Shows code, status, `1/4 stops` | As expected | Pass |
| WEB-RC-02 | N | `DriverRunCard` interaction | click "Open run" | `onOpen` called with the run | As expected | Pass |
| WEB-WP-01 | N | `WorkflowPipeline` (agent monitor) | render workflow | All six pipeline stages shown | As expected | Pass |
| WEB-WP-02 | F | `WorkflowPipeline` failure state | failed workflow | Safe-failure message shown | As expected | Pass |
| WEB-AP-01 | N | `AIPlanningPage` render | render page | Planning header + workflow picker render | As expected | Pass |
| WEB-PR-01 | A | `ProtectedRoute` gating | unauthenticated access | Redirects away from the protected page | As expected | Pass |
| WEB-NAV-01 | N | `Navbar` auth state | authenticated user | Logout shown | As expected | Pass |
| WEB-NAV-02 | N | `Navbar` logout | click Logout | Session cleared; public Login/Register paths | As expected | Pass |
| WEB-DRD-01 | N | `DriverRunDetail` end-assignment *(new)* | run complete (all delivered) | "End assignment" button shown | As expected | Pass |
| WEB-DRD-02 | N | `DriverRunDetail` interaction *(new)* | click End assignment | Mutation called; confirmation message shown | As expected | Pass |
| WEB-DRD-03 | B | `DriverRunDetail` negative *(new)* | run with an open stop | End-assignment button **not** shown | As expected | Pass |
| WEB-NB-01 | N | `NotificationBell` badge *(new)* | unread = 3 | Badge shows "3" | As expected | Pass |
| WEB-NB-02 | B | `NotificationBell` cap *(new)* | unread = 25 | Badge capped at "9+" | As expected | Pass |
| WEB-NB-03 | B | `NotificationBell` empty *(new)* | unread = 0 | No badge | As expected | Pass |
| WEB-NB-04 | N | `NotificationBell` panel *(new)* | open panel, Mark all read | Items listed; mark-all mutation fired | As expected | Pass |
| WEB-VAL-01 | I | `OrderForm` recipient name required *(new)* | submit with empty recipient name | Error shown; `onSubmit` not called | As expected | Pass |
| WEB-VAL-02 | I | `OrderForm` recipient 10-digit contact *(new)* | submit with contact `123` | "must be a 10-digit phone number" error; blocked | As expected | Pass |
| WEB-VAL-03 | N | `OrderForm` valid submit *(new)* | valid dimensions + recipient | `onSubmit` called once | As expected | Pass |
| WEB-VAL-04 | I | `DriverForm` name letters-only *(new)* | name `123` | "only contain letters" error; create not called | As expected | Pass |
| WEB-VAL-05 | I | `DriverForm` phone 10 digits *(new)* | phone `123` | "exactly 10 digits" error; create not called | As expected | Pass |
| WEB-VAL-06 | B | `DriverForm` licence > 1 month *(new)* | expiry 10 days out | "more than 1 month from today" error; create not called | As expected | Pass |
| WEB-VAL-07 | N | `DriverForm` valid submit *(new)* | all fields valid | create mutation called once | As expected | Pass |

> **Runner note (important for viva):** the project's nvm Node is v20.20, on which Vitest crashes (`webidl.util.markAsUncloneable`). Web tests run on **Node 22** (`/usr/local/bin/node`). This is an environment fix, documented as a defect (see Defect Report).

**Section 4 totals:** 27 documented cases — **all Pass**. 14 tests are new (DriverRunDetail ×3, NotificationBell ×4, **form-validation: OrderForm ×3 + DriverForm ×4**), covering component, **form-validation**, UI-state, boundary, negative and interaction scenarios.

---

## Section 5 — Flutter Mobile Testing (flutter_test)

**Tool:** `flutter_test` · **How executed:** `flutter test` (Flutter SDK at `~/development/flutter/bin/flutter`).
**Result:** **35 tests passed** (full mobile suite), including the **2 new widget tests** for the driver runs screen — executed & verified.
**Coverage:** `flutter test --coverage` → `coverage/lcov.info` (optional appendix).

### 5.1 Unit — model parsing & mapping (existing)

| ID | Type | Feature | Expected Result | Status |
|----|------|---------|-----------------|--------|
| MOB-DR-01 | N | `ShipmentSummary.fromJson` parses a driver run row | Fields parsed from API JSON | Pass |
| MOB-DR-02 | N | `DriverRunView.fromJson` parses run detail with ordered stops | Stops ordered by sequence | Pass |
| MOB-DR-03 | N | Summary flags `AwaitingApproval` | Status flag surfaced | Pass |
| MOB-DR-04 | N | Detail parses ordered stops + allocation | Stops + allocated driver/vehicle parsed | Pass |
| MOB-DR-05 | N | `ApprovalResult` parses shipment code | Shipment code read from response | Pass |
| MOB-DR-06 | B | `isActive` is false for Delivered/Cancelled | Terminal statuses → inactive | Pass |
| MOB-DR-07 | N | Driver status int → label | Enum int mapped to label | Pass |
| MOB-DR-08 | N | Vehicle status int → label | Enum int mapped to label | Pass |
| MOB-DR-09 | N | Parses all stops with delivered status | Every stop parsed | Pass |
| MOB-CT-01 | N | Customer tracking parses dispatched run with driver + ETA | Driver contact + ETA parsed | Pass |
| MOB-CT-02 | N | Detects delivered via `deliveredAt` | Delivered stage derived | Pass |
| MOB-CT-03 | B | Preparing stage before a shipment exists | Pre-dispatch stage handled | Pass |
| MOB-CT-04 | N | Serializes `TimeSpan` as HH:mm:ss + date-only ISO | Correct serialization | Pass |

### 5.2 Widget — driver runs screen *(new)*

| ID | Type | Feature | Steps / Input | Expected Result | Status |
|----|------|---------|---------------|-----------------|--------|
| MOB-W-01 | Widget / UI-state | `DriverRunsPage` renders runs | Repo override returns 1 run | Screen shows `SHP-M-001` and `1 / 4` stop progress | Pass |
| MOB-W-02 | Widget / empty | `DriverRunsPage` empty state | Repo override returns `[]` | Shows "No delivery runs yet" | Pass |

> The 2 widget tests override `driverRepositoryProvider` + `tokenStoreProvider` (mirroring the existing warehouse widget-test pattern) so the screen renders with no network or secure-storage access. Executed via `flutter test` → **both pass** (full suite 35 passed). Test file: `mobile/test/features/driver/driver_runs_page_test.dart`.

**Section 5 totals:** 15 documented cases (13 unit + 2 new widget). Covers unit (model parsing/mapping) and widget (UI-state + empty-state) testing for the S4 driver/tracking mobile features.

---

## Section 6 — Integration / End-to-End Testing (Postman + Newman)

**Tool:** Postman collection run headless with **Newman** + `newman-reporter-htmlextra` · **Target:** the live deployed system (Render backend + agent).
**How executed:** `newman run LogiFlow-S4-E2E.postman_collection.json -e LogiFlow-Render.postman_environment.json -r cli,htmlextra`
**Result:** **12 requests, 16 assertions — all passed** (run duration ~13s). Report: `evidence/newman-report.html`. Collection + environment: `postman/`.
**Scope:** one integrated workflow across the real components — customer **auth → order creation → read-back**, admin **ops/agent reads → shipment tracking**, driver **runs**, plus **authorization** negatives. (The mutating trigger→approve→drive→track path is also covered deterministically in-process by `BE-INT-03`.)

| ID | Type | Step (request) | Expected Result | Actual | Status |
|----|------|----------------|-----------------|--------|--------|
| E2E-01 | N | Customer registers (unique email) | 200/201 accepted | As expected | Pass |
| E2E-02 | N | Customer logs in | 200; JWT returned & captured | As expected | Pass |
| E2E-03 | N | Customer creates a delivery order | 201; order id returned | As expected | Pass |
| E2E-04 | N | Customer reads the order back | 200; status = `Pending` | As expected | Pass |
| E2E-05 | N | Admin logs in | 200; admin JWT captured | As expected | Pass |
| E2E-06 | N | Admin lists agent workflows | 200; array returned | As expected | Pass |
| E2E-07 | N | Admin lists shipments | 200; array (captures first shipment id) | As expected | Pass |
| E2E-08 | N | Admin tracks a shipment | 200; response has `stops` timeline | As expected | Pass |
| E2E-09 | N | Driver logs in | 200; driver JWT captured | As expected | Pass |
| E2E-10 | A | Driver reads own runs (`/shipments/mine`) | 200; array (own runs only) | As expected | Pass |
| E2E-11 | A/F | Driver tries to trigger a workflow | **403 Forbidden** (ADMIN-only) | As expected | Pass |
| E2E-12 | A/F | Unauthenticated lists shipments | **401 Unauthorized** | As expected | Pass |

**Section 6 totals:** 12 requests / 16 assertions — **all Pass**. Demonstrates a complete cross-component workflow on the deployed system and enforces role/auth boundaries. This is the required integrated-workflow test (API-level, live).
