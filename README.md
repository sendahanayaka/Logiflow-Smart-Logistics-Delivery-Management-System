# LogiFlow

LogiFlow is a Smart Logistics & Delivery Management Platform. This repository
currently provides the shared web, API, identity, and database foundation on
which the team can build the logistics modules.

## Current Shared Foundation

- Public landing page and Customer registration
- JWT access-token authentication with rotating, server-stored refresh sessions
- HttpOnly refresh cookie, session restoration, and server-backed logout
- Customer, Driver, Warehouse Staff, and Operations Manager authorization
- Responsive authenticated `/app` shell with role-aware navigation
- Operations Manager user listing, details, editing, role, and status management
- PostgreSQL schema managed by Entity Framework Core migrations

Orders, fleet, warehouse, delivery, mobile, and agentic AI modules are not
implemented yet.

## Tech Stack

Backend:

- ASP.NET Core 8 and C#
- Entity Framework Core 8 with Npgsql
- PostgreSQL
- ASP.NET Core Identity
- JWT bearer authentication

Web:

- React 18
- Redux Toolkit and RTK Query
- React Router
- Vite

Flutter and a Python/LangGraph service are planned future architecture, not
current runtime requirements.

## Roles

- `Customer`: created through public registration
- `Driver`: created and managed by an Operations Manager
- `WarehouseStaff` (displayed as Warehouse Staff): created and managed by an Operations Manager
- `OperationsManager` (displayed as Operations Manager): manages internal users

Public `/register` always creates a Customer. It cannot be used to create staff
or manager accounts.

## Prerequisites

- Git
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Node.js `20.19+` or `22.12+` and npm
- PostgreSQL 14 or newer, including command-line tools
- `dotnet-ef` 8.0.30 when applying or creating migrations

Install the matching EF tool globally if it is not already available:

```bash
dotnet tool install --global dotnet-ef --version 8.0.30
```

If it is already installed at another 8.0 patch version, update it with
`dotnet tool update --global dotnet-ef --version 8.0.30`.

## Repository Structure

```text
backend/
  src/LogiFlow.Api/             HTTP API and application startup
  src/LogiFlow.Application/     use cases and service contracts
  src/LogiFlow.Domain/          shared domain models and enums
  src/LogiFlow.Infrastructure/  Identity, PostgreSQL, JWT, and migrations
  tests/LogiFlow.Api.Tests/     API integration tests
web/
  public/                       logo and favicon
  src/app/                      Redux store, API base query, and router
  src/features/                 authentication, public, and user features
  src/shared/                   reusable components, hooks, and layouts
  tests/                        Vitest and Testing Library tests
```

## Local Database Setup

Create a local PostgreSQL role and database. Choose your own password rather
than copying a credential from source control.

```bash
createuser --pwprompt logiflow
createdb --owner=logiflow logiflow
```

Set the connection string in your shell or IDE:

```bash
export ConnectionStrings__DefaultConnection='Host=localhost;Port=5432;Database=logiflow;Username=logiflow;Password=YOUR_LOCAL_PASSWORD'
```

Any compatible PostgreSQL provider, including a future shared service such as
Neon, can be used by changing this setting. LogiFlow has no provider-specific
SDK or database code.

## Environment Variables

The safe [`.env.example`](.env.example) lists the backend configuration names.
It is documentation only; ASP.NET Core reads values from the process
environment, an IDE launch profile, user-secrets, or another configured .NET
configuration provider.

Required backend configuration:

```text
ConnectionStrings__DefaultConnection
Jwt__Issuer
Jwt__Audience
Jwt__SigningKey                 # at least 32 bytes; never commit the value
Jwt__ExpiryMinutes
Jwt__RefreshTokenExpiryDays
Cors__AllowedOrigins__0         # add __1, __2, etc. for more origins
AuthCookies__RefreshTokenSecure # false for local HTTP; true for HTTPS
```

Optional Development-only initial manager configuration:

```text
IdentitySeed__OperationsManager__Email
IdentitySeed__OperationsManager__Password
IdentitySeed__OperationsManager__FullName
IdentitySeed__OperationsManager__PhoneNumber
```

For the web app, copy the existing example if you want the Vite development
proxy:

```bash
cp web/.env.example web/.env
```

`VITE_API_BASE_URL` defaults to `/api`. `VITE_DEV_API_TARGET` configures the
development proxy target and defaults to the documented API URL in the example.
The local `web/.env` file is ignored and must not be committed.

## Database Migrations

EF migrations are the database source of truth. With the connection string and
required JWT/cookie configuration set, run from the repository root:

```bash
dotnet restore backend/LogiFlow.sln
dotnet ef database update \
  --project backend/src/LogiFlow.Infrastructure \
  --startup-project backend/src/LogiFlow.Api
```

The checked-in migration chain creates the Identity/user-management schema and
then the refresh-token session schema. Do not create these tables manually.

## Backend Setup

Provide a development signing key and the database configuration before
starting the API. Values shown here are placeholders:

```bash
export Jwt__SigningKey='REPLACE_WITH_A_RANDOM_DEVELOPMENT_SECRET_OF_32_BYTES_OR_MORE'
export AuthCookies__RefreshTokenSecure='false'
export Cors__AllowedOrigins__0='http://localhost:5173'

dotnet restore backend/LogiFlow.sln
dotnet run --project backend/src/LogiFlow.Api --launch-profile http
```

The HTTP launch profile serves the API at `http://localhost:5080`. Swagger is
available at `http://localhost:5080/swagger` in Development.

### Initial Operations Manager

To seed the first Operations Manager for local development, set the four
`IdentitySeed__OperationsManager__...` values listed above before starting the
API with `ASPNETCORE_ENVIRONMENT=Development`. Email and password are required;
full name and phone number are optional. The password must have at least eight
characters, uppercase and lowercase letters, a number, and a special character.

On startup, the API creates the four roles and creates the configured manager
only when it does not already exist. That manager can use `/users` to create and
manage internal accounts. Public registration remains Customer-only.

## Frontend Setup

```bash
cd web
npm ci
cp .env.example .env
npm run dev
```

Vite serves the web app at `http://localhost:5173`. Start the API first so the
configured `/api` proxy can forward authentication and application requests.

## Running the Application

Use this order after cloning:

1. Start PostgreSQL and create the local role/database.
2. Export backend configuration and apply EF migrations.
3. Start the ASP.NET Core API on `http://localhost:5080`.
4. Install web dependencies with `npm ci` and start Vite on `http://localhost:5173`.
5. Open the landing page, register a Customer, sign in, and continue to `/app`.

No agent service is needed for the current foundation.

## Authentication Flow

Login returns a short-lived access token and current user in JSON. The web app
keeps the access token only in Redux memory. The API sends the long-lived
refresh token only as an HttpOnly cookie and stores only its SHA-256 hash.
Startup refresh restores a browser session, successful refresh rotates the
server-side session, and logout revokes it before clearing client state.

## Tests and Checks

Backend integration tests require a dedicated PostgreSQL database whose name
contains `test`; the harness deletes and recreates it. Never point it at a
development, shared, or production database. See
[`backend/tests/README.md`](backend/tests/README.md).

```bash
dotnet test backend/LogiFlow.sln

cd web
npm run lint
npm test
npm run build
```

## Git Workflow

1. Update local `main`, then create a focused feature branch.
2. Keep commits cohesive and do not push directly to `main`.
3. Open a pull request and request review for shared code or contracts.
4. Coordinate EF migrations to avoid conflicting snapshots or migration order.
5. Rebase or merge the latest `main` and rerun backend and frontend checks before merging.
