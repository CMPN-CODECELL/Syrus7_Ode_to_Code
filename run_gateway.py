"""Launcher script for KrishiNirnay FastAPI Gateway."""

import uvicorn

if __name__ == "__main__":
    print("🌾 Starting KrishiNirnay Gateway at http://localhost:8000 ...")
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
