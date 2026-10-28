# DataWise AI — System Inventory & Architecture Specification

## 1. Executive Overview
- **Application Name**: DataWise AI (Autonomous Agentic Data Science & AutoML Platform)
- **Primary Repository**: `c:\Users\Chokha\Desktop\DATAPREPAGENT`
- **Super Administrator**: `masumganvir2006@gmail.com` (Sole designated administrator with database oversight)
- **Security Posture**: Enterprise Multi-Tenant Zero-Trust Architecture with Row-Level Security (RLS), Strict RBAC, End-to-End Cryptographic Artifact Integrity, and Outlier/Leakage Guards.

---

## 2. Component Inventory

### 2.1 Backend Core
- **Framework**: FastAPI (Async ASGI, Python 3.11/3.14)
- **Server**: Uvicorn / Gunicorn ASGI Workers
- **Database ORM**: SQLAlchemy 2.0 (AsyncIO with `async_sessionmaker`, PostgreSQL / SQLite fallback)
- **Database Engine**: Supabase Managed PostgreSQL with Row-Level Security (RLS) & Local SQLite test environment
- **Caching & Distributed Locks**: Redis (Async redis-py) with graceful in-memory fallback
- **Authentication**: JWT Bearer Tokens (HMAC-SHA256, 60-minute expiry) + Argon2id Secure Password Hashing + Clerk Identity Gateway + Google/GitHub OAuth integrations
- **Admin Identity**: `masumganvir2006@gmail.com` strictly hardcoded across RBAC policies and database RLS.

### 2.2 Agentic Orchestration & Machine Learning
- **Agent Orchestrator**: LangGraph StateGraph (Multi-Agent State Machine with 15-stage pipeline)
- **LLM Routing**: `LLMProvider` multi-tiered fallback architecture supporting Groq (Qwen/Llama), Google Gemini Flash, Anthropic Claude, OpenAI GPT-4o-mini, Local Ollama, and deterministic Mock fallback
- **AutoML Core Engine**: AdaptiveAutoMLEngine utilizing Optuna Bayesian Optimization (TPESampler), 5-Fold Stratified Cross-Validation, and automated train-only fit leakage prevention
- **Model Frameworks**: Scikit-Learn, LightGBM, XGBoost, CatBoost, HistGradientBoosting
- **Explainability**: SHAP (TreeExplainer, KernelExplainer), Permutation Importance, Partial Dependence Plots
- **Artifact Packaging**: Serialized Joblib models, ONNX exports, FastAPI Docker deployment packages, reproducible Jupyter Notebooks (.ipynb), and HTML Executive Reports.

### 2.3 Frontend Application
- **Framework**: React 18 with Vite build system
- **Language**: TypeScript (Strict type-checking)
- **Routing**: React Router v6
- **Styling**: Vanilla CSS tokens + Tailwind CSS with glassmorphism design system
- **State Management**: Zustand / React Context with local isolation
- **Real-Time Communications**: Native WebSocket client (`useWebSocket.ts`) + Server-Sent Events (SSE) for stage-by-stage execution streaming.

### 2.4 Storage & Data Lifecycle
- **Storage Abstraction**: `StorageService` supporting AWS S3, MinIO, Supabase Storage, and local persistent volume
- **Namespacing Convention**: `users/{user_id}/projects/{project_id}/{artifact_type}/{filename}`
- **Integrity Verification**: SHA-256 tamper-detection hashes computed and stored alongside metadata.
