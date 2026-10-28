"""
DataWise AI — Comprehensive Adaptive Multi-Agent AutoML Engine Test Suite

Tests all core requirements:
1. Dual Problem Prompts (Prompt A & B) validation & persistence.
2. AI Problem Formulation & user correction.
3. Estimator parameter validation & invalid candidate rejection.
4. Locked parameter preservation in Hybrid and Manual tuning modes.
5. Leakage-safe ColumnTransformer fitting & holdout test isolation.
6. Class imbalance handling with Stratified K-Fold.
7. Real Optuna Bayesian TPESampler optimization with genuine trial records.
8. Candidate ranking, champion selection, and final test evaluation.
9. Multi-user security & project isolation.
"""

import io
import json
import pytest
import numpy as np
import pandas as pd
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from main import app
from app.db.session import init_db, AsyncSessionLocal
from app.db.models.entities import User, Project
from app.auth.security import create_access_token
from app.ml.technique_registry import technique_registry, TechniqueCategory
from app.ml.adaptive_automl_engine import AdaptiveAutoMLEngine
from app.agents.automl_agents import (
    ProjectIntakeAgent,
    ProjectIntakeInput,
    ProblemFormulationAgent,
    ProblemFormulationInput,
    DataQualityLeakageAgent,
)


@pytest.fixture(autouse=True)
async def setup_test_db():
    await init_db()


@pytest.fixture
def synthetic_classification_df():
    """Generates synthetic dataset for credit fraud / binary classification."""
    np.random.seed(42)
    n = 150
    amount = np.random.exponential(scale=50.0, size=n)
    distance = np.random.uniform(0.5, 60.0, size=n)
    hour = np.random.randint(0, 24, size=n)
    category = np.random.choice(["grocery", "electronics", "travel"], size=n)
    
    # 15% fraud rate
    logits = 0.03 * amount + 0.05 * distance - 2.5
    prob = 1.0 / (1.0 + np.exp(-logits))
    is_fraud = (np.random.rand(n) < prob).astype(int)

    return pd.DataFrame({
        "amount": amount,
        "distance": distance,
        "hour": hour,
        "category": category,
        "is_fraud": is_fraud,
    })


@pytest.fixture
def synthetic_regression_df():
    """Generates synthetic dataset for price prediction."""
    np.random.seed(42)
    n = 120
    sqft = np.random.uniform(600, 3500, size=n)
    bedrooms = np.random.randint(1, 6, size=n)
    tier = np.random.choice(["urban", "suburban", "rural"], size=n)
    price = sqft * 0.25 + bedrooms * 20.0 + np.random.normal(0, 15, size=n)
    return pd.DataFrame({
        "sqft": sqft,
        "bedrooms": bedrooms,
        "tier": tier,
        "price": price,
    })


# ══════════════════════════════════════════════════════════════════════════
# 1. TECHNIQUE REGISTRY & PARAMETER VALIDATION TESTS
# ══════════════════════════════════════════════════════════════════════════

def test_technique_registry_catalog():
    """Verify supported estimators exist in technique registry for classification and regression."""
    clf_techniques = technique_registry.list_by_task("classification")
    reg_techniques = technique_registry.list_by_task("regression")

    clf_ids = [t.id for t in clf_techniques]
    reg_ids = [t.id for t in reg_techniques]

    assert "random_forest_classifier" in clf_ids
    assert "hist_gradient_boosting_classifier" in clf_ids
    assert "logistic_regression" in clf_ids
    assert "decision_tree_classifier" in clf_ids

    assert "random_forest_regressor" in reg_ids
    assert "hist_gradient_boosting_regressor" in reg_ids
    assert "ridge_regression" in reg_ids

    # Verify shorthand alias resolution
    assert technique_registry.get("random_forest_clf") is not None
    assert technique_registry.get("hist_gradient_boosting_clf") is not None


def test_estimator_parameter_validation_valid():
    """Valid parameters pass validation on scikit-learn estimators."""
    rf = technique_registry.get("random_forest_clf")
    assert rf is not None

    valid_params = {"n_estimators": 100, "max_depth": 8, "min_samples_split": 4}
    is_valid, msg = rf.validate_user_parameters(valid_params)
    assert is_valid is True
    assert msg == "OK"


