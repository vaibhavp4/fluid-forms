"""Explicit anonymous sandbox boundary and persistent abuse limits.

PUBLIC_DEMO must use its own SQLite database, media directory and quota ledger.
No owner credential is sent to the anonymous browser.
"""

import os
import sqlite3
import time
from pathlib import Path
from sqlalchemy.engine import make_url


class DemoLimitError(Exception):
    pass


def public_demo():
    return os.getenv("PUBLIC_DEMO") == "1"


def validate_demo_environment():
    if not public_demo():
        return
    raw = os.getenv("DEMO_DATA_ROOT", "")
    if not raw or not Path(raw).is_absolute():
        raise RuntimeError("PUBLIC_DEMO requires a dedicated absolute DEMO_DATA_ROOT")
    root = Path(raw).resolve()
    if root == Path("/var/lib/fieldnote") or root == Path(".data").resolve():
        raise RuntimeError("Public demo cannot use the private workspace directory")
    url = make_url(os.getenv("DATABASE_URL", ""))
    if (
        url.drivername != "sqlite"
        or not url.database
        or Path(url.database).resolve() != root / "demo.db"
    ):
        raise RuntimeError("Public demo database must be DEMO_DATA_ROOT/demo.db")
    if Path(os.getenv("MEDIA_DIR", "")).resolve() != root / "media":
        raise RuntimeError("Public demo media must be DEMO_DATA_ROOT/media")


def reserve(kind):
    """Reserve before dispatch, in a transaction shared across workers and restarts."""
    if not public_demo():
        return
    validate_demo_environment()
    root = Path(os.environ["DEMO_DATA_ROOT"])
    root.mkdir(parents=True, exist_ok=True)
    now = time.time()
    with sqlite3.connect(root / "limits.db", timeout=10) as db:
        db.execute(
            "create table if not exists events (kind text not null, at real not null)"
        )
        db.execute("begin immediate")
        total = db.execute(
            "select count(*) from events where kind=?", (kind,)
        ).fetchone()[0]
        recent = db.execute(
            "select count(*) from events where kind=? and at>?", (kind, now - 60)
        ).fetchone()[0]
        total_limit = (
            int(os.getenv("DEMO_AI_REQUEST_LIMIT", "500"))
            if kind == "ai"
            else int(os.getenv("DEMO_WRITE_LIMIT", "2000"))
        )
        minute_limit = (
            int(os.getenv("DEMO_AI_PER_MINUTE", "12"))
            if kind == "ai"
            else int(os.getenv("DEMO_WRITES_PER_MINUTE", "60"))
        )
        if total >= total_limit:
            raise DemoLimitError(
                "The shared demo usage allowance has been reached. Existing examples remain available; please contact the project owner for more live usage."
            )
        if recent >= minute_limit:
            raise DemoLimitError(
                "The shared demo is busy. Please wait a minute and try again."
            )
        db.execute("insert into events(kind,at) values(?,?)", (kind, now))


def ai_usage():
    if not public_demo():
        return None
    root = Path(os.environ["DEMO_DATA_ROOT"])
    path = root / "limits.db"
    used = 0
    if path.exists():
        with sqlite3.connect(path) as db:
            used = db.execute("select count(*) from events where kind='ai'").fetchone()[
                0
            ]
    return {"used": used, "limit": int(os.getenv("DEMO_AI_REQUEST_LIMIT", "500"))}
