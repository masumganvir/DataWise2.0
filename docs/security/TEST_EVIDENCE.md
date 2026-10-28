# DataWise AI — Test Evidence & Verification Records

## 1. Test Execution Summary

Every test reported below was executed against the actual codebase using pytest and Python 3.14.

| Test Suite | Path | Tests Executed | Passed | Failed | Status |
|---|---|---|---|---|---|
| **Admin & Database Access** | `backend/tests/test_admin_database_access.py` | 4 | 4 | 0 | **PASS** |
| **Multi-User Isolation** | `backend/tests/test_multi_user_isolation.py` | 7 | 7 | 0 | **PASS** |
| **Project Identity & Isolation** | `backend/tests/test_multi_project_identity_and_isolation.py` | 8 | 8 | 0 | **PASS** |
| **Recovery & Confidentiality** | `backend/tests/test_recovery_and_confidentiality.py` | 20 | 20 | 0 | **PASS** |
| **Auth & Audit** | `backend/tests/test_auth_and_audit.py` | 3 | 3 | 0 | **PASS** |
| **Storage & Security** | `backend/tests/test_storage_and_security.py` | 5 | 5 | 0 | **PASS** |
| **Step 22 Security Controls** | `backend/tests/test_step22_security.py` | 4 | 4 | 0 | **PASS** |
| **Frontend Production Build** | `frontend/` (`npm run build`) | Bundle build | 1 | 0 | **PASS** |

---

## 2. Key Verified Test Invariants

### 2.1 Admin Exclusivity
- `SUPER_ADMIN_EMAIL == "masumganvir2006@gmail.com"` is strictly enforced across Python backend and SQL RLS.
- Non-admin users attempting administrative operations are rejected with HTTP 403 Forbidden.
- Attempting to pass `role: "admin"` in a JWT as a non-admin results in automatic downgrade to `data_scientist`.

### 2.2 Cross-User Data Isolation
- User A cannot view, update, delete, or list User B's projects.
- User A cannot access User B's dataset files, model artifacts, or report bundles.
- Direct artifact downloads enforce tenant ownership before returning signed URLs or file streams.

### 2.3 Confidentiality & PII Masking
- API keys (OpenAI, Gemini, Groq, Anthropic, HuggingFace) are masked (`AQ.A••••••••CQSA`) in all API responses.
- Database connection strings with embedded passwords are automatically sanitized.
- Stack traces and internal filesystem paths are scrubbed from user-facing error bodies.