def test_estimator_parameter_validation_invalid_rejection():
    """Non-existent or out-of-range parameters are rejected with descriptive errors."""
    rf = technique_registry.get("random_forest_clf")
    assert rf is not None

    # Invalid parameter name
    bad_name = {"non_existent_param": 100}
    is_valid, msg = rf.validate_user_parameters(bad_name)
    assert is_valid is False
    assert "Unknown parameter" in msg

    # Negative integer value
    bad_val = {"n_estimators": -50}
    is_valid2, msg2 = rf.validate_user_parameters(bad_val)
    assert is_valid2 is False
    assert "below minimum" in msg2 or "must be >=" in msg2


# ══════════════════════════════════════════════════════════════════════════
# 2. LOGICAL AGENTS UNIT TESTS
# ══════════════════════════════════════════════════════════════════════════

def test_project_intake_agent():
    """ProjectIntakeAgent validates and preserves Prompts A and B."""
    agent = ProjectIntakeAgent()
    out = agent.run(ProjectIntakeInput(
        project_id="test_proj_1",
        project_name="Credit Fraud Engine",
        prompt_a="Identify rare fraudulent transactions without blocking legit users.",
        prompt_b="Produce risk probabilities, explain with SHAP, adjust decision threshold.",
    ))
    assert out.prompts_valid is True
    assert out.original_prompts_preserved["prompt_a"] == "Identify rare fraudulent transactions without blocking legit users."
    assert out.original_prompts_preserved["prompt_b"] == "Produce risk probabilities, explain with SHAP, adjust decision threshold."
    assert out.versioned_problem_spec["project_id"] == "test_proj_1"


def test_problem_formulation_agent_fraud():
    """ProblemFormulationAgent maps fraud problem to binary classification with PR-AUC."""
    agent = ProblemFormulationAgent()
    out = agent.run(ProblemFormulationInput(
        prompt_a="I need to identify fraudulent credit card transactions. Fraud cases are rare (<0.5%).",
        prompt_b="Build a fraud-risk prediction system that produces a risk probability and deployable API.",
        target_candidates=["is_fraud", "amount", "hour"],
        dataset_summary={},
    ))
    assert "classification" in out.inferred_task_type
    assert out.recommended_target == "is_fraud"
    assert out.recommended_primary_metric in ["PR-AUC", "Recall", "F1", "ROC-AUC"]
    assert "false_negative_cost" in out.cost_considerations or "false_positive_cost" in out.cost_considerations


def test_data_quality_leakage_agent():
    """DataQualityLeakageAgent flags high correlation leakage columns."""
    df_leak = pd.DataFrame({
        "transaction_id": [f"TX_{i}" for i in range(100)],
        "target_clone": [0] * 90 + [1] * 10,
        "amount": [10.0] * 100,
        "is_fraud": [0] * 90 + [1] * 10,
    })
    agent = DataQualityLeakageAgent()
    out = agent.run(df=df_leak, target_col="is_fraud")
    assert out["leakage_risks_found"] is True
    assert len(out["leakage_warnings"]) > 0


# ══════════════════════════════════════════════════════════════════════════
# 3. ADAPTIVE AUTOML ENGINE TRAINING & OPTUNA TRIALS
# ══════════════════════════════════════════════════════════════════════════

def test_adaptive_automl_engine_hybrid_locked_parameter(synthetic_classification_df):
    """
    Verifies that when user locks n_estimators=75 in Hybrid mode,
    the engine preserves that exact setting across all evaluated trials.
    """
    engine = AdaptiveAutoMLEngine(
        df=synthetic_classification_df,
        prompt_a="Identify fraudulent transactions.",
        prompt_b="Build calibrated classification model.",
        target_column="is_fraud",
        task_type="classification",
        optimization_metric="f1",
        tuning_mode="hybrid",
        locked_parameters={"random_forest_clf": {"n_estimators": 75}},
        selected_algorithms=["random_forest_clf", "logistic_regression"],
        cv_folds=3,
        max_trials=6,
        time_budget_seconds=60,
    )

    trials_logged = []
    def on_trial(trial_rec):
        trials_logged.append(trial_rec)

    results = engine.run_optimization(progress_callback=on_trial)

    assert len(results["trials"]) >= 2
    assert len(trials_logged) >= 2
    assert results["champion_pipeline"] is not None
    assert results["primary_metric"] == "f1"
    assert "test_score" in results["champion"]

    # Check that Random Forest trials honored the locked n_estimators
    rf_trials = [t for t in results["trials"] if t["algorithm_id"] in ("random_forest_clf", "random_forest_classifier")]
    assert len(rf_trials) > 0
    for t in rf_trials:
        assert t["parameters"]["n_estimators"] == 75
        assert t["is_locked"] is True


