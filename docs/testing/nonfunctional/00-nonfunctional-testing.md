# Non-Functional Testing — LogiFlow (Group / Whole System)

**Project:** LogiFlow — Smart Logistics & Delivery Management · SE3090 Assignment 2
**Scope:** Whole-system non-functional testing (group deliverable, not an individual slice).
**Required:** Performance + Security. **Additional (justified):** Accessibility.
**Date:** 2026-10-08

---

## 1. Tool selection & justification

| Non-functional type | Tool | Why this tool |
|---------------------|------|---------------|
| **Performance + Load** (required) | **k6** | Scriptable load generator, code-as-tests with pass/fail **thresholds**; a suggested tool in the brief; runs headless with clear metrics (p95, RPS, error rate). |
| **Security** (required) | **SCA + manual**: `npm audit` (web), `dotnet list package --vulnerable` (backend), `pip-audit` (agent) + TLS/header inspection + access-control probing | Covers the OWASP "Vulnerable & Outdated Components" and "Broken Access Control" risks across all three stacks. **OWASP ZAP was not used** because its standard run needs Docker (unavailable here) and the deployed target is a shared free-tier instance an active scan could overload; SCA + authz probing give reproducible, stack-wide security evidence without that risk. |
| **Accessibility** (additional, justified) | **Lighthouse** (headless Chrome) | The system has a **customer-facing React web app**, so accessibility (WCAG) is a relevant quality attribute; Lighthouse gives an objective score + actionable audits, and also a frontend performance score. |

**Justification for choosing Accessibility as the additional type:** LogiFlow exposes a public customer portal (landing, registration, order tracking). Accessibility directly affects whether real customers can use it, so it is the most relevant extra non-functional attribute to evidence (over, e.g., compatibility).

## 2. Test environment
- **Backend under test:** run locally (`http://localhost:5050`) against local **PostgreSQL 15**, so load numbers are not skewed by free-tier throttling.
- **Web under test:** production build served via `vite preview` (`http://localhost:4173`).
- **Security scans:** against the repo dependencies (all stacks) + the deployed backend (`…onrender.com`) for transport/headers.
- Tools: k6 v2.3, Lighthouse (headless Chrome), `npm audit`, `dotnet list package --vulnerable`, `pip-audit`.

## 3. Test cases & results

| ID | Type | What is tested | Tool | Expected / Threshold | Actual Result | Status |
|----|------|----------------|------|----------------------|---------------|--------|
| NF-PERF-01 | Load | 20 VUs for ~35s on `GET /api/shipments` (auth'd) | k6 | p95 < 500 ms; errors < 1%; checks > 99% | **p95 = 5.64 ms**, avg 4.5 ms, **0% errors**, 560 reqs @ ~15.6 rps, checks 100% (1119/1119) | **Pass** |
| NF-PERF-02 | Performance (frontend) | Landing page load performance | Lighthouse | Score reported | **69 / 100** (bundle-size dominated; code-splitting would raise it) | Reported |
| NF-SEC-01 | Security (SCA) | Backend NuGet dependencies | `dotnet list package --vulnerable` | Identify vulnerable packages | **2 High**: `System.Text.Json 8.0.4` (GHSA-8g4q-xg66-9fp4), `Microsoft.Extensions.Caching.Memory 8.0.0` (GHSA-qj66-m88j-hmgj) | Findings (fix) |
| NF-SEC-02 | Security (SCA) | Web npm dependencies | `npm audit` | Identify vulnerable packages | **9 vulns** (3 critical, 2 high, 4 moderate) — mostly dev-only (vitest/tinypool chain) | Findings (fix) |
| NF-SEC-03 | Security (SCA) | Agent Python dependencies | `pip-audit` | Identify vulnerable packages | `starlette 0.41.3` (multiple PYSEC-2026 CVEs), `setuptools 65.5.0` (PYSEC-2026-3447) | Findings (fix) |
| NF-SEC-04 | Security (transport) | HTTPS + security headers on deployed backend | curl | TLS on; security headers present | HTTPS/HTTP-2 via Cloudflare ✅; **missing** HSTS / X-Content-Type-Options / X-Frame-Options / CSP ⚠ | Finding (harden) |
| NF-SEC-05 | Security (access control) | Unauthenticated access to a protected endpoint | curl | 401 | `GET /api/shipments` (no token) → **401** | **Pass** |
| NF-SEC-06 | Security (access control) | Role escalation — customer hitting an ADMIN endpoint | curl | 403 | customer token → `POST /api/workflows` → **403** | **Pass** |
| NF-ACC-01 | Accessibility | WCAG audit of the customer web | Lighthouse | High score, note issues | **Accessibility = 98 / 100** | **Pass** |

## 4. Interpretation & findings

**Performance:** the API is very responsive under load — p95 **5.64 ms** with **zero errors** at 20 concurrent users, so the backend + PostgreSQL comfortably handle the expected demo load. (On the free-tier deployment the first request after idle is slower due to cold start — see individual Defect DEF-01, now mitigated with higher client timeouts.) Frontend Lighthouse performance (69) is limited by a single large JS bundle; **recommendation:** code-split / lazy-load routes.

**Security:** access control is correctly enforced (NF-SEC-05/06 pass — JWT required, roles enforced). SCA surfaced **actionable dependency vulnerabilities** on every stack; **recommendations:**
- Backend: upgrade `System.Text.Json` and `Microsoft.Extensions.Caching.Memory` to the patched 8.0.x.
- Agent: upgrade `starlette` (and `setuptools`).
- Web: the critical/high items are dev-only (test tooling); `npm audit fix` for the rest.
- Deployment: add security headers (HSTS, X-Content-Type-Options, X-Frame-Options, a basic CSP).

**Accessibility:** the customer web scores **98/100** — strong; remaining points are minor (e.g., colour-contrast / label refinements Lighthouse lists).

## 5. Reproduce / evidence
```bash
# Performance/load (backend must be running on :5050)
k6 run -e BASE_URL=http://localhost:5050/api docs/testing/nonfunctional/k6/load-test.js

# Security — SCA
(cd web && npm audit)
(cd backend && dotnet list package --vulnerable --include-transitive)
agent-service/.venv/bin/pip-audit

# Security — transport + access control
curl -sI https://logiflow-smart-logistics-delivery.onrender.com/swagger/index.html
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5050/api/shipments        # 401

# Accessibility (web preview on :4173)
npx lighthouse http://localhost:4173/ --only-categories=accessibility,performance --chrome-flags="--headless"
```
Evidence files: `evidence/k6-summary.json`, `npm-audit-web.txt`, `dotnet-vulnerable.txt`, `pip-audit-agent.txt`, `security-headers.txt`, `lighthouse.report.html`.

**Summary:** Performance **Pass** (p95 5.64 ms, 0% errors), Security **enforced** with SCA findings raised for remediation, Accessibility **98/100**. Required perf + security covered; accessibility added and justified.
