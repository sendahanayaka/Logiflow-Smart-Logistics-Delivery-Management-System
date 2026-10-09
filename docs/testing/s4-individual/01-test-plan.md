# Test Plan — S4: Delivery Execution & Tracking (Individual)

**Project:** LogiFlow — Smart Logistics & Delivery Management System
**Module:** SE3090 — Software Engineering Frameworks · Assignment 2 (Testing & Quality Evaluation)
**Member / Slice:** Aathif Azeez — **S4: Delivery Execution & Tracking** (+ driver portal, admin portal excl. fleet management, agentic routing agent, integration owner)
**Date:** 2026-10-08
**Document status:** Baseline v1.0

---

## 1. Introduction & Purpose

This plan defines the testing I personally perform on my part of the LogiFlow integrated system for SE3090 Assignment 2. It is scoped to the **Delivery Execution & Tracking (S4)** slice and the features I own, and it covers the required *integrated workflow* test end-to-end (dispatch → agent plan → approval → shipment → driver run → customer tracking).

The goal is to show the slice is tested in a planned, tool-based way: selecting suitable testing areas, using appropriate frameworks, executing the tests, recording results, identifying/fixing defects, and collecting reproducible evidence.

Non-functional testing (performance, security, etc.) is handled at the **group** level and is **out of scope** for this individual plan.

## 2. Scope

### 2.1 In scope (features I own)
- **Driver portal** — my runs list, run detail (ordered stops), start run (→ picked up), mark en-route/arrived, proof of delivery (POD), **end my assignment** (frees driver + vehicle).
- **Admin / operations portal (excluding fleet management)** — approvals queue, agent monitor (per-agent steps), AI planning view, shipments tracking dashboard.
- **S4 backend services & controllers** — `ShipmentService`, `AgentWorkflowService`, `ApprovalService`, `NotificationService`, `MessagingService`; `ShipmentsController`, `WorkflowsController`, `NotificationsController`, `MessagingController`.
- **Agentic routing agent** — route sequencing, ETA engine (OSRM + haversine fallback), notification composer, LLM narration with deterministic safe-failure, prompt-injection defence (customer notes treated as data), human-approval gate.
- **S4 persistence** — `Shipment`, `RouteStop`, `TrackingEvent`, `Notification`, `Message`, and agent-workflow/allocation records: constraints, relationships, transactions, migrations.
- **Integrated workflow** — the complete delivery lifecycle across backend + agent (at least one full cross-component workflow test, as required).

### 2.2 Out of scope (owned by teammates / group)
- Fleet management CRUD — drivers/vehicles/maintenance (S2).
- Customer order creation, pricing, checkout (S1).
- Warehouse intake, inventory, dispatch batching internals (S3).
- Non-functional testing — performance, load, security, accessibility (group deliverable, done separately).

## 3. Test Objectives
1. Verify **functional correctness** of S4 services, controllers, driver/admin UI and the routing agent against their specifications.
2. Verify **validation, authorization and ownership** rules (e.g., a driver only sees/acts on their own runs; approval gate enforced).
3. Verify the **agent is safe**: structured output, business-rule compliance, prompt-injection resistance, and graceful fallback when the LLM/routing service is unavailable.
4. Verify **data integrity** of S4 entities (constraints, relationships, transactions, migrations).
5. Demonstrate **one complete integrated workflow** across backend and agent.
6. Produce **tool-generated evidence** (test output, coverage, E2E report) and a traceable **defect + retest** record.

## 4. Testing Areas & Approach

| # | Area | What I test | Tool / Framework | Test case types |
|---|------|-------------|------------------|-----------------|
| 1 | Backend / API | S4 services + controllers: shipment lifecycle, start-run, events, POD, end-assignment, workflow run/approval, notifications, messaging; validation & authorization | **xUnit** + FluentAssertions + `WebApplicationFactory` | normal, invalid, boundary, failure, auth |
| 2 | Database | S4 entities: FK/unique/not-null constraints, relationships, cascade, transaction rollback, migration apply | **EF Core + SQLite (in-memory)** | constraint, relationship, transaction, migration |
| 3 | Agentic AI | Routing agent: structured-output schema, business-rule compliance, prompt-injection-as-data, approval enforcement, safe-failure/fallback | **pytest** (deterministic) + pytest-cov | normal, boundary, failure, security (injection) |
| 4 | React web | Driver run detail, admin approvals/monitor/tracking, notification bell, messaging — rendering, state, error-state, protected routes | **Vitest** + React Testing Library | component, form-validation, UI-state, error-state |
| 5 | Flutter mobile | Driver run + customer tracking: model parsing, widget rendering, navigation | **flutter_test** | unit, widget, parsing |
| 6 | Integration / E2E | Full delivery workflow via API: dispatch batch → workflow run → approval → shipment start → stop events → POD → tracking | **Postman + Newman** (HTML report) | end-to-end happy path + negative (unauthorized, invalid transition) |

## 5. Tools & Frameworks (and why)

