import os
import subprocess
import sys
import pytest
from backend import demo


@pytest.fixture
def sandbox(monkeypatch, tmp_path):
    monkeypatch.setenv("PUBLIC_DEMO", "1")
    monkeypatch.setenv("DEMO_DATA_ROOT", str(tmp_path))
    monkeypatch.setenv("DATABASE_URL", "sqlite:///" + str(tmp_path / "demo.db"))
    monkeypatch.setenv("MEDIA_DIR", str(tmp_path / "media"))
    return tmp_path


def test_demo_requires_separate_storage(sandbox, monkeypatch):
    demo.validate_demo_environment()
    monkeypatch.setenv("DATABASE_URL", "sqlite:////var/lib/fieldnote/fieldnote.db")
    with pytest.raises(RuntimeError):
        demo.validate_demo_environment()
    monkeypatch.setenv("DATABASE_URL", "sqlite:///" + str(sandbox / "demo.db"))
    monkeypatch.setenv("MEDIA_DIR", "/var/lib/fieldnote/media")
    with pytest.raises(RuntimeError):
        demo.validate_demo_environment()


def test_demo_quota_persists_across_processes(sandbox, monkeypatch):
    monkeypatch.setenv("DEMO_AI_REQUEST_LIMIT", "2")
    monkeypatch.setenv("DEMO_AI_PER_MINUTE", "10")
    demo.reserve("ai")
    demo.reserve("ai")
    subprocess.run(
        [
            sys.executable,
            "-c",
            "from backend.demo import ai_usage; assert ai_usage()['used'] == 2",
        ],
        check=True,
    )
    assert demo.ai_usage() == {"used": 2, "limit": 2}
    with pytest.raises(demo.DemoLimitError):
        demo.reserve("ai")
    assert demo.ai_usage()["used"] == 2


def test_demo_limits_apply_before_inference(sandbox, monkeypatch):
    from backend import intelligence

    monkeypatch.setenv("NEBIUS_API_KEY", "test-only")
    monkeypatch.setenv("DEMO_AI_REQUEST_LIMIT", "0")
    model = intelligence.lm()
    with pytest.raises(demo.DemoLimitError):
        model.forward(messages=[{"role": "user", "content": "Must never dispatch"}])
    assert demo.ai_usage()["used"] == 0


def test_demo_mutation_rate_limit(sandbox, monkeypatch):
    monkeypatch.setenv("DEMO_WRITES_PER_MINUTE", "1")
    demo.reserve("write")
    with pytest.raises(demo.DemoLimitError):
        demo.reserve("write")


def test_public_access_keeps_private_database_isolated(sandbox, monkeypatch):
    """Fresh imports bind each application to its own database, as in deployment."""
    monkeypatch.setenv("OWNER_TOKEN", "private-test-token")
    private_env = dict(
        os.environ,
        PUBLIC_DEMO="0",
        DATABASE_URL="sqlite:///" + str(sandbox / "private.db"),
    )
    private = """
from fastapi.testclient import TestClient
from backend.main import app
from backend import store
with store.Session.begin() as db:
    store.create(db, 'form', {'title': 'Private workspace'}, id='private-record')
client = TestClient(app)
assert client.get('/api/workspace').status_code == 401
assert client.get('/api/workspace', headers={'Authorization': 'Bearer private-test-token'}).json()['form'][0]['id'] == 'private-record'
"""
    subprocess.run([sys.executable, "-c", private], env=private_env, check=True)
    public = """
from fastapi.testclient import TestClient
from backend.main import app
client = TestClient(app)
health = client.get('/api/health').json()
assert health['public_demo'] and not health['owner_auth']
assert client.get('/api/workspace').json()['form'] == []
assert client.post('/api/sessions', json={'form_id': 'private-record'}).status_code == 404
assert client.post('/api/demo/seed').status_code == 200
assert client.get('/api/workspace').json()['form']
assert client.post('/api/forms', content='x', headers={'Content-Length': '100000'}).status_code == 413
"""
    subprocess.run([sys.executable, "-c", public], check=True)


def test_api_returns_429_when_ai_budget_exhausted(sandbox, monkeypatch):
    monkeypatch.setenv("NEBIUS_API_KEY", "test-only")
    monkeypatch.setenv("DEMO_AI_REQUEST_LIMIT", "0")
    code = """
from fastapi.testclient import TestClient
from backend.main import app
client = TestClient(app)
response = client.post('/api/forms', json={'brief': 'Collect feedback for a learning course.'})
assert response.status_code == 429, response.text
assert response.headers['retry-after'] == '60'
assert client.get('/api/workspace').json()['form'] == []
"""
    subprocess.run([sys.executable, "-c", code], check=True)
