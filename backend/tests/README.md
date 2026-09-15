# LogiFlow backend tests

The API integration tests require a dedicated PostgreSQL database. The database
name must contain `test`; the test harness recreates it before each scenario.

```bash
export LOGIFLOW_TEST_CONNECTION_STRING='Host=127.0.0.1;Port=5432;Database=logiflow_tests;Username=postgres;Password=your-local-test-password'
dotnet test LogiFlow.sln
```

Do not point this setting at a development or production database.
