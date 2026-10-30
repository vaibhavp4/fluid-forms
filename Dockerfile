FROM node:22-alpine AS frontend
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:0.9.5 /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY backend/ backend/
COPY scripts/ scripts/
COPY evals/ evals/
COPY docs/evidence/ docs/evidence/
COPY --from=frontend /web/dist web/dist/
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
VOLUME ["/app/.data"]
CMD [".venv/bin/python", "scripts/serve.py", "--host", "0.0.0.0", "--port", "8000"]
