"""
DataWise AI — PyTorch Tabular Deep Learning Estimators

Scikit-Learn compatible PyTorch estimators for tabular classification and regression:
- Multi-Layer Perceptron (MLP) architecture
- Batch Normalization & Dropout regularization
- AdamW optimizer with CosineAnnealingLR / ReduceLROnPlateau
- Early Stopping with patience and best-weight checkpointing
- Full scikit-learn API: fit(X, y), predict(X), predict_proba(X), get_params(), set_params()
"""

from __future__ import annotations

import copy
import time
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from loguru import logger
from sklearn.base import BaseEstimator, ClassifierMixin, RegressorMixin

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


class _TabularMLPNet(nn.Module if HAS_TORCH else object):
    def __init__(
        self,
        input_dim: int,
        output_dim: int,
        hidden_dims: List[int] = [64, 32],
        dropout_rate: float = 0.2,
        use_batch_norm: bool = True,
        is_classification: bool = True,
    ):
        super().__init__()
        layers = []
        in_d = input_dim

        for h_dim in hidden_dims:
            layers.append(nn.Linear(in_d, h_dim))
            if use_batch_norm:
                layers.append(nn.BatchNorm1d(h_dim))
            layers.append(nn.ReLU())
            if dropout_rate > 0.0:
                layers.append(nn.Dropout(dropout_rate))
            in_d = h_dim

        layers.append(nn.Linear(in_d, output_dim))
        self.network = nn.Sequential(*layers)
        self.is_classification = is_classification

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


class PyTorchTabularClassifier(BaseEstimator, ClassifierMixin):
    """Deep Learning Multi-Layer Perceptron for tabular classification."""

    def __init__(
        self,
        hidden_dims: str = "64,32",
        dropout_rate: float = 0.2,
        learning_rate: float = 0.003,
        weight_decay: float = 1e-4,
        batch_size: int = 32,
        epochs: int = 40,
        patience: int = 5,
        use_batch_norm: bool = True,
        random_state: int = 42,
    ):
        self.hidden_dims = hidden_dims
        self.dropout_rate = dropout_rate
        self.learning_rate = learning_rate
        self.weight_decay = weight_decay
        self.batch_size = batch_size
        self.epochs = epochs
        self.patience = patience
        self.use_batch_norm = use_batch_norm
        self.random_state = random_state
        self.model_: Optional[Any] = None
        self.classes_: Optional[np.ndarray] = None
        self.input_dim_: int = 0

    def _parse_hidden_dims(self) -> List[int]:
        if isinstance(self.hidden_dims, list):
            return self.hidden_dims
        return [int(x.strip()) for x in str(self.hidden_dims).split(",") if x.strip()]

    def fit(self, X: Any, y: Any):
        if not HAS_TORCH:
            raise RuntimeError("PyTorch is required to train PyTorchTabularClassifier.")

        torch.manual_seed(self.random_state)
        np.random.seed(self.random_state)

        # Convert to numpy float32
        if isinstance(X, pd.DataFrame):
            X_arr = X.values.astype(np.float32)
        else:
            X_arr = np.asarray(X, dtype=np.float32)

        if isinstance(y, pd.Series):
            y_arr = y.values
        else:
            y_arr = np.asarray(y)

        # Encode classes
        self.classes_, y_encoded = np.unique(y_arr, return_inverse=True)
        num_classes = len(self.classes_)
        self.input_dim_ = X_arr.shape[1]

        # Device selection
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Network construction
        hidden_list = self._parse_hidden_dims()
        self.model_ = _TabularMLPNet(
            input_dim=self.input_dim_,
            output_dim=num_classes,
            hidden_dims=hidden_list,
            dropout_rate=self.dropout_rate,
            use_batch_norm=self.use_batch_norm and len(X_arr) > 1,
            is_classification=True,
        ).to(device)

        # DataLoader
        dataset = TensorDataset(torch.from_numpy(X_arr), torch.from_numpy(y_encoded).long())
        loader = DataLoader(dataset, batch_size=min(self.batch_size, len(X_arr)), shuffle=True)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.AdamW(self.model_.parameters(), lr=self.learning_rate, weight_decay=self.weight_decay)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=self.epochs)

        best_loss = float("inf")
        best_weights = None
        no_improve = 0

        self.model_.train()
        for epoch in range(self.epochs):
            total_loss = 0.0
            for bx, by in loader:
                bx, by = bx.to(device), by.to(device)
                optimizer.zero_grad()
                out = self.model_(bx)
                loss = criterion(out, by)
                loss.backward()
                optimizer.step()
                total_loss += loss.item() * len(bx)

            avg_loss = total_loss / max(1, len(X_arr))
            scheduler.step()

            # Early stopping check
            if avg_loss < best_loss - 1e-4:
                best_loss = avg_loss
                best_weights = copy.deepcopy(self.model_.state_dict())
                no_improve = 0
            else:
                no_improve += 1
                if no_improve >= self.patience:
                    break

        if best_weights is not None:
            self.model_.load_state_dict(best_weights)

        self.model_.eval()
        return self

    def predict_proba(self, X: Any) -> np.ndarray:
        if not HAS_TORCH or self.model_ is None:
            raise RuntimeError("Model is not fitted.")

        if isinstance(X, pd.DataFrame):
            X_arr = X.values.astype(np.float32)
        else:
            X_arr = np.asarray(X, dtype=np.float32)

        device = next(self.model_.parameters()).device
        self.model_.eval()
        with torch.no_grad():
            t_x = torch.from_numpy(X_arr).to(device)
            logits = self.model_(t_x)
            probs = torch.softmax(logits, dim=1).cpu().numpy()
        return probs

    def predict(self, X: Any) -> np.ndarray:
        probs = self.predict_proba(X)
        pred_idx = np.argmax(probs, axis=1)
        return self.classes_[pred_idx]


