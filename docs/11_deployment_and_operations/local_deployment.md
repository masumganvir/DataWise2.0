# Local Deployment Guide

## Development Deployment

### Prerequisites
- Python 3.11+, Node.js 18+, npm 9+
- (Optional) Redis 7.x, MinIO

### Quick Start

```bash
# Terminal 1: Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Terminal 2: Frontend
cd frontend
npm install && npm run dev
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Services:
#   - backend:  http://localhost:8000
#   - frontend: http://localhost:3000
#   - redis:    localhost:6379
#   - minio:    http://localhost:9000 (console: 9001)
```

## Docker Compose Services

The `docker-compose.yml` defines the following services:

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| backend | Custom (Dockerfile) | 8000 | FastAPI backend |
| frontend | Custom (Dockerfile) | 3000/80 | React frontend + nginx |
| redis | redis:7-alpine | 6379 | Cache and rate limiting |
| minio | minio/minio | 9000, 9001 | S3-compatible object storage |

## Environment Variables Reference

See `docs/ENVIRONMENT_VARIABLES.md` for the complete list. Key production overrides:

| Variable | Development | Production |
|----------|-------------|------------|
| `APP_ENV` | `development` | `production` |
| `DATABASE_URL` | `sqlite+aiosqlite:///./datawise.db` | `postgresql+asyncpg://user:pass@host/db` |
| `SECRET_KEY` | Default dev key | Strong random 256-bit key |
| `CORS_ORIGINS` | `*` | Specific allowed origins |
| `REDIS_URL` | `redis://localhost:6379/0` | Production Redis cluster |

## Health Checks

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Liveness | `{"status": "ok"}` |
| `GET /health/live` | Kubernetes liveness | `{"status": "alive"}` |
| `GET /health/ready` | Deep readiness (DB + Redis + Storage) | `{"status": "ready"}` |

## Database Setup

### SQLite (Development)
- Automatic: Tables created on startup via `init_db()`
- File: `backend/datawise.db`

### PostgreSQL (Production)
```bash
# Set environment variable
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/datawise

# Run migrations
cd backend
alembic upgrade head
```

## Monitoring

- **Metrics**: Internal `MetricsCollector` records request counts, latencies, error rates
- **Logging**: Loguru with structured JSON output, configurable log level via `APP_LOG_LEVEL`
- **Request tracing**: Every request gets a unique `X-Request-ID` header
- **Process time**: `X-Process-Time` header on every response
- **Sentry**: Optional Sentry integration via `SENTRY_DSN`
- **OpenTelemetry**: Optional OTEL integration via `OTEL_ENDPOINT`

## Backup & Recovery

### Database Backup (SQLite)
```bash
cp backend/datawise.db backend/datawise.db.backup
```

### Database Backup (PostgreSQL)
```bash
pg_dump -U user -h host datawise > backup.sql
```

### Artifact Backup
```bash
# Local storage
cp -r backend/artifacts/ /backup/artifacts/

# MinIO
mc mirror minio/datawise /backup/datawise/
```
