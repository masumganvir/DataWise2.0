"""
DataWise AI — LLM Provider Abstraction & Model Routing

Wraps Google Gemini, OpenAI, and Anthropic APIs behind a unified interface:
  LLMProvider
  ├── GeminiProvider
  ├── OpenAIProvider
  └── AnthropicProvider

Supports Model Routing:
  - Fast task (simple explanations, classification of tool results, UI chat)
  - Capable task (complex reasoning, feature engineering, model strategy, report synthesis)
Falls back to MockProvider when no API keys are present in .env.
"""

from __future__ import annotations

import os
from typing import AsyncIterator, Dict, List, Literal, Optional

import httpx
from loguru import logger


# ------------------------------------------------------------------ #
#  Unified message type
# ------------------------------------------------------------------ #

class LLMMessage:
    def __init__(self, role: str, content: str) -> None:
        self.role = role
        self.content = content

    def to_dict(self) -> Dict[str, str]:
        return {"role": self.role, "content": self.content}


# ------------------------------------------------------------------ #
#  Base Provider
# ------------------------------------------------------------------ #

class BaseLLMProvider:
    async def complete(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> str:
        raise NotImplementedError

    async def stream(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> AsyncIterator[str]:
        raise NotImplementedError


# ------------------------------------------------------------------ #
#  Gemini Provider
# ------------------------------------------------------------------ #

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None
        try:
            from google import genai
            self._client = genai.Client(api_key=api_key)
        except Exception as e:
            logger.warning(f"Failed to initialize google.genai Client: {e}")

    async def complete(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> str:
        if not self._client:
            return ""
        full_prompt = ""
        if system_prompt:
            full_prompt += f"{system_prompt}\n\n"
        for m in messages:
            full_prompt += f"{m.role.capitalize()}: {m.content}\n"

        import asyncio
        loop = asyncio.get_event_loop()
        models_to_try = ["gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-3.8-flash"]
        for model_name in models_to_try:
            try:
                res = await loop.run_in_executor(
                    None,
                    lambda m=model_name: self._client.models.generate_content(
                        model=m,
                        contents=full_prompt,
                    )
                )
                if res and res.text:
                    return res.text.strip()
            except Exception as exc:
                logger.debug(f"Gemini model {model_name} attempt failed: {exc}")
        return ""

    async def stream(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> AsyncIterator[str]:
        full = await self.complete(messages, system_prompt, temperature, max_tokens, task)
        for word in full.split():
            yield word + " "


# ------------------------------------------------------------------ #
#  Groq Provider
# ------------------------------------------------------------------ #

class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.models_to_try = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]

    async def complete(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> str:
        msg_list = []
        if system_prompt:
            msg_list.append({"role": "system", "content": system_prompt})
        msg_list.extend([m.to_dict() for m in messages])

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                for model in self.models_to_try:
                    try:
                        res = await client.post(
                            "https://api.groq.com/openai/v1/chat/completions",
                            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                            json={
                                "model": model,
                                "messages": msg_list,
                                "temperature": temperature,
                                "max_tokens": max_tokens,
                            },
                        )
                        if res.status_code == 200:
                            data = res.json()
                            choices = data.get("choices", [])
                            if choices:
                                text = choices[0].get("message", {}).get("content", "").strip()
                                if text:
                                    return text
                        logger.debug(f"Groq model {model} returned status {res.status_code}")
                    except Exception as exc:
                        logger.debug(f"Groq model {model} failed: {exc}")
        except Exception as exc:
            logger.warning(f"Groq completion client error: {exc}")
        return ""

    async def stream(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> AsyncIterator[str]:
        full = await self.complete(messages, system_prompt, temperature, max_tokens, task)
        for word in full.split():
            yield word + " "



# ------------------------------------------------------------------ #
#  OpenAI Provider
# ------------------------------------------------------------------ #

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def complete(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> str:
        try:
            from openai import AsyncOpenAI  # type: ignore

            model_name = "gpt-4o" if task == "capable" else "gpt-4o-mini"
            client = AsyncOpenAI(api_key=self.api_key)
            msg_list = []
            if system_prompt:
                msg_list.append({"role": "system", "content": system_prompt})
            msg_list.extend([m.to_dict() for m in messages])

            response = await client.chat.completions.create(
                model=model_name,
                messages=msg_list,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"OpenAI completion failed: {exc}")
            return f"DataWise AI (OpenAI fallback response for: {messages[-1].content[:60]}...)"

    async def stream(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> AsyncIterator[str]:
        try:
            from openai import AsyncOpenAI  # type: ignore

            model_name = "gpt-4o" if task == "capable" else "gpt-4o-mini"
            client = AsyncOpenAI(api_key=self.api_key)
            msg_list = []
            if system_prompt:
                msg_list.append({"role": "system", "content": system_prompt})
            msg_list.extend([m.to_dict() for m in messages])

            stream = await client.chat.completions.create(
                model=model_name,
                messages=msg_list,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"OpenAI stream failed: {exc}")
            yield f"DataWise AI (OpenAI stream fallback for: {messages[-1].content[:60]}...)"


# ------------------------------------------------------------------ #
#  Anthropic Provider
# ------------------------------------------------------------------ #

class AnthropicProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def complete(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> str:
        model_name = "claude-3-5-sonnet-20241022" if task == "capable" else "claude-3-5-haiku-20241022"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        anthropic_msgs = [{"role": ("user" if m.role == "user" else "assistant"), "content": m.content} for m in messages]
        payload = {
            "model": model_name,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": anthropic_msgs,
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content_blocks = data.get("content", [])
                    return "".join(b.get("text", "") for b in content_blocks)
                else:
                    logger.warning(f"Anthropic API returned status {res.status_code}: {res.text}")
                    return f"DataWise AI (Anthropic error {res.status_code})"
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"Anthropic completion failed: {exc}")
            return f"DataWise AI (Anthropic fallback for: {messages[-1].content[:60]}...)"

    async def stream(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> AsyncIterator[str]:
        # Non-streaming fallback for simple responses
        full = await self.complete(messages, system_prompt, temperature, max_tokens, task)
        for word in full.split():
            yield word + " "


# ------------------------------------------------------------------ #
#  Mock Provider (Fallback)
# ------------------------------------------------------------------ #

class MockProvider(BaseLLMProvider):
    async def complete(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> str:
        last = messages[-1].content if messages else ""
        return (
            f"**DataWise AI** (Autonomous Data Scientist — Demo Mode)\n\n"
            f"Analysis of query: _{last[:160]}..._\n\n"
            f"To enable real LLM completions, configure `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY` in your `.env`."
        )

    async def stream(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> AsyncIterator[str]:
        text = await self.complete(messages, system_prompt, temperature, max_tokens, task)
        for word in text.split():
            yield word + " "


# ------------------------------------------------------------------ #
#  Facade Dispatcher & Model Router
# ------------------------------------------------------------------ #

class LLMProvider:
    """
    Unified LLM router managing Groq, Gemini, OpenAI, Anthropic, and Mock providers.
    Routes queries with seamless cascading fallback if a provider spikes or fails.
    """

    def __init__(self) -> None:
        self.groq_key = os.getenv("GROQ_API_KEY", "")
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.openai_key = os.getenv("OPENAI_API_KEY", "")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")

        self.providers: List[BaseLLMProvider] = []
        if self.groq_key:
            self.providers.append(GroqProvider(self.groq_key))
        if self.gemini_key:
            self.providers.append(GeminiProvider(self.gemini_key))
        if self.openai_key:
            self.providers.append(OpenAIProvider(self.openai_key))
        if self.anthropic_key:
            self.providers.append(AnthropicProvider(self.anthropic_key))
        self.providers.append(MockProvider())

        logger.info(f"LLMProvider initialized with {len(self.providers)} providers: {[p.__class__.__name__ for p in self.providers]}")

    async def complete(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> str:
        for provider in self.providers:
            try:
                res = await provider.complete(
                    messages=messages,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    task=task,
                )
                if res and not res.startswith("DataWise AI (") and not res.startswith("Error:"):
                    return res
            except Exception as exc:
                logger.warning(f"Provider {provider.__class__.__name__} failed: {exc}")

        # Fallback to the last provider (Mock)
        return await self.providers[-1].complete(messages, system_prompt, temperature, max_tokens, task)

    async def stream(
        self,
        messages: List[LLMMessage],
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        task: Literal["fast", "capable"] = "fast",
    ) -> AsyncIterator[str]:
        for provider in self.providers:
            try:
                has_yielded = False
                async for chunk in provider.stream(
                    messages=messages,
                    system_prompt=system_prompt,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    task=task,
                ):
                    if chunk and not chunk.startswith("DataWise AI ("):
                        has_yielded = True
                        yield chunk
                if has_yielded:
                    return
            except Exception as exc:
                logger.warning(f"Provider {provider.__class__.__name__} stream failed: {exc}")

        async for chunk in self.providers[-1].stream(messages, system_prompt, temperature, max_tokens, task):
            yield chunk


# Singleton
llm_provider = LLMProvider()