class PyTorchTabularRegressor(BaseEstimator, RegressorMixin):
    """Deep Learning Multi-Layer Perceptron for tabular regression."""

    def __init__(
        self,
        hidden_dims: str = "64,32",
        dropout_rate: float = 0.1,
        learning_rate: float = 0.005,
        weight_decay: float = 1e-4,
        batch_size: int = 32,
        epochs: int = 40,
        patience: int = 5,
        use_batch_norm: bool = True,
        random_state: int = 42,
    ):
        self.hidden_dims = hidden_dims
        self.dropout_rate = dropout_rate
        self.learning_rate = learning_rate
        self.weight_decay = weight_decay
        self.batch_size = batch_size
        self.epochs = epochs
        self.patience = patience
        self.use_batch_norm = use_batch_norm
        self.random_state = random_state
        self.model_: Optional[Any] = None
        self.input_dim_: int = 0

    def _parse_hidden_dims(self) -> List[int]:
        if isinstance(self.hidden_dims, list):
            return self.hidden_dims
        return [int(x.strip()) for x in str(self.hidden_dims).split(",") if x.strip()]

    def fit(self, X: Any, y: Any):
        if not HAS_TORCH:
            raise RuntimeError("PyTorch is required to train PyTorchTabularRegressor.")

        torch.manual_seed(self.random_state)
        np.random.seed(self.random_state)

        if isinstance(X, pd.DataFrame):
            X_arr = X.values.astype(np.float32)
        else:
            X_arr = np.asarray(X, dtype=np.float32)

        if isinstance(y, (pd.Series, pd.DataFrame)):
            y_arr = y.values.astype(np.float32).reshape(-1, 1)
        else:
            y_arr = np.asarray(y, dtype=np.float32).reshape(-1, 1)

        self.input_dim_ = X_arr.shape[1]
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        hidden_list = self._parse_hidden_dims()
        self.model_ = _TabularMLPNet(
            input_dim=self.input_dim_,
            output_dim=1,
            hidden_dims=hidden_list,
            dropout_rate=self.dropout_rate,
            use_batch_norm=self.use_batch_norm and len(X_arr) > 1,
            is_classification=False,
        ).to(device)

        dataset = TensorDataset(torch.from_numpy(X_arr), torch.from_numpy(y_arr))
        loader = DataLoader(dataset, batch_size=min(self.batch_size, len(X_arr)), shuffle=True)

        criterion = nn.MSELoss()
        optimizer = optim.AdamW(self.model_.parameters(), lr=self.learning_rate, weight_decay=self.weight_decay)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=self.epochs)

        best_loss = float("inf")
        best_weights = None
        no_improve = 0

        self.model_.train()
        for epoch in range(self.epochs):
            total_loss = 0.0
            for bx, by in loader:
                bx, by = bx.to(device), by.to(device)
                optimizer.zero_grad()
                out = self.model_(bx)
                loss = criterion(out, by)
                loss.backward()
                optimizer.step()
                total_loss += loss.item() * len(bx)

            avg_loss = total_loss / max(1, len(X_arr))
            scheduler.step()

            if avg_loss < best_loss - 1e-4:
                best_loss = avg_loss
                best_weights = copy.deepcopy(self.model_.state_dict())
                no_improve = 0
            else:
                no_improve += 1
                if no_improve >= self.patience:
                    break

        if best_weights is not None:
            self.model_.load_state_dict(best_weights)

        self.model_.eval()
        return self

    def predict(self, X: Any) -> np.ndarray:
        if not HAS_TORCH or self.model_ is None:
            raise RuntimeError("Model is not fitted.")

        if isinstance(X, pd.DataFrame):
            X_arr = X.values.astype(np.float32)
        else:
            X_arr = np.asarray(X, dtype=np.float32)

        device = next(self.model_.parameters()).device
        self.model_.eval()
        with torch.no_grad():
            t_x = torch.from_numpy(X_arr).to(device)
            out = self.model_(t_x).cpu().numpy().flatten()
        return out
