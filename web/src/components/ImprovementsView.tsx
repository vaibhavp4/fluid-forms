import { ChevronRight, GitBranch, FlaskConical } from "lucide-react";
import type { Workspace, Proposal } from "../types";
export function ImprovementsView({
  data,
  setProposal,
  experiment,
}: {
  data: Workspace;
  setProposal: (p: Proposal) => void;
  experiment: any;
}) {
  return (
    <div className="stack">
      <section className="panel padded">
        <div className="section-heading">
          <GitBranch size={22} />
          <h2>Workflow revisions</h2>
        </div>
        <p className="muted">
          Every change has an explanation, checks, and your approval.
        </p>
        {data.proposal.length ? (
          data.proposal.map((p) => (
            <button
              className="proposal-row"
              key={p.id}
              onClick={() => setProposal(p)}
            >
              <div>
                <strong>{p.spec.title}</strong>
                <p>{p.feedback}</p>
              </div>
              <span
                className={`status ${p.status === "published" ? "good" : "neutral"}`}
              >
                {p.status}
              </span>
              <ChevronRight size={18} />
            </button>
          ))
        ) : (
          <div className="empty-inline">
            Open a response and choose “Improve this workflow” to propose a
            change.
          </div>
        )}
      </section>
      <section className="panel padded">
        <div className="section-heading">
          <FlaskConical size={21} />
          <h2>Model optimization</h2>
        </div>
        {experiment?.status === "complete" ? (
          <>
            <p>
              Baseline and GEPA candidate on a held-out set of{" "}
              {experiment.test_count} synthetic examples.
            </p>
            <div className="experiment-metrics">
              <div>
                <small>Baseline issue accuracy</small>
                <strong>
                  {Math.round(experiment.baseline.accuracy * 100)}%
                </strong>
              </div>
              <div>
                <small>Candidate issue accuracy</small>
                <strong>
                  {Math.round(experiment.candidate.accuracy * 100)}%
                </strong>
              </div>
            </div>
            <p className="helper">
              {experiment.decision}. This is an offline experiment, not an
              automatic production model change.
            </p>
          </>
        ) : (
          <>
            <p>No model optimization experiment has been run yet.</p>
            <p className="helper">
              Workflow checks verify branching and required fields. Model
              evaluation separately measures interpretation against labeled
              examples. We won’t substitute one for the other.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
