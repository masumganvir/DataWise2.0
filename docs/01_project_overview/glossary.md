# Glossary

| Term | Definition |
|------|-----------|
| **Agent** | A specialized software component that performs a specific data science task (e.g., profiling, preprocessing, training). Implemented as a subclass of `BaseAgent` in `backend/agents/base.py`. |
| **AgentState** | The central strongly-typed LangGraph state dictionary (`TypedDict`) that flows through all graph nodes. Defined in `backend/graphs/state.py`. |
| **AutoML** | Automated Machine Learning — the process of automating algorithm selection, hyperparameter tuning, and model evaluation. |
| **Bayesian Optimization** | A sequential model-based optimization strategy that builds a probabilistic model of the objective function. Implemented via Optuna. |
| **Candidate Model** | An algorithm instance proposed for training and evaluation during an experiment. |
| **Champion Model** | The best-performing model selected after all experiments and evaluations are complete. |
| **Clerk** | Third-party authentication provider used for OAuth login (Google, GitHub). |
| **Conditional Edge** | A LangGraph edge that routes execution to different nodes based on state evaluation (e.g., leakage check, approval gate). |
| **Cross-Validation** | A resampling technique (typically k-fold) used to estimate model generalization performance on unseen data. |
| **Data Leakage** | When information from outside the training dataset is used to create the model, leading to overly optimistic performance estimates. |
| **EDA** | Exploratory Data Analysis — visual and statistical examination of dataset characteristics before modeling. |
| **Experiment** | A container for one or more ML training runs within a project, tracking configuration, status, and results. |
| **FastAPI** | Async Python web framework used for the backend API server. |
| **Feature Engineering** | The process of creating new features from existing data to improve model performance. |
| **Feature Selection** | The process of identifying the most relevant features to reduce dimensionality and improve model performance. |
| **HPO** | Hyperparameter Optimization — systematic search for optimal model configuration parameters. |
| **Human-in-the-Loop** | A workflow pattern where the system pauses for explicit human approval before proceeding with potentially destructive or irreversible operations. |
| **Imputation** | The process of replacing missing values with substituted values (mean, median, mode, or model-based). |
| **LangGraph** | A framework for building multi-step, stateful workflows using directed graphs with typed state. |
| **Leaderboard** | A ranked list of trained model candidates ordered by their primary evaluation metric. |
| **LLM** | Large Language Model — used for natural language understanding, planning, and report generation (not for ML execution). |
| **Master Graph** | The top-level LangGraph orchestration graph that coordinates all subgraphs (preprocessing → approval → training → optimization → visualization → monitoring). |
| **MinIO** | S3-compatible object storage used for artifact persistence. |
| **Model Registry** | A system for versioning and managing trained models with their metadata and artifacts. |
| **Notebook** | A Jupyter-compatible notebook (`.ipynb`) generated as a reproducible experiment record. |
| **Optuna** | Python library for hyperparameter optimization using Bayesian search strategies (TPE, CMA-ES). |
| **Overfitting** | When a model performs well on training data but poorly on unseen data due to excessive complexity. |
| **Pipeline** | A scikit-learn `Pipeline` or `ColumnTransformer` that chains preprocessing and modeling steps. |
| **Preprocessing** | Data transformation steps (encoding, scaling, imputation, outlier treatment) applied before model training. |
| **Problem Specification** | The structured interpretation of user prompts (Prompt A + Prompt B) into ML task parameters. |
| **Project** | The top-level workspace entity that groups datasets, experiments, models, and artifacts. |
| **Prompt A** | The first user prompt describing the problem they want to solve. |
| **Prompt B** | The second user prompt describing the desired solution approach and constraints. |
| **RBAC** | Role-Based Access Control — authorization system with roles: owner, admin, developer, data_scientist, viewer. |
| **Redis** | In-memory data store used for caching, distributed rate limiting, and background job coordination. |
| **Run** | A specific execution iteration of an experiment with its own configuration and results. |
| **SHAP** | SHapley Additive exPlanations — a game-theory approach to explain individual model predictions. |
| **Subgraph** | A modular LangGraph `StateGraph` that handles a specific phase (preprocessing, training, optimization, monitoring). |
| **Supabase** | Backend-as-a-service platform providing authentication, PostgreSQL, and object storage. |
| **Supervisor Agent** | The coordinating agent that plans workflow execution and delegates to specialized agents. |
| **Trial** | A single hyperparameter configuration evaluated during optimization (Optuna terminology). |
| **Tuning Mode** | The HPO configuration strategy: `manual` (user-specified), `agent` (AI-selected), or `hybrid` (AI proposes, user constrains). |
| **Underfitting** | When a model is too simple to capture the underlying patterns in the data. |
| **WebSocket** | Full-duplex communication protocol used for real-time streaming of agent progress and events. |
