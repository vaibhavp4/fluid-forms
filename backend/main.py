import base64
import hashlib
import hmac
import io
import os
from pathlib import Path
from uuid import uuid4
from datetime import date
from dotenv import load_dotenv

load_dotenv()
from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    Header,
    UploadFile,
    File,
    Form as UploadForm,
)
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.exc import IntegrityError
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from sqlalchemy import update
from . import store
from .contracts import *
from . import intelligence as ai
from .evaluation import artifact_hash, evaluate_spec

app = FastAPI(title="Fieldnote", version="0.1.0")
store.Base.metadata.create_all(store.engine)


@app.exception_handler(IntegrityError)
async def conflict_handler(request, exc):
    return JSONResponse(
        status_code=409,
        content={
            "detail": "A concurrent update completed first. Retry to retrieve the saved result."
        },
    )


MEDIA = Path(os.getenv("MEDIA_DIR", ".data/media"))
MEDIA.mkdir(parents=True, exist_ok=True)


def owner(authorization: str = Header(default="")):
    token = os.getenv("OWNER_TOKEN")
    if token and not hmac.compare_digest(authorization, f"Bearer {token}"):
        raise HTTPException(401, "Owner access required")


def get(db, id, kind):
    row = db.get(store.Record, id)
    if not row or row.kind != kind:
        raise HTTPException(404, "Record not found")
    return row


def mutable(session):
    if session.data.get("submitted"):
        raise HTTPException(409, "This update has already been submitted")


def provider_call(fn, *args):
    try:
        return fn(*args)
    except ai.ProviderError as exc:
        raise HTTPException(502, str(exc)) from exc


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "mode": "live" if ai.live() else "demo",
        "model": os.getenv("NEBIUS_MODEL", "nvidia/Nemotron-3_5-Lightning")
        if ai.live()
        else None,
        "vision": bool(
            os.getenv("VISION_MODEL")
            and (os.getenv("VISION_API_KEY") or os.getenv("NEBIUS_API_KEY"))
        ),
        "owner_auth": bool(os.getenv("OWNER_TOKEN")),
    }


@app.get("/api/workspace", dependencies=[Depends(owner)])
def workspace():
    with store.Session() as db:
        return {
            kind: [store.serial(r) for r in store.records(db, kind)]
            for kind in ["form", "release", "submission", "proposal"]
        }


@app.post("/api/forms", dependencies=[Depends(owner)])
def create_form(body: CreateForm):
    spec, trace = provider_call(ai.compose, body.brief, body.title)
    with store.Session.begin() as db:
        form = store.create(
            db,
            "form",
            {"title": spec.title, "current_release": None, "brief": body.brief},
        )
        proposal = store.create(
            db,
            "proposal",
            {
                "form_id": form.id,
                "base_release": None,
                "spec": spec.model_dump(),
                "feedback": body.brief,
                "status": "draft",
                "trace": trace,
                "hash": artifact_hash(spec),
                "evaluation": None,
            },
        )
        return {"form": store.serial(form), "proposal": store.serial(proposal)}


@app.post("/api/forms/{form_id}/proposals", dependencies=[Depends(owner)])
def create_proposal(form_id: str, body: RevisionRequest):
    with store.Session() as db:
        form = get(db, form_id, "form")
        if not form.data["current_release"]:
            raise HTTPException(409, "Publish the initial draft first")
        release = get(db, form.data["current_release"], "release")
        base_id = release.id
        spec = FormSpec.model_validate(release.data["spec"])
    candidate, trace = provider_call(ai.revise, spec, body.feedback)
    with store.Session.begin() as db:
        proposal = store.create(
            db,
            "proposal",
            {
                "form_id": form_id,
                "base_release": base_id,
                "spec": candidate.model_dump(),
                "feedback": body.feedback,
                "status": "draft",
                "trace": trace,
                "hash": artifact_hash(candidate),
                "evaluation": None,
            },
        )
        return store.serial(proposal)


