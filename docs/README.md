# DataWise AI — Documentation Hub

> **DataWise AI** is an Adaptive Multi-Agent Platform for Automated Data Science and Machine Learning Engineering.

## Documentation Structure

| Section | Description |
|---------|-------------|
| [01 — Project Overview](01_project_overview/) | Executive summary, problem statement, objectives, glossary |
| [02 — System Architecture](02_system_architecture/) | Full-stack architecture, component inventory, decisions |
| [03 — Agentic AI](03_agentic_ai/) | Agent inventory, orchestration, LangGraph workflows |
| [04 — Machine Learning](04_machine_learning/) | ML pipeline, preprocessing, algorithm selection, HPO |
| [05 — Data & Persistence](05_data_and_persistence/) | Database schema, entity relationships, storage |
| [06 — API & Integrations](06_api_and_integrations/) | API reference, authentication, external services |
| [07 — Security & Privacy](07_security_and_privacy/) | Threat model, auth, encryption, sandboxing |
| [08 — User Documentation](08_user_documentation/) | Getting started, tutorials, troubleshooting |
| [09 — Developer Documentation](09_developer_documentation/) | Dev setup, coding conventions, extension guides |
| [10 — Testing & Performance](10_testing_and_performance/) | Test strategy, inventory, results |
| [11 — Deployment & Operations](11_deployment_and_operations/) | Local/production deployment, monitoring, backup |
| [12 — Research & Roadmap](12_research_and_roadmap/) | Related work, research questions, future plans |

## Diagrams

All architecture and workflow diagrams are maintained as Mermaid source files in [`diagrams/`](diagrams/).

## PDF Reports

Generated PDF reports are available in [`reports/`](reports/).

## Building Documentation

```bash
cd backend
python scripts/build_documentation.py
```

## Version

- **Document Version**: 1.0.0
- **Last Updated**: 2026-10-27
- **Platform Version**: 1.0.0
