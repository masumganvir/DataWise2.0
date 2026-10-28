import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Code2,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Zap,
  BarChart2,
  Brain,
  FileSpreadsheet,
  Binary,
  Lightbulb,
  Terminal,
  Bookmark,
} from 'lucide-react'

// ─── Interfaces ──────────────────────────────────────────────
export interface DocItem {
  id: string
  title: string
  category: 'numpy' | 'pandas' | 'matplotlib' | 'sklearn' | 'automl'
  badge: string
  summary: string
  syntax: string
  exampleCode: string
  explanation: string
  commonMistakes?: string
  datawiseTip?: string
}

// ─── Documentation Knowledge Base ────────────────────────────
export const DOC_ITEMS: DocItem[] = [
  // ─── NUMPY ────────────────────────────────────────────────
  {
    id: 'np-create-arrays',
    title: 'Array Creation & Initialization',
    category: 'numpy',
    badge: 'Core',
    summary: 'Initialize multi-dimensional ndarrays with specific shapes, types, and values.',
    syntax: 'np.array(object), np.zeros(shape), np.ones(shape), np.arange(start, stop, step), np.linspace(start, stop, num)',
    exampleCode: `import numpy as np

# 1D & 2D Arrays
arr_1d = np.array([1, 2, 3, 4, 5], dtype=np.float32)
matrix = np.array([[1.0, 2.0], [3.0, 4.0]])

# Standard initializers
zeros = np.zeros((3, 4))          # 3x4 zero matrix
ones = np.ones((2, 3), dtype=int) # 2x3 ones
identity = np.eye(4)             # 4x4 Identity matrix

# Range generation
grid = np.arange(0, 10, 2)       # array([0, 2, 4, 6, 8])
lin = np.linspace(0.0, 1.0, 5)   # 5 evenly spaced numbers from 0 to 1

print(f"Shape: {matrix.shape}, Dtype: {matrix.dtype}, Dimensions: {matrix.ndim}")`,
    explanation: 'NumPy arrays are homogeneous blocks of memory. Specifying dtype (e.g. float32 vs float64) cuts memory consumption in half, which is critical for large datasets.',
    commonMistakes: 'Using Python lists instead of NumPy arrays causes slow scalar loop execution instead of SIMD vectorized operations.',
    datawiseTip: 'DataWise AI automatically converts raw numeric dataframe columns into contiguous float32 numpy arrays before feeding them into PyTorch neural models.'
  },
  {
    id: 'np-shape-reshape',
    title: 'Reshaping & Dimension Transformations',
    category: 'numpy',
    badge: 'Transform',
    summary: 'Change array dimensionality without copying underlying buffer memory.',
    syntax: 'arr.reshape(new_shape), arr.flatten(), arr.squeeze(), arr[:, np.newaxis], np.transpose(arr)',
    exampleCode: `import numpy as np

# 1D feature array of 12 items
data = np.arange(12)

# Reshape into (4 rows, 3 features)
matrix = data.reshape(4, 3)

# Use -1 to let NumPy infer the dimension automatically
auto_matrix = data.reshape(-1, 2) # Shape: (6, 2)

# Add feature axis for single-sample inference (1, N)
sample = np.array([2.5, 4.1, 0.9])
expanded = sample[np.newaxis, :]  # Shape: (1, 3)

# Transpose
transposed = matrix.T             # Shape: (3, 4)

print("Reshaped Matrix:\n", matrix)
print("Expanded Shape for Model Predict:", expanded.shape)`,
    explanation: 'Reshaping creates a new array view over the same memory buffer, executing in O(1) time. The total number of elements must remain identical.',
    commonMistakes: 'Passing 1D arrays of shape (N,) directly into scikit-learn models. Sklearn estimators require 2D input (N, features), so use .reshape(-1, 1).',
    datawiseTip: 'In our Prediction Agent, single inference payloads are automatically expanded to shape (1, num_features).'
  },
  {
    id: 'np-math-stats',
    title: 'Vectorized Math & Statistical Aggregations',
    category: 'numpy',
    badge: 'Math',
    summary: 'Perform element-wise arithmetic, dot products, and multi-axis statistics at C-speed.',
    syntax: 'np.mean(a, axis), np.std(a, axis), np.median(a), np.sum(a, axis), np.dot(a, b), a @ b',
    exampleCode: `import numpy as np

X = np.array([
    [10.0, 20.0, 30.0],
    [15.0, 25.0, 35.0],
    [12.0, 22.0, 32.0]
])

# Column-wise mean and standard deviation (axis=0 operates down columns)
col_mean = np.mean(X, axis=0)  # array([12.33, 22.33, 32.33])
col_std  = np.std(X, axis=0)   # standard deviation per column

# Standard Z-Score normalization (vectorized broadcasting)
Z = (X - col_mean) / col_std

# Matrix multiplication (@ operator)
weights = np.array([0.2, 0.5, 0.3])
predictions = X @ weights      # Shape: (3,)

print("Column Means:", col_mean)
print("Normalized Features (Z-Score):\n", np.round(Z, 2))
print("Dot Product Predictions:", np.round(predictions, 2))`,
    explanation: 'axis=0 computes statistics across rows (collapsing into one row per column). axis=1 computes statistics across columns (collapsing across rows).',
    commonMistakes: 'Confusing axis=0 (down column rows) and axis=1 (across feature columns).',
    datawiseTip: 'The Preprocessing Agent uses vectorized NumPy operations for ultra-fast outlier clipping with 3-sigma thresholds.'
  },
  {
    id: 'np-mask-filter',
    title: 'Boolean Masking & Conditional Filtering',
    category: 'numpy',
    badge: 'Filtering',
    summary: 'Filter and replace elements using logical conditions without procedural loops.',
    syntax: 'arr[condition], np.where(condition, x, y), np.clip(arr, min, max)',
    exampleCode: `import numpy as np

scores = np.array([85, 42, 91, 55, 78, 33, 98])

# 1. Boolean condition vector
is_passing = scores >= 60

# 2. Extract matching elements
passed_scores = scores[is_passing] # array([85, 91, 78, 98])

# 3. Conditional replacement: np.where(condition, if_true, if_false)
labels = np.where(scores >= 60, "Pass", "Fail")

# 4. Outlier capping / clipping values within range [40, 95]
clipped_scores = np.clip(scores, a_min=40, a_max=95)

print("Passed:", passed_scores)
print("Labels:", labels)
print("Clipped Scores:", clipped_scores)`,
    explanation: 'Boolean masking returns a 1D array of elements meeting the condition. np.where allows inline conditional ternary assignment across entire arrays.',
    commonMistakes: 'Using Python `and` / `or` for element-wise logic. Always use bitwise `&` / `|` with parentheses: `(x > 10) & (x < 50)`.',
    datawiseTip: 'DataWise AI uses np.where and np.clip to sanitize incoming inference payloads against feature drift extremes.'
  },

  // ─── PANDAS ────────────────────────────────────────────────
  {
    id: 'pd-io-loading',
    title: 'Dataset Ingestion (CSV, Parquet, JSON, SQL)',
    category: 'pandas',
    badge: 'IO',
    summary: 'Fast tabular loading with memory optimization and chunking support.',
    syntax: 'pd.read_csv(filepath, parse_dates, usecols), pd.read_parquet(filepath), df.to_parquet(filepath)',
    exampleCode: `import pandas as pd

# Load CSV with explicit column selection and datetime parsing
df = pd.read_csv(
    'customer_churn.csv',
    usecols=['customer_id', 'signup_date', 'monthly_charges', 'churn'],
    parse_dates=['signup_date'],
    low_memory=False
)

# Parquet is 5-10x faster and preserves strict schema types
# df = pd.read_parquet('dataset.parquet')

# Quick inspection
print(f"Loaded {len(df):,} rows and {len(df.columns)} columns")
print(df.info())
print(df.head(3))`,
    explanation: 'Pandas read_csv allows memory tuning with `usecols` (read only needed columns) and `dtype` specifications to reduce RAM consumption on large datasets.',
    commonMistakes: 'Reading unneeded columns from huge CSVs into memory, triggering Out-Of-Memory (OOM) errors.',
    datawiseTip: 'DataWise AI compresses all uploaded datasets into Apache Parquet format on disk for lightning-fast preview and model training.'
  },
  {
    id: 'pd-eda-inspection',
    title: 'Exploratory Data Analysis & Summary Stats',
    category: 'pandas',
    badge: 'Profiling',
    summary: 'Inspect distributions, missing values, column types, and cardinality in seconds.',
    syntax: 'df.describe(), df.info(), df.isnull().sum(), df.nunique(), df[col].value_counts()',
    exampleCode: `import pandas as pd

# Summary statistics for numeric features
summary_num = df.describe().T[['mean', 'std', 'min', '50%', 'max']]

# Check missing values count and percentage
null_counts = df.isnull().sum()
null_percent = (null_counts / len(df)) * 100
missing_report = pd.DataFrame({'Missing': null_counts, 'Percent (%)': null_percent})

# Categorical cardinality
cardinality = df.select_dtypes(include=['object', 'category']).nunique()

# Target class distribution
target_balance = df['churn'].value_counts(normalize=True) * 100

print("Missing Values Summary:\n", missing_report[missing_report['Missing'] > 0])
print("\nTarget Class Distribution (%):\n", target_balance)`,
    explanation: 'df.describe() provides five-number summaries and standard deviations. value_counts(normalize=True) immediately exposes class imbalance.',
    commonMistakes: 'Relying only on df.head() without checking df.isnull().sum() or data types.',
    datawiseTip: 'The automated EDA Agent runs these exact profiling statistics to build your live interactive EDA report and correlation heatmaps.'
  },
  {
    id: 'pd-cleaning-impute',
    title: 'Data Cleaning, Null Handling & Duplicates',
    category: 'pandas',
    badge: 'Cleaning',
    summary: 'Drop, impute, and transform missing values and duplicate rows cleanly.',
    syntax: 'df.dropna(), df.fillna(value), df.drop_duplicates(), df[col].astype(dtype)',
    exampleCode: `import pandas as pd

# Remove duplicate customer records based on ID
df = df.drop_duplicates(subset=['customer_id'], keep='last')

# Numeric imputation with median
median_charges = df['monthly_charges'].median()
df['monthly_charges'] = df['monthly_charges'].fillna(median_charges)

# Categorical imputation with mode or sentinel token
df['payment_method'] = df['payment_method'].fillna('Unknown')

# Clean string columns (trim whitespace, lowercasing)
df['contract_type'] = df['contract_type'].str.strip().str.lower()

# Convert high-cardinality objects to category type for 80% RAM savings
df['state'] = df['state'].astype('category')`,
    explanation: 'Median imputation is preferred over mean for skewed distributions because median is robust against extreme outliers.',
    commonMistakes: 'Computing imputation values on the combined dataset instead of only the training split, leading to data leakage.',
    datawiseTip: 'DataWise AI isolates training split statistics before applying imputers to guarantee zero data leakage.'
  },
  {
    id: 'pd-groupby-agg',
    title: 'GroupBy Aggregation & Feature Engineering',
    category: 'pandas',
    badge: 'Feature Eng',
    summary: 'Compute cohort statistics, rolling windows, and aggregated customer features.',
    syntax: 'df.groupby(keys).agg(spec), df.pivot_table(), pd.crosstab()',
    exampleCode: `import pandas as pd

# Multi-metric cohort aggregation
cohort_stats = df.groupby('contract_type').agg(
    total_customers=('customer_id', 'count'),
    avg_monthly_charges=('monthly_charges', 'mean'),
    median_tenure=('tenure_months', 'median'),
    churn_rate=('churn', 'mean')
).reset_index()

# Group-level feature engineering: difference from group mean
group_mean = df.groupby('contract_type')['monthly_charges'].transform('mean')
df['charges_vs_contract_mean'] = df['monthly_charges'] - group_mean

# Pivot table: Churn rate by contract and payment method
pivot = df.pivot_table(
    index='contract_type',
    columns='payment_method',
    values='churn',
    aggfunc='mean'
)

print(cohort_stats)
print("\nPivot Table (Churn Rate):\n", pivot)`,
    explanation: '`transform()` calculates group-level metrics and broadcasts them back to match the original dataframe index, making it ideal for feature creation.',
    commonMistakes: 'Using Python for-loops to iterate over rows with `df.iterrows()`. Always use vectorized `.groupby().agg()` or `.transform()`.',
    datawiseTip: 'Our Feature Engineering Agent tests candidate interaction features generated from group statistics and keeps those that boost mutual information.'
  },

  // ─── MATPLOTLIB & SEABORN ─────────────────────────────────
  {
    id: 'plt-figure-subplots',
    title: 'Figure & Multi-Panel Subplots Setup',
    category: 'matplotlib',
    badge: 'Setup',
    summary: 'Object-oriented plotting architecture with figures, subplots, and dark themes.',
    syntax: 'fig, ax = plt.subplots(nrows, ncols, figsize=(w, h)), plt.tight_layout(), plt.savefig()',
    exampleCode: `import matplotlib.pyplot as plt
import numpy as np

# Set dark modern aesthetic
plt.style.use('dark_background')
fig, axes = plt.subplots(nrows=1, ncols=2, figsize=(14, 5), dpi=100)

x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Panel 1: Sine wave
axes[0].plot(x, y1, color='#6366f1', linewidth=2.5, label='Sine wave')
axes[0].set_title('Signal A (Frequency)', fontsize=12, fontweight='bold', pad=10)
axes[0].set_xlabel('Time (s)')
axes[0].set_ylabel('Amplitude')
axes[0].grid(True, linestyle='--', alpha=0.3)
axes[0].legend()

# Panel 2: Cosine wave
axes[1].plot(x, y2, color='#34d399', linewidth=2.5, label='Cosine wave')
axes[1].set_title('Signal B (Phase Shift)', fontsize=12, fontweight='bold', pad=10)
axes[1].set_xlabel('Time (s)')
axes[1].grid(True, linestyle='--', alpha=0.3)
axes[1].legend()

plt.tight_layout()
# plt.savefig('signals.png', dpi=300, bbox_inches='tight')
plt.show()`,
    explanation: 'The object-oriented API (`fig, ax = plt.subplots()`) is standard for production. Each `ax` represents an independent subplot canvas.',
    commonMistakes: 'Mixing stateful `plt.plot()` calls with object-oriented `ax.plot()`, leading to unpredictable multi-panel layouts.',
    datawiseTip: 'All high-resolution visual reports generated by DataWise AI use high-DPI subplots saved directly into your downloadable bundle.'
  },
  {
    id: 'plt-correlation-heatmap',
    title: 'Correlation Matrix & Heatmap Visualization',
    category: 'matplotlib',
    badge: 'Visual EDA',
    summary: 'Visualize multicollinearity and feature associations using Seaborn and Matplotlib.',
    syntax: 'sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1)',
    exampleCode: `import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

# Calculate Pearson correlation matrix
corr = df.select_dtypes(include=['number']).corr()

plt.figure(figsize=(10, 8), dpi=120)
sns.set_theme(style='dark')

# Generate mask for upper triangle to eliminate duplicate info
mask = np.triu(np.ones_like(corr, dtype=bool))

sns.heatmap(
    corr,
    mask=mask,
    annot=True,
    fmt='.2f',
    cmap='vlag',
    vmin=-1.0,
    vmax=1.0,
    cbar_kws={'label': 'Pearson Correlation (r)'},
    linewidths=0.5
)

plt.title('Feature Correlation Matrix (Lower Triangle)', fontsize=14, fontweight='bold', pad=15)
plt.tight_layout()
plt.show()`,
    explanation: 'Masking the upper triangle makes large matrices easier to read. Look for features with |r| > 0.85 indicating multicollinearity.',
    commonMistakes: 'Including un-encoded categorical columns or ID columns which skews correlation calculations.',
    datawiseTip: 'The Multicollinearity & Leakage Agent automatically detects correlations > 0.90 and recommends pruning redundant features.'
  },
  {
    id: 'plt-model-evaluation',
    title: 'Model Evaluation Curves (ROC, PR & Confusion Matrix)',
    category: 'matplotlib',
    badge: 'Metrics',
    summary: 'Plot ROC-AUC, Precision-Recall curves, and annotated Confusion Matrix.',
    syntax: 'RocCurveDisplay.from_estimator(clf, X_test, y_test), ConfusionMatrixDisplay.from_predictions()',
    exampleCode: `import matplotlib.pyplot as plt
from sklearn.metrics import RocCurveDisplay, PrecisionRecallDisplay, ConfusionMatrixDisplay

fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# 1. Confusion Matrix
ConfusionMatrixDisplay.from_predictions(
    y_test, y_pred,
    display_labels=['Retained', 'Churned'],
    cmap='Blues',
    ax=axes[0],
    colorbar=False
)
axes[0].set_title('Confusion Matrix', fontweight='bold')

# 2. ROC Curve
RocCurveDisplay.from_estimator(
    champion_model, X_test, y_test,
    ax=axes[1],
    color='#6366f1',
    name='XGBoost Champion'
)
axes[1].plot([0, 1], [0, 1], 'r--', label='Chance (AUC=0.50)')
axes[1].set_title('ROC Curve', fontweight='bold')
axes[1].legend()

# 3. Precision-Recall Curve (Crucial for Imbalanced Data)
PrecisionRecallDisplay.from_estimator(
    champion_model, X_test, y_test,
    ax=axes[2],
    color='#34d399',
    name='Precision-Recall'
)
axes[2].set_title('Precision-Recall Curve', fontweight='bold')

plt.tight_layout()
plt.show()`,
    explanation: 'On imbalanced datasets (e.g. 95% negative, 5% positive), the Precision-Recall curve is vastly more informative than ROC-AUC.',
    commonMistakes: 'Evaluating only accuracy on imbalanced datasets. A model predicting all zeros can achieve 95% accuracy while finding zero positives.',
    datawiseTip: 'DataWise AI computes both ROC-AUC and PR-AUC and selects the champion model based on the primary metric defined in your project objective.'
  },

  // ─── SCIKIT-LEARN ──────────────────────────────────────────
  {
    id: 'skl-preprocessing-pipeline',
    title: 'ColumnTransformer & Preprocessing Pipelines',
    category: 'sklearn',
    badge: 'Pipeline',
    summary: 'Clean numerical and categorical feature branches simultaneously without leakage.',
    syntax: 'ColumnTransformer(transformers=[...]), Pipeline(steps=[...])',
    exampleCode: `import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier

num_features = ['tenure_months', 'monthly_charges', 'total_charges']
cat_features = ['contract_type', 'payment_method', 'internet_service']

# Numerical branch: Impute median then standard scale
num_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

# Categorical branch: Impute mode then One-Hot encode
cat_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# Combine branches
preprocessor = ColumnTransformer(transformers=[
    ('num', num_transformer, num_features),
    ('cat', cat_transformer, cat_features)
])

# Full reproducible pipeline with classifier
clf_pipeline = Pipeline(steps=[
    ('prep', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Fit on train, predict on test with ONE line:
clf_pipeline.fit(X_train, y_train)
y_pred = clf_pipeline.predict(X_test)`,
    explanation: 'Pipelines wrap preprocessing and modeling into a single object. Calling `.fit()` fits transformers only on training data, preventing leakage.',
    commonMistakes: 'Calling `.fit_transform()` on the test dataset. The test dataset must ONLY be passed to `.transform()`, which Pipeline handles automatically.',
    datawiseTip: 'The exported `pipeline.joblib` artifact in DataWise AI contains the complete ColumnTransformer and trained model in a single serializable bundle.'
  },
  {
    id: 'skl-split-cv',
    title: 'Train-Test Splitting & Stratified Cross-Validation',
    category: 'sklearn',
    badge: 'Validation',
    summary: 'Split datasets with class stratification and perform K-Fold validation.',
    syntax: 'train_test_split(X, y, test_size, stratify), StratifiedKFold(n_splits=5), cross_val_score()',
    exampleCode: `from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import GradientBoostingClassifier

# 1. Stratified 80/20 train/test split (preserves target ratio)
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.20,
    random_state=42,
    stratify=y  # Essential for classification!
)

# 2. 5-Fold Stratified Cross Validation
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
model = GradientBoostingClassifier(random_state=42)

scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='f1_macro')

print(f"5-Fold F1 Scores: {scores.round(3)}")
print(f"Mean CV Score: {scores.mean():.4f} (+/- {scores.std():.4f})")`,
    explanation: 'Stratification guarantees that both training and testing partitions have identical class proportions, avoiding empty class folds.',
    commonMistakes: 'Not setting `shuffle=True` when creating KFold, which can bias folds if data is sorted by target.',
    datawiseTip: 'DataWise AI evaluates all 5 candidate algorithms using 5-fold Stratified CV before picking the Champion model.'
  },
  {
    id: 'skl-optuna-tuning',
    title: 'Hyperparameter Optimization (Optuna & RandomizedSearch)',
    category: 'sklearn',
    badge: 'AutoML',
    summary: 'Tune hyperparameters with Bayesian Optimization and tree-structured Parzen estimators.',
    syntax: 'RandomizedSearchCV(estimator, param_distributions), optuna.create_study()',
    exampleCode: `import optuna
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

def objective(trial):
    # Suggest hyperparameter values
    n_estimators = trial.suggest_int('n_estimators', 50, 300, step=25)
    max_depth = trial.suggest_int('max_depth', 3, 20)
    min_samples_split = trial.suggest_int('min_samples_split', 2, 10)
    max_features = trial.suggest_categorical('max_features', ['sqrt', 'log2'])

    clf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        max_features=max_features,
        random_state=42,
        n_jobs=-1
    )

    # Return mean cross-validation score
    scores = cross_val_score(clf, X_train_prep, y_train, cv=3, scoring='roc_auc')
    return scores.mean()

# Run Bayesian Study
study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=30, timeout=120)

print("Best ROC-AUC:", study.best_value)
print("Best Hyperparameters:\n", study.best_params)`,
    explanation: 'Bayesian optimization builds a probabilistic model of the objective function, finding higher-scoring hyperparameters in fewer iterations than grid search.',
    commonMistakes: 'Running exhaustive GridSearchCV with large parameter grids, which causes exponential time explosion.',
    datawiseTip: 'The AutoML Agent runs Optuna Bayesian HPO with early stopping to tune the top 2 candidate models.'
  },

  // ─── AUTOPLATFORM ──────────────────────────────────────────
  {
    id: 'dw-agentic-workflow',
    title: 'DataWise AI Autonomous Agent Orchestration',
    category: 'automl',
    badge: 'Platform',
    summary: 'How DataWise AI coordinates EDA, Preprocessing, Feature Selection, and Model Tuning.',
    syntax: 'LangGraph StateGraph + Gemini 1.5 Pro + Scikit-Learn Executor',
    exampleCode: `# Conceptual DataWise AI Graph Workflow
from langgraph.graph import StateGraph, END

# Workflow Nodes executed by DataWise AI
workflow = StateGraph(ProjectWorkflowState)

workflow.add_node("dataset_profiler", run_eda_agent)
workflow.add_node("feature_cleaner",  run_preprocessing_agent)
workflow.add_node("feature_engineer", run_feature_engineering_agent)
workflow.add_node("model_trainer",    run_automl_training_agent)
workflow.add_node("model_evaluator",  run_evaluation_agent)
workflow.add_node("report_publisher", run_report_and_notebook_agent)

# Connected autonomous pipeline
workflow.add_edge("dataset_profiler", "feature_cleaner")
workflow.add_edge("feature_cleaner", "feature_engineer")
workflow.add_edge("feature_engineer", "model_trainer")
workflow.add_edge("model_trainer", "model_evaluator")
workflow.add_edge("model_evaluator", "report_publisher")
workflow.add_edge("report_publisher", END)`,
    explanation: 'DataWise AI coordinates multiple specialized agents. Each agent observes the dataset, applies reproducible Python transformations, and records audit trails.',
    commonMistakes: 'Treating AI as a black box without reproducible code. DataWise AI always generates the full clean Jupyter notebook with raw Pandas and Scikit-Learn code.',
    datawiseTip: 'You can download the generated .ipynb notebook from any project run and run it locally in VS Code or JupyterLab.'
  }
]

