#!/usr/bin/env bash
set -e

echo ">>> Starting nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

cleanup() {
  kill "$NGINX_PID" 2>/dev/null || true
}
trap cleanup SIGTERM SIGINT EXIT

echo ">>> Starting backend on ${BACKEND_HOST}:${BACKEND_PORT}..."
exec /app/.venv/bin/uvicorn app.main:app \
  --host "${BACKEND_HOST:-0.0.0.0}" \
  --port "${BACKEND_PORT:-8000}" \
  --workers "${UVICORN_WORKERS:-4}"
