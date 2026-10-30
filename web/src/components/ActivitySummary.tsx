import { useEffect, useState } from "react";
import { Activity, CheckCircle2, GitBranch, BrainCircuit } from "lucide-react";
import type { Workspace } from "../types";
import { api } from "../api";
export function ActivitySummary({ data }: { data: Workspace }) {
  const [report, setReport] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    api("/evaluations")
      .then((r) => mounted && setReport(r))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  const revisions = data.proposal.filter((p) => p.base_release);
  const events = [
    ...data.proposal.map((p) => ({
      id: p.id,
      at: p.created || "",
      title: p.base_release ? "Revision proposed" : "Template assembled",
      detail: p.feedback,
      meta: `${String(p.trace.model || "local demo")} · ${Number(p.trace.latency_ms || 0)} ms · ${p.evaluation ? `${p.evaluation.cases.filter((c) => c.passed).length}/${p.evaluation.cases.length} contract checks passed` : "awaiting contract checks"}`,
    })),
    ...data.release.map((r) => ({
      id: r.id,
      at: r.created,
      title: `Version ${r.number} approved and published`,
      detail: r.spec.title,
      meta: `Artifact ${r.hash.slice(0, 12)} · ${r.spec.follow_up_rules?.length || 0} contextual questions · ${r.spec.require_delivery_photo ? "delivery image branch" : "text workflow"}`,
    })),
    ...data.submission
      .filter((s) => !s.sample)
      .map((s) => ({
        id: s.id,
        at: s.created,
        title: "Response interpreted and confirmed",
        detail: s.answers.interpretation.summary,
        meta: `Route: ${s.answers.interpretation.issue.replaceAll("_", " ")} · ${Object.keys(s.answers.followups || {}).length} contextual answers · v${s.version}`,
      })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <section className="panel padded trace-panel">
      <div className="section-heading">
        <Activity size={21} />
        <h2>Improvement activity</h2>
      </div>
      <p className="muted">
        From a response to a proposed change, checked and approved for the next
        person.
      </p>
      <div className="trace-summary">
        <span>
          <strong>{revisions.length}</strong> revision proposals
        </span>
        <span>
          <strong>
            {data.proposal.filter((p) => p.evaluation?.passed).length}
          </strong>{" "}
          checked workflows
        </span>
        <span>
          <strong>{data.release.filter((r) => r.number > 1).length}</strong>{" "}
          published improvements
        </span>
      </div>
      {report?.status === "complete" && (
        <p className="helper">
          <BrainCircuit size={14} /> Separate recorded GEPA experiment:{" "}
          {report.baseline.correct}/{report.baseline.count} baseline →{" "}
          {report.candidate.correct}/{report.candidate.count} selected. Baseline
          retained; no automatic model promotion. This recorded test covers
          site-report interpretation.
        </p>
      )}
      <details>
        <summary>
          View decision and optimization trace ({events.length} events)
        </summary>
        <div className="trace-list">
          {events.slice(0, 12).map((e) => (
            <div className="trace-event" key={e.id}>
              <span className="trace-dot">
                {e.title.includes("published") ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <GitBranch size={15} />
                )}
              </span>
              <div>
                <strong>{e.title}</strong>
                <p>{e.detail}</p>
                <small className="helper">{e.meta}</small>
              </div>
              <time>
                {new Date(e.at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          ))}
          {!events.length && (
            <p className="helper">
              Create and publish a form to start its trace.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
