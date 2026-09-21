<!-- [S4] internal agent-service -->
# LogiFlow Agent Service (internal only)

Python + LangGraph workflow, invoked by the ASP.NET Core API — never reachable from clients.
Real skeleton (state, schemas, graph, stubs, tests) lands in Phase 2.

Run: `ollama pull llama3.2:3b` then `uvicorn app.main:app --port 8000`.
