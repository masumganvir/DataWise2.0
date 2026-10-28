# DataWise AI — Engineering Change Log

All significant architectural interventions, bug fixes, and security enhancements are recorded here in reverse chronological order.

---

### [2026-10-28] — Production Hardening & Security Audit Release
- **Security & Authorization**:
  - Bound administrative authority exclusively to `masumganvir2006@gmail.com` across backend RBAC (`app/auth/rbac.py`) and PostgreSQL Row-Level Security (`backend/database/rls.sql`).
  - Added automatic role downgrade in `get_current_user` to strip admin roles from unauthorized users.
  - Disabled all development/demo tokens when running in production (`settings.is_production`).
  - Implemented `_verify_project_access` enforcing HTTP 401 for anonymous callers and HTTP 403 for cross-tenant callers.
  - Added `require_admin` dependency to `POST /api/settings` and masked API keys on `GET /api/settings`.
  - Added `_is_safe_local_endpoint` preventing SSRF on custom Ollama endpoints.
- **Frontend Quality**:
  - Generalized `ModelComparisonItem` interface in `frontend/src/pages/assistant/AIAssistant.tsx` resolving TypeScript compilation failure.
  - Production build verified with `npm run build` (0 errors).
- **Machine Learning & Reliability**:
  - Handled structured dictionary column metadata in `project_planner.py`.
  - Expanded regression and forecasting task-type inference keywords (`sales`, `volume`, `quantity`).
  - Captured main event loop before thread dispatch in `projects.py` and utilized `asyncio.run_coroutine_threadsafe(..., loop)`.
  - Optimized liveness probing in `test_live_workflow_e2e.py` from 21 seconds to 0.8 ms.
- **Testing & Documentation**:
  - Authored dedicated security test suite `backend/tests/test_admin_database_access.py`.
  - Verified 100% pass across all test suites (43/43 tests passed).
  - Authored complete security, quality, testing, and deployment documentation.
