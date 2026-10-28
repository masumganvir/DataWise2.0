"""
Comprehensive Acceptance Test Suite for Advanced EDA + Visualization + PCA Subsystem
Validates real state output shapes from all 10 dataset modalities.
"""

import os
import sys
import time
import tempfile
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath("."))

from backend.agents.eda.eda_orchestrator import EDAOrchestrator

results_summary = []

def record(name, status, details=""):
    results_summary.append({"test": name, "status": status, "details": details})
    print(f"[{status}] {name} - {details}")


# ── TEST 1: Small Numerical Dataset ─────────────────────────────────────────
try:
    out_dir1 = tempfile.mkdtemp(prefix="eda_small_")
    df = pd.DataFrame({"a": np.random.randn(50), "b": np.random.randn(50), "target": np.random.randn(50)})
    orch = EDAOrchestrator(output_dir=out_dir1)
    res = orch.run(df, target_column="target", project_id="p1", run_id="r1")
    n_viz = len(res.get("visualization_results", []))
    # eda_summary.json is written to parent of output_dir (which is visualizations/)
    parent_dir = os.path.dirname(out_dir1)
    eda_summary = os.path.join(parent_dir, "eda_summary.json")
    eda_summary_in_dir = os.path.join(out_dir1, "eda_summary.json")
    assert n_viz > 0, f"No visualizations: {n_viz}"
    assert os.path.exists(eda_summary) or os.path.exists(eda_summary_in_dir), "eda_summary.json missing in both dir and parent"
    record("1. Small Numerical Dataset", "PASS", f"{n_viz} plots, eda_summary.json present")
except Exception as e:
    record("1. Small Numerical Dataset", "FAIL", str(e))


# ── TEST 2: Mixed Numerical & Categorical Dataset ────────────────────────────
try:
    out_dir2 = tempfile.mkdtemp(prefix="eda_mixed_")
    df = pd.DataFrame({
        "age": np.random.randint(18, 70, 200).astype(float),
        "income": np.random.exponential(50000, 200),
        "gender": np.random.choice(["M","F"], 200),
        "dept": np.random.choice(["Sales","Eng","HR"], 200),
        "promoted": np.random.choice([0,1], p=[0.8,0.2], size=200)
    })
    orch = EDAOrchestrator(output_dir=out_dir2)
    res = orch.run(df, target_column="promoted", project_id="p2", run_id="r2")
    cat_cols = res.get("categorical_columns", [])
    num_cols = res.get("numeric_columns", [])
    assert len(cat_cols) >= 2, f"Expected ≥2 cat cols, got {cat_cols}"
    assert len(num_cols) >= 2, f"Expected ≥2 num cols, got {num_cols}"
    record("2. Mixed Numerical/Categorical Dataset", "PASS", f"cat={cat_cols}, num={num_cols}")
except Exception as e:
    record("2. Mixed Numerical/Categorical Dataset", "FAIL", str(e))


# ── TEST 3: Highly Skewed Dataset ────────────────────────────────────────────
try:
    out_dir3 = tempfile.mkdtemp(prefix="eda_skew_")
    df = pd.DataFrame({
        "skewed": np.random.lognormal(2.0, 2.5, 300),
        "normal": np.random.normal(0, 1, 300),
        "target": np.random.normal(10, 2, 300)
    })
    orch = EDAOrchestrator(output_dir=out_dir3)
    res = orch.run(df, target_column="target", project_id="p3", run_id="r3")
    dist_sum = res.get("distribution_summary", {})
    skew_entry = dist_sum.get("skewed", {})
    skew_val = skew_entry.get("skewness", 0)
    assert abs(skew_val) > 1.0, f"Expected |skew|>1 for lognormal, got {skew_val}"
    record("3. Highly Skewed Dataset", "PASS", f"skewed_feature skewness={skew_val:.2f}, recommended: {skew_entry.get('recommended_transformation','')}")
except Exception as e:
    record("3. Highly Skewed Dataset", "FAIL", str(e))