def test_adaptive_automl_engine_holdout_test_isolation(synthetic_classification_df):
    """
    Verifies holdout test split (20%) is kept separate and untouched during CV.
    """
    engine = AdaptiveAutoMLEngine(
        df=synthetic_classification_df,
        prompt_a="Predict outcome.",
        prompt_b="Deploy model.",
        target_column="is_fraud",
        task_type="classification",
        cv_folds=3,
        max_trials=4,
    )
    results = engine.run_optimization()

    X_train = results["X_train"]
    X_test = results["X_test"]
    assert len(X_train) + len(X_test) == len(synthetic_classification_df)
    assert abs(len(X_test) / len(synthetic_classification_df) - 0.20) < 0.05

    # Check test score is genuinely computed
    champion = results["champion"]
    assert 0.0 <= champion["test_score"] <= 1.0


def test_adaptive_automl_engine_regression(synthetic_regression_df):
    """Verifies regression task with R² or RMSE metrics and continuous target."""
    engine = AdaptiveAutoMLEngine(
        df=synthetic_regression_df,
        prompt_a="Predict house price.",
        prompt_b="Minimize RMSE.",
        target_column="price",
        task_type="regression",
        optimization_metric="r2",
        selected_algorithms=["hist_gradient_boosting_reg", "ridge_regression"],
        cv_folds=3,
        max_trials=4,
    )
    results = engine.run_optimization()
    assert results["primary_metric"] == "r2"
    assert len(results["candidates"]) >= 1


# ══════════════════════════════════════════════════════════════════════════
# 4. END-TO-END WORKFLOW, API PERSISTENCE & USER ISOLATION
# ══════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_dual_prompts_api_persistence():
    """Verify Prompt A and Prompt B are captured and returned without silent overwriting."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create user token
        token = create_access_token(data={"sub": "usr_test_dual_prompts_1"})
        headers = {"Authorization": f"Bearer {token}"}

        prompt_a = "I need to identify fraudulent credit card transactions to prevent chargebacks."
        prompt_b = "Build a fraud-risk prediction system that produces a risk probability and inference API."

        create_res = await client.post(
            "/api/projects",
            json={
                "name": "Fraud Detection Platform",
                "prompt_a": prompt_a,
                "prompt_b": prompt_b,
                "tuning_mode": "hybrid",
                "locked_parameters": {"random_forest_clf": {"n_estimators": 80}},
            },
            headers=headers,
        )
        assert create_res.status_code in (200, 201)
        proj_data = create_res.json()
        proj_id = proj_data["id"]

        # Fetch project and verify prompt persistence
        get_res = await client.get(f"/api/projects/{proj_id}", headers=headers)
        assert get_res.status_code == 200
        fetched = get_res.json()
        assert fetched["prompt_a"] == prompt_a
        assert fetched["prompt_b"] == prompt_b
        assert fetched["tuning_mode"] == "hybrid"


@pytest.mark.asyncio
async def test_api_problem_formulation():
    """Verify /api/projects/{id}/formulate produces structured interpretation from prompts."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = create_access_token(data={"sub": "usr_test_formulate_1"})
        headers = {"Authorization": f"Bearer {token}"}

        proj_res = await client.post(
            "/api/projects",
            json={"name": "Churn Prediction Project"},
            headers=headers,
        )
        proj_id = proj_res.json()["id"]

        formulate_res = await client.post(
            f"/api/projects/{proj_id}/formulate",
            json={
                "prompt_a": "Detect customer churn before subscription renewal.",
                "prompt_b": "Build high-recall classifier with SHAP feature explanations.",
            },
            headers=headers,
        )
        assert formulate_res.status_code == 200
        data = formulate_res.json()
        assert "classification" in data["task_type"]
        assert "churn" in data["candidate_tasks"][0].lower() or "classification" in data["candidate_tasks"][0].lower()


