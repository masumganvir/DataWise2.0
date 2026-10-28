# DataWise AI — Environment Variables Reference

This document catalogs every environment variable used across backend, database, storage, and agentic execution.

> [!IMPORTANT]
> Never commit active secret values to version control. Set sensitive variables via production secret managers or container runtime environments.

| Variable Name | Purpose | Required | Component | Secret |
|---|---|---|---|---|
| `APP_ENV` | Application environment (`development`, `staging`, `production`) | Yes | Backend | No |
| `IS_PRODUCTION` | Flag indicating production security posture | Yes | Backend | No |
| `STRICT_GMAIL` | Enforces `@gmail.com` email restriction (Default: `true`) | Yes | Auth | No |
| `JWT_SECRET_KEY` | HMAC-SHA256 signing key for JWT session tokens | Yes | Auth | **YES** |
| `DATABASE_URL` | Async SQLAlchemy database connection string | Yes | Database | **YES** |
| `SUPABASE_URL` | Supabase project API gateway endpoint | Optional | Database | No |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase service role key for admin background jobs | Optional | Database | **YES** |
| `REDIS_URL` | Redis connection URL for rate limiting and locks | Optional | Cache | No |
| `OBJECT_STORAGE_PROVIDER` | Storage backend (`local`, `s3`, `supabase`) | Yes | Storage | No |
| `GROQ_API_KEY` | Groq LLM inference API key | Optional | Agents | **YES** |
| `GEMINI_API_KEY` | Google Gemini API key | Optional | Agents | **YES** |
| `OPENAI_API_KEY` | OpenAI API key | Optional | Agents | **YES** |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | Optional | Agents | **YES** |
| `HUGGINGFACE_API_KEY`| HuggingFace Hub token | Optional | Agents | **YES** |
| `VITE_API_BASE_URL` | Frontend API base target (e.g. `http://localhost:8000`) | Yes | Frontend | No |
