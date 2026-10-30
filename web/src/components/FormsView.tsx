import {
  ClipboardList,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type { Workspace, Proposal } from "../types";
import { FormPreview } from "./FormPreview";
export function FormsView({
  data,
  setCreating,
  openWorker,
  improveForm,
  setToast,
  setProposal,
  busy,
  rollback,
}: {
  data: Workspace;
  setCreating: (v: boolean) => void;
  openWorker: (id: string) => void;
  improveForm: (id: string) => void;
  setToast: (v: string) => void;
  setProposal: (p: Proposal) => void;
  busy: boolean;
  rollback: (formId: string, releaseId: string) => void;
}) {
  return (
    <div className="forms-list">
      {data.form.length === 0 ? (
        <div className="panel empty-state">
          <ClipboardList size={36} />
          <h3>Start with a workflow your team knows.</h3>
          <p>Choose the daily site update pack and make it yours.</p>
          <button className="primary" onClick={() => setCreating(true)}>
            Create your first form
          </button>
        </div>
      ) : (
        data.form.map((f) => {
          const release = data.release.find((r) => r.id === f.current_release);
          const drafts = data.proposal.filter(
            (p) => p.form_id === f.id && p.status === "draft",
          );
          return (
            <section className="panel padded form-panel" key={f.id}>
              <div className="panel-heading">
                <div>
                  <h2>{f.title}</h2>
                  <p className="muted">
                    {release
                      ? `Version ${release.number} · Published`
                      : "Draft · not published"}
                    {f.sample ? " · Example workflow" : ""}
                  </p>
                </div>
                {release && (
                  <button className="primary" onClick={() => openWorker(f.id)}>
                    Open respondent form
                    <ArrowUpRight size={18} />
                  </button>
                )}
              </div>
              {release && <FormPreview spec={release.spec} />}
              <div className="form-actions">
                {release && (
                  <>
                    <button
                      className="secondary"
                      onClick={() => improveForm(f.id)}
                    >
                      <Sparkles size={17} />
                      Improve workflow
                    </button>
                    <button
                      className="text-button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            `${location.origin}/?form=${f.id}`,
                          );
                          setToast("Worker link copied.");
                        } catch {
                          setToast(
                            `Worker link: ${location.origin}/?form=${f.id}`,
                          );
                        }
                      }}
                    >
                      Copy worker link
                    </button>
                  </>
                )}
                {drafts.map((p) => (
                  <button
                    key={p.id}
                    className="secondary"
                    onClick={() => setProposal(p)}
                  >
                    Review draft
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
              {release && (
                <details className="release-history">
                  <summary>Version history</summary>
                  {data.release
                    .filter((r) => r.form_id === f.id)
                    .map((r) => (
                      <div key={r.id}>
                        <span>
                          Version {r.number} ·{" "}
                          {r.spec.require_delivery_photo
                            ? "Delivery evidence branch"
                            : "Standard daily update"}
                        </span>
                        {r.id === f.current_release ? (
                          <span className="status good">Current</span>
                        ) : (
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => rollback(f.id, r.id)}
                          >
                            <RotateCcw size={14} />
                            Restore for new updates
                          </button>
                        )}
                      </div>
                    ))}
                </details>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
