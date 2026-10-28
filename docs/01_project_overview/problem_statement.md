# Problem Statement

## The Challenge of End-to-End Machine Learning

Building and deploying machine learning models in production remains a fragmented, error-prone, and time-consuming process. Practitioners face several interconnected challenges that no single existing tool fully addresses.

### 1. Fragmented ML Workflows

Data scientists typically use 5–10 different tools across the ML lifecycle: Jupyter notebooks for exploration, pandas for preprocessing, scikit-learn for modeling, Optuna or Hyperopt for tuning, MLflow for tracking, and ad-hoc scripts for deployment. Each transition introduces friction, inconsistency, and risk of error.

**Status in DataWise AI**: ADDRESSED — The platform provides a single unified workflow from dataset upload through model deployment, orchestrated by LangGraph agents.

### 2. Repetitive Preprocessing

Every new dataset requires similar boilerplate: missing value analysis, outlier detection, encoding, scaling, and feature engineering. Data scientists spend an estimated 60–80% of their time on data preparation rather than modeling.

**Status in DataWise AI**: ADDRESSED — Automated preprocessing agents (intake, profiling, quality, outlier, missing values, encoding, scaling, transformation, feature engineering, feature selection) handle these tasks with human-in-the-loop approval for destructive operations.

### 3. Manual Algorithm Selection

Choosing between RandomForest, XGBoost, LightGBM, logistic regression, and other algorithms requires understanding dataset properties, computational constraints, and problem characteristics. Most practitioners default to a small set of familiar models.

**Status in DataWise AI**: ADDRESSED — The ML Strategy Agent selects candidate algorithms based on problem type (classification/regression), dataset size, feature types, and imbalance characteristics.

### 4. Expensive Hyperparameter Experimentation

Grid search over large parameter spaces is computationally prohibitive. Random search is wasteful. Bayesian optimization requires careful setup. Most practitioners settle for default hyperparameters.

**Status in DataWise AI**: ADDRESSED — Optuna-based Bayesian HPO with configurable budgets (max 50 experiments, 8-trial patience, 30-minute timeout), early stopping, and user-locked parameters.

### 5. Data Leakage and Evaluation Errors

Fitting preprocessing on the full dataset before splitting, using test data for hyperparameter tuning, or including target-derived features are common mistakes that produce overly optimistic evaluation metrics.

**Status in DataWise AI**: PARTIALLY ADDRESSED — A dedicated Leakage Detection Agent scans for common leakage patterns. The preprocessing graph enforces train-only fitting. However, all leakage patterns may not be detected.

### 6. Difficulty Reproducing Experiments

Without systematic tracking of datasets, preprocessing steps, hyperparameters, random seeds, and software versions, reproducing ML experiments is unreliable.

**Status in DataWise AI**: PARTIALLY ADDRESSED — The 37-entity database schema tracks experiments, runs, preprocessing configurations, hyperparameter trials, and model versions. Full seed-level reproducibility requires further validation.

### 7. Fragmented Artifact Management

Models, preprocessing pipelines, notebooks, reports, and deployment scripts are typically scattered across local directories, cloud storage, and version control with no unified access control.

**Status in DataWise AI**: ADDRESSED — Centralized artifact storage (local filesystem / MinIO S3 / Supabase) with database-tracked metadata, per-project isolation, and authenticated download endpoints.

### 8. The Gap Between AI Explanations and Verified ML Execution

LLM-generated insights may hallucinate results, metrics, or recommendations. Without deterministic execution and validation, AI-generated analysis cannot be trusted for production decisions.

**Status in DataWise AI**: ADDRESSED — LLMs are used only for planning, interpretation, and report generation. All ML operations (training, evaluation, preprocessing) execute deterministically through scikit-learn, XGBoost, LightGBM, and Optuna with verified metrics.
