"""
DataWise AI — AI Project Planner Agent
LangGraph-ready autonomous planning agent that evaluates dataset profiles,
user prompts, and business objectives to generate structured, human-approvable
project blueprints.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional
from loguru import logger

from app.graph.llm_provider import LLMMessage, llm_provider


class ProjectPlannerAgent:
    """Autonomous agent that designs ML project proposals from data & intent."""

    def __init__(self):
        self.llm = llm_provider

    def _generate_deterministic_proposal(
        self,
        dataset_info: Dict[str, Any],
        user_prompt: str = "",
        dataset_filename: str = "",
        prompt_a_problem: str = "",
        prompt_b_solution: str = "",
    ) -> Dict[str, Any]:
        """High-quality deterministic fallback when LLM is unavailable."""
        columns: List[str] = dataset_info.get("columns", []) or []
        row_count: int = dataset_info.get("row_count") or dataset_info.get("rows") or 0
        col_count: int = len(columns) or dataset_info.get("column_count") or dataset_info.get("cols") or 0
        target_candidate = dataset_info.get("target_candidate") or dataset_info.get("recommended_target")

        combined_text = f"{user_prompt} {prompt_a_problem} {prompt_b_solution}".lower()

        # Derive candidate targets with scores
        target_candidates_list = []
        if columns:
            normalized_columns = []
            for c in columns:
                if isinstance(c, dict):
                    col_name = str(c.get("name") or c.get("column") or c.get("col") or list(c.keys())[0])
                else:
                    col_name = str(c)
                normalized_columns.append(col_name)

                c_low = col_name.lower()
                score = 0
                if any(k in c_low for k in ["target", "label", "class", "churn", "fraud", "is_fraud", "default", "stroke", "disease"]):
                    score += 5
                if any(k in c_low for k in ["price", "sale", "outcome", "status", "score", "amount", "cost", "revenue", "value"]):
                    score += 3
                if c_low in combined_text:
                    score += 4
                if score > 0:
                    target_candidates_list.append({"column": col_name, "confidence": score, "reason": "Keyword & prompt match"})

            target_candidates_list = sorted(target_candidates_list, key=lambda x: x["confidence"], reverse=True)
            if not target_candidate:
                target_candidate = target_candidates_list[0]["column"] if target_candidates_list else (normalized_columns[-1] if normalized_columns else None)

        # Inferred Task Types
        inferred_tasks = []
        target_lower = (target_candidate or "").lower()

        is_fraud_or_imbalance = any(k in combined_text for k in ["fraud", "anomaly", "rare", "imbalance", "unusual", "suspicious"]) or "fraud" in target_lower
        is_forecasting = any(k in combined_text for k in ["forecast", "time series", "future", "date", "temporal", "trend", "rolling", "lag"])
        is_clustering = any(k in combined_text for k in ["cluster", "grouping", "segment", "unsupervised", "unlabelled", "discover patterns"])
        is_regression = any(k in target_lower for k in ["price", "cost", "amount", "salary", "score", "value", "revenue", "loss", "gdp", "profit", "demand", "count", "sales", "volume", "quantity", "target", "spend"]) or any(k in combined_text for k in ["continuous", "estimate amount", "predict value", "regression", "forecast sales", "monthly sales"])

        if is_forecasting:
            inferred_tasks.append({"task": "Time-Series Forecasting", "confidence": 0.95, "description": "Sequence-aware modeling with walk-forward rolling-origin validation."})
        if is_clustering:
            inferred_tasks.append({"task": "Clustering (Unsupervised)", "confidence": 0.88, "description": "Group data points into distinct behavioral clusters without predefined labels."})
        if is_fraud_or_imbalance:
            inferred_tasks.append({"task": "Binary Classification (Imbalanced)", "confidence": 0.95, "description": "Detect rare positive events (fraud, failure, churn) prioritizing high recall and PR-AUC."})
        elif not is_regression and not is_clustering and not is_forecasting:
            inferred_tasks.append({"task": "Binary Classification", "confidence": 0.90, "description": "Predict categorical outcome between distinct classes."})

        if is_regression:
            inferred_tasks.append({"task": "Regression", "confidence": 0.92, "description": "Predict continuous numeric target with minimum prediction error (RMSE/MAE)."})
        else:
            inferred_tasks.append({"task": "Regression", "confidence": 0.40, "description": "Predict continuous numeric outcome."})

        inferred_tasks.append({"task": "Anomaly Detection", "confidence": 0.75 if is_fraud_or_imbalance else 0.35, "description": "Isolate rare out-of-distribution patterns using Isolation Forest and LOF."})

        # Sort tasks by confidence
        inferred_tasks = sorted(inferred_tasks, key=lambda x: x["confidence"], reverse=True)

        # Primary task type
        primary_task = inferred_tasks[0]["task"].split(" ")[0].lower()
        if "classification" in primary_task:
            task_type = "classification"
        elif "regression" in primary_task:
            task_type = "regression"
        elif "clustering" in primary_task:
            task_type = "clustering"
        elif "time-series" in primary_task or "forecasting" in primary_task or "time" in primary_task:
            task_type = "time_series"
        else:
            task_type = "classification"

        # Metric determination
        if is_fraud_or_imbalance:
            primary_metric = "PR-AUC"
            secondary_metrics = ["ROC-AUC", "Recall", "Precision", "Balanced Accuracy", "F1"]
        elif task_type == "classification":
            primary_metric = "F1"
            secondary_metrics = ["ROC-AUC", "Precision", "Recall", "Balanced Accuracy"]
        elif task_type == "regression":
            primary_metric = "R²"
            secondary_metrics = ["RMSE", "MAE", "MAPE"]
        else:
            primary_metric = "Silhouette Score"
            secondary_metrics = ["Calinski-Harabasz", "Davies-Bouldin"]

        # Derive clean display name from filename or target
        base_name = ""
        if dataset_filename:
            clean = re.sub(r"\.[^.]+$", "", dataset_filename)
            clean = re.sub(r"[_\-]+", " ", clean).strip()
            base_name = " ".join(word.capitalize() for word in clean.split())
        elif target_candidate:
            base_name = f"{target_candidate.replace('_', ' ').title()} Intelligence"
        else:
            base_name = "Adaptive Machine Learning"

        project_name = f"{base_name} Engine"

        # Structured Problem & Solution Interpretation
        problem_interpretation = {
            "business_domain": "Finance / Risk & Fraud" if is_fraud_or_imbalance else "Operations / Enterprise Analytics",
            "core_objective": prompt_a_problem.strip() or f"Autonomously predict '{target_candidate or 'target'}' to drive decision automation.",
            "error_cost_tradeoff": "High penalty for False Negatives (missed cases). Prioritize recall and PR-AUC over raw accuracy." if is_fraud_or_imbalance else "Balanced penalty between False Positives and False Negatives.",
            "operational_constraints": "Leak-free training; strict feature isolation; sub-50ms inference latency budget.",
        }

        solution_interpretation = {
            "model_behavior": prompt_b_solution.strip() or f"High-generalization calibrated ensemble with probability outputs and adjustable decision threshold.",
            "prediction_format": "Probability score + Predicted class label + SHAP feature attribution",
            "explainability_tier": "Global & Local Feature Importance (SHAP TreeExplainer & Permutation Importance)",
            "deployment_target": "FastAPI REST API Docker Container + Batch Scoring Python Script + Serialized Pipeline Bundle",
        }

        # Algorithm families suitable
        if task_type == "classification":
            candidate_algorithms = [
                {"name": "HistGradientBoosting", "family": "Gradient Boosting", "speed": "Very Fast", "pros": "Native missing values, non-linear boundaries"},
                {"name": "Random Forest", "family": "Ensemble Trees", "speed": "Fast", "pros": "Robust to outliers, low overfitting risk"},
                {"name": "Logistic Regression", "family": "Linear", "speed": "Ultra Fast", "pros": "Highly interpretable baseline, calibrated odds"},
                {"name": "Extra Trees", "family": "Ensemble Trees", "speed": "Fast", "pros": "Extremely randomized splits, variance reduction"},
            ]
        else:
            candidate_algorithms = [
                {"name": "HistGradientBoosting Regressor", "family": "Gradient Boosting", "speed": "Very Fast", "pros": "State-of-the-art tabular accuracy"},
                {"name": "Random Forest Regressor", "family": "Ensemble Trees", "speed": "Fast", "pros": "Stable variance, non-parametric"},
                {"name": "Ridge Regression", "family": "Linear Regularized", "speed": "Ultra Fast", "pros": "L2 regularization, multicollinearity robust"},
                {"name": "ElasticNet", "family": "Linear Regularized", "speed": "Fast", "pros": "Combined L1/L2 penalty for sparse feature selection"},
            ]

        # Valid hyperparameter space
        hyperparameter_space = {
            "HistGradientBoosting": {
                "max_iter": {"type": "int", "min": 20, "max": 200, "default": 50, "step": 10},
                "learning_rate": {"type": "float", "min": 0.01, "max": 0.3, "default": 0.1, "step": 0.02},
                "max_leaf_nodes": {"type": "int", "min": 15, "max": 63, "default": 31, "step": 4},
                "min_samples_leaf": {"type": "int", "min": 10, "max": 50, "default": 20, "step": 5},
            },
            "Random Forest": {
                "n_estimators": {"type": "int", "min": 20, "max": 200, "default": 50, "step": 10},
                "max_depth": {"type": "int", "min": 4, "max": 20, "default": 10, "step": 2},
                "min_samples_split": {"type": "int", "min": 2, "max": 10, "default": 2, "step": 1},
            },
            "Logistic Regression": {
                "C": {"type": "float", "min": 0.01, "max": 10.0, "default": 1.0, "step": 0.1},
                "max_iter": {"type": "int", "min": 100, "max": 500, "default": 200, "step": 50},
            },
            "Ridge Regression": {
                "alpha": {"type": "float", "min": 0.01, "max": 20.0, "default": 1.0, "step": 0.5},
            },
            "ElasticNet": {
                "alpha": {"type": "float", "min": 0.01, "max": 10.0, "default": 0.5, "step": 0.1},
                "l1_ratio": {"type": "float", "min": 0.1, "max": 0.9, "default": 0.5, "step": 0.1},
            },
        }

        return {
            "project_name": project_name,
            "project_description": f"Adaptive AutoML pipeline targeting '{target_candidate or 'features'}' across {row_count or 'unknown'} records.",
            "business_problem": problem_interpretation["core_objective"],
            "prompt_a_problem": prompt_a_problem or user_prompt or "Identify predictive patterns and optimize decision boundaries.",
            "prompt_b_solution": prompt_b_solution or "Build an explainable, calibrated pipeline with real-time inference API.",
            "problem_interpretation": problem_interpretation,
            "solution_interpretation": solution_interpretation,
            "target": target_candidate or "target",
            "target_candidate": target_candidate or "target",
            "target_candidates": target_candidates_list,
            "task": task_type,
            "task_type": task_type,
            "ml_task": task_type,
            "inferred_tasks": inferred_tasks,
            "primary_metric": primary_metric,
            "secondary_metrics": secondary_metrics,
            "candidate_algorithms": candidate_algorithms,
            "hyperparameter_space": hyperparameter_space,
            "recommended_pipeline": [
                "Automated Schema Inference & Imputation",
                "Outlier Containment & Robust Scaling",
                "Information-Theoretic Feature Selection",
                "Cross-Validation Model Benchmarking",
                "Hyperparameter Optimization (Optuna / RandomizedSearchCV)",
                "SHAP Explainability & FastAPI Artifact Delivery",
            ],
            "deployment_context": "Real-time REST API & Batch Scoring",
            "expected_output": "Serialized Joblib Model, Preprocessing Pipeline, Executable Jupyter Notebook, and Technical Reports",
            "risks": [
                "Class imbalance requires PR-AUC and class-weight balancing rather than raw accuracy.",
                "High cardinality categoricals require frequency or target encoding to prevent feature explosion.",
            ],
            "project_prompt": f"Analyze dataset '{dataset_filename}' to solve: '{prompt_a_problem or user_prompt}'. Deliver solution: '{prompt_b_solution}'.",
        }

    async def plan_project(
        self,
        dataset_info: Dict[str, Any],
        user_prompt: str = "",
        dataset_filename: str = "",
        custom_name: Optional[str] = None,
        prompt_a_problem: str = "",
        prompt_b_solution: str = "",
    ) -> Dict[str, Any]:
        """Generate a project plan proposal based on dataset profile and user intent."""
        effective_prompt_a = prompt_a_problem or user_prompt
        effective_prompt_b = prompt_b_solution

        deterministic = self._generate_deterministic_proposal(
            dataset_info=dataset_info,
            user_prompt=user_prompt,
            dataset_filename=dataset_filename,
            prompt_a_problem=effective_prompt_a,
            prompt_b_solution=effective_prompt_b,
        )

        prompt_text = f"""