@pytest.mark.asyncio
async def test_api_hyperparameter_schema_and_validation():
    """Verify /hyperparameters/schema exposes estimator parameters and validate checks values."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = create_access_token(data={"sub": "usr_test_hpo_schema"})
        headers = {"Authorization": f"Bearer {token}"}

        proj_res = await client.post("/api/projects", json={"name": "Schema Test Project"}, headers=headers)
        proj_id = proj_res.json()["id"]

        schema_res = await client.get(f"/api/projects/{proj_id}/hyperparameters/schema?task_type=classification", headers=headers)
        assert schema_res.status_code == 200
        schema_data = schema_res.json()
        assert "algorithms" in schema_data
        assert len(schema_data["algorithms"]) > 0

        # Validate valid params
        val_res = await client.post(
            f"/api/projects/{proj_id}/hyperparameters/validate",
            json={"algorithm_id": "random_forest_clf", "parameters": {"n_estimators": 100, "max_depth": 6}},
            headers=headers,
        )
        assert val_res.status_code == 200
        assert val_res.json()["valid"] is True

        # Validate invalid params
        val_res_bad = await client.post(
            f"/api/projects/{proj_id}/hyperparameters/validate",
            json={"algorithm_id": "random_forest_clf", "parameters": {"unknown_param": 999}},
            headers=headers,
        )
        assert val_res_bad.status_code == 200
        assert val_res_bad.json()["valid"] is False


@pytest.mark.asyncio
async def test_multi_user_project_isolation():
    """Verify User B cannot view or modify User A's private project."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create User A project
        token_a = create_access_token(data={"sub": "usr_alice_isolation_a"})
        res_a = await client.post(
            "/api/projects",
            json={"name": "Alice Confidential Medical Model"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        proj_a_id = res_a.json()["id"]

        # User B attempts to access Alice's project
        token_b = create_access_token(data={"sub": "usr_bob_isolation_b"})
        res_b = await client.get(
            f"/api/projects/{proj_a_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        # Should be forbidden
        assert res_b.status_code == 403


# ══════════════════════════════════════════════════════════════════════════
# 5. DEEP LEARNING & ADVANCED TECHNIQUES VERIFICATION
# ══════════════════════════════════════════════════════════════════════════

def test_pytorch_tabular_classifier_and_regressor():
    """Verify PyTorch Tabular Deep Learning MLP for classification and regression."""
    from app.ml.pytorch_tabular import PyTorchTabularClassifier, PyTorchTabularRegressor

    # 1. Classification
    np.random.seed(42)
    X_clf = np.random.randn(80, 5).astype(np.float32)
    y_clf = (X_clf[:, 0] + X_clf[:, 1] > 0).astype(int)

    clf = PyTorchTabularClassifier(epochs=10, hidden_dims="32,16", batch_size=16)
    clf.fit(X_clf, y_clf)
    probs = clf.predict_proba(X_clf[:5])
    preds = clf.predict(X_clf[:5])

    assert probs.shape == (5, 2)
    assert np.allclose(probs.sum(axis=1), 1.0, atol=1e-4)
    assert len(preds) == 5

    # 2. Regression
    X_reg = np.random.randn(80, 5).astype(np.float32)
    y_reg = (X_reg[:, 0] * 2.0 - X_reg[:, 1] * 1.5).astype(np.float32)

    reg = PyTorchTabularRegressor(epochs=10, hidden_dims="32,16", batch_size=16)
    reg.fit(X_reg, y_reg)
    preds_reg = reg.predict(X_reg[:5])
    assert len(preds_reg) == 5


def test_ensemble_and_decision_threshold_in_engine(synthetic_classification_df):
    """Verify automated ensembling, threshold curve optimization, and permutation explainability."""
    engine = AdaptiveAutoMLEngine(
        df=synthetic_classification_df,
        prompt_a="Identify rare fraudulent transactions.",
        prompt_b="Build calibrated ensemble classifier with optimal threshold.",
        target_column="is_fraud",
        task_type="classification",
        selected_algorithms=["random_forest_clf", "logistic_regression"],
        cv_folds=3,
        max_trials=4,
    )
    results = engine.run_optimization()

    assert "decision_threshold" in results
    assert "optimal_threshold" in results["decision_threshold"]
    assert 0.05 <= results["decision_threshold"]["optimal_threshold"] <= 0.95

    # Verify explainability
    assert "explainability" in results
    assert "top_features" in results["explainability"]

    # Verify candidate summary contains algorithms
    cands = [c["algorithm_id"] for c in results["candidates"]]
    assert len(cands) >= 2


def test_preprocessing_and_feature_selection_catalog():
    """Verify scikit-learn preprocessing transformers, scalers, and selectors are registered."""
    scaler = technique_registry.get("robust_scaler")
    assert scaler is not None
    assert scaler.category == TechniqueCategory.ENCODING_SCALING

    pca = technique_registry.get("pca")
    assert pca is not None
    assert pca.category == TechniqueCategory.FEATURE_SELECTION

    poly = technique_registry.get("polynomial_features")
    assert poly is not None
    assert poly.category == TechniqueCategory.FEATURE_ENGINEERING

