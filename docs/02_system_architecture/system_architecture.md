# System Architecture

## Overview

DataWise AI is a multi-tier web application composed of six primary layers:

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Layer                         │
│         Vite + React 18 + TypeScript + Clerk             │
├─────────────────────────────────────────────────────────┤
│                 API Gateway Layer                        │
│    FastAPI + CORS + Rate Limiting + Telemetry            │
├─────────────────────────────────────────────────────────┤
│              Agent Orchestration Layer                   │
│     LangGraph StateGraph + Supervisor + Subgraphs        │
├─────────────────────────────────────────────────────────┤
│            ML Execution & Compute Layer                  │
│   scikit-learn + XGBoost + LightGBM + Optuna + PyTorch   │
├─────────────────────────────────────────────────────────┤
│              Persistence Layer                           │
│    SQLAlchemy 2.0 + Redis + MinIO S3 / Local Storage     │
├─────────────────────────────────────────────────────────┤
│           Security & Observability Layer                 │
│  Clerk/Supabase/JWT + RBAC + AES-256 + PII Redaction     │
└─────────────────────────────────────────────────────────┘
```

## Component Inventory

### Frontend (`frontend/`)
| Component | Technology | File | Status |
|-----------|-----------|------|--------|
| App Router | React Router v6 | `src/App.tsx` | IMPLEMENTED |
| Auth Provider | Clerk React SDK | `src/components/auth/ProtectedRoute.tsx` | IMPLEMENTED |
| Landing Page | React | `src/pages/LandingPage.tsx` | IMPLEMENTED |
| Dashboard | React | `src/pages/Dashboard.tsx` | IMPLEMENTED |
| Project Management | React | `src/pages/projects/` | IMPLEMENTED |
| New Project (Two-Prompt) | React | `src/pages/projects/NewProject.tsx` | IMPLEMENTED |
| Live Workflow | React + WebSocket | `src/pages/projects/LiveWorkflow.tsx` | IMPLEMENTED |
| Results Workspace | React + Plotly | `src/pages/projects/ResultsWorkspace.tsx` | IMPLEMENTED |
| Dataset Workspace | React | `src/pages/datasets/DatasetWorkspace.tsx` | IMPLEMENTED |
| Model Registry | React | `src/pages/models/ModelRegistry.tsx` | IMPLEMENTED |
| Reports Center | React | `src/pages/reports/ReportsCenter.tsx` | IMPLEMENTED |
| Notebooks Viewer | React | `src/pages/notebooks/NotebooksViewer.tsx` | IMPLEMENTED |
| Admin Dashboard | React | `src/pages/admin/AdminDashboard.tsx` | IMPLEMENTED |
| Documentation Hub | React | `src/pages/docs/DocumentationHub.tsx` | IMPLEMENTED |

### Backend API (`backend/app/api/endpoints/`)
| Module | Routes | File | Status |
|--------|--------|------|--------|
| Auth | Login, Register, Clerk sync, API keys | `auth.py` (34KB) | IMPLEMENTED |
| Projects | CRUD, upload, analysis, workflow, artifacts | `projects.py` (152KB) | IMPLEMENTED |
| Sessions | Legacy session management | `sessions.py` | IMPLEMENTED |
| Datasets | Upload, preview, pagination | `datasets.py` | IMPLEMENTED |
| Analysis | Profiling, quality, correlations | `analysis.py` | IMPLEMENTED |
| ML Analysis | Training, evaluation, feature engineering | `ml_analysis.py` | IMPLEMENTED |
| Decisions | Human-in-the-loop approval | `decisions.py` | IMPLEMENTED |
| Chat | AI assistant conversations | `chat.py` | IMPLEMENTED |
| Reports | PDF, HTML, Markdown generation | `reports.py` | IMPLEMENTED |
| Registry | Model version management | `registry.py` | IMPLEMENTED |
| Inference | Prediction API | `inference.py` | IMPLEMENTED |
| Health | Liveness, readiness probes | `health.py` | IMPLEMENTED |
| Realtime Platform | WebSocket, SSE streaming | `realtime_platform.py` | IMPLEMENTED |

### Agent Orchestration (`backend/graphs/`)
| Graph | Nodes | File | Status |
|-------|-------|------|--------|
| Master Graph | supervisor → preprocessing → approval_gate → training → optimization → visualization → monitoring | `master_graph.py` | IMPLEMENTED |
| Preprocessing | intake → profiling → quality → outlier → missing_values → encoding → scaling → transformation → feature_engineering → feature_selection → leakage_detection | `preprocessing_graph.py` | IMPLEMENTED |
| Training | problem_type → model_selection → training → hyperparameter_tuning → evaluation → overfitting → explainability → robustness → model_comparison → artifact_generation → deployment | `training_graph.py` | IMPLEMENTED |
| Optimization | model_candidates → baseline → cross_validation → ai_analysis → experiment → evaluate → overfit_check → robustness → compare → final_selection | `optimization_graph.py` | IMPLEMENTED |
| Monitoring | baseline → anomaly_detection → concept_drift → performance_degradation → alerting | `monitoring_graph.py` | IMPLEMENTED |
| Recovery | error_detection → classification → root_cause → recovery_plan → execution → validation | `recovery_graph.py` | IMPLEMENTED |

### Database (37 entities in `backend/app/db/models/entities.py`)
| Category | Entities | Status |
|----------|----------|--------|
| Users & Auth | User, UserSession, ApiKey | IMPLEMENTED |
| Projects | Project, ProjectPrompt | IMPLEMENTED |
| Datasets | DatasetEntity, DatasetVersion, DatasetColumn, DatasetProfile, DataQualityReport | IMPLEMENTED |
| Experiments | Experiment, ExperimentRun, PreprocessingRun, Feature | IMPLEMENTED |
| Models | ModelCandidate, TrainingRun, ModelMetric, CrossValidationResult, HyperparameterRun | IMPLEMENTED |
| Evaluation | EvaluationResult, OverfittingReport, ExplainabilityResult, RobustnessResult | IMPLEMENTED |
| Registry | ModelEntity, ModelVersion | IMPLEMENTED |
| Artifacts | ArtifactEntity, Notebook, Report | IMPLEMENTED |
| Deployment | Deployment, PredictionRequest | IMPLEMENTED |
| Monitoring | MonitoringMetric, DriftReport | IMPLEMENTED |
| Observability | AgentRun, AgentEvent, PipelineStage | IMPLEMENTED |
| Governance | UserDecisionRecord, AuditLog | IMPLEMENTED |
| Operations | BackgroundJob, UsageRecord | IMPLEMENTED |

## Data Flow

```
User → React Frontend → Clerk Auth → FastAPI Backend
  → Rate Limiter → Telemetry Middleware → API Router
  → LangGraph Master Graph → Agent Nodes → ML Tools
  → Database (SQLAlchemy) + Storage (MinIO/Local)
  → WebSocket/SSE → Frontend Update
```

## Key Design Decisions

1. **LangGraph over plain chains**: Provides typed state, conditional routing, checkpointing, and human-in-the-loop interrupts.
2. **Deterministic ML execution**: LLMs plan and interpret; scikit-learn/XGBoost/Optuna execute. No LLM-generated code is eval'd.
3. **Multi-provider LLM fallback**: Gemini (primary) → Groq → Cloudflare → Ollama, with circuit breaker and health monitoring.
4. **SQLAlchemy async**: All database operations are async for non-blocking API performance.
5. **In-memory Redis fallback**: Platform works without Redis by falling back to in-memory caching.
6. **Modular subgraphs**: Each pipeline phase (preprocessing, training, optimization, monitoring) is a separate compilable StateGraph.