You are the Lead AI Data Scientist at DataWise AI.
Analyze the dataset profile and the TWO mandatory user prompts to formulate a comprehensive Machine Learning Blueprint.

PROMPT A — PROBLEM DEFINITION:
"{effective_prompt_a or 'Autonomous predictive exploration'}"

PROMPT B — DESIRED SOLUTION & EXPECTED BEHAVIOR:
"{effective_prompt_b or 'Deployable calibrated model with probability outputs and explainability'}"

DATASET CONTEXT:
- Filename: {dataset_filename or 'Unknown'}
- Rows: {dataset_info.get('row_count', 'Unknown')}
- Columns: {json.dumps(dataset_info.get('columns', [])[:30])}
- Target Candidate: {dataset_info.get('recommended_target') or dataset_info.get('target_candidate') or 'Unknown'}
- Column Types: {json.dumps(dataset_info.get('dtypes', {}))}

INSTRUCTIONS:
Respond with a strict JSON object containing:
{{
  "project_name": "Concise, professional title (e.g. 'Credit Card Fraud Anomaly Engine' or 'Housing Valuation Pipeline')",
  "project_description": "2-sentence executive summary of the problem and approach",
  "business_problem": "Specific operational or business goal this model solves",
  "target_candidate": "Best column name to predict (or null for clustering)",
  "ml_task": "classification" or "regression",
  "primary_metric": "Primary optimization metric (F1, PR-AUC, ROC-AUC, RMSE, R2, etc.)",
  "secondary_metrics": ["List", "of", "metrics"],
  "problem_interpretation": {{
    "business_domain": "Domain category",
    "core_objective": "Extracted core goal",
    "error_cost_tradeoff": "Cost analysis of false positives vs false negatives",
    "operational_constraints": "Key constraints"
  }},
  "solution_interpretation": {{
    "model_behavior": "Expected behavior and thresholds",
    "prediction_format": "Output format",
    "explainability_tier": "Explainability requirements",
    "deployment_target": "Deployment target"
  }},
  "recommended_pipeline": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "deployment_context": "Recommended deployment pattern (e.g., REST API, Batch, Edge)",
  "expected_output": "Summary of deliverables",
  "risks": ["Potential data quality or operational risks"]
}}

