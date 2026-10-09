# Defect / Bug Report — S4 (Individual)

**Project:** LogiFlow — Smart Logistics & Delivery Management
**Member / Slice:** Aathif Azeez — S4: Delivery Execution & Tracking
**Severity/Priority scale:** see Test Plan §12 (Critical/High/Medium/Low · P1/P2/P3).

These defects were found while testing and operating the S4 slice and the integrated system. All important ones were fixed and retested; traceability (commit/PR/branch) is given per defect.

## Summary

| ID | Title | Severity | Priority | Status |
|----|-------|----------|----------|--------|
| DEF-01 | S3 dispatch validation fails on first use after idle (timeout) | High | P1 | Fixed & retested |
| DEF-02 | Order checkout broken in deployment (hardcoded `localhost:5000`) | High | P1 | Fixed & retested |
| DEF-03 | Browser calls the internal agent directly (`localhost:8000`) | High | P1 | Fixed & retested |
| DEF-04 | Agent cannot reach backend — `BACKEND_API_BASE_URL` unset | High | P1 | Fixed & retested |
| DEF-05 | Inventory "Edit package" modal is unstable | Medium | P2 | Fixed & retested |
| DEF-06 | Duplicate `CreateDeliveryOrderRequestValidator` (DI ambiguity) | Medium | P2 | Fixed & retested |
| DEF-07 | Web test suite (Vitest) crashes on the repo's Node 20.20 | Medium | P2 | Workaround applied |
| DEF-08 | Agent integration test not self-contained offline | Low | P3 | Open (mitigated) |

## Evidence & retest traceability

Each defect maps to its fix commit/PR and its retest proof. Screenshot files go in `evidence/` (before = the failure, after = the retest passing).

| ID | Fix commit / PR | Retest proof | Before SS | After SS |
|----|-----------------|--------------|-----------|----------|
| DEF-01 | `e69c843` (merge `7b7de66`) | dispatch succeeds; backend 159 tests pass | `def-01-before.png` (S3 "FAIL — service unavailable") | `def-01-after.png` (dispatch PASS) |
| DEF-02 | PR #27 (`f2027c6`,`d846b24`,`1eb1b9a`) | web `tsc + vite build` clean; checkout reaches backend | `def-02-before.png` ("Unexpected end of JSON input") | `def-02-after.png` (checkout success) |
| DEF-03 | PR #27 | agent reachable via `/api/agent/*`; 159 backend tests pass | `def-03-before.png` ("Agent Service Offline") | `def-03-after.png` (agent response via backend) |
| DEF-04 | Render env (`BACKEND_API_BASE_URL`, `AgentService__BaseUrl`) | S3 resolves real context (no "context unavailable") | `def-04-before.png` ("context unavailable") | `def-04-after.png` (validation PASS/FAIL result) |
| DEF-05 | branch `feature/validation-ux-pass` *(pending)* | web build clean; modal stable (portal) | `def-05-before.png` (unstable popup) | `def-05-after.png` (stable modal) |
| DEF-06 | branch `feature/validation-ux-pass` *(pending)* | 159 backend tests pass (single validator) | `def-06-before.png` (two validator files) | `def-06-after.png` (one validator; tests green) |
| DEF-07 | *(env workaround — run on Node 22)* | 107 web tests pass on Node 22 | `def-07-before.png` (`markAsUncloneable` crash, Node 20) | `def-07-after.png` (107 passed, Node 22) |
| DEF-08 | *(open — mitigated by deselect)* | agent suite green when deselected (146 passed) | — | `def-08-after.png` (146 passed, 1 deselected) |

> Tip: for "before" screenshots you can't re-capture, cite the commit/log instead (e.g., the failing CI run, or the error text already quoted in the defect). The "after" screenshots are your Steps 2–7 green runs.

---

## DEF-01 — S3 dispatch validation fails on first use after idle
- **Severity/Priority:** High / P1
- **Area:** Backend ↔ Agent (S3 Load & Dispatch validation path, used by warehouse dispatch).
- **Description:** Dispatching from the warehouse returned *"S3 Load & Dispatch Validation: FAIL — The internal S3 validation service is unavailable."*, even though the agent was healthy.
- **Steps to reproduce:** On the deployed system, leave it idle >15 min, then perform a warehouse dispatch (which calls `/api/dispatch/...validation`).
- **Root cause (diagnosed live):** the backend's S3 validation `HttpClient` timeout was **12s**, but on Render's free tier the agent **cold-starts (~43s)** after idle. The backend timed out and surfaced the agent as "unavailable". Warm, the same call answers in **0.9s**.
- **Evidence:** direct probe of the agent `/validation/dispatch` — 43.4s cold vs 0.9s warm; the exact error string in `DispatchAgentValidationController`.
- **Fix:** raised the S3 validation client timeout `12s → 60s` (and the workflow client `30s → 60s`) in `Program.cs`. Commit `e69c843`, merged to `main` (`7b7de66`).
- **Retest:** after deploy, dispatch succeeds (first call waits for the cold start, then PASS); backend build + **149 tests** pass. ✅

