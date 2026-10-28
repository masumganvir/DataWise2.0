# DataWise AI — Feature & User-Journey Inventory

This inventory documents all verified features, user workflows, endpoints, and validation requirements.

| Feature Area | Sub-Feature / User Journey | Expected Behavior | Verification Method | Status |
|---|---|---|---|---|
| **Authentication** | Email & Password Registration | Enforce `@gmail.com` domain restriction, Argon2id hash, and reject duplicate emails. | Automated test (`test_multi_user_isolation.py`) | **VERIFIED (PASS)** |
| **Authentication** | Email & Password Login | Authenticate against Argon2id hash, issue 60-min JWT bearer token. | Automated test (`test_multi_user_isolation.py`) | **VERIFIED (PASS)** |
| **Authentication** | Demo Token Rejection | Strictly deny `"demo-token"` or `"dev-token"` in production mode. | Automated test (`test_session_security_and_invalid_tokens`) | **VERIFIED (PASS)** |
| **Admin Control** | Exclusive Admin Assignment | Exclusively bind administrative privileges to `masumganvir2006@gmail.com`. | Automated test (`test_admin_database_access.py`) | **VERIFIED (PASS)** |
| **Admin Control** | Role Demotion on Impersonation | Downgrade any non-masumganvir user claiming `"admin"` or `"owner"` to `"data_scientist"`. | Automated test (`test_admin_database_access.py`) | **VERIFIED (PASS)** |
| **Admin Control** | Settings & API Key Protection | Restrict `POST /api/settings` to `masumganvir2006@gmail.com`, mask keys on `GET /api/settings`. | Automated test (`test_admin_database_access.py`) | **VERIFIED (PASS)** |
| **Database** | PostgreSQL RLS Admin Gate | `public.is_database_admin()` SQL security definer checks email against `masumganvir2006@gmail.com`. | Migration & unit tests (`test_admin_database_access.py`) | **VERIFIED (PASS)** |
| **Multi-Tenancy** | Project Data Isolation | User A cannot read, modify, or delete User B's projects (HTTP 403 Forbidden). | Automated test (`test_multi_user_project_isolation`) | **VERIFIED (PASS)** |
| **Multi-Tenancy** | Artifact Download Security | User A cannot download User B's notebooks, models, or report bundles (HTTP 403). | Automated test (`test_artifact_download_security`) | **VERIFIED (PASS)** |
| **Dataset Ingestion** | Upload & Validation | Accept CSV/XLSX/Parquet, compute SHA-256 fingerprint, check for duplicates. | Automated test (`test_dataset_sha256_duplicate_detection`) | **VERIFIED (PASS)** |
| **AI Planner** | Problem Formulation Prompts | Capture Prompt A (Problem) & Prompt B (Expected Behavior); version historical prompts. | Automated test (`test_project_prompt_versioning`) | **VERIFIED (PASS)** |
| **AI Planner** | Blueprint Generation | Analyze dataset profile & user intent to propose ML task, metric, and algorithms. | Automated test (`test_ai_project_planner_agent_proposal_and_approval`) | **VERIFIED (PASS)** |
| **EDA & Profiling** | Sequence-Wise Visualizations | Generate 13 Seaborn/Matplotlib plots (histograms, correlations, outliers, PCA). | Automated test (`test_02_dummy_project_and_complete_ml_workflow`) | **VERIFIED (PASS)** |
| **ML Engine** | Bayesian Optimization (Optuna) | Run multi-trial HPO with 5-fold CV, train-only fit leakage defense, and early stopping. | Automated test (`test_02_dummy_project_and_complete_ml_workflow`) | **VERIFIED (PASS)** |
| **Model Packaging** | Serialization & Deserialization | Serialize champion model to `model_pipeline.pkl`, run immediate verification inference. | Automated test (`test_02_dummy_project_and_complete_ml_workflow`) | **VERIFIED (PASS)** |
| **Artifact Export** | Notebook & Report Generation | Compile 35-section Jupyter notebook (.ipynb), executive HTML report, and ZIP bundle. | Automated test (`test_02_dummy_project_and_complete_ml_workflow`) | **VERIFIED (PASS)** |
| **Confidentiality** | Sensitive Data Redaction | Mask API keys (`AQ.A••••••••CQSA`), database URLs, PII, and scrub stack traces. | Automated test (`test_recovery_and_confidentiality.py`) | **VERIFIED (PASS)** |
| **Frontend** | Production Compilation | Compile React 18 TypeScript application via Vite into optimized static assets. | Build command (`npm run build`) | **VERIFIED (PASS)** |
