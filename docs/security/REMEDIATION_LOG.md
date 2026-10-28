# DataWise AI — Remediation Log

This log chronicles all engineering interventions, architectural hardenings, and verified code changes implemented during the production readiness hardening cycle.

---

### Phase 1: Frontend Type Consistency & Production Bundling
- **File**: `frontend/src/pages/assistant/AIAssistant.tsx`
- **Issue**: TypeScript compilation failed due to strict literal type constraint on `speed` and `overfitRisk` properties in `ModelComparisonItem`.
- **Change**: Generalized interface definition to `speed: string; overfitRisk: string;`.
- **Verification**: Executed `npm run build` in `frontend/`. Production bundle generated cleanly to `dist/` with zero TypeScript or asset bundling errors in 9.47s.

---

### Phase 2: RBAC & Exclusivity of Administrative Authority
- **File**: `backend/app/auth/rbac.py`
- **Issue**: The platform lacked enforcement ensuring only `masumganvir2006@gmail.com` could possess administrative access or database oversight.
- **Change**:
  - Defined `SUPER_ADMIN_EMAIL = "masumganvir2006@gmail.com"`.
  - In `get_current_user`, added automatic role downgrade:
    ```python
    if user and user.role in ("admin", "owner"):
        if not user.email or user.email.strip().lower() != SUPER_ADMIN_EMAIL.lower():
            user.role = "data_scientist"
    ```
  - Created `require_admin` dependency restricting all admin management endpoints to `SUPER_ADMIN_EMAIL`.
  - Blocked demo/test tokens in production environments.
- **Verification**: Created and executed `tests/test_admin_database_access.py`. 100% of tests passed.

---

### Phase 3: Project Authorization & Multi-Tenant Data Isolation
- **File**: `backend/app/api/endpoints/projects.py`
- **Issue**: Missing authentication check on `_verify_project_access` allowed unauthenticated requests to read projects and download artifacts.
- **Change**: Implemented strict three-point validation:
  1. `if not user:` raises HTTP 401 Unauthorized.
  2. Owner check: `is_owner = (p.user_id == user.id)`.
  3. Super-admin check: `is_admin = (user.email == "masumganvir2006@gmail.com")`.
  4. If neither, raises HTTP 403 Forbidden.
- **Verification**: Executed `tests/test_multi_user_isolation.py` and `tests/test_multi_project_identity_and_isolation.py`. All tests passed.

---

### Phase 4: Platform Settings Protection & SSRF Prevention
- **File**: `backend/app/api/endpoints/settings.py`
- **Issue**: `POST /api/settings` and `POST /api/settings/test-key` permitted unauthenticated modification and arbitrary outbound requests.
- **Change**:
  - Protected `POST /api/settings` with `require_admin` (`masumganvir2006@gmail.com` only).
  - Protected `POST /api/settings/test-key` with `require_authenticated_user`.
  - Added `_is_safe_local_endpoint` restricting Ollama endpoints to localhost/127.0.0.1.
- **Verification**: Verified in `tests/test_admin_database_access.py`.

---

### Phase 5: PostgreSQL Database Row-Level Security (RLS)
- **Files**: `backend/database/rls.sql`, `backend/database/supabase_master_schema.sql`, `database/supabase_schema.sql`
- **Issue**: Database RLS allowed any user with `role: "admin"` in JWT to bypass RLS policies.
- **Change**: Implemented security definer function:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_database_admin()
  RETURNS boolean AS $$
  BEGIN
    RETURN LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'masumganvir2006@gmail.com';
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
  Updated all RLS policies for `users`, `projects`, `datasets`, `runs`, `artifacts`, `models`, `predictions`, and `audit_logs` to require `public.is_database_admin()`.

---

### Phase 6: Dataset Metadata Dict Handling & Task Type Inference
- **File**: `backend/app/agents/project_planner.py`
- **Issue**: If dataset profile passed column metadata as dictionaries, `c.lower()` raised `AttributeError: 'dict' object has no attribute 'lower'`. Also `"sales"` was not recognized in `is_regression`.
- **Change**: Added column normalization safely extracting name from either string or dictionary, and added sales/volume keywords and time-series detection.
- **Verification**: Verified with `tests/test_multi_project_identity_and_isolation.py`.