| Tool | Version (target) | Used for | Why chosen |
|---|---|---|---|
| **xUnit** | 2.9 | Backend unit + controller tests | Standard .NET test framework already used by the project; integrates with `dotnet test`. |
| **FluentAssertions** | 8.x | Readable assertions | Expressive, clear failure messages (viva-friendly). |
| **Microsoft.AspNetCore.Mvc.Testing** (`WebApplicationFactory`) | 8.0 | In-process API/integration tests | Tests the real HTTP pipeline (routing, auth, validation) without a deployed server. |
| **Coverlet + ReportGenerator** | latest | Backend coverage report (HTML) | Produces tool-generated coverage evidence. |
| **EF Core + SQLite (in-memory)** | 8.0 | Database testing | Enforces real relational constraints & migrations without Docker/PostgreSQL. |
| **pytest + pytest-cov** | 8.3 | Agent tests + coverage | Matches the Python agent; deterministic, reproducible for viva. |
| **Vitest + React Testing Library** | 2.0 / 16.x | Web component tests | Already configured; fast; user-centric queries. |
| **flutter_test** | SDK | Mobile widget/unit tests | Built-in Flutter test framework. |
| **Postman + Newman** (+ htmlextra reporter) | latest | Integrated workflow E2E | API-level E2E is reliable (no browser flakiness) and the workflow is backend+agent; Newman gives a shareable HTML report. |

## 6. Test Environment

| Item | Detail |
|---|---|
| OS | macOS (Darwin) — local development machine |
| Backend runtime | .NET 8 SDK |
| Web runtime | Node.js + Vite; Vitest (jsdom) |
| Agent runtime | Python 3.11; FastAPI/LangGraph; Ollama optional (tests use deterministic fallbacks, no live LLM required) |
| Mobile | Flutter SDK (Android target) |
| Databases | **Test:** EF Core SQLite in-memory + EFCore.InMemory. **Reference/prod:** PostgreSQL (Render). |
| Source control / CI | GitHub; CI runs the full test suites on push |
| Deployed system (reference) | Backend + Agent on Render; Web on Vercel |

## 7. Test Data Strategy
- **Unit/service tests:** in-memory fixtures and hand-built stub dependencies (e.g., stub agent client) — no external services.
- **Database tests:** a fresh SQLite in-memory connection per test with migrations/`EnsureCreated`, seeded with the minimum S4 rows.
- **Agent tests:** deterministic input payloads; LLM calls exercised through the fallback path so results are stable.
- **E2E:** a dedicated test account per role (ADMIN, DRIVER) and a seeded dispatch batch; collection variables chain IDs between requests.

## 8. Roles & Responsibilities
This is an **individual** plan: I (S4) design, implement, execute and document all tests listed here, and own the related defects and fixes. Group-level non-functional testing and teammates' slices are tracked in their own plans and integrated into the group report.

## 9. Schedule (indicative)

| Phase | Activity | Target |
|---|---|---|
| 1 | Test Plan (this document) | Day 1 |
| 2 | Backend/API tests + coverage | Day 1–2 |
| 3 | Database tests (SQLite) | Day 2 |
| 4 | Agentic AI tests + coverage | Day 2–3 |
| 5 | React web tests + coverage | Day 3 |
| 6 | Flutter mobile tests | Day 3 |
| 7 | Integration/E2E (Postman/Newman) | Day 4 |
| 8 | Defect/Bug report + retests | Day 4 |
| 9 | Test Execution Summary | Day 5 |
| 10 | Assemble evidence + export PDF | Day 5 |

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Agent LLM (Ollama) not available during tests | Flaky/blocked agent tests | Tests target the deterministic fallback path; no live LLM required. |
| Free-tier cold starts on deployed services | E2E timeouts | Run E2E against a locally running backend/agent, or warm services first; generous Newman timeouts. |
| `EFCore.InMemory` does not enforce real constraints | False confidence in DB tests | Use SQLite in-memory for constraint/relationship/transaction tests. |
| Vitest local runner incompatibility (Node/jsdom) | Can't run web tests locally | Pin a compatible Node; rely on CI for the full web suite if needed. |
| Cross-slice coupling in the integrated workflow | Test needs S1/S2/S3 data | Seed prerequisite batch/driver data as fixtures; document assumptions. |

## 11. Entry & Exit Criteria
**Entry:** feature implemented and builds; test environment and tools installed for that area.
**Exit (per area):** all planned test cases executed; results recorded Pass/Fail; critical/high defects fixed and **retested**; tool-generated evidence captured.

## 12. Defect Severity & Priority (used by the Defect/Bug Report)

**Severity** (impact on the system):
- **Critical** — core workflow blocked / data loss / security hole.
- **High** — major feature broken, no easy workaround.
- **Medium** — feature works but behaves incorrectly in some cases.
- **Low** — minor/cosmetic.

**Priority** (how soon to fix): **P1** immediate · **P2** before submission · **P3** if time permits.

## 13. Deliverables & Traceability
- `01-test-plan.md` (this), `02-test-cases.md`, `03-defect-report.md`, `04-execution-summary.md`, and `evidence/` (coverage, Newman report, screenshots).
- Each **test case ID** maps to a feature and to its evidence; each **defect ID** maps to the failing test case and its fix commit + retest result.
- Test source code lives in the repo (`backend/tests`, `agent-service/tests`, `web/tests`, `mobile/test`, and the Postman collection under `docs/testing/s4-individual/`), giving traceable git contribution evidence.

---
*Baseline for SE3090 Assignment 2 — individual testing, S4 slice.*
