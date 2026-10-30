from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class FormSpec(StrictModel):
    title: str = Field(default="Daily site update", min_length=3, max_length=80)
    description: str = Field(
        default="A quick update before you leave the site.", max_length=300
    )
    note_prompt: str = Field(
        default="What did you finish, what held you up, and what do you need tomorrow?",
        max_length=500,
    )
    blocker_question: str = Field(
        default="Has someone arranged what you need next?", max_length=300
    )
    require_delivery_photo: bool = False
    evidence_prompt: str = Field(
        default="Take a photo of the packaging or delivery label so the office can investigate.",
        max_length=400,
    )
    allow_exception: Literal[True] = True
    sites: list[str] = Field(
        default_factory=lambda: ["Elm House", "Oak Avenue", "Park Road"],
        min_length=1,
        max_length=20,
    )


class Interpretation(StrictModel):
    completed: str = Field(max_length=1000)
    blocker: str = Field(max_length=1000)
    next_action: str = Field(max_length=1000)
    issue: Literal[
        "wrong_material", "late_delivery", "weather", "other", "none", "uncertain"
    ]
    summary: str = Field(max_length=1000)


class PhotoObservation(StrictModel):
    visibility: Literal["visible", "not_visible", "indeterminate"]
    explanation: str = Field(max_length=500)


class CreateForm(StrictModel):
    brief: str = Field(min_length=10, max_length=4000)
    title: str = Field(default="Daily site update", min_length=3, max_length=80)


class RevisionRequest(StrictModel):
    feedback: str = Field(min_length=10, max_length=4000)


class StartSession(StrictModel):
    form_id: str


class NoteRequest(StrictModel):
    note: str = Field(min_length=5, max_length=6000)


class SaveSession(StrictModel):
    site: str
    day: date
    worker: str = Field(min_length=1, max_length=100)
    note: str = Field(min_length=5, max_length=6000)
    interpretation: Interpretation
    arranged: Literal["yes", "no", "unknown", ""] = ""
    exception: str = Field(default="", max_length=1000)


class Approval(StrictModel):
    artifact_hash: str


def photo_required(spec: FormSpec, interpretation: Interpretation) -> bool:
    return spec.require_delivery_photo and interpretation.issue == "wrong_material"


class ReviewDecision(StrictModel):
    note: str = Field(min_length=5, max_length=1000)