// ─── Main Documentation Hub Component ────────────────────────
export function DocumentationHub() {
  const [activeTab, setActiveTab] = useState<'all' | 'numpy' | 'pandas' | 'matplotlib' | 'sklearn' | 'automl'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<DocItem | null>(null)

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredDocs = useMemo(() => {
    return DOC_ITEMS.filter((item) => {
      const matchesTab = activeTab === 'all' || item.category === activeTab
      if (!matchesTab) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.syntax.toLowerCase().includes(q) ||
        item.explanation.toLowerCase().includes(q) ||
        item.exampleCode.toLowerCase().includes(q)
      )
    })
  }, [activeTab, searchQuery])

  const CATEGORIES = [
    { key: 'all', label: 'All Docs', icon: BookOpen, count: DOC_ITEMS.length, color: '#818cf8' },
    { key: 'numpy', label: 'NumPy', icon: Binary, count: DOC_ITEMS.filter(d => d.category === 'numpy').length, color: '#38bdf8' },
    { key: 'pandas', label: 'Pandas', icon: FileSpreadsheet, count: DOC_ITEMS.filter(d => d.category === 'pandas').length, color: '#34d399' },
    { key: 'matplotlib', label: 'Matplotlib & Seaborn', icon: BarChart2, count: DOC_ITEMS.filter(d => d.category === 'matplotlib').length, color: '#f472b6' },
    { key: 'sklearn', label: 'Scikit-Learn', icon: Brain, count: DOC_ITEMS.filter(d => d.category === 'sklearn').length, color: '#fb923c' },
    { key: 'automl', label: 'DataWise AI Agents', icon: Sparkles, count: DOC_ITEMS.filter(d => d.category === 'automl').length, color: '#a78bfa' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 50%, rgba(6,182,212,0.06) 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '16px',
          padding: '32px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', fontSize: '0.75rem', color: '#a5b4fc', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
            <BookOpen size={13} /> Official Python Data Science & ML Knowledge Base
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.03em', color: '#f8fafc' }}>
            Documentation & Interactive Learning Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '640px', lineHeight: 1.6 }}>
            Master NumPy, Pandas, Matplotlib, and Scikit-Learn with production-ready recipes, syntax cheatsheets, and tips directly used by DataWise AI agents.
          </p>
        </div>

        {/* Live Search Input */}
        <div style={{ position: 'relative', minWidth: '320px', flex: '1', maxWidth: '440px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search NumPy, Pandas, Matplotlib, Scikit-Learn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#f8fafc',
              fontSize: '0.9rem',
              outline: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '10px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = activeTab === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: isActive ? `1px solid ${cat.color}` : '1px solid var(--border-subtle)',
                background: isActive ? `${cat.color}22` : 'rgba(15, 23, 42, 0.5)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} style={{ color: cat.color }} />
              <span>{cat.label}</span>
              <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', color: cat.color, fontFamily: 'var(--font-mono)' }}>
                {cat.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Docs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(620px, 1fr))', gap: '20px' }}>
        {filteredDocs.map((doc) => {
          const isCopied = copiedId === doc.id
          const catMeta = CATEGORIES.find(c => c.key === doc.category)
          const accentColor = catMeta?.color || '#818cf8'

          return (
            <div
              key={doc.id}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${accentColor}55`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: `${accentColor}25`, color: accentColor, fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      {catMeta?.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      {doc.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                    {doc.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleCopy(doc.id, doc.exampleCode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: isCopied ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.06)',
                    border: isCopied ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                    color: isCopied ? '#34d399' : '#cbd5e1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                  title="Copy working code"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Summary */}
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                {doc.summary}
              </p>

              {/* Syntax Tag */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.78rem', color: '#c7d2fe', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                <span style={{ color: '#64748b' }}>Signature: </span>{doc.syntax}
              </div>

              {/* Code Box */}
              <div style={{ position: 'relative' }}>
                <pre
                  style={{
                    margin: 0,
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#090d16',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e2e8f0',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    fontFamily: "'JetBrains Mono', monospace",
                    overflowX: 'auto',
                    maxHeight: '260px',
                  }}
                >
                  <code>{doc.exampleCode}</code>
                </pre>
              </div>

              {/* Explanation & DataWise Tip */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', lineHeight: 1.5, color: '#94a3b8' }}>
                <div>
                  <strong style={{ color: '#cbd5e1' }}>Why it matters: </strong>
                  {doc.explanation}
                </div>
                {doc.commonMistakes && (
                  <div style={{ color: '#f87171' }}>
                    <strong>Common Gotcha: </strong>
                    {doc.commonMistakes}
                  </div>
                )}
                {doc.datawiseTip && (
                  <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', padding: '8px 12px', color: '#c7d2fe', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Lightbulb size={16} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>DataWise AI Tip: </strong>{doc.datawiseTip}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredDocs.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(15,23,42,0.5)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
          <Search size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#f8fafc', margin: '0 0 6px 0' }}>No documentation found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            No methods or guides matched "{searchQuery}". Try searching for terms like <em>array, groupby, roc, heatmap, optuna</em>.
          </p>
        </div>
      )}
    </div>
  )
}

export default DocumentationHub