# ── TEST 4: Missing Values Dataset ───────────────────────────────────────────
try:
    out_dir4 = tempfile.mkdtemp(prefix="eda_missing_")
    df = pd.DataFrame({
        "feat1": [np.nan if i % 5 == 0 else float(i) for i in range(100)],
        "feat2": [np.nan if i % 3 == 0 else float(i*2) for i in range(100)],
        "cat1":  [np.nan if i % 7 == 0 else ("A" if i%2==0 else "B") for i in range(100)],
        "target": np.random.randint(0, 2, 100)
    })
    orch = EDAOrchestrator(output_dir=out_dir4)
    res = orch.run(df, target_column="target", project_id="p4", run_id="r4")
    quality = res.get("data_quality_report", {})
    # Data quality report contains missing column info
    missing_cols = quality.get("columns_with_missing", {})
    feat1_miss = missing_cols.get("feat1", {}).get("count", -1)
    assert feat1_miss == 20, f"Expected 20 missing in feat1, got {feat1_miss}"
    record("4. Missing Values Dataset", "PASS", f"feat1 missing_count={feat1_miss}, data_quality_score={quality.get('quality_score')}")
except Exception as e:
    record("4. Missing Values Dataset", "FAIL", str(e))


# ── TEST 5&6: Fraud/Extreme Outlier Dataset (Non-Destructive Policy) ─────────
try:
    out_dir5 = tempfile.mkdtemp(prefix="eda_fraud_")
    n_normal, n_fraud = 950, 50
    df = pd.DataFrame({
        "amount": np.concatenate([np.random.normal(50, 15, n_normal), np.random.normal(2500, 500, n_fraud)]),
        "v1": np.random.normal(0,1,1000),
        "v2": np.random.normal(0,1,1000),
        "is_fraud": [0]*n_normal + [1]*n_fraud
    })
    orch = EDAOrchestrator(output_dir=out_dir5)
    res = orch.run(df, target_column="is_fraud", project_id="p5", run_id="r5")
    outlier_sum = res.get("outlier_summary", {})
    decisions_list = outlier_sum.get("decisions", [])
    # Find 'amount' column decision in list
    amount_decision = next((d for d in decisions_list if d.get("column") == "amount"), None)
    rec = amount_decision.get("recommended_action") if amount_decision else "NOT_FOUND"
    assert rec != "REMOVE", f"Non-destructive policy violated: action={rec}"
    record("5&6. Extreme Outliers/Imbalanced", "PASS", f"amount outlier action='{rec}' (non-destructive policy respected)")
except Exception as e:
    record("5&6. Extreme Outliers/Imbalanced", "FAIL", str(e))


# ── TEST 7: High-Dimensional Dataset (PCA) ───────────────────────────────────
try:
    out_dir7 = tempfile.mkdtemp(prefix="eda_high_")
    cols = [f"gene_{i}" for i in range(30)]
    df = pd.DataFrame(np.random.randn(200, 30), columns=cols)
    df["response"] = np.random.randint(0, 2, 200)
    orch = EDAOrchestrator(output_dir=out_dir7)
    res = orch.run(df, target_column="response", project_id="p7", run_id="r7")
    pca_res = res.get("pca_results", {})
    assert pca_res.get("is_appropriate") is True, f"PCA not marked appropriate: {pca_res}"
    n95 = pca_res.get("threshold_components", {}).get("95_percent")
    assert n95 is not None, f"95% variance threshold missing: {pca_res.get('threshold_components')}"
    record("7. High-Dimensional Dataset (PCA)", "PASS", f"PCA appropriate=True, 95%_variance_components={n95}")
except Exception as e:
    record("7. High-Dimensional Dataset (PCA)", "FAIL", str(e))


