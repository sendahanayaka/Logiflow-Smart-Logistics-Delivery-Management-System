# LogiFlow — Smart Logistics & Delivery Management System

SE3090 (Software Engineering Frameworks) group project. One coherent product: a React
web app and a Flutter mobile app consume the **same** ASP.NET Core Web API, the **same**
PostgreSQL database, the **same** JWT identity, roles and business rules. An internal
Python + LangGraph **Agentic AI** service plans fulfilment; a human operations manager
approves before anything dispatches.

> **This branch (`feature/agent-skeleton`) is the repository structure scaffold.** Most
> source files are placeholders carrying an ownership tag (`[ALL]`, `[S1]`–`[S4]`) and a
> `TODO`. Pull from `main` after this merges and fill in your own slice's folders. Real
> agent-service logic lands in a follow-up phase.

## Stack

| Layer | Tech |
|---|---|
| Backend | ASP.NET Core 8 Web API (clean layers: API → Application → Domain → Infrastructure) |
| Data | PostgreSQL + EF Core (Npgsql), code-first migrations |
| Web | React 18 + TypeScript, Redux Toolkit (RTK Query), Vite |
| Mobile | Flutter + Riverpod, dio, flutter_secure_storage |
| Agentic AI | Python + LangGraph, LLM via Ollama (`llama3.2:3b`), internal FastAPI service |
| Auth | JWT via ASP.NET Core Identity, role-based policies |
| CI | GitHub Actions (backend / web / mobile / agent pipelines, path-filtered) |

## Repository layout & ownership

```
backend/         ASP.NET Core solution (LogiFlow.sln)
  src/LogiFlow.Api            controllers, DTOs, validators, middleware   [ALL + S1..S4]
  src/LogiFlow.Application    services + non-CRUD engines per component
  src/LogiFlow.Domain         entities, enums, exceptions
  src/LogiFlow.Infrastructure EF Core, Identity, agent client, external gateways
  tests/                      unit + integration tests
web/             React 18 + TypeScript (Vite, RTK Query)                   [ALL + S1..S4]
mobile/          Flutter + Riverpod                                        [ALL + S1..S4]
agent-service/   Python + LangGraph internal service (invoked by API only) [S4 + ALL]
.github/workflows/  backend-ci · web-ci · mobile-ci · agent-ci
docs/            adr/ · api/ · diagrams/
scripts/         seed · run-local · demo-reset
```

Component ownership: **S1** Orders · **S2** Fleet · **S3** Warehouse · **S4** Delivery.
Shared (`[ALL]`): Auth, Users, Identity, Common, Middleware, infrastructure setup.

## Startup order (local dev)

1. PostgreSQL (`docker compose up postgres`)
2. Apply EF migrations + seed
3. `agent-service` — `ollama pull llama3.2:3b`, then `uvicorn app.main:app --port 8000`
4. ASP.NET Core API
5. Web / mobile clients

Copy `.env.example` → `.env` and fill in secrets (never commit `.env`).

## Contributing

Branch from `main` as `feature/s#-<topic>`; open a PR with at least one reviewer
(`[ALL]` files require two). CI must pass before merge. One EF migration per PR.
