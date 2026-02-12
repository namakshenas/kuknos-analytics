#!/usr/bin/env bash
set -e

# Fix potential npm permission issues (Req7)
if [ -d "frontend/node_modules" ]; then
  sudo chown -R "$(whoami)" frontend/node_modules
fi
if [ -d "frontend" ]; then
  sudo chown -R "$(whoami)" frontend/
fi

# Backend
echo ">>> Starting backend..."
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Frontend
echo ">>> Starting frontend..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo ">>> Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo ">>> Backend: http://localhost:8000/docs"
echo ">>> Frontend: http://localhost:5173"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
