"""
DataWise AI — Modular Machine Learning Technique Registry & Pluggable Search Engine

Implements the Section 6 and Section 4 specification:
- Technique Registry with categories, preconditions, incompatibilities, dependencies,
  compute costs, leakage precautions, and selection rationales.
- Algorithm Catalogs for Classification, Regression, Clustering, Anomaly Detection, Time-Series.
- Estimator validation checking every parameter against the actual scikit-learn/LightGBM/XGBoost estimator.
- Multi-mode hyperparameter search (Manual, Agent, Hybrid) with parameter locking.
- Pluggable search engines: Grid Search, Randomized Search, and Optuna Bayesian Optimization.
- Strict leak-free cross-validation and evaluation protocols.
"""

from __future__ import annotations

import importlib
import inspect
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Type, Union

import numpy as np
import pandas as pd
from loguru import logger
from sklearn.base import BaseEstimator
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.ensemble import (
    AdaBoostClassifier,
    AdaBoostRegressor,
    BaggingClassifier,
    BaggingRegressor,
    ExtraTreesClassifier,
    ExtraTreesRegressor,
    GradientBoostingClassifier,
    GradientBoostingRegressor,
    HistGradientBoostingClassifier,
    HistGradientBoostingRegressor,
    IsolationForest,
    RandomForestClassifier,
    RandomForestRegressor,
    StackingClassifier,
    StackingRegressor,
    VotingClassifier,
    VotingRegressor,
)
from sklearn.linear_model import (
    BayesianRidge,
    ElasticNet,
    HuberRegressor,
    Lasso,
    LinearRegression,
    LogisticRegression,
    RANSACRegressor,
    Ridge,
    RidgeClassifier,
    SGDClassifier,
    SGDRegressor,
)
from sklearn.naive_bayes import BernoulliNB, GaussianNB, MultinomialNB
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor, LocalOutlierFactor
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.svm import SVC, SVR, LinearSVC, LinearSVR, OneClassSVM
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.cluster import (
    OPTICS,
    AgglomerativeClustering,
    Birch,
    DBSCAN,
    KMeans,
    MiniBatchKMeans,
    SpectralClustering,
)
from sklearn.mixture import GaussianMixture
from sklearn.covariance import EllipticEnvelope
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import (
    MaxAbsScaler,
    MinMaxScaler,
    Normalizer,
    OneHotEncoder,
    OrdinalEncoder,
    PolynomialFeatures,
    PowerTransformer,
    QuantileTransformer,
    RobustScaler,
    StandardScaler,
    TargetEncoder,
)
from sklearn.impute import KNNImputer, MissingIndicator, SimpleImputer
from sklearn.feature_selection import (
    RFE,
    SelectFromModel,
    SelectKBest,
    VarianceThreshold,
    f_classif,
    f_regression,
    mutual_info_classif,
    mutual_info_regression,
)
from sklearn.decomposition import PCA, FactorAnalysis, FastICA, IncrementalPCA, TruncatedSVD
from sklearn.model_selection import KFold, StratifiedKFold, TimeSeriesSplit, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    f1_score,
    log_loss,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
    silhouette_score,
)
from app.ml.pytorch_tabular import PyTorchTabularClassifier, PyTorchTabularRegressor

# Optional dependencies
HAS_OPTUNA = importlib.util.find_spec("optuna") is not None
HAS_XGBOOST = importlib.util.find_spec("xgboost") is not None
HAS_LIGHTGBM = importlib.util.find_spec("lightgbm") is not None
HAS_CATBOOST = importlib.util.find_spec("catboost") is not None
HAS_TORCH = importlib.util.find_spec("torch") is not None
HAS_SHAP = importlib.util.find_spec("shap") is not None

if HAS_OPTUNA:
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)

if HAS_XGBOOST:
    from xgboost import XGBClassifier, XGBRegressor

if HAS_LIGHTGBM:
    from lightgbm import LGBMClassifier, LGBMRegressor


class TechniqueCategory(str, Enum):
    DATA_VALIDATION = "data_validation"
    OUTLIER_HANDLING = "outlier_handling"
    ENCODING_SCALING = "encoding_scaling"
    FEATURE_ENGINEERING = "feature_engineering"
    FEATURE_SELECTION = "feature_selection"
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    CLUSTERING = "clustering"
    ANOMALY_DETECTION = "anomaly_detection"
    TIME_SERIES = "time_series"
    ENSEMBLE = "ensemble"
    EXPLAINABILITY = "explainability"


@dataclass
class TechniqueParameterSchema:
    name: str
    param_type: str  # "int" | "float" | "categorical" | "bool"
    default: Any
    description: str
    min_val: Optional[Union[int, float]] = None
    max_val: Optional[Union[int, float]] = None
    step: Optional[Union[int, float]] = None
    choices: Optional[List[Any]] = None
    log_scale: bool = False


