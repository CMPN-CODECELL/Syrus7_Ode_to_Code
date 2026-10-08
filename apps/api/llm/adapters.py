"""LLM Adapters and Circuit Breakers for KrishiNirnay.
Primary: Gemini 3.8 Flash
Fallback: Groq openai/gpt-oss-20b
Ultimate Fallback: Deterministic Template
"""

import os
import time
import json
import logging
from typing import Optional, Dict, Any, Tuple
import httpx

logger = logging.getLogger("krishinirnay.llm")

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_time_sec: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_time_sec = recovery_time_sec
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.state = "CLOSED" # CLOSED (healthy), OPEN (unhealthy/tripped)

    def record_success(self):
        self.failure_count = 0
        self.state = "CLOSED"

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(f"Circuit breaker tripped to OPEN state (failures: {self.failure_count})")

    def can_attempt(self) -> bool:
        if self.state == "CLOSED":
            return True
        if time.time() - self.last_failure_time > self.recovery_time_sec:
            # Half-open trial
            return True
        return False

class LLMAdapter:
    def __init__(self):
        self.gemini_breaker = CircuitBreaker()
        self.groq_breaker = CircuitBreaker()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")

    async def call_gemini(self, prompt: str, system_prompt: str) -> Optional[str]:
        """Calls Gemini 3.8 Flash using Google Generative Language REST API."""
        if not self.gemini_api_key or not self.gemini_breaker.can_attempt():
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600}
        }

        try:
            async with httpx.AsyncClient(timeout=4.5) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        self.gemini_breaker.record_success()
                        return text
                logger.warning(f"Gemini error response: {res.status_code}")
                self.gemini_breaker.record_failure()
                return None
        except Exception as e:
            logger.warning(f"Gemini invocation exception: {e}")
            self.gemini_breaker.record_failure()
            return None

    async def call_groq(self, prompt: str, system_prompt: str) -> Optional[str]:
        """Calls Groq openai/gpt-oss-20b as first fallback."""
        if not self.groq_api_key or not self.groq_breaker.can_attempt():
            return None

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "openai/gpt-oss-20b",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 600
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices:
                        text = choices[0].get("message", {}).get("content", "")
                        self.groq_breaker.record_success()
                        return text
                logger.warning(f"Groq error response: {res.status_code}")
                self.groq_breaker.record_failure()
                return None
        except Exception as e:
            logger.warning(f"Groq invocation exception: {e}")
            self.groq_breaker.record_failure()
            return None

    async def generate_response(
        self,
        prompt: str,
        system_instruction: str,
        simulated_llm_outage: bool = False
    ) -> Tuple[Optional[str], str]:
        """
        Executes fallback hierarchy:
        Gemini 3.8 Flash -> Groq openai/gpt-oss-20b -> None (triggers deterministic template).
        Returns: (response_text, provider_used)
        """
        if simulated_llm_outage:
            logger.info("Demo failure switch active: LLM outage simulated")
            return None, "TEMPLATE"

        # 1. Try Gemini
        gemini_text = await self.call_gemini(prompt, system_instruction)
        if gemini_text:
            return gemini_text, "GEMINI"

        # 2. Try Groq Fallback
        groq_text = await self.call_groq(prompt, system_instruction)
        if groq_text:
            return groq_text, "GROQ"

        # 3. Fallback to deterministic template
        return None, "TEMPLATE"

# Global singleton instance
llm_adapter = LLMAdapter()
