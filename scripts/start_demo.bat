@echo off
echo ======================================================================
echo Starting KrishiNirnay: AI Market and Risk Intelligence for Agri Supply Chains
echo Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe."
echo ======================================================================

echo [1/2] Starting FastAPI Public Gateway on http://localhost:8000 ...
start "KrishiNirnay Gateway" cmd /k "python run_gateway.py"

echo [2/2] Starting React + Vite PWA Companion on http://localhost:3000 ...
start "KrishiNirnay PWA" cmd /k "cd apps\web && npm run dev"

echo.
echo Both services launched! 
echo Open browser at: http://localhost:3000
echo FastAPI Docs at: http://localhost:8000/docs
pause