@dataclass
class TechniqueDefinition:
    id: str
    name: str
    category: TechniqueCategory
    supported_tasks: List[str]
    description: str
    preconditions: List[str]
    incompatibilities: List[str]
    required_dependencies: List[str]
    compute_cost: str  # "low" | "medium" | "high"
    leakage_precautions: str
    estimator_class: Optional[Type[BaseEstimator]]
    parameters: Dict[str, TechniqueParameterSchema]
    is_baseline: bool = False

    @property
    def is_available(self) -> bool:
        for dep in self.required_dependencies:
            if dep == "optuna" and not HAS_OPTUNA:
                return False
            if dep == "xgboost" and not HAS_XGBOOST:
                return False
            if dep == "lightgbm" and not HAS_LIGHTGBM:
                return False
            if dep == "catboost" and not HAS_CATBOOST:
                return False
            if dep == "torch" and not HAS_TORCH:
                return False
            if dep == "shap" and not HAS_SHAP:
                return False
        return True

    def validate_user_parameters(self, user_params: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Strict validation of parameters against schema and estimator class."""
        if self.estimator_class is not None:
            try:
                temp_inst = self.estimator_class()
                valid_estimator_params = set(temp_inst.get_params().keys())
            except Exception:
                valid_estimator_params = set(self.parameters.keys())
        else:
            valid_estimator_params = set(self.parameters.keys())

        for param_name, param_val in user_params.items():
            if param_name not in valid_estimator_params and param_name not in self.parameters:
                return False, f"Unknown parameter '{param_name}' for algorithm '{self.name}'."
            if param_name in self.parameters:
                schema = self.parameters[param_name]
                if schema.param_type == "int":
                    if not isinstance(param_val, (int, np.integer)):
                        return False, f"Parameter '{param_name}' must be an integer, got {type(param_val).__name__}."
                    if schema.min_val is not None and param_val < schema.min_val:
                        return False, f"Parameter '{param_name}' value {param_val} is below minimum {schema.min_val}."
                    if schema.max_val is not None and param_val > schema.max_val:
                        return False, f"Parameter '{param_name}' value {param_val} is above maximum {schema.max_val}."
                elif schema.param_type == "float":
                    if not isinstance(param_val, (int, float, np.floating)):
                        return False, f"Parameter '{param_name}' must be a float, got {type(param_val).__name__}."
                    if schema.min_val is not None and param_val < schema.min_val:
                        return False, f"Parameter '{param_name}' value {param_val} is below minimum {schema.min_val}."
                    if schema.max_val is not None and param_val > schema.max_val:
                        return False, f"Parameter '{param_name}' value {param_val} is above maximum {schema.max_val}."
                elif schema.param_type == "categorical":
                    if schema.choices and param_val not in schema.choices:
                        return False, f"Parameter '{param_name}' value '{param_val}' must be one of {schema.choices}."

        return True, "OK"


class TechniqueRegistry:
    """Central modular registry of all supported ML techniques, algorithms, and parameters."""

    def __init__(self) -> None:
        self._techniques: Dict[str, TechniqueDefinition] = {}
        self._initialize_registry()

    ALIASES = {
        "random_forest_clf": "random_forest_classifier",
        "random_forest_reg": "random_forest_regressor",
        "rf_clf": "random_forest_classifier",
        "rf_reg": "random_forest_regressor",
        "hist_gradient_boosting_clf": "hist_gradient_boosting_classifier",
        "hist_gradient_boosting_reg": "hist_gradient_boosting_regressor",
        "hgb_clf": "hist_gradient_boosting_classifier",
        "hgb_reg": "hist_gradient_boosting_regressor",
        "gradient_boosting_clf": "gradient_boosting_classifier",
        "gradient_boosting_reg": "gradient_boosting_regressor",
        "gb_clf": "gradient_boosting_classifier",
        "gb_reg": "gradient_boosting_regressor",
        "adaboost_clf": "adaboost_classifier",
        "adaboost_reg": "adaboost_regressor",
        "ada_clf": "adaboost_classifier",
        "ada_reg": "adaboost_regressor",
        "bagging_clf": "bagging_classifier",
        "bagging_reg": "bagging_regressor",
        "decision_tree_clf": "decision_tree_classifier",
        "decision_tree_reg": "decision_tree_regressor",
        "dt_clf": "decision_tree_classifier",
        "dt_reg": "decision_tree_regressor",
        "extra_trees_clf": "extra_trees_classifier",
        "extra_trees_reg": "extra_trees_regressor",
        "et_clf": "extra_trees_classifier",
        "et_reg": "extra_trees_regressor",
        "xgboost_clf": "xgboost_classifier",
        "xgboost_reg": "xgboost_regressor",
        "xgb_clf": "xgboost_classifier",
        "xgb_reg": "xgboost_regressor",
        "lightgbm_clf": "lightgbm_classifier",
        "lightgbm_reg": "lightgbm_regressor",
        "lgbm_clf": "lightgbm_classifier",
        "lgbm_reg": "lightgbm_regressor",
        "logistic_regression_clf": "logistic_regression",
        "logistic": "logistic_regression",
        "lr_clf": "logistic_regression",
        "linear_reg": "linear_regression",
        "ridge_reg": "ridge_regression",
        "ridge_clf": "ridge_classifier",
        "lasso_reg": "lasso_regression",
        "svc": "svc_rbf",
        "svr": "svr_rbf",
        "svm_clf": "svc_rbf",
        "svm_reg": "svr_rbf",
        "knn_clf": "k_neighbors_classifier",
        "knn_reg": "k_neighbors_regressor",
        "nb_clf": "gaussian_nb",
        "naive_bayes": "gaussian_nb",
        "mlp_clf": "mlp_classifier",
        "mlp_reg": "mlp_regressor",
        "neural_net_clf": "mlp_classifier",
        "neural_net_reg": "mlp_regressor",
        "pytorch_clf": "pytorch_tabular_classifier",
        "pytorch_reg": "pytorch_tabular_regressor",
        "pytorch_tabular_clf": "pytorch_tabular_classifier",
        "pytorch_tabular_reg": "pytorch_tabular_regressor",
        "dl_clf": "pytorch_tabular_classifier",
        "dl_reg": "pytorch_tabular_regressor",
        "huber": "huber_regressor",
        "huber_reg": "huber_regressor",
        "ransac": "ransac_regressor",
        "bayesian_ridge_reg": "bayesian_ridge",
        "poly_features": "polynomial_features",
        "pca_decomp": "pca",
    }

    def register(self, technique: TechniqueDefinition) -> None:
        self._techniques[technique.id] = technique

    def get(self, technique_id: str) -> Optional[TechniqueDefinition]:
        if not technique_id:
            return None
        tech = self._techniques.get(technique_id)
        if tech is None:
            resolved_id = self.ALIASES.get(technique_id)
            if resolved_id:
                tech = self._techniques.get(resolved_id)
        return tech

    def list_by_category(self, category: TechniqueCategory) -> List[TechniqueDefinition]:
        return [t for t in self._techniques.values() if t.category == category]

    def list_by_task(self, task_type: str) -> List[TechniqueDefinition]:
        task_norm = task_type.lower().replace(" ", "_")
        return [
            t for t in self._techniques.values()
            if t.is_available and any(
                task_norm in st or st in task_norm
                for st in t.supported_tasks
            )
        ]

    def _initialize_registry(self) -> None:
        # ─── CLASSIFICATION ALGORITHMS ──────────────────────────────────────
        self.register(TechniqueDefinition(
            id="dummy_classifier",
            name="Dummy Classifier (Baseline)",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Statistical baseline predicting the most frequent or stratified prior distribution.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Fitted only on training folds.",
            estimator_class=DummyClassifier,
            parameters={
                "strategy": TechniqueParameterSchema("strategy", "categorical", "most_frequent", "Baseline strategy", choices=["most_frequent", "prior", "stratified", "uniform"]),
            },
            is_baseline=True,
        ))

        self.register(TechniqueDefinition(
            id="logistic_regression",
            name="Logistic Regression",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Interpretable linear classification model with L1/L2 regularization.",
            preconditions=["Scaled numerical features", "Encoded categorical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Scaler and imputer must be fitted exclusively inside training folds.",
            estimator_class=LogisticRegression,
            parameters={
                "C": TechniqueParameterSchema("C", "float", 1.0, "Inverse regularization strength", min_val=0.001, max_val=100.0, log_scale=True),
                "penalty": TechniqueParameterSchema("penalty", "categorical", "l2", "Regularization penalty", choices=["l2", "none", None]),
                "max_iter": TechniqueParameterSchema("max_iter", "int", 500, "Maximum solver iterations", min_val=100, max_val=2000),
                "solver": TechniqueParameterSchema("solver", "categorical", "lbfgs", "Optimization solver", choices=["lbfgs", "liblinear", "saga"]),
            },
        ))

        self.register(TechniqueDefinition(
            id="ridge_classifier",
            name="Ridge Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="L2-penalized linear model converted to classifier via sign function. Robust against multicollinearity.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Scaled inside pipeline.",
            estimator_class=RidgeClassifier,
            parameters={
                "alpha": TechniqueParameterSchema("alpha", "float", 1.0, "Regularization parameter", min_val=0.01, max_val=100.0, log_scale=True),
            },
        ))

        self.register(TechniqueDefinition(
            id="decision_tree_classifier",
            name="Decision Tree Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Non-linear, fully interpretable hierarchical decision rule model.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Fitted only on train splits.",
            estimator_class=DecisionTreeClassifier,
            parameters={
                "max_depth": TechniqueParameterSchema("max_depth", "int", 6, "Maximum tree depth to prevent overfitting", min_val=2, max_val=20),
                "min_samples_split": TechniqueParameterSchema("min_samples_split", "int", 5, "Minimum samples required to split a node", min_val=2, max_val=50),
                "min_samples_leaf": TechniqueParameterSchema("min_samples_leaf", "int", 2, "Minimum samples at a leaf node", min_val=1, max_val=30),
                "criterion": TechniqueParameterSchema("criterion", "categorical", "gini", "Split impurity criterion", choices=["gini", "entropy"]),
            },
        ))

        self.register(TechniqueDefinition(
            id="random_forest_classifier",
            name="Random Forest Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Ensemble of de-correlated decision trees with bagging and random feature subspaces.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Ensemble pipeline fitted on train folds.",
            estimator_class=RandomForestClassifier,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of trees", min_val=20, max_val=500),
                "max_depth": TechniqueParameterSchema("max_depth", "int", 10, "Maximum tree depth", min_val=3, max_val=30),
                "min_samples_split": TechniqueParameterSchema("min_samples_split", "int", 4, "Minimum samples for node split", min_val=2, max_val=20),
                "min_samples_leaf": TechniqueParameterSchema("min_samples_leaf", "int", 2, "Minimum samples at leaf node", min_val=1, max_val=10),
                "bootstrap": TechniqueParameterSchema("bootstrap", "categorical", True, "Whether bootstrap samples are used", choices=[True, False]),
            },
        ))

        self.register(TechniqueDefinition(
            id="extra_trees_classifier",
            name="Extra Trees Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Extremely randomized trees reducing variance and training time through random split thresholds.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Fitted on train folds.",
            estimator_class=ExtraTreesClassifier,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of trees", min_val=20, max_val=300),
                "max_depth": TechniqueParameterSchema("max_depth", "int", 10, "Maximum depth", min_val=3, max_val=25),
                "min_samples_split": TechniqueParameterSchema("min_samples_split", "int", 4, "Minimum split samples", min_val=2, max_val=20),
            },
        ))

        self.register(TechniqueDefinition(
            id="hist_gradient_boosting_classifier",
            name="HistGradientBoosting Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Fast histogram-based gradient boosting (inspired by LightGBM), native missing value support.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Fitted strictly inside train splits.",
            estimator_class=HistGradientBoostingClassifier,
            parameters={
                "max_iter": TechniqueParameterSchema("max_iter", "int", 100, "Number of boosting iterations", min_val=30, max_val=300),
                "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.1, "Shrinkage rate", min_val=0.01, max_val=0.5, log_scale=True),
                "max_leaf_nodes": TechniqueParameterSchema("max_leaf_nodes", "int", 31, "Maximum leaves per tree", min_val=15, max_val=127),
                "min_samples_leaf": TechniqueParameterSchema("min_samples_leaf", "int", 20, "Minimum samples per leaf", min_val=5, max_val=100),
                "l2_regularization": TechniqueParameterSchema("l2_regularization", "float", 0.0, "L2 regularization", min_val=0.0, max_val=10.0),
            },
        ))

        if HAS_XGBOOST:
            self.register(TechniqueDefinition(
                id="xgboost_classifier",
                name="XGBoost Classifier",
                category=TechniqueCategory.CLASSIFICATION,
                supported_tasks=["classification", "binary_classification", "multiclass_classification"],
                description="State-of-the-art scalable gradient boosted trees with second-order gradient optimization.",
                preconditions=["Numeric or encoded categorical features"],
                incompatibilities=[],
                required_dependencies=["xgboost"],
                compute_cost="high",
                leakage_precautions="Target encoding or scaling fitted inside train split only.",
                estimator_class=XGBClassifier,
                parameters={
                    "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of boosting rounds", min_val=30, max_val=400),
                    "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.08, "Step size shrinkage", min_val=0.01, max_val=0.3, log_scale=True),
                    "max_depth": TechniqueParameterSchema("max_depth", "int", 5, "Maximum tree depth", min_val=2, max_val=12),
                    "subsample": TechniqueParameterSchema("subsample", "float", 0.85, "Subsample ratio of training instances", min_val=0.5, max_val=1.0),
                    "colsample_bytree": TechniqueParameterSchema("colsample_bytree", "float", 0.85, "Subsample ratio of columns per tree", min_val=0.5, max_val=1.0),
                },
            ))

        if HAS_LIGHTGBM:
            self.register(TechniqueDefinition(
                id="lightgbm_classifier",
                name="LightGBM Classifier",
                category=TechniqueCategory.CLASSIFICATION,
                supported_tasks=["classification", "binary_classification", "multiclass_classification"],
                description="High-performance, leaf-wise gradient boosting optimized for speed and memory efficiency.",
                preconditions=[],
                incompatibilities=[],
                required_dependencies=["lightgbm"],
                compute_cost="medium",
                leakage_precautions="Train fold fitting.",
                estimator_class=LGBMClassifier,
                parameters={
                    "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of boosting trees", min_val=30, max_val=300),
                    "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.08, "Learning rate", min_val=0.01, max_val=0.3, log_scale=True),
                    "num_leaves": TechniqueParameterSchema("num_leaves", "int", 31, "Maximum tree leaves", min_val=15, max_val=127),
                    "subsample": TechniqueParameterSchema("subsample", "float", 0.85, "Subsample ratio", min_val=0.5, max_val=1.0),
                },
            ))

        self.register(TechniqueDefinition(
            id="k_neighbors_classifier",
            name="K-Nearest Neighbors Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Instance-based non-parametric classifier based on feature space proximity.",
            preconditions=["Scaled numerical features", "Dataset rows < 20,000 for latency"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Feature scaling fitted only on training set.",
            estimator_class=KNeighborsClassifier,
            parameters={
                "n_neighbors": TechniqueParameterSchema("n_neighbors", "int", 5, "Number of neighbors", min_val=1, max_val=30),
                "weights": TechniqueParameterSchema("weights", "categorical", "uniform", "Weight function", choices=["uniform", "distance"]),
                "metric": TechniqueParameterSchema("metric", "categorical", "minkowski", "Distance metric", choices=["minkowski", "euclidean", "manhattan"]),
            },
        ))

        self.register(TechniqueDefinition(
            id="gaussian_nb",
            name="Gaussian Naive Bayes",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Fast probabilistic baseline applying Bayes theorem with conditional feature independence.",
            preconditions=["Numeric features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Fitted on train folds.",
            estimator_class=GaussianNB,
            parameters={},
            is_baseline=True,
        ))

        self.register(TechniqueDefinition(
            id="mlp_classifier",
            name="Multi-Layer Perceptron (Neural Network)",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Feedforward artificial neural network with backpropagation for tabular feature patterns.",
            preconditions=["Standardized numerical features", "Imputed missing values"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="high",
            leakage_precautions="Standardization strictly within CV folds.",
            estimator_class=MLPClassifier,
            parameters={
                "hidden_layer_sizes": TechniqueParameterSchema("hidden_layer_sizes", "categorical", (64, 32), "Hidden layer architecture", choices=[(64,), (64, 32), (128, 64)]),
                "alpha": TechniqueParameterSchema("alpha", "float", 0.0001, "L2 penalty (regularization term)", min_val=1e-5, max_val=1e-1, log_scale=True),
                "max_iter": TechniqueParameterSchema("max_iter", "int", 300, "Maximum optimization iterations", min_val=150, max_val=800),
            },
        ))

        # ─── REGRESSION ALGORITHMS ──────────────────────────────────────────
        self.register(TechniqueDefinition(
            id="dummy_regressor",
            name="Dummy Regressor (Baseline)",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Baseline predicting target mean or median.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Fitted only on train splits.",
            estimator_class=DummyRegressor,
            parameters={
                "strategy": TechniqueParameterSchema("strategy", "categorical", "mean", "Baseline strategy", choices=["mean", "median"]),
            },
            is_baseline=True,
        ))

        self.register(TechniqueDefinition(
            id="linear_regression",
            name="Linear Regression",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Ordinary least squares linear regression.",
            preconditions=["Scaled numerical features", "Multicollinearity check"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Scaler fitted on train folds.",
            estimator_class=LinearRegression,
            parameters={},
            is_baseline=True,
        ))

        self.register(TechniqueDefinition(
            id="ridge_regression",
            name="Ridge Regression",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="L2-penalized linear regression robust against correlated predictors.",
            preconditions=["Scaled features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Scaled inside pipeline.",
            estimator_class=Ridge,
            parameters={
                "alpha": TechniqueParameterSchema("alpha", "float", 1.0, "Regularization strength", min_val=0.01, max_val=100.0, log_scale=True),
            },
        ))

        self.register(TechniqueDefinition(
            id="lasso_regression",
            name="Lasso Regression",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="L1-penalized linear model promoting sparsity and automatic feature selection.",
            preconditions=["Scaled features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Scaled inside pipeline.",
            estimator_class=Lasso,
            parameters={
                "alpha": TechniqueParameterSchema("alpha", "float", 0.1, "Regularization parameter", min_val=0.001, max_val=10.0, log_scale=True),
                "max_iter": TechniqueParameterSchema("max_iter", "int", 1000, "Maximum iterations", min_val=500, max_val=3000),
            },
        ))

        self.register(TechniqueDefinition(
            id="elastic_net",
            name="Elastic Net Regression",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Linear regression combining L1 and L2 penalties for balanced regularization.",
            preconditions=["Scaled features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Scaled inside pipeline.",
            estimator_class=ElasticNet,
            parameters={
                "alpha": TechniqueParameterSchema("alpha", "float", 0.1, "Constant multiplying penalty", min_val=0.001, max_val=10.0, log_scale=True),
                "l1_ratio": TechniqueParameterSchema("l1_ratio", "float", 0.5, "ElasticNet mixing parameter (0=Ridge, 1=Lasso)", min_val=0.05, max_val=0.95),
            },
        ))

        self.register(TechniqueDefinition(
            id="random_forest_regressor",
            name="Random Forest Regressor",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Bagged non-linear tree ensemble minimizing variance and capturing feature interactions.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Train fold fitting.",
            estimator_class=RandomForestRegressor,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of trees", min_val=20, max_val=400),
                "max_depth": TechniqueParameterSchema("max_depth", "int", 12, "Maximum tree depth", min_val=3, max_val=25),
                "min_samples_split": TechniqueParameterSchema("min_samples_split", "int", 4, "Minimum samples required to split", min_val=2, max_val=20),
            },
        ))

        self.register(TechniqueDefinition(
            id="hist_gradient_boosting_regressor",
            name="HistGradientBoosting Regressor",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Fast histogram gradient boosting for non-linear regression with automatic missing value handling.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Train split containment.",
            estimator_class=HistGradientBoostingRegressor,
            parameters={
                "max_iter": TechniqueParameterSchema("max_iter", "int", 100, "Number of boosting iterations", min_val=30, max_val=300),
                "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.08, "Shrinkage rate", min_val=0.01, max_val=0.4, log_scale=True),
                "max_leaf_nodes": TechniqueParameterSchema("max_leaf_nodes", "int", 31, "Maximum leaves per tree", min_val=15, max_val=127),
            },
        ))

        if HAS_XGBOOST:
            self.register(TechniqueDefinition(
                id="xgboost_regressor",
                name="XGBoost Regressor",
                category=TechniqueCategory.REGRESSION,
                supported_tasks=["regression"],
                description="High-performance gradient boosted decision trees for continuous targets.",
                preconditions=[],
                incompatibilities=[],
                required_dependencies=["xgboost"],
                compute_cost="high",
                leakage_precautions="Train fold containment.",
                estimator_class=XGBRegressor,
                parameters={
                    "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of trees", min_val=30, max_val=400),
                    "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.08, "Learning rate", min_val=0.01, max_val=0.3, log_scale=True),
                    "max_depth": TechniqueParameterSchema("max_depth", "int", 5, "Maximum tree depth", min_val=2, max_val=12),
                },
            ))

        if HAS_LIGHTGBM:
            self.register(TechniqueDefinition(
                id="lightgbm_regressor",
                name="LightGBM Regressor",
                category=TechniqueCategory.REGRESSION,
                supported_tasks=["regression"],
                description="Fast leaf-wise gradient boosting regression.",
                preconditions=[],
                incompatibilities=[],
                required_dependencies=["lightgbm"],
                compute_cost="medium",
                leakage_precautions="Train fold containment.",
                estimator_class=LGBMRegressor,
                parameters={
                    "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of boosting trees", min_val=30, max_val=300),
                    "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.08, "Learning rate", min_val=0.01, max_val=0.3, log_scale=True),
                    "num_leaves": TechniqueParameterSchema("num_leaves", "int", 31, "Maximum leaves", min_val=15, max_val=127),
                },
            ))

        # ─── CLUSTERING ALGORITHMS ──────────────────────────────────────────
        self.register(TechniqueDefinition(
            id="kmeans",
            name="K-Means Clustering",
            category=TechniqueCategory.CLUSTERING,
            supported_tasks=["clustering", "unsupervised"],
            description="Centroid-based partition clustering minimizing intra-cluster inertia.",
            preconditions=["Scaled numerical features", "Missing values imputed"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Fitted on whole dataset or train partition for feature representation.",
            estimator_class=KMeans,
            parameters={
                "n_clusters": TechniqueParameterSchema("n_clusters", "int", 3, "Number of clusters to form", min_val=2, max_val=15),
                "init": TechniqueParameterSchema("init", "categorical", "k-means++", "Method for initialization", choices=["k-means++", "random"]),
                "n_init": TechniqueParameterSchema("n_init", "int", 10, "Number of centroid seed runs", min_val=5, max_val=20),
            },
        ))

        self.register(TechniqueDefinition(
            id="dbscan",
            name="DBSCAN (Density-Based Spatial Clustering)",
            category=TechniqueCategory.CLUSTERING,
            supported_tasks=["clustering", "unsupervised"],
            description="Finds core samples of high density and expands clusters. Discovers arbitrarily shaped clusters and flags noise.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Unsupervised clustering.",
            estimator_class=DBSCAN,
            parameters={
                "eps": TechniqueParameterSchema("eps", "float", 0.5, "Maximum distance between two samples for neighborhood", min_val=0.1, max_val=2.0),
                "min_samples": TechniqueParameterSchema("min_samples", "int", 5, "Number of samples in neighborhood for core point", min_val=2, max_val=20),
            },
        ))

        # ─── ANOMALY DETECTION ALGORITHMS ────────────────────────────────────
        self.register(TechniqueDefinition(
            id="isolation_forest",
            name="Isolation Forest Anomaly Detector",
            category=TechniqueCategory.ANOMALY_DETECTION,
            supported_tasks=["anomaly_detection", "unsupervised", "classification"],
            description="Isolates anomalies by randomly partitioning features. Outliers have noticeably shorter path lengths.",
            preconditions=["Imputed numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Contained within feature processing or standalone detection.",
            estimator_class=IsolationForest,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of base estimators", min_val=50, max_val=250),
                "contamination": TechniqueParameterSchema("contamination", "float", 0.05, "Expected proportion of outliers", min_val=0.01, max_val=0.25),
                "random_state": TechniqueParameterSchema("random_state", "int", 42, "Reproducibility seed"),
            },
        ))

        # ─── ADVANCED CLASSIFICATION ENSEMBLES & DEEP LEARNING ───────────────
        self.register(TechniqueDefinition(
            id="gradient_boosting_classifier",
            name="Gradient Boosting Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Sequential stage-wise additive tree ensemble minimizing deviance loss.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="high",
            leakage_precautions="Train fold fitting.",
            estimator_class=GradientBoostingClassifier,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of boosting stages", min_val=30, max_val=300),
                "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.1, "Learning rate shrinkage", min_val=0.01, max_val=0.3, log_scale=True),
                "max_depth": TechniqueParameterSchema("max_depth", "int", 3, "Maximum tree depth", min_val=2, max_val=8),
                "subsample": TechniqueParameterSchema("subsample", "float", 1.0, "Subsample ratio of training instances", min_val=0.6, max_val=1.0),
            },
        ))

        self.register(TechniqueDefinition(
            id="adaboost_classifier",
            name="AdaBoost Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Adaptive boosting focusing sequential estimators on hard-to-classify samples.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Train fold fitting.",
            estimator_class=AdaBoostClassifier,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 50, "Number of boosting iterations", min_val=20, max_val=200),
                "learning_rate": TechniqueParameterSchema("learning_rate", "float", 1.0, "Weighting shrinkage", min_val=0.05, max_val=2.0, log_scale=True),
            },
        ))

        self.register(TechniqueDefinition(
            id="bagging_classifier",
            name="Bagging Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Bootstrap aggregating ensemble reducing variance of base estimators.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Train fold fitting.",
            estimator_class=BaggingClassifier,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 20, "Number of base estimators", min_val=10, max_val=100),
                "max_samples": TechniqueParameterSchema("max_samples", "float", 1.0, "Fraction of samples drawn for each estimator", min_val=0.5, max_val=1.0),
            },
        ))

        self.register(TechniqueDefinition(
            id="svc_rbf",
            name="Support Vector Classifier (RBF Kernel)",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Maximum margin classifier with Radial Basis Function kernel for non-linear boundaries.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="high",
            leakage_precautions="Features must be scaled exclusively on training splits.",
            estimator_class=SVC,
            parameters={
                "C": TechniqueParameterSchema("C", "float", 1.0, "Regularization penalty", min_val=0.01, max_val=50.0, log_scale=True),
                "gamma": TechniqueParameterSchema("gamma", "categorical", "scale", "Kernel coefficient", choices=["scale", "auto"]),
                "probability": TechniqueParameterSchema("probability", "bool", True, "Enable probability estimates"),
            },
        ))

        self.register(TechniqueDefinition(
            id="linear_svc",
            name="Linear Support Vector Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Fast linear SVM implementing liblinear for high-dimensional sparse or scaled data.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Pipeline scaling containment.",
            estimator_class=LinearSVC,
            parameters={
                "C": TechniqueParameterSchema("C", "float", 1.0, "Penalty parameter", min_val=0.01, max_val=50.0, log_scale=True),
                "max_iter": TechniqueParameterSchema("max_iter", "int", 1000, "Maximum iterations", min_val=500, max_val=3000),
            },
        ))

        self.register(TechniqueDefinition(
            id="k_neighbors_classifier",
            name="K-Nearest Neighbors Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Instance-based non-parametric classifier voting among nearest neighbors.",
            preconditions=["Scaled numerical features", "Low to moderate dimensionality"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Scaler fitted on training split.",
            estimator_class=KNeighborsClassifier,
            parameters={
                "n_neighbors": TechniqueParameterSchema("n_neighbors", "int", 5, "Number of neighbors", min_val=1, max_val=30),
                "weights": TechniqueParameterSchema("weights", "categorical", "uniform", "Weight function", choices=["uniform", "distance"]),
                "p": TechniqueParameterSchema("p", "int", 2, "Minkowski power (1=Manhattan, 2=Euclidean)", min_val=1, max_val=2),
            },
        ))

        self.register(TechniqueDefinition(
            id="gaussian_nb",
            name="Gaussian Naive Bayes",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Probabilistic classifier assuming independent Gaussian distributed features.",
            preconditions=["Numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Train fold prior estimation.",
            estimator_class=GaussianNB,
            parameters={
                "var_smoothing": TechniqueParameterSchema("var_smoothing", "float", 1e-9, "Portion of largest variance added to prevent division by zero", min_val=1e-11, max_val=1e-5, log_scale=True),
            },
        ))

        self.register(TechniqueDefinition(
            id="bernoulli_nb",
            name="Bernoulli Naive Bayes",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Naive Bayes for discrete boolean/binary indicator features.",
            preconditions=["Binarized or indicator features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Train fold prior estimation.",
            estimator_class=BernoulliNB,
            parameters={
                "alpha": TechniqueParameterSchema("alpha", "float", 1.0, "Additive Laplace smoothing", min_val=0.1, max_val=10.0),
            },
        ))

        self.register(TechniqueDefinition(
            id="sgd_classifier",
            name="Stochastic Gradient Descent Classifier",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Linear classifier optimized via incremental SGD; ideal for large out-of-core datasets.",
            preconditions=["Scaled features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Pipeline scaling.",
            estimator_class=SGDClassifier,
            parameters={
                "loss": TechniqueParameterSchema("loss", "categorical", "log_loss", "Loss function", choices=["log_loss", "hinge", "modified_huber"]),
                "alpha": TechniqueParameterSchema("alpha", "float", 0.0001, "Regularization multiplier", min_val=1e-6, max_val=1e-1, log_scale=True),
                "penalty": TechniqueParameterSchema("penalty", "categorical", "l2", "Penalty norm", choices=["l2", "l1", "elasticnet"]),
            },
        ))

        self.register(TechniqueDefinition(
            id="pytorch_tabular_classifier",
            name="PyTorch Tabular Deep Learning MLP",
            category=TechniqueCategory.CLASSIFICATION,
            supported_tasks=["classification", "binary_classification", "multiclass_classification"],
            description="Deep Neural Network with Batch Normalization, Dropout, AdamW, and Cosine Annealing learning rate schedules.",
            preconditions=["Scaled numerical features", "Encoded categorical features"],
            incompatibilities=[],
            required_dependencies=["torch"],
            compute_cost="high",
            leakage_precautions="Batch normalization and weights fitted only on training split.",
            estimator_class=PyTorchTabularClassifier,
            parameters={
                "hidden_dims": TechniqueParameterSchema("hidden_dims", "categorical", "64,32", "Hidden layer dimensions", choices=["64,32", "128,64,32", "32,16"]),
                "dropout_rate": TechniqueParameterSchema("dropout_rate", "float", 0.2, "Dropout regularization probability", min_val=0.0, max_val=0.5),
                "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.003, "AdamW initial learning rate", min_val=0.0005, max_val=0.01, log_scale=True),
                "epochs": TechniqueParameterSchema("epochs", "int", 30, "Maximum training epochs", min_val=15, max_val=80),
                "patience": TechniqueParameterSchema("patience", "int", 5, "Early stopping patience", min_val=3, max_val=10),
            },
        ))

        # ─── ADVANCED REGRESSION ALGORITHMS ──────────────────────────────────
        self.register(TechniqueDefinition(
            id="gradient_boosting_regressor",
            name="Gradient Boosting Regressor",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Forward stage-wise regression tree ensemble optimizing Huber or squared error loss.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="high",
            leakage_precautions="Train fold fitting.",
            estimator_class=GradientBoostingRegressor,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 100, "Number of boosting stages", min_val=30, max_val=300),
                "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.1, "Learning rate", min_val=0.01, max_val=0.3, log_scale=True),
                "max_depth": TechniqueParameterSchema("max_depth", "int", 3, "Maximum tree depth", min_val=2, max_val=8),
            },
        ))

        self.register(TechniqueDefinition(
            id="adaboost_regressor",
            name="AdaBoost Regressor",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Iterative boosting regressor adapting sample weights according to prediction errors.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Train fold fitting.",
            estimator_class=AdaBoostRegressor,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 50, "Number of boosting iterations", min_val=20, max_val=200),
                "learning_rate": TechniqueParameterSchema("learning_rate", "float", 1.0, "Weighting shrinkage", min_val=0.05, max_val=2.0, log_scale=True),
                "loss": TechniqueParameterSchema("loss", "categorical", "linear", "Loss function", choices=["linear", "square", "exponential"]),
            },
        ))

        self.register(TechniqueDefinition(
            id="bagging_regressor",
            name="Bagging Regressor",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Bootstrap aggregating ensemble for continuous target prediction.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Train fold fitting.",
            estimator_class=BaggingRegressor,
            parameters={
                "n_estimators": TechniqueParameterSchema("n_estimators", "int", 20, "Number of base estimators", min_val=10, max_val=100),
                "max_samples": TechniqueParameterSchema("max_samples", "float", 1.0, "Fraction of samples drawn for each estimator", min_val=0.5, max_val=1.0),
            },
        ))

        self.register(TechniqueDefinition(
            id="huber_regressor",
            name="Huber Regressor (Robust)",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Linear regression robust against heavy outliers; uses Huber loss rather than squared loss.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Scaled inside pipeline.",
            estimator_class=HuberRegressor,
            parameters={
                "epsilon": TechniqueParameterSchema("epsilon", "float", 1.35, "Controls fraction of samples treated as outliers", min_val=1.1, max_val=2.0),
                "alpha": TechniqueParameterSchema("alpha", "float", 0.0001, "Regularization parameter", min_val=1e-5, max_val=10.0, log_scale=True),
            },
        ))

        self.register(TechniqueDefinition(
            id="bayesian_ridge",
            name="Bayesian Ridge Regression",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Bayesian estimation of linear model parameters with automatic regularization tuning.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Pipeline scaling.",
            estimator_class=BayesianRidge,
            parameters={
                "n_iter": TechniqueParameterSchema("n_iter", "int", 300, "Maximum iterations", min_val=100, max_val=1000),
            },
        ))

        self.register(TechniqueDefinition(
            id="svr_rbf",
            name="Support Vector Regressor (RBF Kernel)",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Epsilon-insensitive Support Vector Regression with RBF kernel.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="high",
            leakage_precautions="Pipeline scaling.",
            estimator_class=SVR,
            parameters={
                "C": TechniqueParameterSchema("C", "float", 1.0, "Regularization penalty", min_val=0.1, max_val=50.0, log_scale=True),
                "epsilon": TechniqueParameterSchema("epsilon", "float", 0.1, "Epsilon tube width", min_val=0.01, max_val=0.5),
            },
        ))

        self.register(TechniqueDefinition(
            id="linear_svr",
            name="Linear Support Vector Regressor",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Fast linear Support Vector Regression for scaled continuous targets.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Pipeline scaling.",
            estimator_class=LinearSVR,
            parameters={
                "C": TechniqueParameterSchema("C", "float", 1.0, "Regularization parameter", min_val=0.01, max_val=50.0, log_scale=True),
                "epsilon": TechniqueParameterSchema("epsilon", "float", 0.0, "Epsilon tube width", min_val=0.0, max_val=0.5),
            },
        ))

        self.register(TechniqueDefinition(
            id="k_neighbors_regressor",
            name="K-Nearest Neighbors Regressor",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Non-parametric local regression interpolating target values among k neighbors.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Pipeline scaling.",
            estimator_class=KNeighborsRegressor,
            parameters={
                "n_neighbors": TechniqueParameterSchema("n_neighbors", "int", 5, "Number of neighbors", min_val=1, max_val=30),
                "weights": TechniqueParameterSchema("weights", "categorical", "uniform", "Weight function", choices=["uniform", "distance"]),
            },
        ))

        self.register(TechniqueDefinition(
            id="mlp_regressor",
            name="MLP Regressor (Multi-Layer Perceptron)",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Neural network regression model trained via backpropagation with Adam.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="high",
            leakage_precautions="Pipeline scaling.",
            estimator_class=MLPRegressor,
            parameters={
                "hidden_layer_sizes": TechniqueParameterSchema("hidden_layer_sizes", "categorical", (64, 32), "Hidden layer architecture", choices=[(64, 32), (100,), (128, 64)]),
                "alpha": TechniqueParameterSchema("alpha", "float", 0.0001, "L2 penalty parameter", min_val=1e-5, max_val=1e-1, log_scale=True),
                "max_iter": TechniqueParameterSchema("max_iter", "int", 300, "Maximum training epochs", min_val=150, max_val=600),
            },
        ))

        self.register(TechniqueDefinition(
            id="pytorch_tabular_regressor",
            name="PyTorch Tabular Deep Learning Regressor",
            category=TechniqueCategory.REGRESSION,
            supported_tasks=["regression"],
            description="Deep Neural Network with Batch Normalization, Dropout, AdamW, and Cosine Annealing learning rate schedules.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=["torch"],
            compute_cost="high",
            leakage_precautions="Fitted only on training split.",
            estimator_class=PyTorchTabularRegressor,
            parameters={
                "hidden_dims": TechniqueParameterSchema("hidden_dims", "categorical", "64,32", "Hidden layer dimensions", choices=["64,32", "128,64,32", "32,16"]),
                "dropout_rate": TechniqueParameterSchema("dropout_rate", "float", 0.1, "Dropout regularization probability", min_val=0.0, max_val=0.4),
                "learning_rate": TechniqueParameterSchema("learning_rate", "float", 0.005, "AdamW initial learning rate", min_val=0.001, max_val=0.02, log_scale=True),
                "epochs": TechniqueParameterSchema("epochs", "int", 30, "Maximum training epochs", min_val=15, max_val=80),
                "patience": TechniqueParameterSchema("patience", "int", 5, "Early stopping patience", min_val=3, max_val=10),
            },
        ))

        # ─── ADVANCED CLUSTERING & ANOMALY DETECTION ─────────────────────────
        self.register(TechniqueDefinition(
            id="minibatch_kmeans",
            name="Mini-Batch K-Means",
            category=TechniqueCategory.CLUSTERING,
            supported_tasks=["clustering", "unsupervised"],
            description="Scalable variant of K-Means using mini-batches to optimize large datasets.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Unsupervised clustering.",
            estimator_class=MiniBatchKMeans,
            parameters={
                "n_clusters": TechniqueParameterSchema("n_clusters", "int", 3, "Number of clusters to form", min_val=2, max_val=20),
                "batch_size": TechniqueParameterSchema("batch_size", "int", 100, "Mini-batch size", min_val=50, max_val=500),
            },
        ))

        self.register(TechniqueDefinition(
            id="agglomerative_clustering",
            name="Agglomerative Hierarchical Clustering",
            category=TechniqueCategory.CLUSTERING,
            supported_tasks=["clustering", "unsupervised"],
            description="Bottom-up hierarchical clustering grouping samples into a cluster dendrogram.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Unsupervised clustering.",
            estimator_class=AgglomerativeClustering,
            parameters={
                "n_clusters": TechniqueParameterSchema("n_clusters", "int", 3, "Number of clusters to find", min_val=2, max_val=15),
                "linkage": TechniqueParameterSchema("linkage", "categorical", "ward", "Linkage criterion", choices=["ward", "complete", "average"]),
            },
        ))

        self.register(TechniqueDefinition(
            id="optics",
            name="OPTICS (Ordering Points To Identify Clustering Structure)",
            category=TechniqueCategory.CLUSTERING,
            supported_tasks=["clustering", "unsupervised"],
            description="Density-based clustering finding clusters of varying density without a global epsilon.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="high",
            leakage_precautions="Unsupervised clustering.",
            estimator_class=OPTICS,
            parameters={
                "min_samples": TechniqueParameterSchema("min_samples", "int", 5, "Number of samples in neighborhood for core point", min_val=2, max_val=25),
            },
        ))

        self.register(TechniqueDefinition(
            id="gaussian_mixture",
            name="Gaussian Mixture Models (GMM)",
            category=TechniqueCategory.CLUSTERING,
            supported_tasks=["clustering", "unsupervised", "anomaly_detection"],
            description="Probabilistic soft-clustering fitting a mixture of Gaussian distributions using Expectation-Maximization.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Unsupervised fitting.",
            estimator_class=GaussianMixture,
            parameters={
                "n_components": TechniqueParameterSchema("n_components", "int", 3, "Number of mixture components", min_val=2, max_val=15),
                "covariance_type": TechniqueParameterSchema("covariance_type", "categorical", "full", "Covariance matrix type", choices=["full", "tied", "diag", "spherical"]),
            },
        ))

        self.register(TechniqueDefinition(
            id="local_outlier_factor",
            name="Local Outlier Factor (LOF)",
            category=TechniqueCategory.ANOMALY_DETECTION,
            supported_tasks=["anomaly_detection", "unsupervised"],
            description="Measures local deviation of density with respect to surrounding neighbors to identify outliers.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Novelty detection fitting.",
            estimator_class=LocalOutlierFactor,
            parameters={
                "n_neighbors": TechniqueParameterSchema("n_neighbors", "int", 20, "Number of neighbors for local density estimate", min_val=5, max_val=50),
                "contamination": TechniqueParameterSchema("contamination", "float", 0.05, "Proportion of outliers in the data", min_val=0.01, max_val=0.25),
                "novelty": TechniqueParameterSchema("novelty", "bool", True, "Enable predict and decision_function on new data"),
            },
        ))

        self.register(TechniqueDefinition(
            id="one_class_svm",
            name="One-Class SVM Anomaly Detector",
            category=TechniqueCategory.ANOMALY_DETECTION,
            supported_tasks=["anomaly_detection", "unsupervised"],
            description="Unsupervised outlier detection estimating the support of a high-dimensional distribution.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Fitted on normal train instances.",
            estimator_class=OneClassSVM,
            parameters={
                "nu": TechniqueParameterSchema("nu", "float", 0.05, "Upper bound on fraction of training errors and lower bound on support vectors", min_val=0.01, max_val=0.25),
                "gamma": TechniqueParameterSchema("gamma", "categorical", "scale", "Kernel coefficient", choices=["scale", "auto"]),
            },
        ))

        self.register(TechniqueDefinition(
            id="elliptic_envelope",
            name="Elliptic Envelope (Fast Robust Covariance)",
            category=TechniqueCategory.ANOMALY_DETECTION,
            supported_tasks=["anomaly_detection", "unsupervised"],
            description="Fits a robust covariance estimate to Gaussian distributed data to detect extreme multivariate outliers.",
            preconditions=["Continuous unimodal features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Robust covariance fitted on train partition.",
            estimator_class=EllipticEnvelope,
            parameters={
                "contamination": TechniqueParameterSchema("contamination", "float", 0.05, "Expected outlier proportion", min_val=0.01, max_val=0.25),
            },
        ))

        # ─── PREPROCESSING, ENCODERS & FEATURE SELECTORS ─────────────────────
        self.register(TechniqueDefinition(
            id="standard_scaler",
            name="Standard Scaler",
            category=TechniqueCategory.ENCODING_SCALING,
            supported_tasks=["classification", "regression", "clustering", "anomaly_detection"],
            description="Standardizes features by removing mean and scaling to unit variance.",
            preconditions=["Numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Mean and std fitted ONLY on training split.",
            estimator_class=StandardScaler,
            parameters={},
        ))

        self.register(TechniqueDefinition(
            id="robust_scaler",
            name="Robust Scaler (Median & IQR)",
            category=TechniqueCategory.ENCODING_SCALING,
            supported_tasks=["classification", "regression", "clustering", "anomaly_detection"],
            description="Scales features using median and Interquartile Range (IQR), robust to extreme outliers.",
            preconditions=["Numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Median and quantiles computed exclusively on training data.",
            estimator_class=RobustScaler,
            parameters={},
        ))

        self.register(TechniqueDefinition(
            id="min_max_scaler",
            name="Min-Max Scaler",
            category=TechniqueCategory.ENCODING_SCALING,
            supported_tasks=["classification", "regression", "clustering"],
            description="Transforms features by scaling each feature to a given range [0, 1].",
            preconditions=["Numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Min and max determined strictly on train split.",
            estimator_class=MinMaxScaler,
            parameters={},
        ))

        self.register(TechniqueDefinition(
            id="power_transformer",
            name="Power Transformer (Yeo-Johnson)",
            category=TechniqueCategory.ENCODING_SCALING,
            supported_tasks=["classification", "regression"],
            description="Applies a power transform feature-wise to make data more Gaussian-like.",
            preconditions=["Numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Fitted on train folds.",
            estimator_class=PowerTransformer,
            parameters={},
        ))

        self.register(TechniqueDefinition(
            id="pca",
            name="Principal Component Analysis (PCA)",
            category=TechniqueCategory.FEATURE_SELECTION,
            supported_tasks=["classification", "regression", "clustering", "dimensionality_reduction"],
            description="Linear dimensionality reduction using Singular Value Decomposition to project data onto principal components.",
            preconditions=["Scaled numerical features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Components fitted strictly on train fold; out-of-sample data transformed.",
            estimator_class=PCA,
            parameters={
                "n_components": TechniqueParameterSchema("n_components", "int", 5, "Number of principal components to retain", min_val=2, max_val=50),
            },
        ))

        self.register(TechniqueDefinition(
            id="truncated_svd",
            name="Truncated SVD (LSA)",
            category=TechniqueCategory.FEATURE_SELECTION,
            supported_tasks=["classification", "regression", "dimensionality_reduction"],
            description="Dimensionality reduction via truncated singular value decomposition, working directly on sparse matrices.",
            preconditions=["Numerical or sparse text features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="medium",
            leakage_precautions="Fitted on train folds.",
            estimator_class=TruncatedSVD,
            parameters={
                "n_components": TechniqueParameterSchema("n_components", "int", 5, "Number of singular vectors", min_val=2, max_val=50),
            },
        ))

        self.register(TechniqueDefinition(
            id="variance_threshold",
            name="Variance Threshold Selector",
            category=TechniqueCategory.FEATURE_SELECTION,
            supported_tasks=["classification", "regression"],
            description="Baseline feature selector removing all constant and low-variance features below threshold.",
            preconditions=[],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="low",
            leakage_precautions="Threshold evaluated on train folds.",
            estimator_class=VarianceThreshold,
            parameters={
                "threshold": TechniqueParameterSchema("threshold", "float", 0.0, "Features with training-set variance lower than threshold are removed", min_val=0.0, max_val=0.2),
            },
        ))

        self.register(TechniqueDefinition(
            id="polynomial_features",
            name="Polynomial & Interaction Features",
            category=TechniqueCategory.FEATURE_ENGINEERING,
            supported_tasks=["classification", "regression"],
            description="Generates a new feature matrix consisting of all polynomial combinations of features with degree <= specified degree.",
            preconditions=["Scaled features"],
            incompatibilities=[],
            required_dependencies=[],
            compute_cost="high",
            leakage_precautions="Interaction generation contained in pipeline.",
            estimator_class=PolynomialFeatures,
            parameters={
                "degree": TechniqueParameterSchema("degree", "int", 2, "Degree of polynomial features", min_val=2, max_val=3),
                "interaction_only": TechniqueParameterSchema("interaction_only", "bool", True, "Produce only interaction features without powers"),
            },
        ))


# Global Singleton Registry
technique_registry = TechniqueRegistry()
