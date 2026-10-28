# DataWise AI — QA Test Evidence & Execution Logs

This document contains actual terminal execution evidence, test counts, and exit codes from pytest and Vite test runners.

---

## 1. Test Suite Summary Table

| Test Suite File | Domain / Focus | Tests Run | Passed | Failed | Duration | Exit Code |
|---|---|---|---|---|---|---|
| `test_admin_database_access.py` | Admin & Database Exclusivity | 4 | 4 | 0 | 2.18s | 0 |
| `test_multi_user_isolation.py` | Tenant Segregation & Artifact Security | 7 | 7 | 0 | 56.96s | 0 |
| `test_master_end_to_end_loop.py` | Full ML Pipeline & Regression | 4 | 4 | 0 | 428.85s | 0 |
| `test_recovery_and_confidentiality.py` | Secret Redaction, PII & Rollback | 20 | 20 | 0 | 1.40s | 0 |
| `test_multi_project_identity_and_isolation.py` | Project Slugs & Prompt Versioning | 8 | 8 | 0 | 1.92s | 0 |
| `test_auth_and_audit.py` | JWT Tokens & Audit Logging | 3 | 3 | 0 | 0.95s | 0 |
| `test_storage_and_security.py` | Storage Service & Path Traversal | 5 | 5 | 0 | 0.82s | 0 |
| `test_step22_security.py` | Step 22 Security Controls | 4 | 4 | 0 | 0.78s | 0 |
| **Total Automated Tests** | | **55** | **55** | **0** | | **0** |

---

## 2. Frontend Production Compilation Evidence
```text
$ npm run build
> datawise-ai-frontend@1.0.0 build
> tsc && vite build

vite v5.4.19 building for production...
transforming...
✓ 1842 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   2.84 kB │ gzip:   1.02 kB
dist/assets/index-D8x2n91p.css   48.21 kB │ gzip:   9.84 kB
dist/assets/index-B7j28z1L.js   812.45 kB │ gzip: 241.12 kB
✓ built in 9.47s
```

---

## 3. Key Test Evidence Logs

### A. Admin & Database Exclusivity Test Run
```text
tests/test_admin_database_access.py::test_super_admin_email_constant PASSED [ 25%]
tests/test_admin_database_access.py::test_admin_settings_access_restricted_to_super_admin PASSED [ 50%]
tests/test_admin_database_access.py::test_rbac_downgrades_unauthorized_admin_role PASSED [ 75%]
tests/test_admin_database_access.py::test_admin_cross_tenant_project_oversight PASSED [100%]
======================= 4 passed, 26 warnings in 2.18s ========================
```

### B. Master ML Pipeline & Multi-User Regression Run
```text
tests/test_master_end_to_end_loop.py::test_01_domain_restriction_and_duplicate_prevention PASSED [ 25%]
tests/test_master_end_to_end_loop.py::test_02_dummy_project_and_complete_ml_workflow PASSED [ 50%]
tests/test_master_end_to_end_loop.py::test_03_multi_user_isolation_and_attack_prevention PASSED [ 75%]
tests/test_master_end_to_end_loop.py::test_04_regression_suite_four_distinct_projects PASSED [100%]
================= 4 passed, 55 warnings in 428.85s (0:07:08) ==================
```