# ── TEST 8: Datetime Dataset ─────────────────────────────────────────────────
try:
    out_dir8 = tempfile.mkdtemp(prefix="eda_time_")
    dates = pd.date_range("2024-01-01", periods=150, freq="D")
    df = pd.DataFrame({
        "timestamp": dates,
        "traffic": np.random.poisson(500, 150) + np.arange(150),
        "cat": np.random.choice(["A","B"], 150)
    })
    orch = EDAOrchestrator(output_dir=out_dir8)
    res = orch.run(df, target_column="traffic", project_id="p8", run_id="r8")
    dt_cols = res.get("datetime_columns", [])
    assert len(dt_cols) >= 1, f"No datetime columns detected: {dt_cols}"
    record("8. Datetime Columns Dataset", "PASS", f"Detected datetime columns: {dt_cols}")
except Exception as e:
    record("8. Datetime Columns Dataset", "FAIL", str(e))


# ── TEST 9: Highly Correlated Features (Multicollinearity) ───────────────────
try:
    out_dir9 = tempfile.mkdtemp(prefix="eda_corr_")
    x = np.random.randn(100)
    df = pd.DataFrame({
        "base": x,
        "collinear_1": x * 2.0 + np.random.normal(0, 0.05, 100),
        "collinear_2": x * -3.0 + np.random.normal(0, 0.05, 100),
        "independent": np.random.randn(100),
        "target": np.random.randn(100)
    })
    orch = EDAOrchestrator(output_dir=out_dir9)
    res = orch.run(df, target_column="target", project_id="p9", run_id="r9")
    corr_sum = res.get("correlation_summary", {})
    high_pairs = corr_sum.get("high_correlation_pairs", [])
    assert len(high_pairs) > 0, f"No collinear pairs detected. corr_sum keys: {list(corr_sum.keys())}"
    record("9. Highly Correlated Features (VIF)", "PASS", f"Detected {len(high_pairs)} collinear pairs")
except Exception as e:
    record("9. Highly Correlated Features (VIF)", "FAIL", str(e))


# ── TEST 10: Large Dataset (50k rows) ───────────────────────────────────────
try:
    out_dir10 = tempfile.mkdtemp(prefix="eda_large_")
    N = 50000
    df = pd.DataFrame({
        "score_1": np.random.randn(N),
        "score_2": np.random.exponential(10, N),
        "cat": np.random.choice(["T1","T2","T3","T4"], N),
        "target": np.random.choice([0,1], p=[0.7,0.3], size=N)
    })
    t0 = time.time()
    orch = EDAOrchestrator(output_dir=out_dir10)
    res = orch.run(df, target_column="target", project_id="p10", run_id="r10")
    elapsed = time.time() - t0
    assert elapsed < 30.0, f"Pipeline too slow: {elapsed:.2f}s"
    record("10. Large Dataset (50k rows)", "PASS", f"Completed in {elapsed:.2f}s with smart sampling")
except Exception as e:
    record("10. Large Dataset (50k rows)", "FAIL", str(e))


# ── ARTIFACT CHECK: EDA_Report.html ─────────────────────────────────────────
print("\n" + "=" * 70)
print("VERIFYING ARTIFACTS")
print("=" * 70)

report_path = os.path.join(out_dir1, "EDA_Report.html")
if os.path.exists(report_path):
    size_kb = os.path.getsize(report_path) / 1024
    record("EDA_Report.html Generated", "PASS", f"{size_kb:.1f} KB standalone HTML report with embedded charts")
else:
    # Check parent directory
    parent_report = os.path.join(os.path.dirname(out_dir1), "EDA_Report.html")
    found = os.path.exists(parent_report)
    if not found:
        # List what's in out_dir1
        contents = os.listdir(out_dir1) if os.path.exists(out_dir1) else []
        record("EDA_Report.html Generated", "FAIL", f"Not found. out_dir1 contents: {contents}")
    else:
        record("EDA_Report.html Generated", "PASS", f"Found at parent dir")

# ── SUMMARY ─────────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("ACCEPTANCE TEST SUMMARY")
print("=" * 70)
passes = sum(1 for t in results_summary if t["status"] == "PASS")
fails  = sum(1 for t in results_summary if t["status"] == "FAIL")
for t in results_summary:
    print(f"  [{t['status']}] {t['test']}: {t['details']}")
print(f"\n  TOTAL: {passes} PASSED, {fails} FAILED out of {len(results_summary)}")
