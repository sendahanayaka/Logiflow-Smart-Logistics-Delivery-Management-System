# S4 — Delivery Execution & Tracking (backend slice)

The backend half of S4: it drives the Python routing agent, re-validates its plan,
persists the workflow, gates approval, dispatches a shipment, and serves live tracking
+ the driver run. React (ops/customer) and Flutter (driver) consume these endpoints;
the Python agent is internal-only (called by the backend, never by clients).

## Flow

```
POST /api/workflows            -> call agent, re-validate, persist plan (AwaitingApproval)
POST /api/workflows/{id}/approval  -> APPROVE => dispatch Shipment + first TrackingEvent (Completed)
                                      REJECT  => Rejected ;  REVISE => kept AwaitingApproval
GET  /api/shipments/{id}/run   -> driver's ordered stops + ETAs
POST /api/shipments/{id}/events-> ARRIVED recomputes downstream ETAs ; DEPARTED logs
POST /api/shipments/{id}/pod   -> proof of delivery; completes shipment when all stops delivered
GET  /api/tracking/{id}        -> customer/ops timeline (planned + actual, per-stop ETAs)
```

## Endpoints & roles

| Method & path | Role (JWT `ClaimTypes.Role`) | Purpose |
|---|---|---|
| `POST /api/workflows` | `ADMIN` | trigger the routing agent for a dispatch batch |
| `GET /api/workflows/{id}` | `ADMIN` | fetch a workflow + its route stops |
| `POST /api/workflows/{id}/approval` | `ADMIN` | approve / reject / revise |
| `GET /api/shipments/{id}/run` | `DRIVER`, `ADMIN` | the driver's assigned run |
| `POST /api/shipments/{id}/events` | `DRIVER`, `ADMIN` | report ARRIVED / DEPARTED |
| `POST /api/shipments/{id}/pod` | `DRIVER`, `ADMIN` | capture proof of delivery |
| `GET /api/tracking/{id}` | `ADMIN`, `CUSTOMER`, `DRIVER` | live tracking timeline |

`ADMIN` is the Operations Manager role (seeded by S1's `RoleConfiguration`).

## Key pieces

- **`EtaEngine`** (`Application/Delivery`) — pure, deterministic ETA computation (C# mirror of
  the Python `eta_calculator`) + `ValidatePlan` server-side re-validation ("the agent proposes,
  the backend decides": rejects impossible road<straight-line distances and non-monotonic ETAs).
- **`TimelineBuilder`** — merges planned stops with actual events; a delay is recomputed by
  re-running the engine from a later start.
- **`AgentServiceClient`** — typed `HttpClient` to the agent (snake_case JSON, timeout, optional
  `X-Internal-Api-Key`); any transport/non-2xx becomes an `AgentServiceException` (=> 502).

## Run locally

```bash
# 1. Postgres
docker compose up -d postgres            # from repo root (creds logiflow/logiflow)

# 2. apply migrations
cd backend
export S3_MIGRATION_CONNECTION="Host=localhost;Port=5432;Database=logiflow;Username=logiflow;Password=logiflow"
dotnet ef database update --project src/LogiFlow.Infrastructure --startup-project src/LogiFlow.Api

# 3. config (never commit real secrets)
export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=logiflow;Username=logiflow;Password=logiflow"
export Jwt__Key="a-32+char-development-signing-key-change-me"
export AgentService__ApiKey=""           # set the shared secret in staging/demo

# 4. run the API (and the Python agent separately on :8000)
dotnet run --project src/LogiFlow.Api
```

## Test

```bash
dotnet test backend/LogiFlow.sln        # unit + integration, no Postgres/agent needed
```
Unit tests use EF InMemory + a fake agent client; integration tests boot the API in-process
(`WebApplicationFactory`) with an in-memory DB, a fake agent, and JWTs, and exercise the full
HTTP flow (trigger -> approve -> drive -> track) plus 401/403 auth enforcement.

## Security posture

- Every endpoint is JWT + role gated; the agent service is internal-only with an optional
  shared-secret header.
- Secrets come from config/env, never code (`.env` gitignored; `appsettings.json` ships blanks).
- Input is validated (FluentValidation); customer order text is treated as data, never
  instructions (enforced in the agent).

## Known limitations (deferred)

- **Per-customer tracking ownership** — `GET /api/tracking/{id}` is role-gated but not scoped to
  the requesting customer; needs the order -> customer link from S1.
- **REVISE** records the request and keeps the workflow awaiting; a true agent replan loop is not
  implemented yet.
- **Depot & dispatch time** — ETAs anchor on the first stop; the warehouse->first-stop leg and a
  real dispatch time need those fields added to the contract (from S2/S3).
