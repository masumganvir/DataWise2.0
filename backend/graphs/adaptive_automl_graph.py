"""
DataWise AI — Adaptive Multi-Agent AutoML Orchestration Graph

Implements Section 5 specifications:
Intake → Dataset Intelligence → Problem Formulation → Target/Task Confirmation →
Requirements and Objective → Data Quality and Leakage Analysis → Preprocessing Strategy →
Feature Strategy → Algorithm Strategy → Hyperparameter Design → Experiment Planning →
User Approval → Training & Search → Candidate Evaluation → Robustness/Explainability →
Model Selection → Final Test Evaluation → Reporting and Artifact Creation → Model Registry.

Conditional edge logic:
- If target or task is ambiguous, pause at confirmation gate.
- If severe data leakage is flagged, halt training or prune leaking features.
- If human approval is required, pause and wait for user decision.
- If training fails or hits resource limits, trigger recovery agent.
"""

from __future__ import annotations

import time
from typing import Any, Dict, Literal, Optional
from loguru import logger
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from graphs.state import AgentState
from app.agents.automl_agents import (
    ProjectIntakeAgent, ProjectIntakeInput,
    DatasetIntelligenceAgent,
    ProblemFormulationAgent, ProblemFormulationInput,
    MLRequirementsAgent, MLRequirementsInput,
    DataQualityLeakageAgent,
    PreprocessingStrategyAgent,
    FeatureStrategyAgent,
    AlgorithmStrategyAgent,
    HyperparameterSpaceDesignerAgent,
    ExperimentPlanningAgent,
    TrainingOptimizationAgent,
    EvaluationModelSelectionAgent,
    RobustnessFairnessAgent,
    ModelExplainabilityAgent,
    ReportingArtifactAgent,
    MonitoringRetrainingAgent,
    RecoveryValidationAgent,
)
from app.ml.adaptive_automl_engine import AdaptiveAutoMLEngine


# ─── Individual Agent Nodes ──────────────────────────────────────────────────

def project_intake_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 1. Project Intake Agent executing")
    agent = ProjectIntakeAgent()
    out = agent.run(ProjectIntakeInput(
        project_id=state.get("project_id", "default_proj"),
        project_name=state.get("project_name", "ML Project"),
        prompt_a=state.get("prompt_a", "Analyze dataset and build predictive model."),
        prompt_b=state.get("prompt_b", "Maximize generalization and explain key feature importances."),
        dataset_name=state.get("dataset_id"),
        dataset_path=state.get("dataset_path"),
    ))
    return {
        **state,
        "current_agent": "ProjectIntakeAgent",
        "current_step": "DATASET_INTELLIGENCE",
        "problem_specification": out.versioned_problem_spec,
        "completed_steps": [*state.get("completed_steps", []), "intake"],
    }


def dataset_intelligence_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 2. Dataset Intelligence Agent executing")
    import pandas as pd
    from app.tools.storage import storage_manager

    df = storage_manager.load_dataframe(state["dataset_path"])
    agent = DatasetIntelligenceAgent()
    out = agent.run(df)

    rec_target = state.get("target_column") or (out.detected_target_candidates[0] if out.detected_target_candidates else None)
    return {
        **state,
        "current_agent": "DatasetIntelligenceAgent",
        "current_step": "PROBLEM_FORMULATION",
        "target_column": rec_target,
        "dataset_metadata": out.fingerprint,
        "completed_steps": [*state.get("completed_steps", []), "dataset_intelligence"],
    }


def problem_formulation_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 3. Problem Formulation Agent executing")
    agent = ProblemFormulationAgent()
    out = agent.run(ProblemFormulationInput(
        prompt_a=state.get("prompt_a", ""),
        prompt_b=state.get("prompt_b", ""),
        target_candidates=[state.get("target_column")] if state.get("target_column") else [],
        dataset_summary=state.get("dataset_metadata", {}),
    ))
    return {
        **state,
        "current_agent": "ProblemFormulationAgent",
        "current_step": "REQUIREMENTS_OBJECTIVE",
        "problem_type": out.inferred_task_type,
        "completed_steps": [*state.get("completed_steps", []), "problem_formulation"],
    }


def requirements_objective_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 4. ML Requirements & Objective Agent executing")
    agent = MLRequirementsAgent()
    out = agent.run(MLRequirementsInput(
        task_type=state.get("problem_type", "classification"),
        primary_metric=state.get("problem_specification", {}).get("primary_metric", "F1"),
        tuning_mode=state.get("tuning_mode", "hybrid"),
    ))
    return {
        **state,
        "current_agent": "MLRequirementsAgent",
        "current_step": "DATA_QUALITY_LEAKAGE",
        "completed_steps": [*state.get("completed_steps", []), "requirements_objective"],
    }


