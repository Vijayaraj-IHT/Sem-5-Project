#!/usr/bin/env bash
# ==============================================================================
# LexGuard Judicial Repository & Verification System — Launcher (.sh)
# Compatible with Git Bash, MSYS2, WSL, and Linux terminal environments
# ==============================================================================

# Detect platform and resolve project directory
if [ -d "/e/SEM 5 PROJECT/Lexguard" ]; then
    PROJECT_DIR="/e/SEM 5 PROJECT/Lexguard"
elif [ -d "/mnt/e/SEM 5 PROJECT/Lexguard" ]; then
    PROJECT_DIR="/mnt/e/SEM 5 PROJECT/Lexguard"
elif [ -d "E:/SEM 5 PROJECT/Lexguard" ]; then
    PROJECT_DIR="E:/SEM 5 PROJECT/Lexguard"
else
    PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

echo "===================================================================="
echo "  ⚖️  Starting LexGuard Judicial Repository & Verification System"
echo "  Project Path: ${PROJECT_DIR}"
echo "===================================================================="

cd "${PROJECT_DIR}"

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "===================================================================="
    echo "  Shutting down LexGuard services..."
    echo "===================================================================="
    if [ -n "${BACKEND_PID}" ]; then
        kill "${BACKEND_PID}" 2>/dev/null || true
    fi
    if [ -n "${FRONTEND_PID}" ]; then
        kill "${FRONTEND_PID}" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start FastAPI Backend Server
echo "[1/3] Starting FastAPI Backend on http://127.0.0.1:8000..."
cd "${PROJECT_DIR}/backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend initialization
sleep 3

# 2. Start Vite Frontend Server
echo "[2/3] Starting Vite Frontend on http://127.0.0.1:5173..."
cd "${PROJECT_DIR}/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

sleep 2

# 3. Launch Web Browser
echo "[3/3] Launching web browser..."
URL="http://127.0.0.1:5173"
if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "${URL}" || true
elif command -v start >/dev/null 2>&1; then
    start "${URL}" || true
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${URL}" || true
fi

echo ""
echo "===================================================================="
echo "  ✅ LexGuard is Running Successfully!"
echo "  Frontend Application: http://127.0.0.1:5173"
echo "  Backend API Server:   http://127.0.0.1:8000"
echo "  API Documentation:    http://127.0.0.1:8000/api/v1/docs"
echo "  System Health:        http://127.0.0.1:8000/health"
echo "===================================================================="
echo "  Pre-seeded Demo Logins:"
echo "    - Staff:    staff@court.gov.in    / staff123"
echo "    - Advocate: advocate@bar.in       / advocate123"
echo "    - Scholar:  scholar@law.edu       / scholar123"
echo "    - Public:   public@citizen.in     / public123"
echo "===================================================================="
echo "  Press [CTRL + C] anytime in this terminal to gracefully stop all services."
echo "===================================================================="

# Keep running until user terminates
wait
