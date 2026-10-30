"""Serve the built application. Refuse accidental unauthenticated public exposure."""

import sys
import argparse
import os
from pathlib import Path
from dotenv import load_dotenv
import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
load_dotenv()
parser = argparse.ArgumentParser()
parser.add_argument("--host", default="127.0.0.1")
parser.add_argument("--port", type=int, default=8000)
args = parser.parse_args()
if not Path("web/dist/index.html").exists():
    raise SystemExit("Build the frontend first: npm --prefix web run build")
if args.host not in ["127.0.0.1", "localhost", "::1"] and not os.getenv("OWNER_TOKEN"):
    raise SystemExit(
        "Set OWNER_TOKEN before exposing the owner workspace beyond localhost."
    )
uvicorn.run("backend.main:app", host=args.host, port=args.port)
