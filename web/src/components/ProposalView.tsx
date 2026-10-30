import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  GitBranch,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { api, errorMessage } from "../api";
import type { Proposal, Release, Evaluation, FormSpec } from "../types";
import { FormPreview } from "./FormPreview";
import { Busy, Notice } from "./ui";
export function ProposalView({
  proposal,
  baseline,
  onBack,
  onPublished,
  onRefresh,
}: {
  proposal: Proposal;
  baseline?: FormSpec;
  onBack: () => void;
  onPublished: () => void;
  onRefresh: () => void;
}) {
  const [report, setReport] = useState<Evaluation | null>(proposal.evaluation);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  async function evaluate() {
    setBusy("evaluate");
    setError("");
    try {
      setReport(
        await api<Evaluation>(`/proposals/${proposal.id}/evaluate`, "POST"),
      );
      onRefresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  async function publish() {
    setBusy("publish");
    setError("");
    try {
      await api<Release>(`/proposals/${proposal.id}/publish`, "POST", {
        artifact_hash: proposal.hash,
      });
      onPublished();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  const changed = baseline
    ? Object.keys(proposal.spec).filter(
        (k) =>
          JSON.stringify(proposal.spec[k as keyof FormSpec]) !==
          JSON.stringify(baseline[k as keyof FormSpec]),
      )
    : [];
  return (
    <>
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to workspace
      </button>
      <div className="page-heading">
        <div>
          <h1>
            {baseline
              ? "A better next update"
              : "Your workflow, ready to review"}
          </h1>
          <p>
            {baseline
              ? "Review what changes before your team sees it."
              : "A short, guided experience built from your brief."}
          </p>
        </div>
        <span className="status neutral">
          {proposal.status === "published" ? "Published" : "Draft · not live"}
        </span>
      </div>
      <div className="proposal-grid">
        <section className="panel padded">
          <div className="section-heading">
            <GitBranch size={20} />
            <h2>{proposal.spec.title}</h2>
          </div>
          <p className="muted">{proposal.spec.description}</p>
          <FormPreview spec={proposal.spec} />
          <div className="notice info">
            <ShieldCheck size={19} />
            <div>
              <strong>Existing updates stay as they are.</strong>
              <p>
                Publishing applies to new sessions. Work already started keeps
                its original version.
              </p>
            </div>
          </div>
        </section>
        <div className="stack">
          <section className="panel padded">
            <h2>{baseline ? "What will change" : "Your instructions"}</h2>
            <blockquote className="small-quote">
              “{proposal.feedback}”
            </blockquote>
            {baseline && (
              <div className="change-list">
                {changed.length === 0 ? (
                  <p>
                    No supported behavior changed. Refine your feedback before
                    publishing.
                  </p>
                ) : (
                  changed.map((key) => (
                    <div key={key}>
                      <strong>
                        {(
                          {
                            require_delivery_photo: "Delivery evidence",
                            evidence_prompt: "Capture guidance",
                            note_prompt: "Opening question",
                            blocker_question: "Follow-up question",
                            title: "Form name",
                            description: "Introduction",
                            sites: "Site choices",
                          } as Record<string, string>
                        )[key] || key}
                      </strong>
                      <p>
                        {key === "require_delivery_photo"
                          ? proposal.spec.require_delivery_photo
                            ? "Add a photo step for confirmed wrong-material deliveries. Other updates remain unchanged."
                            : "Remove the mandatory delivery photo step."
                          : String(proposal.spec[key as keyof FormSpec])}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
            <p className="helper">
              {proposal.trace.provider === "local_demo"
                ? "Local demo · bounded template revision"
                : "Generated with " +
                  String(proposal.trace.model || "configured model")}
            </p>
          </section>
          <section className="panel padded">
            <div className="section-heading">
              <FlaskConical size={20} />
              <h2>Check before publishing</h2>
            </div>
            {report ? (
              <>
                <ul className="check-list">
                  {report.cases.map((c) => (
                    <li key={c.name}>
                      <CheckCircle2
                        size={17}
                        className={c.passed ? "green" : "red"}
                      />
                      {c.name}
                      <span>{c.passed ? "Pass" : "Fail"}</span>
                    </li>
                  ))}
                </ul>
                <p className="helper">{report.note}</p>
              </>
            ) : (
              <p className="muted">
                Check required fields, the delivery branch, exception handling,
                and unchanged paths.
              </p>
            )}
            <button
              className="secondary full"
              disabled={!!busy}
              onClick={evaluate}
            >
              {busy === "evaluate" ? (
                <Busy text="Running checks…" />
              ) : (
                <>
                  <FlaskConical size={17} />
                  {report ? "Run checks again" : "Run workflow checks"}
                </>
              )}
            </button>
          </section>
          {error && <Notice tone="error">{error}</Notice>}
          {proposal.status !== "published" && (
            <>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                />
                I’ve reviewed this exact workflow and its evidence requirements.
              </label>
              <button
                className="primary full"
                disabled={
                  !!busy ||
                  !report?.passed ||
                  !approved ||
                  (!!baseline && changed.length === 0)
                }
                onClick={publish}
              >
                {busy === "publish" ? (
                  <Busy text="Publishing…" />
                ) : (
                  <>
                    Approve and publish
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
