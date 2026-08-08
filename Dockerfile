# ---------- Stage 1: Build frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---------- Stage 2: Runtime (nginx + backend) ----------
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS runtime

# Install nginx
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx \
    && rm -f /etc/nginx/sites-enabled/default \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend dependencies and the app package
COPY backend/pyproject.toml backend/uv.lock ./
COPY backend/app ./app
RUN uv sync --frozen --no-dev

# Copy built frontend into nginx webroot
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# nginx site config + entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV BACKEND_HOST=0.0.0.0
ENV BACKEND_PORT=8000
ENV UVICORN_WORKERS=4

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