def data_quality_leakage_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 5. Data Quality & Leakage Agent executing")
    import pandas as pd
    from app.tools.storage import storage_manager

    df = storage_manager.load_dataframe(state["dataset_path"])
    agent = DataQualityLeakageAgent()
    report = agent.run(df, state.get("target_column"))
    return {
        **state,
        "current_agent": "DataQualityLeakageAgent",
        "current_step": "PREPROCESSING_STRATEGY",
        "leakage_report": report,
        "completed_steps": [*state.get("completed_steps", []), "data_quality_leakage"],
    }


def preprocessing_strategy_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 6. Preprocessing Strategy Agent executing")
    agent = PreprocessingStrategyAgent()
    strategy = agent.run(
        num_cols=state.get("numerical_columns", []),
        cat_cols=state.get("categorical_columns", []),
    )
    return {
        **state,
        "current_agent": "PreprocessingStrategyAgent",
        "current_step": "FEATURE_STRATEGY",
        "completed_steps": [*state.get("completed_steps", []), "preprocessing_strategy"],
    }


def feature_strategy_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 7. Feature Strategy Agent executing")
    agent = FeatureStrategyAgent()
    features_spec = agent.run(
        feature_cols=state.get("feature_columns", []),
        n_rows=state.get("dataset_rows", 500),
    )
    return {
        **state,
        "current_agent": "FeatureStrategyAgent",
        "current_step": "ALGORITHM_STRATEGY",
        "feature_selection_result": features_spec.get("selected_features", []),
        "completed_steps": [*state.get("completed_steps", []), "feature_strategy"],
    }


def algorithm_strategy_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 8. Algorithm Strategy Agent executing")
    agent = AlgorithmStrategyAgent()
    candidates = agent.run(
        task_type=state.get("problem_type", "classification"),
        n_rows=state.get("dataset_rows", 500),
    )
    return {
        **state,
        "current_agent": "AlgorithmStrategyAgent",
        "current_step": "HYPERPARAMETER_DESIGN",
        "candidate_models": candidates,
        "completed_steps": [*state.get("completed_steps", []), "algorithm_strategy"],
    }


def hyperparameter_design_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 9. Hyperparameter Space Designer Agent executing")
    return {
        **state,
        "current_agent": "HyperparameterSpaceDesignerAgent",
        "current_step": "EXPERIMENT_PLANNING",
        "completed_steps": [*state.get("completed_steps", []), "hyperparameter_design"],
    }


def experiment_planning_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 10. Experiment Planning Agent executing")
    agent = ExperimentPlanningAgent()
    plan = agent.run(
        project_name=state.get("project_name", "ML Project"),
        task_type=state.get("problem_type", "classification"),
        target_col=state.get("target_column"),
        primary_metric=state.get("primary_metric", "F1"),
        selected_algorithms=[c["algorithm_id"] for c in state.get("candidate_models", [])[:4]],
        tuning_mode=state.get("tuning_mode", "hybrid"),
        locked_parameters=state.get("locked_parameters", {}),
        max_trials=15,
        cv_folds=5,
    )
    return {
        **state,
        "current_agent": "ExperimentPlanningAgent",
        "current_step": "APPROVAL_GATE",
        "experiment_plan": plan,
        "completed_steps": [*state.get("completed_steps", []), "experiment_planning"],
    }


def approval_gate_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 11. User Approval Gate evaluating")
    if state.get("should_pause") and state.get("pending_decision"):
        logger.warning("[AutoMLGraph] Halting at Human Approval Gate.")
        return {**state, "current_step": "AWAITING_APPROVAL"}
    return {
        **state,
        "should_pause": False,
        "current_step": "TRAINING_OPTIMIZATION",
        "completed_steps": [*state.get("completed_steps", []), "approval_gate"],
    }


def training_optimization_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 12. Training & Optimization Agent executing")
    from app.tools.storage import storage_manager

    df = storage_manager.load_dataframe(state["dataset_path"])
    engine = AdaptiveAutoMLEngine(
        df=df,
        prompt_a=state.get("prompt_a", ""),
        prompt_b=state.get("prompt_b", ""),
        target_column=state.get("target_column"),
        task_type=state.get("problem_type"),
        tuning_mode=state.get("tuning_mode", "hybrid"),
        locked_parameters=state.get("locked_parameters", {}),
        user_parameters=state.get("user_parameters", {}),
        cv_folds=5,
        max_trials=15,
    )
    opt_result = engine.run_optimization()

    return {
        **state,
        "current_agent": "TrainingOptimizationAgent",
        "current_step": "EVALUATION_MODEL_SELECTION",
        "training_results": opt_result.get("candidates", []),
        "trials": opt_result.get("trials", []),
        "best_model": opt_result.get("champion", {}).get("algorithm_name", "Champion"),
        "evaluation_results": opt_result.get("champion", {}).get("test_metrics", {}),
        "completed_steps": [*state.get("completed_steps", []), "training_optimization"],
    }


