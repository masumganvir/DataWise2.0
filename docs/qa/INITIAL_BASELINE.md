# DataWise AI — Initial Quality Baseline Assessment

## 1. System Inventory & Application Architecture
- **Application Name**: DataWise AI (Autonomous Agentic Data Science & AutoML Platform)
- **Primary Language & Stacks**:
  - **Backend**: FastAPI 0.115+, Python 3.11/3.14, SQLAlchemy 2.0 AsyncIO, Supabase PostgreSQL, Redis caching with in-memory fallback.
  - **ML Platform**: Scikit-Learn, Optuna (Bayesian Optimization with TPESampler), LightGBM, XGBoost, CatBoost, SHAP.
  - **Agentic Engine**: LangGraph StateGraph (15-stage pipeline, multi-agent supervisor orchestrator).
  - **Frontend**: React 18, Vite 5.x, TypeScript (strict mode), Tailwind CSS / Vanilla CSS glassmorphic tokens, Clerk & Supabase auth stores.
- **Repository Location**: `c:\Users\Chokha\Desktop\DATAPREPAGENT`
- **Designated Super Admin**: `masumganvir2006@gmail.com`

---

## 2. Baseline Status Matrix (Before Production Hardening)

| Category | Initial Observation | Measured Impact | Baseline Status |
|---|---|---|---|
| **Frontend Production Build** | TypeScript literal mismatch on `ModelComparisonItem` in `AIAssistant.tsx`. | Build aborted with exit code 1; `npm run build` failed to create `dist/`. | **DEFECT (CRITICAL)** |
| **Authentication & Tokens** | Hardcoded tokens (`demo-token`, `dev-token`) allowed anonymous access. | Bypassed authentication in all environments including production. | **DEFECT (HIGH)** |
| **Multi-User Isolation (BOLA)** | `projects.py` evaluated `if user and p.user_id != user.id`. | Anonymous callers bypassed ownership check and could view/download any user's project/artifacts. | **DEFECT (CRITICAL)** |
| **Database Administration** | Direct RLS allowed any user with `role: "admin"` in JWT to bypass RLS. | Database was vulnerable to privilege escalation by any tenant. | **DEFECT (CRITICAL)** |
| **Settings & Secrets Protection** | `POST /api/settings` lacked authorization checks. | Anonymous callers could overwrite OpenAI, Groq, and Gemini API keys. | **DEFECT (CRITICAL)** |
| **SSRF Exposure** | Ollama endpoint URL was unvalidated. | Attackers could probe internal cloud metadata (`169.254.169.254`) or VPC hosts. | **DEFECT (HIGH)** |
| **Dataset Column Parsing** | `c.lower()` assumed columns list contained only strings. | Crashed with `AttributeError: 'dict' object has no attribute 'lower'` on structured profiles. | **DEFECT (MEDIUM)** |
| **Task Type Inference** | Keywords for sales/volume and time-series were missing in regression detection. | Mislabeled retail sales forecasting datasets as binary classification. | **DEFECT (MEDIUM)** |
| **E2E Probe Latency** | `urllib.request.urlopen` used blocking 21-second timeouts. | Idle probe lag delayed CI/CD test execution by 21 seconds per probe. | **PERFORMANCE LAG** |
| **Optuna Event Dispatch** | Worker threads invoked `asyncio.create_task` without an event loop. | Emitted runtime warnings and caused potential event drop during HPO. | **DEFECT (LOW)** |
