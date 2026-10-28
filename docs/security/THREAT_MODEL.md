# DataWise AI — Threat Model (STRIDE Methodology)

## 1. System Overview
DataWise AI processes multi-tenant machine learning workflows, user datasets, feature engineering pipelines, model training jobs, and artifact exports. 

## 2. Threat Analysis by STRIDE Category

### 2.1 Spoofing (Identity)
- **Threat**: Attacker creates account claiming to be administrator or forges JWT claims.
- **Defense**: 
  - JWTs are cryptographically signed with HMAC-SHA256 using server-side secret keys.
  - The super-admin identity is hardcoded to `masumganvir2006@gmail.com`. Any other user claiming admin is automatically downgraded to `"data_scientist"` by RBAC.

### 2.2 Tampering
- **Threat**: Cross-tenant modification of another user's project, dataset, or experiment plan.
- **Defense**:
  - `_verify_project_access` verifies owner equality before executing any mutation (PUT, POST, PATCH, DELETE).
  - Artifact storage keys compute SHA-256 checksums to detect file tampering.

### 2.3 Repudiation
- **Threat**: User denies performing action (e.g., deleting a dataset or changing settings).
- **Defense**:
  - Centralized `AuditLog` records every login, dataset upload, project modification, artifact download, and setting change with timestamps and user identifiers.

### 2.4 Information Disclosure
- **Threat**: Leakage of API keys, model parameters, stack traces, or other users' datasets.
- **Defense**:
  - `SecretRedactor` masks API keys (`AQ.A••••••••CQSA`), database URLs, and passwords.
  - `PIIRedactor` masks emails and phone numbers.
  - `OutputSecurityGate` strips internal filesystem paths (`C:\Users\...`) and stack traces from client-facing responses.

### 2.5 Denial of Service
- **Threat**: Malicious user submits excessive training jobs or pathological datasets to exhaust server memory and CPU.
- **Defense**:
  - Distributed rate limiting middleware (`RateLimitMiddleware`) restricts requests per IP/user.
  - Model training enforces strict time budgets (`time_budget_seconds=300`) and trial budgets (`max_trials=15`).

### 2.6 Elevation of Privilege
- **Threat**: Regular user accesses database administration or updates global LLM provider keys.
- **Defense**:
  - `require_admin` dependency restricts `POST /api/settings` to `masumganvir2006@gmail.com`.
  - Supabase PostgreSQL RLS enforces `public.is_database_admin()`.