@app.post("/api/proposals/{proposal_id}/evaluate", dependencies=[Depends(owner)])
def evaluate(proposal_id: str):
    with store.Session.begin() as db:
        proposal = get(db, proposal_id, "proposal")
        baseline = (
            get(db, proposal.data["base_release"], "release").data["spec"]
            if proposal.data["base_release"]
            else None
        )
        report = evaluate_spec(
            FormSpec.model_validate(proposal.data["spec"]),
            FormSpec.model_validate(baseline) if baseline else None,
        )
        proposal.data = {**proposal.data, "evaluation": report}
        return report


@app.post("/api/proposals/{proposal_id}/publish", dependencies=[Depends(owner)])
def publish(proposal_id: str, body: Approval):
    with store.Session.begin() as db:
        proposal = get(db, proposal_id, "proposal")
        if proposal.data["status"] != "draft":
            raise HTTPException(409, "This proposal has already been published")
        if body.artifact_hash != proposal.data["hash"]:
            raise HTTPException(409, "The approved artifact does not match this draft")
        report = proposal.data.get("evaluation")
        if (
            not report
            or not report["passed"]
            or report["artifact_hash"] != body.artifact_hash
        ):
            raise HTTPException(
                409, "Run and pass the contract checks before publishing"
            )
        form = get(db, proposal.data["form_id"], "form")
        if form.data["current_release"] != proposal.data["base_release"]:
            raise HTTPException(409, "A newer version exists. Create a fresh proposal.")
        previous = form.data.copy()
        releases = [
            r for r in store.records(db, "release") if r.data["form_id"] == form.id
        ]
        release = store.create(
            db,
            "release",
            {
                "form_id": form.id,
                "number": len(releases) + 1,
                "spec": proposal.data["spec"],
                "hash": body.artifact_hash,
                "proposal_id": proposal.id,
                "evaluation": report,
                "approved_at": store.now(),
            },
        )
        # Compare-and-swap prevents concurrent approvals from losing a release.
        result = db.execute(
            update(store.Record)
            .where(
                store.Record.id == form.id,
                store.Record.data["current_release"].as_string()
                == proposal.data["base_release"],
            )
            .values(
                data={
                    **previous,
                    "current_release": release.id,
                    "title": release.data["spec"]["title"],
                }
            )
        )
        if result.rowcount != 1:
            raise HTTPException(409, "Concurrent publication; reload and retry")
        proposal.data = {
            **proposal.data,
            "status": "published",
            "release_id": release.id,
        }
        return store.serial(release)


@app.post("/api/forms/{form_id}/rollback/{release_id}", dependencies=[Depends(owner)])
def rollback(form_id: str, release_id: str):
    with store.Session.begin() as db:
        form = get(db, form_id, "form")
        release = get(db, release_id, "release")
        if release.data["form_id"] != form.id:
            raise HTTPException(400, "Release belongs to a different form")
        prior = form.data["current_release"]
        form.data = {
            **form.data,
            "current_release": release_id,
            "title": release.data["spec"]["title"],
        }
        store.create(
            db,
            "audit",
            {"action": "rollback", "form_id": form_id, "from": prior, "to": release_id},
        )
        return {"ok": True}


@app.post("/api/sessions")
def start_session(body: StartSession):
    with store.Session.begin() as db:
        form = get(db, body.form_id, "form")
        if not form.data["current_release"]:
            raise HTTPException(409, "This form is not published yet")
        release = get(db, form.data["current_release"], "release")
        session = store.create(
            db,
            "session",
            {
                "form_id": form.id,
                "release_id": release.id,
                "version": release.data["number"],
                "spec": release.data["spec"],
                "answers": None,
                "photo": None,
                "submitted": False,
            },
        )
        return store.serial(session)


@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    with store.Session() as db:
        return store.serial(get(db, session_id, "session"))


@app.post("/api/sessions/{session_id}/interpret")
def interpret(session_id: str, body: NoteRequest):
    with store.Session() as db:
        mutable(get(db, session_id, "session"))
    interpretation, trace = provider_call(ai.interpret, body.note)
    with store.Session.begin() as db:
        session = get(db, session_id, "session")
        mutable(session)
        session.data = {
            **session.data,
            "last_interpretation": {
                "note": body.note,
                "result": interpretation.model_dump(),
                "trace": trace,
            },
        }
    return {"interpretation": interpretation.model_dump(), "trace": trace}


