"""Bounded GEPA experiment. No test examples reach optimization. Never auto-publishes."""

import argparse
import hashlib
import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
import dspy
from backend.intelligence import InterpretUpdate, lm
from threading import Lock


class RequestBudget:
    """Shared task/reflection request budget, checked before network dispatch."""

    def __init__(self, limit=56):
        self.limit = limit
        self.calls = 0
        self.lock = Lock()

    def reserve(self, prompt, messages):
        size = (
            len(json.dumps(messages, ensure_ascii=False))
            if messages
            else len(prompt or "")
        )
        with self.lock:
            if self.calls >= self.limit or size > 50000:
                raise RuntimeError("Experiment request or prompt-size budget exhausted")
            self.calls += 1


def budgeted_model(budget):
    class BoundedLM(dspy.LM):
        def forward(self, prompt=None, messages=None, **kwargs):
            budget.reserve(prompt, messages)
            return super().forward(prompt=prompt, messages=messages, **kwargs)

    return lm(BoundedLM)


def metric(example, prediction, trace=None, pred_name=None, pred_trace=None):
    try:
        actual = prediction.interpretation.issue
    except Exception:
        actual = "invalid"
    score = float(actual == example.issue)
    return dspy.Prediction(
        score=score,
        feedback=f"Expected issue={example.issue}; observed issue={actual}. Distinguish ongoing wrong deliveries from corrected, hypothetical, late, and uncertain reports.",
    )


def evaluate(program, rows):
    predictions = []
    started = time.monotonic()
    for row in rows:
        start = time.monotonic()
        try:
            result = program(note=row["note"])
            actual = result.interpretation.issue
        except Exception:
            actual = "error"
        predictions.append(
            {
                "id": row["id"],
                "expected": row["issue"],
                "actual": actual,
                "correct": actual == row["issue"],
                "latency_ms": round((time.monotonic() - start) * 1000),
            }
        )
    return {
        "accuracy": sum(x["correct"] for x in predictions) / len(predictions),
        "correct": sum(x["correct"] for x in predictions),
        "count": len(predictions),
        "duration_seconds": round(time.monotonic() - started, 2),
        "cases": predictions,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-metric-calls", type=int, default=18)
    parser.add_argument("--max-seconds", type=int, default=600)
    args = parser.parse_args()
    if not os.getenv("NEBIUS_API_KEY"):
        raise SystemExit(
            "NEBIUS_API_KEY is required. No optimization result was generated."
        )
    if args.max_metric_calls < 12 or args.max_metric_calls > 60:
        raise SystemExit(
            "Use 12–60 metric calls for this bounded prototype experiment."
        )
    source = Path("evals/interpretation.json")
    raw = source.read_bytes()
    data = json.loads(raw)
    # Alarm bounds the entire local run, including reflection. Provider requests have timeouts too.
    import signal

    def deadline(*_):
        raise TimeoutError("Experiment wall-clock budget exhausted")

    signal.signal(signal.SIGALRM, deadline)
    signal.alarm(args.max_seconds)
    examples = lambda split: [
        dspy.Example(note=r["note"], issue=r["issue"]).with_inputs("note")
        for r in data[split]
    ]
    budget = RequestBudget()
    task = budgeted_model(budget)
    reflection = budgeted_model(budget)
    baseline = dspy.Predict(InterpretUpdate)
    output = Path(".data/experiments")
    output.mkdir(parents=True, exist_ok=True)
    with dspy.context(lm=task, adapter=dspy.JSONAdapter()):
        optimizer = dspy.GEPA(
            metric=metric,
            max_metric_calls=args.max_metric_calls,
            reflection_lm=reflection,
            num_threads=1,
            track_stats=True,
            seed=17,
        )
        candidate = optimizer.compile(
            baseline, trainset=examples("train"), valset=examples("dev")
        )
        candidate.save(str(output / "candidate.json"))
        # Evaluate test only after candidate selection. Test results cannot change the selected artifact.
        before = evaluate(baseline, data["test"])
        after = evaluate(candidate, data["test"])
    signal.alarm(0)
    report = {
        "status": "complete",
        "dataset_sha256": hashlib.sha256(raw).hexdigest(),
        "data_kind": "synthetic",
        "test_count": len(data["test"]),
        "model": os.getenv("NEBIUS_MODEL", "nvidia/Nemotron-3_5-Lightning"),
        "algorithm": "GEPA",
        "reasoning_mode": "disabled",
        "selection_note": "GEPA selected the original baseline; no improved prompt was selected."
        if candidate.signature.instructions == baseline.signature.instructions
        else "GEPA selected a revised prompt using development examples only.",
        "max_metric_calls": args.max_metric_calls,
        "baseline": before,
        "candidate": after,
        "decision": "Candidate improved on this small test set; human review required"
        if after["accuracy"] > before["accuracy"]
        else "Retain baseline: no held-out improvement",
        "runtime_promotion": False,
        "usage": {
            "dispatched_requests": budget.calls,
            "request_limit": budget.limit,
            "max_prompt_characters": 50000,
            "max_output_tokens_per_request": 2500,
            "prompt_tokens": sum(
                (h.get("usage") or {}).get("prompt_tokens", 0)
                for h in task.history + reflection.history
            ),
            "completion_tokens": sum(
                (h.get("usage") or {}).get("completion_tokens", 0)
                for h in task.history + reflection.history
            ),
            "task_calls": len(task.history),
            "reflection_calls": len(reflection.history),
            "reported_cost_usd": sum(
                h.get("cost") or 0 for h in task.history + reflection.history
            ),
            "cost_note": "Provider-reported estimates may be absent. Zero does not establish free inference.",
        },
    }
    Path(".data/evaluation-report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
