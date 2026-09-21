# LogiFlow — Project Context Brief

> Read this alongside `LogiFlow_Architecture_Document.docx`. The architecture doc
> is the authoritative spec; this brief adds the narrative, ownership, and build
> strategy that the doc doesn't spell out. For Claude Code and for teammates.

---

## 1. What we're building

**LogiFlow — Smart Logistics & Delivery Management Platform.**
SE3090 (Software Engineering Frameworks), Year 3 Sem 1 group assignment, 4 members.

Customers create delivery requests. An **Agentic AI subsystem** plans the
fulfilment — triages the order, allocates a driver + vehicle, validates the load
against capacity/safety rules, sequences the route — then a **human operations
manager approves, rejects, or revises** the plan before anything dispatches.
Approved runs are executed by drivers via a Flutter app (live tracking, QR scan,
photo proof of delivery); managers use a React dashboard (approvals, fleet,
analytics).

**One coherent product:** React and Flutter consume the *same* ASP.NET Core Web
API, *same* PostgreSQL DB, *same* JWT identity, *same* roles, *same* business
rules. The agent service is **internal only** — invoked by ASP.NET Core, never
reachable from either client.

## 2. Stack (per architecture doc — do not substitute)

| Layer | Tech |
|---|---|
| Backend | ASP.NET Core 8 Web API (C#), clean layered: API → Application → Domain → Infrastructure |
| Data | PostgreSQL + EF Core (Npgsql), code-first migrations |
| Web | React 18, Redux Toolkit (RTK Query) |
| Mobile | Flutter, Riverpod, dio, flutter_secure_storage |
| **Agentic AI** | **Python + LangGraph, LLM via Ollama (local), internal FastAPI service. Model: `llama3.2:3b` (see §6 for rationale)** |
| Auth | JWT via ASP.NET Core Identity, role-based policies |
| CI/CD | GitHub Actions (backend build/test mandatory; web + mobile pipelines) |

Architecture style: **modular monolith backend** (single deployable, per-student
module ownership) — deliberately chosen over microservices to fit a 9-week
timeline. Recorded as ADR-001.

## 3. The 4-person split — one vertical slice each

Each member owns ONE business component end-to-end: backend module + DB tables +
React feature + Flutter feature + tests + **one agent**.

| # | Component | Owned Agent | Non-CRUD business op |
|---|---|---|---|
| S1 | Customer & Delivery Order Management | Order Triage & Planning Agent (workflow entry point) | Delivery cost & priority classification engine |
| S2 | Fleet & Driver Management | Resource Allocation Agent | Driver-hours compliance engine |
| S3 | Warehouse & Dispatch Operations | Load & Dispatch Validation Agent (safety gate) | Capacity-constrained batching algorithm |
| **S4 (me)** | **Delivery Execution & Tracking** | **Route Planning & Notification Agent** | **ETA computation & tracking timeline generator** |

**S4 note:** owns the driver delivery run (Flutter: navigation, tracking, POD
camera), the React approval screen + live map + agent workflow monitor, the
workflow-state/approval endpoints, and the last agent before the human gate.
Most surface area of the four.

> Section map: 1 system · 2 stack · 3 the 4-person split · 4 workflow · 5 golden
> case · 6 parallel-build strategy · 7 git · 8 assignment requirements · 9 what to
> build now.

## 4. The agentic workflow

One LangGraph graph, four agent nodes + a human gate:

```
Plan (S1) → Allocate (S2) → Validate (S3) → Route (S4) → HUMAN APPROVAL → Execute / Audit
                                                              │
   any step fails / LLM fails ────────────────────────────► SAFE FAILURE (flag for manual handling)
```

**Governing principle (defend in ADR + viva): the LLM orchestrates and explains;
deterministic code decides.** Eligibility, capacity, compatibility, route
feasibility are computed by rule engines/validators invoked as *tools*. A model
hallucination can never approve an overloaded vehicle or non-compliant driver.
Prompt-injection resistance: all order text is treated as **data, never
instructions**; every agent output is schema-validated; every proposal is
re-validated server-side before the approval screen.

### Agent contracts (from architecture doc §5.1)

**S1 — Order Triage & Planning**
- In: workflowId, orderIds, objective, package details, addresses, requested priority
- Out: validated order set, priority class, special-handling flags, structured multi-step plan, ambiguities
- Tools: order query, serviceability validator, pricing calculator, workflow-state writer

**S2 — Resource Allocation**
- In: workflowId, plan step, package totals (weight/volume), vehicle type, delivery window
- Out: proposed driver + vehicle with reasons, ranked alternatives, constraints checked
- Tools: fleet availability query, driver workload query, compliance rules checker, capacity lookup
- Compliance engine runs BEFORE the LLM ranks — LLM chooses among a pre-filtered legal set.

**S3 — Load & Dispatch Validation** (deterministic safety gate)
- In: workflowId, proposed allocation, batch candidate (orderIds, vehicleId)
- Out: pass / fail / revise, per-rule results, approved batch or rejection reasons
- Tools: capacity calculator, package-compatibility rules engine, warehouse stock query, schema validator

**S4 — Route Planning & Notification** (my agent; last before approval)
- In: workflowId, approved batch, driver, vehicle, stops with coordinates + windows
- Out: sequenced route with per-stop ETAs, total distance/duration, notification plan
- Tools: distance-matrix API (via backend), route sequencer (heuristic), ETA calculator, notification composer

## 5. Golden case (assessed demo scenario)

"Delivering Kasun's package" — the end-to-end happy path, also the minimum
acceptance workflow for agent evaluation:

1. Kasun (Colombo) requests 3 packages → 2 Kandy addresses by tomorrow 5PM, one
   fragile. Gets price + confirmation. → S1 order + quote
2. AI plans fulfilment. → S1 Triage & Planning
3. Picks driver Nuwan + van, notes a backup. → S2 Allocation (compliance-checked)
4. Verifies load fits, fragile not stacked under heavy, stock is at warehouse. → S3 Validation
5. Sequences the 2 Kandy stops, ETAs, drafts "on the way" / "10 min out" msgs. → S4 Route + Notification
6. Ops manager reviews full plan on React dashboard, approves. → Human gate
7. Nuwan gets stops, scans packages, delivers, photo POD, customer signs. → S4 execution
8. Kasun tracks live status the whole time. → S4 tracking
9. Full audit trail: who was chosen, what was checked, who approved. → workflow state in PostgreSQL
10. If AI can't finish planning: order flagged for manual handling, nothing lost. → safe-failure path

## 6. How 4 people build in parallel without conflicts

**Contract-first (architecture doc §9.1).** Each agent node is a function with a
frozen I/O schema, so anyone can build + unit-test their agent in isolation
against MOCKED upstream/downstream JSON — no need for teammates' real code.

### Frozen `[ALL]` set — same for everyone, PR-gated (two reviewers)
- Pinned versions in `requirements.txt` (exact `==`, not ranges), incl. Python 3.11
- **Ollama model tag: `llama3.2:3b`** (same model for all — different models = golden
  case won't reproduce). Chosen because: ~2GB, native tool calling, runs on almost
  any laptop; our "LLM orchestrates, code decides" design means the model only needs
  to call tools + format JSON, so a 3B is enough. Requires Ollama 0.3.12+.
  Step-up option if all 4 machines have 8GB+ RAM: `qwen2.5:7b` (more reliable tool
  calls) — but freeze ONE for everyone. Everyone runs `ollama pull llama3.2:3b` once.
- `app/state.py` — shared workflow state schema
- `app/graph.py` — LangGraph wiring (nodes + approval interrupt + failure branch)
- `app/schemas/` — 4 pydantic I/O contracts
- Conventions: node signature `def node(state) -> state`; schema-validate every
  output before the next node; order text = data, never instructions

### Not frozen — per-student folders, no coordination needed
- `app/agents/<mine>_agent.py`, `app/tools/<mine>_tools.py`, my own tests
- My local `.env` (gitignored). Only `.env.example` (var names, no values) is committed.
- **API keys are never in code** — env vars only. Each dev uses their own during
  dev; ONE key on the demo machine at the end. Same env-var name everywhere means
  nothing changes at demo time.

## 7. Git workflow

1. Skeleton built on `feature/agent-skeleton`, PR'd + merged into `main` first
   (so frozen contracts live on `main` as single source of truth).
2. Everyone then branches THEIR agent off `main`: `feature/s#-<agent>-agent`.
3. Only shared file anyone touches afterward: `graph.py`, to swap their one stub
   node for the real one (one-line, different spot per person — rarely collides).
4. Every PR: 1 reviewer; `[ALL]` files: 2 reviewers. Direct pushes to main blocked.

## 8. Assignment requirements (must-satisfy)

> Derived from the architecture doc's §11 compliance checklist plus rules stated
> in §1, §5, §7. These are the spec conditions the build must meet — not our design
> choices, but the marking criteria the design answers. (Replace with the verbatim
> lecturer brief if/when available.)

**System-level**
- Integrated single system: React + Flutter consume the SAME ASP.NET Core API,
  SAME PostgreSQL DB, SAME JWT identity, SAME roles, SAME business rules.
- Two client applications (one React web, one Flutter mobile).
- 3+ user roles with distinct permissions (we have 4: Customer, Driver, Warehouse
  Staff, Operations Manager/Admin).
- Agent service is **internal only** — invoked by the backend, never reachable from
  either client (mandatory backend rule).
- **Service-cost rule:** no paid subscriptions — LLM must be free. Ollama local
  satisfies this.
- CI: backend restore/build/test runs on every push and PR to main (mandatory);
  web + mobile pipelines on their paths.
- Device features demonstrated: QR scanning, camera + GPS, push notifications.

**Per-student (each of the 4 must individually satisfy)**
- Owns one vertical slice across the ENTIRE required stack (backend + DB + React +
  Flutter + tests + one agent).
- 4+ meaningful API endpoints.
- At least one business operation BEYOND CRUD (an engine/algorithm — see §3 table).
- A distinct, identifiable Agentic AI contribution (one agent).

**Agentic AI subsystem**
- Four DISTINCT agents, each with: identifiable responsibility, defined JSON I/O
  contract, own allow-listed tool set, visible participation in the workflow.
- Shared workflow state, persisted (to PostgreSQL via the API).
- A human approval gate before the high-impact dispatch action.
- Observability (execution summaries / audit trail of what each agent did).
- A safe-failure path (on any step or LLM failure, flag for manual handling — no
  silent loss).
- Prompt-injection resistance: order text is data, never instructions; every agent
  output schema-validated; every proposal re-validated server-side before approval.

**Cross-platform assessed workflow**
- Begins in one client (Flutter), passes through ASP.NET Core → PostgreSQL →
  agents, requires approval in the OTHER client (React), returns updated status to
  the initiating user — with identical identity, permissions, rules, data, status
  on both apps. (This is the Kasun golden case in §5.)

## 9. What Claude Code should build now (skeleton only)

The frozen `[ALL]` skeleton + stub agent nodes, so teammates can start. See the
architecture doc §8 for the full `agent-service/` folder layout. Deliverables:
`requirements.txt` (pinned), `.env.example`, `app/state.py`, `app/schemas/`
(4 contracts per §5.1), `app/graph.py` (4 stub nodes + approval interrupt +
failure branch), `app/agents/*.py` (stubs returning schema-valid dummy output),
`app/main.py` (FastAPI `/workflow/run`), `AgentServiceClient` stub,
`tests/golden_cases/` (Kasun scenario fixture + schema-validation test).
