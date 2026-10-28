# Agent Inventory

## Overview

DataWise AI employs 16 primary numbered agents and 50+ specialized sub-agents organized in a LangGraph-based orchestration system. Each agent extends `BaseAgent` (defined in `backend/agents/base.py`) and follows a standard contract: `AgentInput` → `analyze()` → `AgentOutput`.

## Primary Agent Pipeline (Numbered Agents)

| # | Agent | Directory | Purpose | LLM Usage | Status |
|---|-------|-----------|---------|-----------|--------|
| 00 | Orchestrator Agent | `agents/00_orchestrator_agent/` | Coordinates workflow sequencing and delegation | Yes — planning | IMPLEMENTED |
| 01 | Dataset Profiling Agent | `agents/01_dataset_profiling_agent/` | Computes comprehensive dataset statistics and column classifications | No — deterministic pandas | IMPLEMENTED |
| 02 | Data Quality Agent | `agents/02_data_quality_agent/` | Detects missing values, duplicates, constant columns, type mismatches | No — deterministic | IMPLEMENTED |
| 03 | EDA Visualization Agent | `agents/03_eda_visualization_agent/` | Generates exploratory charts (distributions, correlations, box plots) | Minimal — chart selection | IMPLEMENTED |
| 04 | Outlier Intelligence Agent | `agents/04_outlier_intelligence_agent/` | Identifies outliers using IQR, Z-score, and isolation forest | No — deterministic | IMPLEMENTED |
| 05 | Missing Value Agent | `agents/05_missing_value_agent/` | Recommends and applies imputation strategies | Minimal — strategy selection | IMPLEMENTED |
| 06 | Preprocessing Agent | `agents/06_preprocessing_agent/` | Coordinates encoding, scaling, and transformation | No — deterministic | IMPLEMENTED |
| 07 | Feature Engineering Agent | `agents/07_feature_engineering_agent/` | Creates derived features (interactions, polynomial, datetime extraction) | Yes — feature suggestions | IMPLEMENTED |
| 08 | Feature Selection Agent | `agents/08_feature_selection_agent/` | Selects most informative features using importance, correlation, variance | No — deterministic | IMPLEMENTED |
| 09 | Data Leakage Agent | `agents/09_data_leakage_agent/` | Scans for potential data leakage patterns | Yes — pattern interpretation | IMPLEMENTED |
| 10 | ML Strategy Agent | `agents/10_ml_strategy_agent/` | Selects candidate algorithms based on problem type and data properties | Yes — strategy planning | IMPLEMENTED |
| 11 | Model Training Agent | `agents/11_model_training_agent/` | Executes scikit-learn/XGBoost/LightGBM model training | No — deterministic | IMPLEMENTED |
| 12 | Model Tuning Agent | `agents/12_model_tuning_agent/` | Runs Optuna hyperparameter optimization | No — deterministic | IMPLEMENTED |
| 13 | Model Evaluation Agent | `agents/13_model_evaluation_agent/` | Computes metrics, confusion matrices, ROC curves | No — deterministic | IMPLEMENTED |
| 14 | Deployment Artifact Agent | `agents/14_deployment_artifact_agent/` | Serializes models, generates inference scripts and pipelines | No — deterministic | IMPLEMENTED |
| 15 | Reporting & Notebook Agent | `agents/15_reporting_notebook_agent/` | Generates PDF reports, HTML reports, Jupyter notebooks | Yes — narrative generation | IMPLEMENTED |

## Specialized Sub-Agents

| Agent Category | Agents | Status |
|---------------|--------|--------|
| **Data Quality** | DataQualityAgent, DuplicateDetectionAgent | IMPLEMENTED |
| **Encoding** | EncodingAgent (one-hot, label, ordinal, target) | IMPLEMENTED |
| **Scaling** | ScalingAgent (standard, min-max, robust) | IMPLEMENTED |
| **Transformation** | TransformationAgent (log, sqrt, box-cox, yeo-johnson) | IMPLEMENTED |
| **Feature Selection** | FeatureSelectionAgent (variance, correlation, importance) | IMPLEMENTED |
| **Leakage Detection** | LeakageDetectionAgent | IMPLEMENTED |
| **Model Selection** | ModelSelectionAgent, ModelCandidateAgent | IMPLEMENTED |
| **Training** | TrainingAgent, BaselineTrainingAgent | IMPLEMENTED |
| **Hyperparameter Tuning** | HyperparameterTuningAgent, IterativeOptimizationAgent | IMPLEMENTED |
| **Cross Validation** | CrossValidationAgent | IMPLEMENTED |
| **Evaluation** | EvaluationAgent, ModelComparisonAgent | IMPLEMENTED |
| **Overfitting** | OverfittingDetectionAgent, UnderfittingAgent | IMPLEMENTED |
| **Explainability** | ExplainabilityAgent (SHAP) | IMPLEMENTED |
| **Robustness** | RobustnessAgent | IMPLEMENTED |
| **Imbalance** | ImbalanceAgent (SMOTE, class weights) | IMPLEMENTED |
| **Threshold** | ThresholdOptimizationAgent | IMPLEMENTED |
| **Deployment** | DeploymentAgent, ModelPackagingAgent | IMPLEMENTED |
| **Monitoring** | MonitoringAgent, DriftDetectionAgent, ConceptDriftAgent | IMPLEMENTED |
| **Recovery** | RecoveryAgent, RollbackAgent | IMPLEMENTED |
| **Supervisor** | SupervisorAgent | IMPLEMENTED |
| **Visualization** | VisualizationAgent | IMPLEMENTED |
| **Artifact Generation** | ArtifactGenerationAgent, ArtifactValidationAgent | IMPLEMENTED |
| **Report/Notebook** | ReportGenerationAgent, NotebookGenerationAgent | IMPLEMENTED |

## Agent Base Contract

```python
# backend/agents/base.py

class AgentInput(BaseModel):
    session_id: str
    run_id: Optional[str]
    dataset_path: Optional[str]
    dataset_id: Optional[str]
    parameters: Dict[str, Any]
    state_ref: Optional[Dict[str, Any]]

class AgentOutput(BaseModel):
    session_id: str
    agent_name: str
    status: AgentStatus  # "pending" | "running" | "success" | "warning" | "error" | "needs_approval"
    data: Dict[str, Any]
    summary: str
    warnings: List[str]
    errors: List[str]
    execution_time_seconds: float
    artifacts_generated: List[str]
    needs_approval: bool
    approval_context: Optional[Dict[str, Any]]

class BaseAgent(ABC):
    def run(input_data) -> AgentOutput:
        # Wraps analyze() with timing, logging, and error handling
    def analyze(input_data) -> AgentOutput:
        # Core logic — overridden by each agent
    def validate(output) -> AgentOutput:
        # Schema validation
```

## Agent Execution Flow

Each agent in the numbered pipeline receives the `AgentState` TypedDict, performs its analysis or transformation, and returns an updated state. The LangGraph framework manages state merging, conditional routing, and checkpointing.

Key invariants:
- Raw datasets are **never stored in state** — only file paths and metadata summaries
- All ML operations use deterministic tools from `backend/tools/`
- LLMs are consulted only for planning, interpretation, and narrative generation
- Destructive operations (outlier deletion, target changes) require human approval via the `should_pause` / `pending_decision` mechanism
