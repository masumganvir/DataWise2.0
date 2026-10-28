# API Reference

## Base URL

- Development: `http://localhost:8000/api`
- Versioned: `http://localhost:8000/api/v1`

All endpoints require authentication unless noted. Authentication is via Bearer token (JWT, Clerk session, or API key) in the `Authorization` header.

## Authentication & Identity (`/api/auth/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| POST | `/auth/register` | Create new user account | No |
| POST | `/auth/login` | Authenticate and receive JWT | No |
| POST | `/auth/clerk/sync` | Sync Clerk OAuth user to backend | No (Clerk token) |
| GET | `/auth/me` | Get current user profile | Yes |
| PUT | `/auth/me` | Update current user profile | Yes |
| POST | `/auth/api-keys` | Generate new API key | Yes |
| GET | `/auth/api-keys` | List user's API keys | Yes |
| DELETE | `/auth/api-keys/{key_id}` | Revoke an API key | Yes |
| POST | `/auth/logout` | Invalidate session | Yes |

## Projects & Agentic AutoML (`/api/projects/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| GET | `/projects` | List user's projects | Yes |
| POST | `/projects` | Create new project | Yes |
| GET | `/projects/{id}` | Get project details | Yes (owner) |
| PUT | `/projects/{id}` | Update project | Yes (owner) |
| DELETE | `/projects/{id}` | Delete project and all data | Yes (owner) |
| POST | `/projects/{id}/datasets/upload` | Upload dataset to project | Yes (owner) |
| GET | `/projects/{id}/datasets/{ds_id}/preview` | Paginated dataset preview | Yes (owner) |
| POST | `/projects/{id}/runs` | Start agentic analysis run | Yes (owner) |
| GET | `/projects/{id}/runs/{run_id}/status` | Get run status and progress | Yes (owner) |
| GET | `/projects/{id}/runs/{run_id}/timeline` | Get agent execution timeline | Yes (owner) |
| GET | `/projects/{id}/runs/{run_id}/state` | Get current graph state | Yes (owner) |
| POST | `/projects/{id}/decisions` | Submit human-in-the-loop decision | Yes (owner) |
| GET | `/projects/{id}/artifacts` | List project artifacts | Yes (owner) |
| GET | `/projects/{id}/artifacts/{art_id}/download` | Download artifact file | Yes (owner) |
| GET | `/projects/{id}/download-center` | Get all downloadable artifacts | Yes (owner) |
| GET | `/projects/{id}/report/html` | Download HTML report | Yes (owner) |
| GET | `/projects/{id}/report/pdf` | Download PDF report | Yes (owner) |
| GET | `/projects/{id}/notebook` | Download Jupyter notebook | Yes (owner) |
| GET | `/projects/{id}/model/download` | Download trained model | Yes (owner) |
| GET | `/projects/{id}/pipeline/download` | Download fitted pipeline | Yes (owner) |
| GET | `/projects/{id}/download-all` | Download ZIP bundle | Yes (owner) |
| WS | `/projects/{id}/ws` | WebSocket for real-time events | Yes |

## Sessions (Legacy) (`/api/sessions/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| POST | `/sessions` | Create analysis session | Partial |
| GET | `/sessions/{id}` | Get session details | Partial |

## Datasets (`/api/sessions/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| POST | `/sessions/{id}/datasets/upload` | Upload dataset to session | Partial |
| GET | `/sessions/{id}/datasets/preview` | Preview dataset | Partial |

## Analysis (`/api/sessions/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| GET | `/sessions/{id}/analysis/profile` | Get dataset profile | Partial |
| GET | `/sessions/{id}/analysis/quality` | Get quality report | Partial |
| GET | `/sessions/{id}/analysis/outliers` | Get outlier analysis | Partial |
| GET | `/sessions/{id}/analysis/correlations` | Get correlations | Partial |
| GET | `/sessions/{id}/analysis/distributions` | Get distributions | Partial |

## ML Analysis (`/api/sessions/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| POST | `/sessions/{id}/ml/train` | Train ML models | Partial |
| GET | `/sessions/{id}/ml/results` | Get training results | Partial |
| GET | `/sessions/{id}/ml/comparison` | Compare model candidates | Partial |
| POST | `/sessions/{id}/ml/select` | Select champion model | Partial |

## Model Registry (`/api/models/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| GET | `/models` | List registered models | Yes |
| GET | `/models/{id}` | Get model details | Yes |
| POST | `/models/{id}/versions` | Create model version | Yes |
| GET | `/models/{id}/versions` | List model versions | Yes |

## Model Inference (`/api/inference/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| POST | `/inference/{model_id}/predict` | Run prediction | Yes (API key) |
| POST | `/inference/{model_id}/batch` | Batch prediction | Yes (API key) |

## Reports (`/api/sessions/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| GET | `/sessions/{id}/reports/html` | Generate HTML report | Partial |
| GET | `/sessions/{id}/reports/markdown` | Generate Markdown report | Partial |

## System Health (`/health/`)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| GET | `/health` | Basic liveness check | No |
| GET | `/health/live` | Kubernetes liveness probe | No |
| GET | `/health/ready` | Deep readiness (DB + Redis + Storage) | No |

## Error Response Format

All errors follow a consistent structure:

```json
{
    "error_id": "err_a1b2c3d4",
    "error_code": "VALIDATION_ERROR",
    "message": "Safe, user-facing error description",
    "hint": "Suggested corrective action",
    "retryable": false,
    "request_id": "req-uuid-here"
}
```

Sensitive details (stack traces, file paths, credentials) are **never** included in error responses. The `OutputSecurityGate` and `SecretRedactor` modules sanitize all outgoing error payloads.
