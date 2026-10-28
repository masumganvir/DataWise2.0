# Development Setup & Repository Map

## Repository Structure

```
DATAPREPAGENT/
├── backend/                          # Python backend (FastAPI + LangGraph)
│   ├── main.py                       # Application entry point
│   ├── requirements.txt              # Python dependencies
│   ├── alembic/                      # Database migration scripts
│   ├── alembic.ini                   # Alembic configuration
│   ├── agents/                       # 16+ numbered agents + 50+ sub-agents
│   │   ├── base.py                   # BaseAgent, AgentInput, AgentOutput contracts
│   │   ├── 00_orchestrator_agent/
│   │   ├── 01_dataset_profiling_agent/
│   │   ├── ...
│   │   └── 15_reporting_notebook_agent/
│   ├── graphs/                       # LangGraph StateGraph definitions
│   │   ├── state.py                  # AgentState TypedDict
│   │   ├── master_graph.py           # Top-level orchestration graph
│   │   ├── preprocessing_graph.py    # Data preprocessing subgraph
│   │   ├── training_graph.py         # ML training subgraph
│   │   ├── optimization_graph.py     # AutoML optimization loop
│   │   ├── monitoring_graph.py       # Production monitoring subgraph
│   │   └── recovery_graph.py         # Error recovery subgraph
│   ├── tools/                        # Deterministic ML execution tools
│   │   ├── ingestion/
│   │   ├── profiling/
│   │   ├── preprocessing/
│   │   ├── feature_engineering/
│   │   ├── feature_selection/
│   │   ├── leakage/
│   │   ├── models/
│   │   ├── evaluation/
│   │   ├── tuning/
│   │   ├── visualization/
│   │   ├── notebook/
│   │   ├── reporting/
│   │   └── serialization/
│   ├── app/                          # Core application modules
│   │   ├── api/endpoints/            # FastAPI route handlers
│   │   ├── auth/                     # Authentication & RBAC
│   │   ├── config/                   # Settings & logging
│   │   ├── db/models/                # SQLAlchemy entity definitions
│   │   ├── security/                 # File validation, sandbox, prompt guard
│   │   ├── storage/                  # Object storage service
│   │   └── monitoring/               # Health probes & metrics
│   ├── llm/                          # Multi-provider LLM integration
│   │   ├── router.py                 # LLM routing with fallback chain
│   │   ├── gemini_provider.py
│   │   ├── openai.py
│   │   ├── anthropic.py
│   │   ├── ollama_provider.py
│   │   ├── circuit_breaker.py
│   │   └── health.py
│   ├── recovery/                     # 18-module error recovery system
│   ├── services/                     # Business logic services
│   ├── streaming/                    # WebSocket/SSE streaming
│   └── tests/                        # 44 test files
├── frontend/                         # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx                   # Router with 40+ routes
│   │   ├── pages/                    # Page components
│   │   ├── components/               # Reusable UI components
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── services/                 # API client & auth store
│   │   └── types/                    # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── docs/                             # Documentation (you are here)
├── docker/                           # Docker configuration
├── docker-compose.yml                # Multi-service compose
├── .env.example                      # Environment variable template
└── requirements.txt                  # Root-level dependencies
```

## Development Setup

### Backend Development

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Start with hot reload
python main.py
# OR
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev                   # Starts Vite dev server on :5173
```

### Running Tests

```bash
cd backend
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_step1_infrastructure.py -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

## Coding Conventions

### Python (Backend)
- **Formatting**: Follow PEP 8, use ruff linter (config in `pyproject.toml`)
- **Type hints**: Use Python 3.11+ type annotations throughout
- **Imports**: Use `from __future__ import annotations` for forward references
- **Models**: Pydantic v2 BaseModel for API schemas, SQLAlchemy 2.0 for DB entities
- **Async**: All database operations and HTTP handlers are async
- **Logging**: Use `loguru.logger` — never `print()` or stdlib `logging`

### TypeScript (Frontend)
- **Framework**: React 18 with TypeScript strict mode
- **Routing**: React Router v6 with nested routes
- **State**: Zustand stores (authStore) + React hooks
- **API**: Axios client with interceptors for auth headers
- **Styling**: Vanilla CSS with CSS custom properties (design tokens)

## Adding New Components

### Adding a New Agent

1. Create directory `backend/agents/XX_your_agent_name/`
2. Create `__init__.py` with agent class extending `BaseAgent`
3. Implement `analyze(self, input_data: AgentInput) -> AgentOutput`
4. Register agent in the appropriate graph (preprocessing, training, etc.)
5. Add tests in `backend/tests/`

### Adding a New API Endpoint

1. Create or extend a file in `backend/app/api/endpoints/`
2. Define route handler with proper authentication (`Depends(get_current_user)`)
3. Register router in `backend/app/api/router.py`
4. Add tests

### Adding a New ML Algorithm

1. Add algorithm configuration in the ModelSelectionAgent
2. Implement training logic in `backend/tools/models/`
3. Add hyperparameter search space definition
4. Register in the optimization graph candidate list
5. Add evaluation metrics support
