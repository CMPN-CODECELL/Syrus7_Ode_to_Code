import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

import uvicorn

if __name__ == "__main__":
    print("[KrishiNirnay] Starting Gateway at http://localhost:8000 ...")
    uvicorn.run("apps.api.main:app", host="0.0.0.0", port=8000, reload=True)
