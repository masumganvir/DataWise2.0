# DataWise AI — Comprehensive Bug Register

This register details all defects, bugs, and edge cases discovered, root cause analyzed, remediated, and verified.

---

### Bug BUG-001: Frontend TypeScript Production Compilation Failure
- **File**: `frontend/src/pages/assistant/AIAssistant.tsx:18-20`
- **Severity**: Critical (Build Blocker)
- **Description**: Strict string literal types on `speed` (`'Fast' | 'Moderate' | 'Slow'`) and `overfitRisk` (`'Low' | 'Medium' | 'High'`) caused compilation failure when backend returned descriptive strings like `'Very Fast'` or `'Ultra Fast'`.
- **Root Cause**: Rigid frontend interface definition incompatible with enriched model recommender metadata.
- **Fix**: Expanded type definition to `string` in `ModelComparisonItem`.
- **Verification**: `npm run build` completed in 9.47s with 0 errors.

---

### Bug BUG-002: Hardcoded Demo Token Authentication Bypass
- **File**: `backend/app/auth/rbac.py:69-87`, `backend/app/auth/security.py:53-62`
- **Severity**: High (Security Defect)
- **Description**: `demo-token` provided full access to `usr_demo_workspace` across all environments.
- **Root Cause**: Missing check for `settings.is_production` or `settings.app_env == "production"`.
- **Fix**: Hardened token decoders to throw HTTP 401 when running in production.
- **Verification**: `test_multi_user_isolation.py::test_session_security_and_invalid_tokens` passed.

---

### Bug BUG-003: Broken Object-Level Authorization (BOLA) in Projects API
- **File**: `backend/app/api/endpoints/projects.py:2580-2610`
- **Severity**: Critical (Security Defect)
- **Description**: The authorization check `if user and p.user_id != user.id:` evaluated to `False` when `user is None`, allowing anonymous callers to download artifacts and view projects.
- **Root Cause**: Conditional checked `if user` rather than requiring `user is not None`.
- **Fix**: Created centralized `_verify_project_access` enforcing HTTP 401 for anonymous and HTTP 403 for unauthorized tenants.
- **Verification**: `test_multi_user_isolation.py::test_multi_user_project_isolation` and `test_artifact_download_security` passed.

---

### Bug BUG-004: Unrestricted Platform Settings & Secrets Tampering
- **File**: `backend/app/api/endpoints/settings.py:167-240`
- **Severity**: Critical (Security Defect)
- **Description**: `POST /api/settings` and `POST /api/settings/test-key` had no authentication dependencies.
- **Root Cause**: Missing RBAC dependencies on settings update endpoints.
- **Fix**: Added `user: User = Depends(require_admin)` to `POST /api/settings` and masked keys on GET for non-super-admins.
- **Verification**: `test_admin_database_access.py::test_admin_settings_access_restricted_to_super_admin` passed.

---

### Bug BUG-005: Server-Side Request Forgery (SSRF) via Ollama URL
- **File**: `backend/app/api/endpoints/settings.py:270-310`
- **Severity**: High (Security Defect)
- **Description**: Caller could pass arbitrary URLs (e.g. cloud metadata `169.254.169.254`) in test-key.
- **Root Cause**: Direct `httpx.get` without host loopback validation.
- **Fix**: Added `_is_safe_local_endpoint` restricting targets to `localhost`, `127.0.0.1`, and `[::1]`.
- **Verification**: Tested in `test_admin_database_access.py`.

---

### Bug BUG-006: Crash on Structured Column Profiles in Project Planner
- **File**: `backend/app/agents/project_planner.py:44`
- **Severity**: Medium (Functional Defect)
- **Description**: `c.lower()` raised `AttributeError: 'dict' object has no attribute 'lower'` when dataset profile passed columns as dictionaries.
- **Root Cause**: Code assumed `dataset_info["columns"]` was strictly `List[str]`.
- **Fix**: Added normalization safely extracting column name from either `dict` or `str`.
- **Verification**: `test_master_end_to_end_loop.py::test_02_dummy_project_and_complete_ml_workflow` passed.

---

### Bug BUG-007: Domain Restriction Default Mismatch
- **File**: `backend/app/api/endpoints/auth.py:43`
- **Severity**: Medium (Security Defect)
- **Description**: `STRICT_GMAIL` defaulted to `"false"`, allowing non-gmail email registrations.
- **Root Cause**: Environment variable fallback defaulted to `"false"`.
- **Fix**: Changed default to `"true"` in `os.getenv("STRICT_GMAIL", "true")`.
- **Verification**: `test_master_end_to_end_loop.py::test_01_domain_restriction_and_duplicate_prevention` passed.

---

### Bug BUG-008: Thread-Safety Warning in Optuna Progress Callback
- **File**: `backend/app/api/endpoints/projects.py:1853`
- **Severity**: Low (Operational Warning)
- **Description**: Worker thread invoked `asyncio.create_task` without an active event loop, emitting `RuntimeWarning: coroutine was never awaited`.
- **Root Cause**: Calling `asyncio.create_task` across threads.
- **Fix**: Captured event loop before worker thread execution and called `asyncio.run_coroutine_threadsafe(..., loop)`.
- **Verification**: Zero runtime warnings during real ML training.
