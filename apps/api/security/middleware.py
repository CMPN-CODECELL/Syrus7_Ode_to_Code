"""Security, Rate Limiting, and Correlation ID Middleware for KrishiNirnay.
"""

import time
import uuid
from typing import Dict, List
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_body_bytes: int = 1048576, rate_limit_per_min: int = 60):
        super().__init__(app)
        self.max_body_bytes = max_body_bytes
        self.rate_limit_per_min = rate_limit_per_min
        self.request_timestamps: Dict[str, List[float]] = {}

    async def dispatch(self, request: Request, call_next):
        # 1. Assign or propagate correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or f"corr-{uuid.uuid4().hex[:12]}"
        request.state.correlation_id = correlation_id

        # 2. Rate limiting by client IP
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        timestamps = self.request_timestamps.get(client_ip, [])
        # Keep only timestamps in last 60 seconds
        timestamps = [t for t in timestamps if now - t < 60.0]
        if len(timestamps) >= self.rate_limit_per_min:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded. Please wait a moment.",
                    "correlation_id": correlation_id
                },
                headers={"X-Correlation-ID": correlation_id}
            )
        timestamps.append(now)
        self.request_timestamps[client_ip] = timestamps

        # 3. Process request
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
