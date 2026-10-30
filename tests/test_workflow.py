import os
import tempfile

os.environ["MEDIA_DIR"] = tempfile.mkdtemp(prefix="fieldnote-test-media-")
os.environ["DATABASE_URL"] = "sqlite:///" + tempfile.mktemp(suffix=".db")
os.environ.pop("NEBIUS_API_KEY", None)
os.environ.pop("OWNER_TOKEN", None)
from fastapi.testclient import TestClient
from backend.main import app
from backend import store
from backend.evaluation import artifact_hash
from backend.contracts import FormSpec
import pytest

client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    monkeypatch.delenv("NEBIUS_API_KEY", raising=False)
    monkeypatch.delenv("VISION_API_KEY", raising=False)
    monkeypatch.delenv("OWNER_TOKEN", raising=False)
    store.Base.metadata.drop_all(store.engine)
    store.Base.metadata.create_all(store.engine)


def published():
    response = client.post(
        "/api/forms", json={"brief": "Ask what was completed and what held up work."}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    p = data["proposal"]
    assert (
        client.post(
            f"/api/proposals/{p['id']}/publish", json={"artifact_hash": p["hash"]}
        ).status_code
        == 409
    )
    assert client.post(f"/api/proposals/{p['id']}/evaluate").json()["passed"]
    release = client.post(
        f"/api/proposals/{p['id']}/publish", json={"artifact_hash": p["hash"]}
    )
    assert release.status_code == 200, release.text
    return data["form"], release.json()


def start(form):
    return client.post("/api/sessions", json={"form_id": form["id"]}).json()


def fill(session, exception=""):
    note = "Finished prep. Wrong tiles arrived. Need replacements tomorrow."
    result = client.post(
        f"/api/sessions/{session['id']}/interpret", json={"note": note}
    ).json()["interpretation"]
    response = client.put(
        f"/api/sessions/{session['id']}",
        json={
            "site": "Elm House",
            "day": "2026-10-30",
            "worker": "Sam",
            "note": note,
            "interpretation": result,
            "arranged": "no",
            "exception": exception,
        },
    )
    assert response.status_code == 200, response.text


def test_full_loop_pins_sessions_enforces_evidence_and_rollback():
    form, v1 = published()
    old = start(form)
    fill(old)
    assert client.post(f"/api/sessions/{old['id']}/submit").status_code == 200
    p = client.post(
        f"/api/forms/{form['id']}/proposals",
        json={"feedback": "Ask for a photo when wrong materials arrive."},
    ).json()
    client.post(f"/api/proposals/{p['id']}/evaluate")
    assert (
        client.post(
            f"/api/proposals/{p['id']}/publish", json={"artifact_hash": "invalid"}
        ).status_code
        == 409
    )
    v2 = client.post(
        f"/api/proposals/{p['id']}/publish", json={"artifact_hash": p["hash"]}
    ).json()
    assert v2["number"] == 2
    assert client.get(f"/api/sessions/{old['id']}").json()["version"] == 1
    new = start(form)
    fill(new)
    assert client.post(f"/api/sessions/{new['id']}/submit").status_code == 422
    fill(new, "Packaging was discarded before the update.")
    submitted = client.post(f"/api/sessions/{new['id']}/submit").json()
    assert submitted["review_required"]
    assert (
        client.post(f"/api/sessions/{new['id']}/submit").json()["id"] == submitted["id"]
    )
    assert (
        client.post(
            f"/api/sessions/{new['id']}/interpret", json={"note": "Change the report"}
        ).status_code
        == 409
    )
    assert (
        client.post(f"/api/forms/{form['id']}/rollback/{v1['id']}").status_code == 200
    )
    assert start(form)["version"] == 1
    assert client.get(f"/api/sessions/{new['id']}").json()["version"] == 2


def test_stale_proposal_cannot_overwrite_new_release():
    form, _ = published()
    ps = [
        client.post(
            f"/api/forms/{form['id']}/proposals",
            json={"feedback": "Add a delivery photo check."},
        ).json()
        for _ in range(2)
    ]
    for p in ps:
        client.post(f"/api/proposals/{p['id']}/evaluate")
    assert (
        client.post(
            f"/api/proposals/{ps[0]['id']}/publish",
            json={"artifact_hash": ps[0]["hash"]},
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/proposals/{ps[1]['id']}/publish",
            json={"artifact_hash": ps[1]["hash"]},
        ).status_code
        == 409
    )


def test_upload_rejects_fake_image_and_retains_pending_real_image():
    import io
    from PIL import Image

    form, _ = published()
    session = start(form)
    endpoint = f"/api/sessions/{session['id']}/photo"
    assert (
        client.post(
            endpoint,
            data={"site": "Elm House"},
            files={"file": ("photo.jpg", b"not an image", "image/jpeg")},
        ).status_code
        == 422
    )
    image = Image.new("RGB", (200, 200))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    result = client.post(
        endpoint,
        data={"site": "Elm House"},
        files={"file": ("photo.png", buffer.getvalue(), "image/png")},
    )
    assert result.status_code == 200
    assert result.json()["observation"]["status"] == "review"


def test_owner_auth_and_changed_transcript(monkeypatch):
    form, _ = published()
    session = start(form)
    fill(session)
    payload = client.get(f"/api/sessions/{session['id']}").json()["answers"]
    payload["note"] = "Different report"
    assert client.put(f"/api/sessions/{session['id']}", json=payload).status_code == 409
    monkeypatch.setenv("OWNER_TOKEN", "test-owner-token")
    assert client.get("/api/workspace").status_code == 401
    assert (
        client.get(
            "/api/workspace", headers={"Authorization": "Bearer test-owner-token"}
        ).status_code
        == 200
    )


def test_evidence_review_is_recorded_and_requires_owner(monkeypatch):
    form, _ = published()
    p = client.post(
        f"/api/forms/{form['id']}/proposals",
        json={"feedback": "Require a photo for wrong materials."},
    ).json()
    client.post(f"/api/proposals/{p['id']}/evaluate")
    client.post(f"/api/proposals/{p['id']}/publish", json={"artifact_hash": p["hash"]})
    session = start(form)
    fill(session, "Packaging is no longer available.")
    submission = client.post(f"/api/sessions/{session['id']}/submit").json()
    monkeypatch.setenv("OWNER_TOKEN", "owner-test")
    endpoint = f"/api/submissions/{submission['id']}/review"
    assert (
        client.post(endpoint, json={"note": "Confirmed with the worker."}).status_code
        == 401
    )
    reviewed = client.post(
        endpoint,
        json={"note": "Confirmed with the worker."},
        headers={"Authorization": "Bearer owner-test"},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["review_required"] is False
    assert reviewed.json()["review"]["decision"] == "office_reviewed"


def test_failed_live_provider_never_substitutes_demo(monkeypatch):
    from backend import intelligence

    monkeypatch.setenv("NEBIUS_API_KEY", "test-only-not-a-real-key")

    def fail(*args, **kwargs):
        raise intelligence.ProviderError("Model unavailable")

    monkeypatch.setattr(intelligence, "predict", fail)
    result = client.post(
        "/api/forms", json={"brief": "Collect a short daily work update."}
    )
    assert result.status_code == 502
    assert client.get("/api/workspace").json()["form"] == []


def test_experiment_split_manifest_is_disjoint():
    import json
    from pathlib import Path

    data = json.loads(Path("evals/interpretation.json").read_text())
    ids = []
    notes = []
    for split in ["train", "dev", "test"]:
        ids.extend(r["id"] for r in data[split])
        notes.extend(r["note"] for r in data[split])
    assert len(ids) == len(set(ids))
    assert len(notes) == len(set(notes))


def test_site_change_invalidates_photo_but_preserves_history():
    import io
    from PIL import Image

    form, _ = published()
    proposal = client.post(
        f"/api/forms/{form['id']}/proposals",
        json={"feedback": "Require a photo for wrong deliveries."},
    ).json()
    client.post(f"/api/proposals/{proposal['id']}/evaluate")
    client.post(
        f"/api/proposals/{proposal['id']}/publish",
        json={"artifact_hash": proposal["hash"]},
    )
    session = start(form)
    fill(session)
    buffer = io.BytesIO()
    Image.new("RGB", (200, 200)).save(buffer, format="PNG")
    endpoint = f"/api/sessions/{session['id']}/photo"
    uploaded = client.post(
        endpoint,
        data={"site": "Elm House"},
        files={"file": ("photo.png", buffer.getvalue(), "image/png")},
    )
    assert uploaded.status_code == 200
    payload = client.get(f"/api/sessions/{session['id']}").json()["answers"]
    payload["site"] = "Oak Avenue"
    saved = client.put(f"/api/sessions/{session['id']}", json=payload).json()
    assert saved["photo"] is None
    assert saved["photo_history"][-1]["site"] == "Elm House"
    assert client.post(f"/api/sessions/{session['id']}/submit").status_code == 422
    assert (
        client.post(
            endpoint,
            data={"site": "Unknown site"},
            files={"file": ("photo.png", buffer.getvalue(), "image/png")},
        ).status_code
        == 422
    )


def test_live_revision_patch_preserves_unrelated_fields(monkeypatch):
    from types import SimpleNamespace
    from backend import intelligence

    monkeypatch.setenv("NEBIUS_API_KEY", "test-only-not-a-key")
    monkeypatch.setattr(
        intelligence,
        "predict",
        lambda *a, **k: (
            SimpleNamespace(
                supported=True,
                require_delivery_photo=True,
                evidence_prompt="Photograph the delivery label.",
            ),
            {},
        ),
    )
    base = FormSpec(sites=["Custom site"], note_prompt="Our custom report question")
    revised, _ = intelligence.revise(base, "Please add delivery evidence.")
    assert revised.require_delivery_photo
    assert revised.sites == base.sites
    assert revised.note_prompt == base.note_prompt
    assert revised.allow_exception
    assert not base.require_delivery_photo


def test_optimization_budget_stops_before_dispatch():
    from evals.optimize import RequestBudget

    budget = RequestBudget(limit=1)
    with pytest.raises(RuntimeError):
        budget.reserve("x" * 50001, None)
    assert budget.calls == 0
    budget.reserve("small", None)
    with pytest.raises(RuntimeError):
        budget.reserve("another", None)
    assert budget.calls == 1


def test_retake_cannot_submit_without_exception(monkeypatch):
    import io
    from PIL import Image
    from backend import intelligence

    form, _ = published()
    proposal = client.post(
        f"/api/forms/{form['id']}/proposals",
        json={"feedback": "Ask for a photo of wrong deliveries."},
    ).json()
    client.post(f"/api/proposals/{proposal['id']}/evaluate")
    assert (
        client.post(
            f"/api/proposals/{proposal['id']}/publish",
            json={"artifact_hash": proposal["hash"]},
        ).status_code
        == 200
    )
    session = start(form)
    fill(session)
    monkeypatch.setattr(
        intelligence,
        "inspect_photo",
        lambda _: {
            "visibility": "not_visible",
            "status": "retake",
            "provider": "test",
            "explanation": "No packaging visible.",
        },
    )
    image = io.BytesIO()
    Image.new("RGB", (120, 120)).save(image, format="PNG")
    assert (
        client.post(
            f"/api/sessions/{session['id']}/photo",
            data={"site": "Elm House"},
            files={"file": ("photo.png", image.getvalue(), "image/png")},
        ).status_code
        == 200
    )
    assert client.post(f"/api/sessions/{session['id']}/submit").status_code == 422
    fill(session, exception="Packaging was removed before I arrived.")
    response = client.post(f"/api/sessions/{session['id']}/submit")
    assert response.status_code == 200
    assert response.json()["review_required"]


def test_all_fifteen_templates_compile_and_publish():
    templates = client.get("/api/templates").json()
    assert len(templates) == 15
    assert len({t["id"] for t in templates}) == 15
    for template in templates:
        created = client.post(
            "/api/forms",
            json={
                "template_id": template["id"],
                "title": template["name"],
                "brief": template["brief"],
            },
        )
        assert created.status_code == 200, created.text
        p = created.json()["proposal"]
        report = client.post(f"/api/proposals/{p['id']}/evaluate")
        assert report.json()["passed"], report.text
        published = client.post(
            f"/api/proposals/{p['id']}/publish", json={"artifact_hash": p["hash"]}
        )
        assert published.status_code == 200, published.text
        assert published.json()["spec"]["template_id"] == template["id"]
    assert (
        client.post(
            "/api/forms",
            json={"template_id": "invented", "brief": "This must not call any models."},
        ).status_code
        == 422
    )


def test_negative_feedback_routes_and_improves_next_version():
    from backend.contracts import active_questions, Interpretation

    p = client.post(
        "/api/forms",
        json={
            "template_id": "course-feedback",
            "title": "Course feedback",
            "brief": "Collect the course experience and adapt questions to negative feedback.",
        },
    ).json()["proposal"]
    client.post(f"/api/proposals/{p['id']}/evaluate")
    client.post(f"/api/proposals/{p['id']}/publish", json={"artifact_hash": p["hash"]})
    form = {"id": p["form_id"]}
    old = start(form)

    def answer(session, followups):
        note = "The instructor was helpful but the assignments were confusing and too fast."
        interpretation = client.post(
            f"/api/sessions/{session['id']}/interpret", json={"note": note}
        ).json()["interpretation"]
        assert interpretation["issue"] == "negative_feedback"
        return client.put(
            f"/api/sessions/{session['id']}",
            json={
                "site": "AI Foundations",
                "day": "2026-10-30",
                "worker": "Learner",
                "note": note,
                "interpretation": interpretation,
                "arranged": "no",
                "followups": followups,
            },
        )

    assert answer(old, {}).status_code == 200
    assert client.post(f"/api/sessions/{old['id']}/submit").status_code == 422
    assert (
        answer(old, {"context-detail": "The practical assignments."}).status_code == 200
    )
    assert client.post(f"/api/sessions/{old['id']}/submit").status_code == 200
    revision = client.post(
        f"/api/forms/{form['id']}/proposals",
        json={
            "feedback": "After negative feedback also ask what specific example would have helped."
        },
    ).json()
    assert len(revision["spec"]["follow_up_rules"]) == 2
    assert client.post(f"/api/proposals/{revision['id']}/evaluate").json()["passed"]
    assert (
        client.post(
            f"/api/proposals/{revision['id']}/publish",
            json={"artifact_hash": revision["hash"]},
        ).status_code
        == 200
    )
    assert (
        len(client.get(f"/api/sessions/{old['id']}").json()["spec"]["follow_up_rules"])
        == 1
    )
    new = start(form)
    assert new["version"] == 2
    assert answer(new, {"context-detail": "Assignments."}).status_code == 200
    assert client.post(f"/api/sessions/{new['id']}/submit").status_code == 422
    assert (
        answer(
            new,
            {
                "context-detail": "Assignments.",
                "followup-2": "A worked example with a small dataset.",
            },
        ).status_code
        == 200
    )
    submitted = client.post(f"/api/sessions/{new['id']}/submit").json()
    assert submitted["answers"]["followups"]["followup-2"].startswith(
        "A worked example"
    )
    positive = Interpretation(
        completed="Useful course",
        blocker="",
        next_action="",
        issue="none",
        summary="Helpful",
    )
    assert active_questions(FormSpec.model_validate(new["spec"]), positive) == []
