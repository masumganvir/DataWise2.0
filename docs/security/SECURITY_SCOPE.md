# DataWise AI — Security Scope & Authorization Boundaries

## 1. Authorized Testing Scope
Testing is authorized strictly against the local development environment and isolated SQLite/Supabase test instances:
- **Repository Root**: `c:\Users\Chokha\Desktop\DATAPREPAGENT`
- **Backend API**: `http://127.0.0.1:8000` / `http://localhost:8000`
- **Frontend SPA**: `http://localhost:5173`
- **Test In-Memory Database**: `sqlite+aiosqlite:///:memory:`
- **Staging Target**: Dedicated staging Supabase project owned by platform administrators.

## 2. Prohibited Actions & Boundaries
- No uncontrolled Denial of Service (DoS) attacks or volumetric stress testing.
- No attacks against third-party OAuth providers (Google, GitHub, Clerk) or LLM endpoints (Groq, Anthropic, OpenAI, Gemini).
- No production database schema alteration or destructive actions without snapshot backups.
- No real customer PII or credentials utilized during vulnerability assessment; all test data is synthetic.

## 3. Strict Administrative Authority Boundary
- **Exclusive Database & System Administrator**: `masumganvir2006@gmail.com`.
- No other user, account, or external party may possess administrative access, bypass tenant isolation, or modify global settings.
- Any attempt by non-authorized users to claim role `"admin"` or `"owner"` results in automatic downgrade to `"data_scientist"` and HTTP 403 Forbidden.
