#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -x .venv/bin/uvicorn || ! -d web/node_modules ]]; then
  echo 'First run: uv sync --python 3.12 && npm --prefix web ci'
  exit 1
fi
.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
api_pid=$!
cleanup() { kill "$api_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
npm --prefix web run dev -- --port 5173