## DEF-02 — Order checkout broken in deployment (hardcoded localhost)
- **Severity/Priority:** High / P1
- **Area:** Web (customer checkout) → Backend.
- **Description:** Confirming payment did nothing / errored in the deployed app.
- **Steps to reproduce:** On the deployed web app, place an order → checkout → Confirm. The request went to `http://localhost:5000/...` (the user's own machine), so it failed.
- **Root cause:** `OrderCheckoutPage.tsx` hardcoded `http://localhost:5000/api/orders/{id}/checkout` instead of the configured API base.
- **Fix:** use `${API_BASE_URL}/orders/${id}/checkout`. PR #27 (`fix/deployment-urls`).
- **Evidence:** code diff; `Failed to execute 'json' on 'Response'` symptom when the empty/err response was parsed.
- **Retest:** web `tsc + vite build` clean; checkout now targets the configured backend; no `localhost` left in `web/src`. ✅

## DEF-03 — Browser calls the internal agent directly
- **Severity/Priority:** High / P1 (deployment + security boundary)
- **Area:** Web (AI agent tools) → Agent.
- **Description:** The agentic UI (`AgenticAIDrawer`, `MultiOrderTripPanel`) always showed "Agent Service Offline" in deployment.
- **Steps to reproduce:** Open the AI tools in the deployed app — requests went to `http://localhost:8000`, which also can't present the internal `X-Internal-Api-Key`.
- **Root cause:** the browser called the internal-only agent directly; the agent is meant to be reached only by the backend behind the shared key.
- **Fix:** added a backend passthrough `AgentProxyController` (`/api/agent/*`) that injects the key server-side; the web now calls the backend. PR #27.
- **Evidence:** live check — agent returns **401** without the key; `AgentProxyController` + `Program.cs` named client.
- **Retest:** backend build + 149 tests pass; agent reachable via the backend with the browser never seeing the key. ✅

## DEF-04 — Agent cannot reach the backend (config)
- **Severity/Priority:** High / P1
- **Area:** Deployment configuration (Agent service env).
- **Description:** Even reachable, S3 validation could fail with *"S3 warehouse validation context is unavailable"* because the agent couldn't fetch batch/candidate context from the backend.
- **Steps to reproduce:** With the agent's `BACKEND_API_BASE_URL` unset, it defaults to `localhost:5000` (its own container) and every backend tool call fails.
- **Root cause:** missing `BACKEND_API_BASE_URL` (and backend `AgentService__BaseUrl`) environment variables on Render.
- **Fix:** set `BACKEND_API_BASE_URL` on the agent and `AgentService__BaseUrl` on the backend (documented env checklist).
- **Evidence:** `warehouse_tools.py` fetches `{BACKEND_API_BASE_URL}/api/dispatch/...`; the two distinct failure messages (*service* vs *context* unavailable) distinguish this from DEF-01.
- **Retest:** after setting the vars, the agent resolves batch context and validation returns a real PASS/FAIL. ✅

## DEF-05 — Inventory "Edit package" modal is unstable
- **Severity/Priority:** Medium / P2
- **Area:** Web (warehouse inventory).
- **Description:** Clicking **Edit** on an inventory item opened a popup that was unstable / did not stay put.
- **Steps to reproduce:** Inventory → make a package available → click **Edit**.
- **Root cause:** the modal rendered inline in the page tree, so an ancestor's layout could affect its fixed positioning.
- **Fix:** render `EditPackageForm` through a **React portal to `document.body`**, lock background scroll, add Escape/backdrop-close. Branch `feature/validation-ux-pass` (pending merge).
- **Evidence:** code diff; web `tsc + vite build` clean.
- **Retest:** modal now renders as a stable fixed overlay regardless of ancestor styles. ✅

## DEF-06 — Duplicate order-request validator
- **Severity/Priority:** Medium / P2
- **Area:** Backend (validation / DI).
- **Description:** Two `CreateDeliveryOrderRequestValidator` classes existed for the same request type, so which one ran was non-deterministic.
- **Steps to reproduce:** `IValidator<CreateDeliveryOrderRequest>` resolved via assembly scan with two registrations.
- **Root cause:** a leftover duplicate validator in a second namespace.
- **Fix:** removed the duplicate; consolidated recipient-required rules into the single validator. Branch `feature/validation-ux-pass`.
- **Evidence:** deleted file; backend build + 149 tests pass.
- **Retest:** one validator now enforces recipient name + 10-digit contact; suite green. ✅

## DEF-07 — Vitest crashes on the repo's Node 20.20
- **Severity/Priority:** Medium / P2
- **Area:** Web test tooling.
- **Description:** `vitest run` aborts with `TypeError: webidl.util.markAsUncloneable is not a function` before any test runs.
- **Steps to reproduce:** run the web tests on the project's nvm Node **v20.20**.
- **Root cause:** jsdom v30's bundled `undici` calls a Node API (`markAsUncloneable`) that exists only in **Node ≥ 22**.
- **Fix / workaround:** run the web tests on **Node 22** (`/usr/local/bin/node ./node_modules/vitest/vitest.mjs`). (Permanent fix: pin the project to Node 22, already its declared engine.)
- **Evidence:** the stack trace (undici → jsdom); the full web suite passing on Node 22.
- **Retest:** **100 web tests pass** on Node 22. ✅

## DEF-08 — Agent integration test not self-contained offline
- **Severity/Priority:** Low / P3
- **Area:** Agent test suite (hygiene).
- **Description:** `test_graph_resume_with_approval_completes` reaches the backend (`localhost:5000`) during the post-approval execute phase, so it fails when the backend isn't running.
- **Root cause:** the `offline` fixture doesn't stub the order-fetch used in the execute step.
- **Status:** **Open (mitigated)** — deselected for the offline agent run; the resume→execute→complete path is still covered by `BE-INT-03` (in-process) and the live E2E (Section 6). Proper fix: stub `order_tools` in the `offline` fixture.
- **Retest:** agent suite green once this one is deselected (**146 passed, 1 skipped**). ⚠ deferred.

---

**Defect summary:** 8 defects recorded — **6 fixed & retested**, 1 workaround applied (DEF-07), 1 deferred with mitigation (DEF-08). The three P1 deployment defects (DEF-01/02/03) were the cause of the "system not working after deploy" symptoms and are resolved.
