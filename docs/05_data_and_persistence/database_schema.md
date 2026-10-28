# Database Schema

## Overview

DataWise AI uses SQLAlchemy 2.0 with async support, backed by SQLite (development) or PostgreSQL (production). The schema comprises **37 core entities** organized into 13 functional groups, defined in `backend/app/db/models/entities.py`.

## Entity Groups

### 1. Users & Authentication (3 entities)

**User** (`users`)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String(128) | PK | UUID or Clerk user ID |
| email | String(255) | UNIQUE, NOT NULL, INDEX | User email address |
| name | String(255) | NOT NULL | Display name |
| password_hash | String(255) | NOT NULL | Argon2id or PBKDF2 hash |
| role | String(50) | NOT NULL, DEFAULT 'data_scientist' | RBAC role |
| status | String(50) | NOT NULL, INDEX | active, suspended, pending |
| is_active | Boolean | NOT NULL, DEFAULT true | Soft active flag |
| organization_id | String(36) | INDEX, NULLABLE | Multi-tenancy |
| created_at | DateTime | NOT NULL, INDEX | Auto-timestamp |
| last_login_at | DateTime | NULLABLE | Last login tracking |
| deleted_at | DateTime | NULLABLE | Soft delete |

**UserSession** (`user_sessions`) — Authentication session tokens
**ApiKey** (`api_keys`) — Hashed API keys with scoped permissions

### 2. Projects & Workspaces (2 entities)

**Project** (`projects`)
| Column | Type | Description |
|--------|------|-------------|
| id | String(36) | PK, UUID |
| slug | String(255) | UNIQUE, URL-friendly identifier |
| user_id | String(128) | FK → users.id (CASCADE) |
| name | String(255) | Project name |
| prompt_a | Text | Problem description prompt |
| prompt_b | Text | Solution approach prompt |
| tuning_mode | String(50) | 'manual', 'agent', or 'hybrid' |
| locked_parameters | JSON | User-locked HPO parameters |
| problem_specification | JSON | Structured ML task definition |
| experiment_plan | JSON | Agent-generated experiment plan |
| status | String(50) | active, completed, archived |

**ProjectPrompt** (`project_prompts`) — Versioned structured prompt records

### 3. Datasets & Lineage (5 entities)

**DatasetEntity** (`datasets`) — Dataset metadata with storage references
**DatasetVersion** (`dataset_versions`) — Immutable version snapshots
**DatasetColumn** (`dataset_columns`) — Per-column statistics and types
**DatasetProfile** (`dataset_profiles`) — Comprehensive profiling reports
**DataQualityReport** (`data_quality_reports`) — Quality analysis and anomalies

### 4. Experiments & Runs (3 entities)

**Experiment** (`experiments`) — ML experiment containers
**ExperimentRun** (`experiment_runs`) — Execution iterations
**PreprocessingRun** (`preprocessing_runs`) — Preprocessing configurations

### 5. Features (1 entity)

**Feature** (`features`) — Engineered and selected features with importance scores

### 6. Model Candidates & Training (5 entities)

**ModelCandidate** (`model_candidates`) — Algorithm candidates per run
**TrainingRun** (`training_runs`) — Individual training executions
**ModelMetric** (`model_metrics`) — Per-training-run metric records
**CrossValidationResult** (`cross_validation_results`) — CV fold results
**HyperparameterRun** (`hyperparameter_runs`) — Optuna trial records

### 7. Evaluation & Diagnostics (4 entities)

**EvaluationResult** (`evaluation_results`) — Final evaluation metrics
**OverfittingReport** (`overfitting_reports`) — Train/test gap analysis
**ExplainabilityResult** (`explainability_results`) — SHAP explanations
**RobustnessResult** (`robustness_results`) — Noise perturbation results

### 8. Model Registry (2 entities)

**ModelEntity** (`models`) — Top-level model records per project
**ModelVersion** (`model_versions`) — Immutable versioned model snapshots

### 9. Artifacts (3 entities)

**ArtifactEntity** (`artifacts`) — Generic artifact metadata
**Notebook** (`notebooks`) — Jupyter notebook records
**Report** (`reports`) — Generated report records

### 10. Deployment & Inference (2 entities)

**Deployment** (`deployments`) — Model deployment configurations
**PredictionRequest** (`prediction_requests`) — Inference request logs

### 11. Monitoring (2 entities)

**MonitoringMetric** (`monitoring_metrics`) — Runtime performance metrics
**DriftReport** (`drift_reports`) — Data and concept drift detection

### 12. Observability (3 entities)

**AgentRun** (`agent_runs`) — Agent execution records with timing
**AgentEvent** (`agent_events`) — Fine-grained agent event logs
**PipelineStage** (`pipeline_stages`) — Workflow stage tracking

### 13. Governance & Operations (4 entities)

**UserDecisionRecord** (`user_decisions`) — Human-in-the-loop decision audit
**AuditLog** (`audit_logs`) — Append-only security audit trail
**BackgroundJob** (`background_jobs`) — Redis-backed worker tracking
**UsageRecord** (`usage_records`) — Billing-ready usage tracking

## Key Relationships

```
User (1) ──── (N) Project
User (1) ──── (N) UserSession
User (1) ──── (N) ApiKey
User (1) ──── (N) AuditLog
Project (1) ──── (N) DatasetEntity
Project (1) ──── (N) Experiment
Project (1) ──── (N) ModelEntity
Project (1) ──── (N) ArtifactEntity
Project (1) ──── (N) Notebook
Project (1) ──── (N) Report
Project (1) ──── (N) BackgroundJob
Project (1) ──── (N) ProjectPrompt
DatasetEntity (1) ──── (N) DatasetVersion
DatasetVersion (1) ──── (N) DatasetColumn
DatasetVersion (1) ──── (N) DatasetProfile
DatasetVersion (1) ──── (N) DataQualityReport
DatasetVersion (1) ──── (N) Experiment
Experiment (1) ──── (N) ExperimentRun
Experiment (1) ──── (N) Feature
ExperimentRun (1) ──── (N) PreprocessingRun
ExperimentRun (1) ──── (N) ModelCandidate
ExperimentRun (1) ──── (N) TrainingRun
```

## Migration System

- **Tool**: Alembic (`backend/alembic/`)
- **Configuration**: `backend/alembic.ini`
- **SQLite migration helper**: `backend/apply_sqlite_migrations.py`
- **Status**: IMPLEMENTED — schema creation via `init_db()` in `backend/app/db/session.py`
