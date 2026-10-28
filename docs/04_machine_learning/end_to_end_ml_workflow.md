# End-to-End ML Workflow

## Pipeline Overview

DataWise AI implements a complete ML pipeline orchestrated through LangGraph subgraphs. The workflow proceeds through six major phases:

### Phase 1: Dataset Ingestion & Profiling
**Agents**: IntakeAgent → ProfilingAgent
**Tools**: `tools/ingestion/`, `tools/profiling/`

1. File validation (extension, size, MIME type, malware scanning)
2. Dataset loading (CSV, Excel, JSON, Parquet via `load_dataframe_safely()`)
3. Schema inference (numeric, categorical, datetime, text, identifier columns)
4. Statistical profiling (mean, median, std, quantiles, unique counts, missing rates)
5. Target column detection via `TargetDetector`

### Phase 2: Data Quality & Analysis
**Agents**: DataQualityAgent → OutlierAgent → MissingValueAgent → EDA VisualizationAgent
**Tools**: `tools/data_quality/`, `tools/outliers/`, `tools/visualization/`

1. Missing value analysis (per-column counts, patterns, correlations)
2. Duplicate row detection
3. Constant and near-constant column identification
4. Outlier detection (IQR, Z-score, Isolation Forest)
5. Class distribution analysis for imbalanced datasets
6. Distribution plots, correlation heatmaps, box plots, scatter matrices

### Phase 3: Preprocessing & Feature Engineering
**Agents**: EncodingAgent → ScalingAgent → TransformationAgent → FeatureEngineeringAgent → FeatureSelectionAgent → LeakageDetectionAgent
**Tools**: `tools/preprocessing/`, `tools/feature_engineering/`, `tools/feature_selection/`, `tools/leakage/`

1. **Encoding**: One-hot, label, ordinal, target encoding for categorical features
2. **Scaling**: StandardScaler, MinMaxScaler, RobustScaler for numerical features
3. **Transformation**: Log, sqrt, Box-Cox, Yeo-Johnson for skewed distributions
4. **Feature Engineering**: Interaction terms, polynomial features, datetime extraction
5. **Feature Selection**: Variance threshold, correlation filtering, importance-based selection
6. **Leakage Detection**: Target leakage, temporal leakage, identifier column checks

**Critical invariant**: All transformations are fitted **only on training data** and applied to validation/test sets using the fitted parameters.

### Phase 4: Human Approval Gate
**Node**: `human_approval_gate_node` in Master Graph

The system pauses when:
- Destructive outlier treatment is recommended (row deletion)
- Target column confirmation is needed for ambiguous datasets
- The leakage detection agent flags potential issues

The `should_pause` flag and `pending_decision` state fields control this mechanism.

### Phase 5: Training & Optimization
**Agents**: ProblemTypeAgent → ModelSelectionAgent → TrainingAgent → HyperparameterTuningAgent → EvaluationAgent → OverfittingDetectionAgent → ExplainabilityAgent → RobustnessAgent → ModelComparisonAgent
**Tools**: `tools/models/`, `tools/evaluation/`, `tools/tuning/`

1. **Problem type detection**: Classification, regression, clustering, time series
2. **Candidate selection**: Tailored to problem type and dataset properties
   - Classification: RandomForest, HistGradientBoosting, LogisticRegression, XGBoost, LightGBM
   - Regression: HistGradientBoosting, RandomForest, Ridge, XGBoost, LightGBM
3. **Baseline training**: Default hyperparameters for comparison
4. **Cross-validation**: Stratified k-fold with configurable k
5. **Hyperparameter optimization**: Optuna Bayesian search (TPE sampler)
   - Max 50 experiments, 8-trial patience, 30-minute timeout
   - User-lockable parameters via `locked_parameters` state field
6. **Evaluation**: Accuracy, F1, precision, recall, ROC-AUC, PR-AUC (classification); RMSE, MAE, R² (regression)
7. **Overfitting detection**: Train-test gap analysis
8. **Explainability**: SHAP feature importance
9. **Robustness testing**: Noise perturbation evaluation

### Phase 6: Artifact Generation & Deployment
**Agents**: ArtifactGenerationAgent → DeploymentAgent → ReportingNotebookAgent
**Tools**: `tools/serialization/`, `tools/notebook/`, `tools/reporting/`

1. **Model serialization**: joblib/pickle for scikit-learn, native for XGBoost/LightGBM
2. **Pipeline export**: Fitted ColumnTransformer + model as single artifact
3. **Notebook generation**: Reproducible Jupyter notebook with all steps
4. **Report generation**: PDF, HTML, and Markdown reports
5. **Deployment artifacts**: Inference scripts, requirements.txt, Dockerfile

## Supported Algorithms

### Classification
| Algorithm | Library | Key Hyperparameters |
|-----------|---------|-------------------|
| RandomForestClassifier | scikit-learn | n_estimators, max_depth, min_samples_split |
| HistGradientBoostingClassifier | scikit-learn | learning_rate, max_iter, max_depth |
| LogisticRegression | scikit-learn | C, penalty, solver |
| XGBClassifier | XGBoost | learning_rate, n_estimators, max_depth |
| LGBMClassifier | LightGBM | learning_rate, n_estimators, num_leaves |
| GradientBoostingClassifier | scikit-learn | learning_rate, n_estimators, max_depth |
| SVC | scikit-learn | C, kernel, gamma |
| KNeighborsClassifier | scikit-learn | n_neighbors, weights, metric |

### Regression
| Algorithm | Library | Key Hyperparameters |
|-----------|---------|-------------------|
| HistGradientBoostingRegressor | scikit-learn | learning_rate, max_iter, max_depth |
| RandomForestRegressor | scikit-learn | n_estimators, max_depth, min_samples_split |
| Ridge | scikit-learn | alpha |
| Lasso | scikit-learn | alpha |
| ElasticNet | scikit-learn | alpha, l1_ratio |
| XGBRegressor | XGBoost | learning_rate, n_estimators, max_depth |
| LGBMRegressor | LightGBM | learning_rate, n_estimators, num_leaves |
| SVR | scikit-learn | C, kernel, epsilon |

## Evaluation Metrics

### Classification
- Accuracy, Precision, Recall, F1-score (macro/weighted)
- ROC-AUC, PR-AUC (for imbalanced datasets)
- Confusion matrix, Classification report
- Log loss

### Regression
- RMSE (Root Mean Squared Error)
- MAE (Mean Absolute Error)
- R² (Coefficient of determination)
- MAPE (Mean Absolute Percentage Error)

## Optimization Budget Controls

| Parameter | Default | Source |
|-----------|---------|--------|
| `max_experiments` | 50 | `settings.max_experiments` |
| `max_no_improvement` | 8 | `settings.max_no_improvement` |
| `max_training_time` | 1800s (30 min) | `settings.max_training_time` |
| `max_concurrent_training` | 4 | `settings.max_concurrent_training` |
| `max_concurrent_training_per_user` | 2 | `settings.max_concurrent_training_per_user` |
