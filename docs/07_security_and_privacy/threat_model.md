# Security & Privacy — Threat Model

## Authentication Architecture

DataWise AI supports three authentication providers, configured via environment variables:

### 1. Clerk OAuth (Primary)
- **Provider**: Clerk (`@clerk/clerk-react` v5.61+)
- **Protocols**: Google OAuth 2.0, GitHub OAuth
- **Frontend**: `ClerkSyncManager` component in `App.tsx` syncs Clerk sessions to backend
- **Backend**: `decode_access_token()` in `backend/app/auth/security.py` validates Clerk JWTs by inspecting `iss` field for "clerk" and `sub` for "user_" prefix
- **Status**: IMPLEMENTED

### 2. Supabase Auth
- **Provider**: Supabase (`@supabase/supabase-js`)
- **Backend**: JWT verification using `SUPABASE_JWT_SECRET` with HS256 algorithm and "authenticated" audience
- **Fallback**: Supabase client API `get_user()` for token validation
- **Status**: IMPLEMENTED

### 3. Local JWT
- **Implementation**: `python-jose` library with HS256
- **Token generation**: `create_access_token()` with configurable expiration (default 60 minutes)
- **Password hashing**: Argon2id (primary) with PBKDF2-HMAC-SHA256 fallback
- **Status**: IMPLEMENTED

### Demo/Development Tokens
- Tokens `demo-token`, `test-token`, `dev-token` are accepted in development mode
- Returns a fixed demo user identity — **must be disabled in production**

## Authorization (RBAC)

Implemented in `backend/app/auth/rbac.py`:

| Role | Capabilities |
|------|-------------|
| owner | Full access to all resources |
| admin | Manage users, projects, system configuration |
| developer | Create and manage own projects, full ML access |
| data_scientist | Create projects, run experiments, view results |
| viewer | Read-only access to shared projects |

### Project Isolation
- All project queries include `user_id` filtering: `query.filter(Project.user_id == current_user.id)`
- Datasets, experiments, models, and artifacts inherit project-level access
- **Status**: IMPLEMENTED — verified in `test_multi_user_isolation.py` and `test_multi_project_identity_and_isolation.py`

## Encryption

### In Transit
- HTTPS enforced in production via reverse proxy (nginx configuration in `frontend/nginx.conf`)
- WebSocket connections use WSS in production
- **Status**: IMPLEMENTED (deployment configuration)

### At Rest — Field-Level Encryption
- **Implementation**: `encrypt_data()` / `decrypt_data()` in `backend/app/auth/security.py`
- **Algorithm**: AES-256 via Fernet (authenticated encryption)
- **Key derivation**: PBKDF2-HMAC-SHA256 with 100,000 iterations from `SECRET_KEY`
- **Status**: IMPLEMENTED — available for sensitive fields

## Prompt Injection Defenses

Implemented in `backend/app/security/prompt_guard.py`:
- Input sanitization for LLM prompts
- Detection of injection patterns
- System prompt separation from user input
- **Status**: IMPLEMENTED

## File Upload Security

Implemented in `backend/app/security/file_validator.py`:
- Extension whitelist: csv, xlsx, xls, json, parquet
- MIME type validation
- Maximum file size enforcement (configurable, default 100MB)
- Content scanning for malicious payloads
- Filename sanitization to prevent path traversal
- **Status**: IMPLEMENTED

## Execution Sandboxing

Implemented in `backend/app/security/sandbox.py`:
- Agent execution isolation
- Resource limits for ML training
- Timeout enforcement
- **Status**: IMPLEMENTED

## Rate Limiting

Implemented in `backend/app/security/rate_limiter.py` and `backend/app/rate_limit/middleware.py`:
- Distributed sliding window algorithm (Redis-backed)
- Per-route configurable limits:
  - Default: 120 requests/min
  - Auth: 10 requests/min/IP
  - Upload: 20 uploads/hour/user
  - Training: 10 runs/hour/user
  - Prediction: 300 requests/min
- **Status**: IMPLEMENTED

## Error Response Sanitization

The 18-module recovery system ensures no sensitive information leaks in error responses:
- `ErrorDetector` → `ErrorClassifier` → `SafeErrorFormatter` → `OutputSecurityGate`
- `SecretRedactor`: Redacts API keys, passwords, connection strings from logs
- `PiiRedactor`: Redacts email addresses, phone numbers, personal identifiers
- **Status**: IMPLEMENTED

## API Key Security

- Keys generated with `secrets.token_urlsafe(32)` — 256 bits of entropy
- Only SHA-256 hash stored in database — raw key shown only once
- Key prefix stored for lookup without full comparison
- **Status**: IMPLEMENTED

## Security Controls NOT Yet Implemented

| Control | Status | Recommendation |
|---------|--------|---------------|
| CSP Headers | PLANNED | Add Content-Security-Policy headers |
| CSRF Protection | PLANNED | Implement CSRF tokens for state-changing operations |
| Session Rotation | PLANNED | Rotate session tokens after authentication |
| Dependency Scanning | PLANNED | Add automated CVE scanning for Python/npm packages |
| Penetration Testing | NOT PERFORMED | Commission professional pentest before production |
| SOC 2 / ISO 27001 | NOT APPLICABLE | Requires organizational compliance program |
