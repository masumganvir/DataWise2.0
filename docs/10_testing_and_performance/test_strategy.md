# Test Strategy & Inventory

## Overview

DataWise AI has **44 test files** in `backend/tests/` covering infrastructure, datasets, profiling, quality analysis, outlier detection, visualization, preprocessing, ML training, agent orchestration, security, database persistence, multi-user isolation, and end-to-end workflows.

## Test Command

```bash
cd backend
pytest tests/ -v                      # Run all tests
pytest tests/ --cov=. --cov-report=html  # With coverage report
pytest tests/test_step1_infrastructure.py -v  # Single test file
```

## Test Inventory

### Infrastructure & Configuration
| File | Tests | Focus |
|------|-------|-------|
| `test_step1_infrastructure.py` | Settings, directory creation, Redis, health probes | IMPLEMENTED |
| `test_production_database.py` | SQLAlchemy async session, entity creation, queries | IMPLEMENTED |
| `test_clerk_auth_and_db_persistence.py` | Clerk JWT sync, user persistence | IMPLEMENTED |
| `test_auth_and_audit.py` | Authentication, audit logging | IMPLEMENTED |

### Data Pipeline
| File | Tests | Focus |
|------|-------|-------|
| `test_step2_datasets.py` | Dataset upload, validation, preview | IMPLEMENTED |
| `test_step3_profiler.py` | Dataset profiling, column detection | IMPLEMENTED |
| `test_step4_quality.py` | Data quality analysis, missing values | IMPLEMENTED |
| `test_step5_outliers.py` | Outlier detection (IQR, Z-score) | IMPLEMENTED |
| `test_step6_visualization.py` | Chart generation, plot exports | IMPLEMENTED |
| `test_step7_distributions_correlations.py` | Distribution analysis, correlations | IMPLEMENTED |
| `test_step8_preprocessing.py` | Encoding, scaling, imputation | IMPLEMENTED |
| `test_step9_approval.py` | Human-in-the-loop approval flow | IMPLEMENTED |

### Feature Engineering & ML
| File | Tests | Focus |
|------|-------|-------|
| `test_step10_13_fe_selection_leakage.py` | Feature engineering, selection, leakage | IMPLEMENTED |
| `test_step14_16_pipeline_ml.py` | Pipeline construction, ML training | IMPLEMENTED |
| `test_step17_multiagent_system.py` | Multi-agent coordination | IMPLEMENTED |
| `test_step18_advanced_automl.py` | Advanced AutoML features | IMPLEMENTED |
| `test_step19_automl_endpoints.py` | AutoML API endpoints | IMPLEMENTED |
| `test_step20_reports.py` | Report generation (PDF, HTML, Markdown) | IMPLEMENTED |

### Security & Isolation
| File | Tests | Focus |
|------|-------|-------|
| `test_step22_security.py` | Security controls | IMPLEMENTED |
| `test_storage_and_security.py` | Storage security, access control | IMPLEMENTED |
| `test_multi_user_isolation.py` | Multi-user data isolation | IMPLEMENTED |
| `test_multi_project_identity_and_isolation.py` | Project-level isolation | IMPLEMENTED |
| `test_recovery_and_confidentiality.py` | Error recovery, PII redaction | IMPLEMENTED |

### Platform Integration
| File | Tests | Focus |
|------|-------|-------|
| `test_adaptive_automl_engine.py` | Full adaptive AutoML engine | IMPLEMENTED |
| `test_agentic_automl_master_platform.py` | Agentic master platform | IMPLEMENTED |
| `test_all_subgraphs_and_supervisor.py` | All LangGraph subgraphs | IMPLEMENTED |
| `test_llm_provider_and_routing.py` | LLM provider fallback chain | IMPLEMENTED |
| `test_master_end_to_end_loop.py` | End-to-end workflow loop | IMPLEMENTED |
| `test_master_graph_e2e.py` | Master graph execution | IMPLEMENTED |
| `test_master_implementation_verification.py` | Implementation verification | IMPLEMENTED |
| `test_master_platform_features.py` | Platform feature coverage | IMPLEMENTED |
| `test_qa_master_verification.py` | QA master verification suite | IMPLEMENTED |
| `test_tools_master_suite.py` | All tools verification | IMPLEMENTED |

### Specialized Tests
| File | Tests | Focus |
|------|-------|-------|
| `test_outlier_intelligence_fraud.py` | Fraud detection outlier analysis | IMPLEMENTED |
| `test_realtime_api_endpoints.py` | Real-time API endpoints | IMPLEMENTED |
| `test_realtime_automl_platform.py` | Real-time AutoML platform | IMPLEMENTED |
| `test_model_registry_inference_api.py` | Model registry and inference | IMPLEMENTED |
| `test_projects_endpoint_real_pipeline.py` | Projects endpoint integration | IMPLEMENTED |
| `test_live_workflow_e2e.py` | Live workflow end-to-end | IMPLEMENTED |
| `test_background_jobs.py` | Background job execution | IMPLEMENTED |
| `test_distributed_rate_limiting.py` | Rate limiting | IMPLEMENTED |
| `test_redis_locks_and_cache.py` | Redis locks and caching | IMPLEMENTED |

## Test Configuration

- **Framework**: pytest 8.3+
- **Async support**: pytest-asyncio 0.24+
- **Coverage**: pytest-cov 6.0+
- **Fixtures**: Shared conftest.py with database session, test client, sample datasets

## Known Test Limitations

1. **External service dependencies**: Tests requiring live LLM API keys, Redis, or S3 may be BLOCKED without proper credentials
2. **Database state**: Some integration tests may conflict when run in parallel — use `pytest -p no:randomly` for deterministic ordering
3. **Frontend tests**: No frontend unit or e2e tests currently exist (PLANNED — consider Vitest + Playwright)
4. **Performance benchmarks**: No systematic load testing or performance benchmarks have been recorded (PLANNED)
