"""
DataWise AI — System & Platform Settings Endpoints
Provides configuration management for LLM tokens, AutoML engine defaults,
storage endpoints, and live API key validation.
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional
import urllib.parse
import ipaddress
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from loguru import logger

from app.config.settings import get_settings
from app.auth.rbac import get_current_user, require_authenticated_user, require_admin, SUPER_ADMIN_EMAIL
from app.db.models.entities import User

router = APIRouter()
settings = get_settings()


def _is_safe_local_endpoint(url: str) -> bool:
    """Validate endpoint URL to prevent Server-Side Request Forgery (SSRF)."""
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").lower()
        if hostname in ("localhost", "127.0.0.1", "::1"):
            return True
        try:
            ip = ipaddress.ip_address(hostname)
            return ip.is_loopback
        except ValueError:
            return False
    except Exception:
        return False


class TokenSettingsUpdate(BaseModel):
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    huggingface_token: Optional[str] = None
    ollama_base_url: Optional[str] = None
    primary_provider: Optional[str] = None
    reasoning_temperature: Optional[float] = 0.3
    max_tokens: Optional[int] = 2048
    enable_auto_fallback: Optional[bool] = True
    optuna_trials: Optional[int] = 25
    cv_folds: Optional[int] = 5
    trial_timeout_seconds: Optional[int] = 120
    rate_limit_per_minute: Optional[int] = 60
    storage_backend: Optional[str] = None
    redis_url: Optional[str] = None
    primary_metric: Optional[str] = None
    air_gap_mode: Optional[bool] = None

    class Config:
        extra = "ignore"


class TestKeyRequest(BaseModel):
    provider: str = Field(..., description="gemini, groq, openai, anthropic, or ollama")
    api_key: Optional[str] = None
    model: Optional[str] = None
    endpoint_url: Optional[str] = None


def _mask_key(key: Optional[str]) -> str:
    if not key:
        return ""
    if len(key) <= 8:
        return "••••••••"
    return f"{key[:4]}••••••••{key[-4:]}"


@router.get("", summary="Get current platform settings and token status")
async def get_platform_settings(
    user: Optional[User] = Depends(get_current_user),
) -> Dict[str, Any]:
    is_super_admin = bool(user and user.email and user.email.strip().lower() == SUPER_ADMIN_EMAIL.lower())
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    groq_key = os.getenv("GROQ_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    hf_token = os.getenv("HF_TOKEN", "")
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # Determine active provider
    active_provider = "mock"
    if groq_key:
        active_provider = "groq"
    elif gemini_key:
        active_provider = "gemini"
    elif openai_key:
        active_provider = "openai"
    elif anthropic_key:
        active_provider = "anthropic"

    return {
        "tokens": {
            "gemini": {
                "configured": bool(gemini_key),
                "masked": _mask_key(gemini_key),
                "model": "gemini-flash-latest",
                "status": "ready" if gemini_key else "unconfigured",
            },
            "groq": {
                "configured": bool(groq_key),
                "masked": _mask_key(groq_key),
                "model": "qwen/qwen3.8-27b",
                "status": "ready" if groq_key else "unconfigured",
            },
            "openai": {
                "configured": bool(openai_key),
                "masked": _mask_key(openai_key),
                "model": "gpt-4o-mini",
                "status": "ready" if openai_key else "unconfigured",
            },
            "anthropic": {
                "configured": bool(anthropic_key),
                "masked": _mask_key(anthropic_key),
                "model": "claude-3-5-haiku-20241022",
                "status": "ready" if anthropic_key else "unconfigured",
            },
            "huggingface": {
                "configured": bool(hf_token),
                "masked": _mask_key(hf_token),
                "status": "ready" if hf_token else "unconfigured",
            },
            "ollama": {
                "configured": True,
                "endpoint": ollama_url,
                "status": "local",
            },
        },
        "reasoning": {
            "primary_provider": active_provider,
            "temperature": float(os.getenv("REASONING_TEMPERATURE", "0.3")),
            "max_tokens": int(os.getenv("MAX_REASONING_TOKENS", "2048")),
            "enable_auto_fallback": True,
            "system_persona": "Senior Autonomous Lead Data Scientist",
        },
        "automl_defaults": {
            "optuna_trials": int(os.getenv("OPTUNA_DEFAULT_TRIALS", "25")),
            "cv_folds": int(os.getenv("CV_DEFAULT_FOLDS", "5")),
            "trial_timeout_seconds": int(os.getenv("TRIAL_TIMEOUT_SECONDS", "120")),
            "leakage_defense": "Enforced (Train-Only Fit)",
            "outlier_policy": "RobustScaler (IQR Adaptive)",
        },
        "infrastructure": {
            "storage_backend": os.getenv("STORAGE_BACKEND", "local"),
            "redis_status": "in-memory fallback (active)",
            "rate_limit_per_minute": int(os.getenv("RATE_LIMIT_PER_MINUTE", "60")),
            "environment": os.getenv("ENVIRONMENT", "development"),
        },
    }


@router.post("", summary="Update platform settings and tokens")
async def update_platform_settings(
    payload: TokenSettingsUpdate,
    user: User = Depends(require_admin),
) -> Dict[str, Any]:
    updated_fields = []

    if payload.gemini_api_key is not None and payload.gemini_api_key.strip():
        os.environ["GEMINI_API_KEY"] = payload.gemini_api_key.strip()
        updated_fields.append("GEMINI_API_KEY")

    if payload.groq_api_key is not None and payload.groq_api_key.strip():
        os.environ["GROQ_API_KEY"] = payload.groq_api_key.strip()
        updated_fields.append("GROQ_API_KEY")

    if payload.openai_api_key is not None and payload.openai_api_key.strip():
        os.environ["OPENAI_API_KEY"] = payload.openai_api_key.strip()
        updated_fields.append("OPENAI_API_KEY")

    if payload.anthropic_api_key is not None and payload.anthropic_api_key.strip():
        os.environ["ANTHROPIC_API_KEY"] = payload.anthropic_api_key.strip()
        updated_fields.append("ANTHROPIC_API_KEY")

    if payload.huggingface_token is not None and payload.huggingface_token.strip():
        os.environ["HF_TOKEN"] = payload.huggingface_token.strip()
        updated_fields.append("HF_TOKEN")

    if payload.ollama_base_url is not None and payload.ollama_base_url.strip():
        os.environ["OLLAMA_BASE_URL"] = payload.ollama_base_url.strip()
        updated_fields.append("OLLAMA_BASE_URL")

    if payload.reasoning_temperature is not None:
        os.environ["REASONING_TEMPERATURE"] = str(payload.reasoning_temperature)
        updated_fields.append("REASONING_TEMPERATURE")

    if payload.max_tokens is not None:
        os.environ["MAX_REASONING_TOKENS"] = str(payload.max_tokens)
        updated_fields.append("MAX_REASONING_TOKENS")

    if payload.optuna_trials is not None:
        os.environ["OPTUNA_DEFAULT_TRIALS"] = str(payload.optuna_trials)
        updated_fields.append("OPTUNA_DEFAULT_TRIALS")

    if payload.cv_folds is not None:
        os.environ["CV_DEFAULT_FOLDS"] = str(payload.cv_folds)
        updated_fields.append("CV_DEFAULT_FOLDS")

    if payload.rate_limit_per_minute is not None:
        os.environ["RATE_LIMIT_PER_MINUTE"] = str(payload.rate_limit_per_minute)
        updated_fields.append("RATE_LIMIT_PER_MINUTE")

    if payload.primary_metric is not None:
        os.environ["PRIMARY_EVALUATION_METRIC"] = str(payload.primary_metric)
        updated_fields.append("PRIMARY_EVALUATION_METRIC")

    if payload.air_gap_mode is not None:
        os.environ["AIR_GAP_MODE"] = str(payload.air_gap_mode).lower()
        updated_fields.append("AIR_GAP_MODE")

    # Re-initialize the LLMProvider singleton so changes take effect immediately
    try:
        from app.graph.llm_provider import llm_provider
        llm_provider.__init__()
    except Exception as exc:
        logger.warning(f"Could not re-initialize LLMProvider: {exc}")

    return {
        "status": "success",
        "message": f"Updated {len(updated_fields)} settings successfully.",
        "updated_keys": updated_fields,
        "timestamp": time.strftime("%H:%M:%S"),
    }


@router.post("/test-key", summary="Test and validate an AI provider token live")
async def test_provider_key(
    payload: TestKeyRequest,
    user: User = Depends(require_authenticated_user),
) -> Dict[str, Any]:
    provider = payload.provider.lower().strip()
    key = payload.api_key or os.getenv(f"{provider.upper()}_API_KEY", "")

    start_time = time.perf_counter()

    if provider == "groq":
        test_key = key or os.getenv("GROQ_API_KEY", "")
        if not test_key:
            return {"success": False, "error": "No Groq API key provided or configured."}
        model = payload.model or "qwen/qwen3.8-27b"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {test_key}", "Content-Type": "application/json"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": "Ping test: respond with OK"}],
                        "max_tokens": 5,
                    },
                )
                elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                if res.status_code == 200:
                    return {
                        "success": True,
                        "provider": "Groq Cloud",
                        "model": model,
                        "latency_ms": elapsed_ms,
                        "status_text": "Connection verified & active",
                    }
                return {
                    "success": False,
                    "provider": "Groq Cloud",
                    "status_code": res.status_code,
                    "error": res.text[:200],
                }
        except Exception as exc:
            return {"success": False, "provider": "Groq Cloud", "error": str(exc)}

    elif provider == "gemini":
        test_key = key or os.getenv("GEMINI_API_KEY", "")
        if not test_key:
            return {"success": False, "error": "No Gemini API key provided or configured."}
        try:
            from google import genai
            import asyncio
            client = genai.Client(api_key=test_key)
            loop = asyncio.get_event_loop()
            model = payload.model or "gemini-flash-latest"
            res = await loop.run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=model,
                    contents="Ping test: respond with OK",
                ),
            )
            elapsed_ms = round((time.perf_counter() - start_time) * 1000)
            if res and res.text:
                return {
                    "success": True,
                    "provider": "Google Gemini",
                    "model": model,
                    "latency_ms": elapsed_ms,
                    "status_text": "Connection verified & active",
                }
            return {"success": False, "provider": "Google Gemini", "error": "Empty response from Gemini."}
        except Exception as exc:
            return {"success": False, "provider": "Google Gemini", "error": str(exc)}

    elif provider == "openai":
        test_key = key or os.getenv("OPENAI_API_KEY", "")
        if not test_key:
            return {"success": False, "error": "No OpenAI API key provided or configured."}
        model = payload.model or "gpt-4o-mini"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {test_key}", "Content-Type": "application/json"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": "Ping test: respond with OK"}],
                        "max_tokens": 5,
                    },
                )
                elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                if res.status_code == 200:
                    return {
                        "success": True,
                        "provider": "OpenAI",
                        "model": model,
                        "latency_ms": elapsed_ms,
                        "status_text": "Connection verified & active",
                    }
                return {"success": False, "provider": "OpenAI", "error": res.text[:200]}
        except Exception as exc:
            return {"success": False, "provider": "OpenAI", "error": str(exc)}

    elif provider == "ollama":
        endpoint = payload.endpoint_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        if not _is_safe_local_endpoint(endpoint):
            return {
                "success": False,
                "provider": "Ollama",
                "error": "SSRF Prevention: Only loopback localhost/127.0.0.1 endpoints are permitted.",
            }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{endpoint}/api/tags")
                elapsed_ms = round((time.perf_counter() - start_time) * 1000)
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", [])]
                    return {
                        "success": True,
                        "provider": "Ollama (Local)",
                        "endpoint": endpoint,
                        "models_found": models,
                        "latency_ms": elapsed_ms,
                        "status_text": f"Ollama daemon online with {len(models)} local models",
                    }
                return {"success": False, "provider": "Ollama", "error": f"Status {res.status_code}"}
        except Exception as exc:
            return {"success": False, "provider": "Ollama", "error": f"Local Ollama unreachable at {endpoint}: {exc}"}

    return {"success": False, "error": f"Unknown provider: {provider}"}
