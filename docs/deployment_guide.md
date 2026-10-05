# LogiFlow Deployment Guide

This guide provides exactly what you need to deploy LogiFlow for your university assignment, fulfilling all the grading rubric requirements for the Database, Backend (API), Frontend (React), Mobile (Flutter), and AI agent layer.

## 1. Database (PostgreSQL on Neon)
* **Goal**: Deploy PostgreSQL securely with out-of-the-box infrastructure.
1. Create a free account on [Neon.tech](https://neon.tech/).
2. Click **New Project**, name it (e.g., `logiflow`), and select PostgreSQL version 16 (or higher).
3. Once provisioned, you will be shown your **Connection String**.
4. Important: To make Entity Framework (EF Core) run migration setups cleanly, check the box to reveal passwords, then copy your direct Connection String (e.g., `postgres://[user]:[password]@[host]/[dbname]?sslmode=require`). You will use this exact string in Step 3.

## 2. Agentic AI (Python Service on Railway or Run Locally)
* **Goal**: Provide the Agent service. The rubric allows for local running, but if you want to deploy it to Railway to sit alongside the backend:
1. In the same Railway project, click **New** → **GitHub Repo** and import your LogiFlow repository.
2. In the resulting Service Settings:
   * **Root Directory**: Select `/agent-service`
   * **Build Command**: Railway handles Python out of the box, but you can explicitly define `pip install -r requirements.txt`.
3. In **Variables**, provide any external keys your agent needs (e.g. `OPENAI_API_KEY`).
4. In **Networking**, click **Generate Domain** (e.g., `https://agent-service.up.railway.app`).

**Local Alternative**: Evaluators can run this locally using `cd agent-service && pip install -r requirements.txt && uvicorn main:app`.

## 3. ASP.NET Core API (Backend on Railway)
* **Goal**: Deploy the C# Backend and provide a live Health & Swagger URL.
1. In the same Railway project, click **New** → **GitHub Repo** and import your repository a second time.
2. In this new Service **Settings**:
   * **Root Directory**: Change this to `/backend`.
3. In the **Variables** tab, set exactly these keys to connect your Backend to your DB and Agent:
   * `ConnectionStrings__DefaultConnection` = `[Paste the DATABASE_URL from Step 1]` (Make sure it starts with `Host=...` format or standard `postgres://` depending on what .NET EF Core expects).
   * `AgentService__BaseUrl` = `https://agent-service.up.railway.app` (The URL from Step 2).
4. In **Networking**, generate a domain (e.g., `https://logiflow-api.up.railway.app`). 
5. Provide this URL + `/swagger` to your evaluators.

## 4. React (Frontend on Vercel)
* **Goal**: Deploy the React/Vite app and connect it to the deployed API.
1. Create a project on [Vercel](https://vercel.com/) by importing your repository.
2. In the setup wizard:
   * **Framework**: Vite
   * **Root Directory**: Select `web`
3. Expand **Environment Variables** and add the critical configuration:
   * **Key**: `VITE_API_BASE_URL`
   * **Value**: `https://logiflow-api.up.railway.app/api` (The backend URL generated in Step 3 + `/api`).
4. Click **Deploy**. Vercel will host this globally and securely. 

## 5. Flutter (Mobile App Distribution)
* **Goal**: Submit a runnable Android APK hooked to your cloud backend.
1. You do not need to host Flutter on Vercel. Mobile apps are physical installations.
2. Open your terminal in the LogiFlow repository.
3. CD into the mobile directory: `cd mobile`
4. Build the actual Android APK, overriding the host compiler so it points to your Railway Backend API using these Dart Defines:
   ```bash
   flutter build apk --release --dart-define=API_HOST=logiflow-api.up.railway.app --dart-define=API_PORT=443
   ```
   *(Ensure `--dart-define=API_PORT=443` is set because Railway runs securely on HTTPS port 443).*
5. The `app-release.apk` is generated in `build/app/outputs/flutter-apk/`. Submit this file directly to your university grading portal alongside your source code ZIP.
