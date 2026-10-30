"""Deterministic contract regression checks, distinct from model-quality evidence."""

import hashlib
import json
from .contracts import FormSpec, Interpretation, photo_required, active_questions


def artifact_hash(spec):
    data = spec.model_dump() if isinstance(spec, FormSpec) else spec
    return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()


def evaluate_spec(spec, baseline=None):
    cases = []

    def check(name, passed):
        cases.append({"name": name, "passed": bool(passed)})

    for issue, name in [
        ("wrong_material", "Wrong materials request evidence"),
        ("weather", "Weather delay stays unchanged"),
        ("late_delivery", "Late delivery is not a wrong delivery"),
        ("none", "Normal update stays short"),
        (
            "uncertain",
            "Uncertain issue is not automatically treated as a wrong delivery",
        ),
    ]:
        result = Interpretation(
            completed="", blocker="", next_action="", summary="", issue=issue
        )
        expected = spec.require_delivery_photo and issue == "wrong_material"
        check(name, photo_required(spec, result) == expected)
    check("Exception route remains available", spec.allow_exception)
    check(
        "Question identifiers are unique",
        len({r.id for r in spec.follow_up_rules}) == len(spec.follow_up_rules),
    )
    check(
        "Contextual questions use explicit attention triggers",
        all(r.trigger not in ["none", "uncertain"] for r in spec.follow_up_rules),
    )
    for issue in ["negative_feedback", "request", "other", "none", "uncertain"]:
        observation = Interpretation(
            completed="", blocker="", next_action="", summary="", issue=issue
        )
        check(
            f"Route {issue} selects only matching questions",
            [r.id for r in active_questions(spec, observation)]
            == [r.id for r in spec.follow_up_rules if r.trigger == issue],
        )
    check("Worker prompt is present", bool(spec.note_prompt.strip()))
    check("Evidence prompt is present", bool(spec.evidence_prompt.strip()))
    check(
        "Site choices are unique and nonempty",
        len(set(spec.sites)) == len(spec.sites) and all(x.strip() for x in spec.sites),
    )
    if baseline:
        check("Existing sites preserved", spec.sites == baseline.sites)
        check(
            "Existing contextual questions preserved",
            spec.follow_up_rules[: len(baseline.follow_up_rules)]
            == baseline.follow_up_rules,
        )
    return {
        "kind": "contract_regression",
        "passed": all(x["passed"] for x in cases),
        "cases": cases,
        "artifact_hash": artifact_hash(spec),
        "note": "These checks verify form policy against known issue labels. They do not measure model interpretation or image accuracy.",
    }