@app.put("/api/sessions/{session_id}")
def save(session_id: str, body: SaveSession):
    with store.Session.begin() as db:
        session = get(db, session_id, "session")
        mutable(session)
        if body.site not in session.data["spec"]["sites"]:
            raise HTTPException(422, "Choose a site from this form")
        if not body.worker.strip():
            raise HTTPException(422, "Enter your name")
        last = session.data.get("last_interpretation")
        if not last or last["note"] != body.note:
            raise HTTPException(409, "Review the updated note before saving")
        photo = session.data.get("photo")
        history = session.data.get("photo_history", [])
        if photo and photo.get("site") != body.site:
            history = history + [photo]
            photo = None
        session.data = {
            **session.data,
            "answers": body.model_dump(mode="json"),
            "photo": photo,
            "photo_history": history,
        }
        return store.serial(session)


@app.post("/api/sessions/{session_id}/photo")
async def photo(
    session_id: str, file: UploadFile = File(...), site: str = UploadForm(...)
):
    with store.Session() as db:
        current = get(db, session_id, "session")
        mutable(current)
        if site not in current.data["spec"]["sites"]:
            raise HTTPException(422, "Choose a site from this form before uploading")
    raw = await file.read(8 * 1024 * 1024 + 1)
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(413, "Use a photo smaller than 8 MB")
    try:
        with Image.open(io.BytesIO(raw)) as image:
            if image.width * image.height > 24_000_000:
                raise ValueError("Image too large")
            image.load()
            if min(image.size) < 100:
                raise ValueError("Photo too small")
            from PIL import ImageOps

            image = ImageOps.exif_transpose(image).convert("RGB")
            image.thumbnail((1600, 1600))
            output = io.BytesIO()
            image.save(output, format="JPEG", quality=85)
            normalized = output.getvalue()
    except (
        UnidentifiedImageError,
        ValueError,
        OSError,
        Image.DecompressionBombError,
    ) as exc:
        raise HTTPException(
            422,
            "Upload a decodable photo at least 100 pixels wide and tall, up to 24 megapixels",
        ) from exc
    import asyncio

    observation = await asyncio.to_thread(
        ai.inspect_photo,
        "data:image/jpeg;base64," + base64.b64encode(normalized).decode(),
    )
    media_id = uuid4().hex
    with store.Session.begin() as db:
        session = get(db, session_id, "session")
        mutable(session)
        (MEDIA / f"{media_id}.jpg").write_bytes(normalized)
        session.data = {
            **session.data,
            "photo_history": session.data.get("photo_history", [])
            + ([session.data["photo"]] if session.data.get("photo") else []),
            "photo": {
                "site": site,
                "id": media_id,
                "hash": hashlib.sha256(normalized).hexdigest(),
                "observation": observation,
            },
        }
        return session.data["photo"]


@app.get("/api/sessions/{session_id}/photo")
def view_photo(session_id: str):
    with store.Session() as db:
        session = get(db, session_id, "session")
        if not session.data["photo"]:
            raise HTTPException(404, "No photo")
        return FileResponse(
            MEDIA / f"{session.data['photo']['id']}.jpg", media_type="image/jpeg"
        )