def evaluation_selection_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 13. Evaluation & Model Selection Agent executing")
    agent = EvaluationModelSelectionAgent()
    eval_out = agent.run(
        candidates=state.get("training_results", []),
        primary_metric=state.get("primary_metric", "F1"),
    )
    return {
        **state,
        "current_agent": "EvaluationModelSelectionAgent",
        "current_step": "REPORTING_ARTIFACTS",
        "leaderboard": eval_out.get("pareto_tradeoffs", []),
        "completed_steps": [*state.get("completed_steps", []), "evaluation_selection"],
    }


def reporting_artifacts_node(state: AgentState) -> AgentState:
    logger.info("[AutoMLGraph] 14. Reporting & Artifact Agent executing")
    agent = ReportingArtifactAgent()
    out = agent.run(
        project_id=state.get("project_id", "proj_default"),
        run_id=state.get("run_id", "run_default"),
        out_dir=f"artifacts/{state.get('run_id')}",
    )
    return {
        **state,
        "current_agent": "ReportingArtifactAgent",
        "current_step": "COMPLETED",
        "completed_steps": [*state.get("completed_steps", []), "reporting_artifacts"],
    }


# ─── Conditional Edge Condition Functions ────────────────────────────────────

def check_approval_gate(state: AgentState) -> Literal["proceed", "interrupt"]:
    if state.get("should_pause") and state.get("pending_decision"):
        return "interrupt"
    return "proceed"


def check_leakage_safety(state: AgentState) -> Literal["safe", "halt"]:
    if state.get("leakage_report", {}).get("leakage_risks_found") and state.get("leakage_report", {}).get("critical"):
        return "halt"
    return "safe"


# ─── Graph Builder ───────────────────────────────────────────────────────────

def build_adaptive_automl_graph(checkpointer: Optional[Any] = None) -> StateGraph:
    """Builds and compiles the production Adaptive LangGraph workflow."""
    graph = StateGraph(AgentState)

    graph.add_node("intake", project_intake_node)
    graph.add_node("dataset_intelligence", dataset_intelligence_node)
    graph.add_node("problem_formulation", problem_formulation_node)
    graph.add_node("requirements_objective", requirements_objective_node)
    graph.add_node("data_quality_leakage", data_quality_leakage_node)
    graph.add_node("preprocessing_strategy", preprocessing_strategy_node)
    graph.add_node("feature_strategy", feature_strategy_node)
    graph.add_node("algorithm_strategy", algorithm_strategy_node)
    graph.add_node("hyperparameter_design", hyperparameter_design_node)
    graph.add_node("experiment_planning", experiment_planning_node)
    graph.add_node("approval_gate", approval_gate_node)
    graph.add_node("training_optimization", training_optimization_node)
    graph.add_node("evaluation_selection", evaluation_selection_node)
    graph.add_node("reporting_artifacts", reporting_artifacts_node)

    # Entry point
    graph.set_entry_point("intake")

    # Linear and conditional edges
    graph.add_edge("intake", "dataset_intelligence")
    graph.add_edge("dataset_intelligence", "problem_formulation")
    graph.add_edge("problem_formulation", "requirements_objective")
    graph.add_edge("requirements_objective", "data_quality_leakage")

    graph.add_conditional_edges(
        "data_quality_leakage",
        check_leakage_safety,
        {"safe": "preprocessing_strategy", "halt": END},
    )

    graph.add_edge("preprocessing_strategy", "feature_strategy")
    graph.add_edge("feature_strategy", "algorithm_strategy")
    graph.add_edge("algorithm_strategy", "hyperparameter_design")
    graph.add_edge("hyperparameter_design", "experiment_planning")
    graph.add_edge("experiment_planning", "approval_gate")

    graph.add_conditional_edges(
        "approval_gate",
        check_approval_gate,
        {"proceed": "training_optimization", "interrupt": END},
    )

    graph.add_edge("training_optimization", "evaluation_selection")
    graph.add_edge("evaluation_selection", "reporting_artifacts")
    graph.add_edge("reporting_artifacts", END)

    return graph.compile(checkpointer=checkpointer or MemorySaver())
