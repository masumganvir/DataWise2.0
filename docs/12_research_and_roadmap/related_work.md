# Related Work & Development Roadmap

## Related Work

### AutoML Frameworks

| System | Description | Key Difference from DataWise AI |
|--------|-------------|--------------------------------|
| Auto-sklearn [1] | Bayesian optimization over scikit-learn pipelines | No agent orchestration, no natural language interface |
| AutoGluon [2] | Multi-layer stack ensembling | Fully automated — no human-in-the-loop approval |
| H2O AutoML [3] | Distributed AutoML with leaderboard | Enterprise server — not agent-based |
| TPOT [4] | Genetic programming for pipeline optimization | Code generation approach — no interactive workflow |
| Google Vertex AI AutoML [5] | Managed cloud AutoML service | Cloud-locked, no local deployment, no agent architecture |
| Azure AutoML [6] | Enterprise AutoML in Azure ML | Proprietary cloud service |
| DataRobot [7] | Enterprise AI platform | Commercial SaaS — not open source |

### ML Pipeline Orchestration

| System | Description |
|--------|-------------|
| MLflow [8] | Experiment tracking, model registry, deployment |
| Kubeflow [9] | Kubernetes-native ML pipelines |
| Airflow [10] | DAG-based workflow orchestration |
| Prefect [11] | Modern dataflow orchestration |
| Metaflow [12] | Human-centric ML infrastructure by Netflix |

### Agentic Data Science

| System | Description |
|--------|-------------|
| LangGraph [13] | Framework for building stateful multi-agent workflows |
| AutoGen [14] | Microsoft's multi-agent conversation framework |
| CrewAI [15] | Role-based multi-agent framework |
| ChatDev [16] | LLM agents for software development |

### DataWise AI's Intended Contribution

DataWise AI does not claim to outperform any specific AutoML system. Its design explores the combination of:
1. **Natural language problem definition** (two-prompt interface) rather than programmatic API configuration
2. **Agent-orchestrated workflow** with conditional routing and human-in-the-loop governance
3. **Hybrid tuning modes** where users can lock specific hyperparameters while the agent optimizes others
4. **Integrated artifact generation** (notebooks, reports, models, pipelines) in a single workflow
5. **Enterprise security controls** (RBAC, encryption, PII redaction) built into the platform

These design choices represent engineering decisions that could be evaluated against alternative approaches but have not yet been experimentally validated.

## Research Questions (PROPOSED)

1. **RQ1**: Does adaptive candidate selection (based on dataset properties) reduce total computation compared with a fixed candidate portfolio?
2. **RQ2**: Does hybrid user/agent tuning improve constraint satisfaction versus fully automated HPO?
3. **RQ3**: How does the two-prompt interface compare with programmatic configuration in terms of user satisfaction and specification accuracy?
4. **RQ4**: How reliably does the platform prevent data leakage across different dataset types?
5. **RQ5**: How reproducible are experiments across repeated executions with the same seed and configuration?

These questions are presented as **proposed studies** — no experimental evaluation has been conducted.

## Development Roadmap

### Phase 1: Core Platform (COMPLETED)
- ✅ React frontend with Clerk/Supabase authentication
- ✅ FastAPI backend with 13 route modules
- ✅ 37-entity SQLAlchemy database schema
- ✅ 16+ LangGraph agents with master orchestration
- ✅ Preprocessing pipeline (11 agents)
- ✅ Training pipeline (11 agents)
- ✅ Optimization loop with Optuna
- ✅ Report and notebook generation
- ✅ Error recovery system (18 modules)
- ✅ 44 test files

### Phase 2: Production Hardening (IN PROGRESS)
- 🔄 PostgreSQL deployment with Alembic migrations
- 🔄 Docker production builds
- 🔄 Redis-backed distributed rate limiting
- 🔄 MinIO S3 object storage integration
- 🔄 Comprehensive monitoring and alerting

### Phase 3: Advanced ML (PLANNED)
- ⬜ Deep learning with PyTorch integration
- ⬜ Time series analysis support
- ⬜ Natural language processing pipelines
- ⬜ Computer vision workflows
- ⬜ Automated feature store
- ⬜ Model A/B testing

### Phase 4: Enterprise Features (PLANNED)
- ⬜ Team collaboration and shared projects
- ⬜ Scheduled retraining pipelines
- ⬜ Production model monitoring with drift detection
- ⬜ Cost estimation and resource budgeting
- ⬜ Audit compliance reporting
- ⬜ Multi-region deployment

### Phase 5: Research & Evaluation (PLANNED)
- ⬜ Controlled experiments comparing HPO strategies
- ⬜ User studies on two-prompt interface
- ⬜ Leakage prevention evaluation
- ⬜ Reproducibility benchmarks
- ⬜ Publication of findings

## References

[1] M. Feurer et al., "Efficient and Robust Automated Machine Learning," in Proc. NeurIPS, 2015. URL: https://automl.github.io/auto-sklearn/

[2] N. Erickson et al., "AutoGluon-Tabular: Robust and Accurate AutoML for Structured Data," arXiv:2003.06505, 2020. URL: https://auto.gluon.ai/

[3] H2O.ai, "H2O AutoML," 2024. URL: https://docs.h2o.ai/h2o/latest-stable/h2o-docs/automl.html

[4] R. Olson et al., "TPOT: A Tree-based Pipeline Optimization Tool for Automating Machine Learning," in Proc. ICML AutoML Workshop, 2016. URL: https://epistasislab.github.io/tpot/

[5] Google Cloud, "Vertex AI AutoML," 2024. URL: https://cloud.google.com/vertex-ai/docs/training/automl

[6] Microsoft, "Azure Automated ML," 2024. URL: https://learn.microsoft.com/en-us/azure/machine-learning/concept-automated-ml

[7] DataRobot Inc., "DataRobot AI Platform," 2024. URL: https://www.datarobot.com/

[8] Databricks, "MLflow: An Open Source Platform for the ML Lifecycle," 2024. URL: https://mlflow.org/

[9] Google, "Kubeflow," 2024. URL: https://www.kubeflow.org/

[10] Apache Software Foundation, "Apache Airflow," 2024. URL: https://airflow.apache.org/

[11] Prefect Technologies, "Prefect," 2024. URL: https://www.prefect.io/

[12] Netflix / Outerbounds, "Metaflow," 2024. URL: https://metaflow.org/

[13] LangChain Inc., "LangGraph," 2024. URL: https://langchain-ai.github.io/langgraph/

[14] Microsoft Research, "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation," 2023. URL: https://microsoft.github.io/autogen/

[15] J. Moura, "CrewAI," 2024. URL: https://www.crewai.com/

[16] T. Qian et al., "Communicative Agents for Software Development," arXiv:2307.07924, 2023. URL: https://github.com/OpenBMB/ChatDev