@app.post("/api/sessions/{session_id}/submit")
def submit(session_id: str):
    with store.Session.begin() as db:
        session = get(db, session_id, "session")
        if session.data.get("submission_id"):
            return store.serial(get(db, session.data["submission_id"], "submission"))
        answers = session.data.get("answers")
        if not answers:
            raise HTTPException(422, "Review and save your answers first")
        data = SaveSession.model_validate(answers)
        needed = photo_required(
            FormSpec.model_validate(session.data["spec"]), data.interpretation
        )
        if data.interpretation.issue not in ["none", "uncertain"] and not data.arranged:
            raise HTTPException(422, "Tell us whether the next step has been arranged")
        evidence = session.data.get("photo")
        if evidence and evidence.get("site") != data.site:
            raise HTTPException(
                409,
                "This photo belongs to a different site. Upload evidence for the selected site.",
            )
        if needed and not evidence and len(data.exception.strip()) < 5:
            raise HTTPException(
                422, "Add delivery evidence or explain why it cannot be obtained"
            )
        if (
            needed
            and evidence
            and evidence["observation"]["status"] == "retake"
            and len(data.exception.strip()) < 5
        ):
            raise HTTPException(
                422, "Retake the photo or explain why it cannot be replaced"
            )
        review = needed and (
            not evidence or evidence["observation"]["status"] != "accepted"
        )
        submission = store.create(
            db,
            "submission",
            {
                "form_id": session.data["form_id"],
                "release_id": session.data["release_id"],
                "version": session.data["version"],
                "session_id": session.id,
                "answers": answers,
                "photo": evidence,
                "review_required": review,
                "sample": False,
                "trace": session.data.get("last_interpretation", {}).get("trace", {}),
            },
            id="sub-" + session.id,
        )
        session.data = {
            **session.data,
            "submitted": True,
            "submission_id": submission.id,
        }
        return store.serial(submission)


@app.post("/api/demo/seed", dependencies=[Depends(owner)])
def seed():
    with store.Session.begin() as db:
        if any(r.data.get("sample") for r in store.records(db, "form")):
            return {"ok": True}
        spec = FormSpec()
        report = evaluate_spec(spec)
        form = store.create(
            db,
            "form",
            {
                "title": spec.title,
                "current_release": None,
                "brief": "Prepared sample workflow",
                "sample": True,
            },
        )
        release = store.create(
            db,
            "release",
            {
                "form_id": form.id,
                "number": 1,
                "spec": spec.model_dump(),
                "hash": artifact_hash(spec),
                "evaluation": report,
                "approved_at": store.now(),
                "sample": True,
            },
        )
        form.data = {**form.data, "current_release": release.id}
        for site, note, name in [
            (
                "Elm House",
                "Finished bathroom prep. Couldn't start tiling because the wrong tiles arrived. We need the right ones tomorrow.",
                "Sam",
            ),
            ("Oak Avenue", "First fix completed. Ready for plastering.", "Alex"),
            ("Park Road", "Kitchen preparation complete.", "Jamie"),
        ]:
            result = ai.interpret_demo(note)
            store.create(
                db,
                "submission",
                {
                    "form_id": form.id,
                    "release_id": release.id,
                    "version": 1,
                    "session_id": None,
                    "answers": {
                        "site": site,
                        "day": str(date.today()),
                        "worker": name,
                        "note": note,
                        "interpretation": result.model_dump(),
                        "arranged": "no" if result.issue != "none" else "",
                        "exception": "",
                    },
                    "photo": None,
                    "review_required": False,
                    "sample": True,
                    "trace": {"provider": "prepared_sample"},
                },
            )
        return {"ok": True}


@app.post("/api/submissions/{submission_id}/review", dependencies=[Depends(owner)])
def review_submission(submission_id: str, body: ReviewDecision):
    with store.Session.begin() as db:
        submission = get(db, submission_id, "submission")
        if not submission.data["review_required"]:
            raise HTTPException(409, "This submission does not need evidence review")
        submission.data = {
            **submission.data,
            "review_required": False,
            "review": {
                "note": body.note,
                "at": store.now(),
                "decision": "office_reviewed",
            },
        }
        store.create(
            db,
            "audit",
            {
                "action": "evidence_review",
                "submission_id": submission.id,
                "note": body.note,
            },
        )
        return store.serial(submission)


@app.get("/api/evaluations", dependencies=[Depends(owner)])
def evaluation_reports():
    path = Path(".data/evaluation-report.json")
    import json

    return (
        json.loads(path.read_text())
        if path.exists()
        else {
            "status": "not_run",
            "message": "No model optimization experiment has been run. Contract checks are reported separately.",
        }
    )


if Path("web/dist").exists():
    app.mount("/assets", StaticFiles(directory="web/dist/assets"), name="assets")

    @app.get("/{path:path}")
    def frontend(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        return FileResponse("web/dist/index.html")