CRITICAL RULES:
- Never overwrite or discard the original user prompts.
- Tailor strictly to the actual columns and user prompt.
- Return ONLY valid JSON without markdown fences.
"""
        try:
            resp = await self.llm.generate([
                LLMMessage(role="system", content="You are a principal ML systems architect. Output valid JSON only."),
                LLMMessage(role="user", content=prompt_text),
            ])
            content = resp.content.strip()
            content = re.sub(r"^```json\s*", "", content)
            content = re.sub(r"^```\s*", "", content)
            content = re.sub(r"\s*```$", "", content)
            plan = json.loads(content)

            # Ensure all required keys exist from deterministic blueprint
            for k, v in deterministic.items():
                if k not in plan or not plan[k]:
                    plan[k] = v

            plan["task_type"] = plan.get("task_type") or plan.get("task") or plan.get("ml_task") or deterministic["task_type"]
            plan["task"] = plan["task_type"]
            plan["target_candidate"] = plan.get("target_candidate") or plan.get("target") or deterministic["target_candidate"]
            plan["target"] = plan["target_candidate"]
            plan["prompt_a_problem"] = effective_prompt_a
            plan["prompt_b_solution"] = effective_prompt_b

            if custom_name:
                plan["project_name"] = custom_name

            return plan
        except Exception as exc:
            logger.warning(f"LLM project planning fallback to deterministic: {exc}")
            if custom_name:
                deterministic["project_name"] = custom_name
            return deterministic


project_planner_agent = ProjectPlannerAgent()
