import {
  FileText,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
  MessageSquareText,
  ExternalLink,
} from "lucide-react";
import type { Workspace, Submission, Form } from "../types";
import { ActivitySummary } from "./ActivitySummary";
import { ResponseDetail } from "./ResponseDetail";
import { Status } from "./ui";
export function UpdatesView({
  data,
  response,
  attention,
  active,
  selected,
  setSelected,
  busy,
  seed,
  refresh,
  improveForm,
  openWorker,
}: {
  data: Workspace;
  response?: Submission;
  attention: number;
  active: Form[];
  selected: string | null;
  setSelected: (id: string | null) => void;
  busy: boolean;
  seed: () => void;
  refresh: () => void;
  improveForm: (id: string) => void;
  openWorker: (id: string) => void;
}) {
  return (
    <>
      <section className="stats panel">
        <div>
          <span className="stat-icon">
            <FileText />
          </span>
          <span>
            <strong>{data.submission.length}</strong>
            <small>updates</small>
          </span>
        </div>
        <div>
          <span className="stat-icon amber">
            <AlertTriangle />
          </span>
          <span>
            <strong>{attention}</strong>
            <small>need attention</small>
          </span>
        </div>
        <div>
          <span className="stat-icon">
            <ClipboardList />
          </span>
          <span>
            <strong>{active.length}</strong>
            <small>live {active.length === 1 ? "form" : "forms"}</small>
          </span>
        </div>
      </section>
      <ActivitySummary data={data} />
      <div
        className={response ? "response-layout" : "response-layout no-detail"}
      >
        <section className="panel responses">
          <div className="panel-heading">
            <h2>Recent updates</h2>
            {data.submission.some((s) => s.sample) && (
              <span className="helper">Includes labeled examples</span>
            )}
          </div>
          {data.submission.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Context</th>
                    <th>Update</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...data.submission]
                    .sort(
                      (a, b) =>
                        Number(b.answers.interpretation.issue !== "none") -
                        Number(a.answers.interpretation.issue !== "none"),
                    )
                    .map((s) => (
                      <tr
                        key={s.id}
                        className={selected === s.id ? "selected" : ""}
                      >
                        <td>
                          <button
                            className="row-title"
                            onClick={() => setSelected(s.id)}
                          >
                            {s.answers.site}
                          </button>
                          <small>
                            {s.answers.worker}
                            {s.sample ? " · Example" : ""}
                          </small>
                        </td>
                        <td>
                          <button
                            className="summary-button"
                            onClick={() => setSelected(s.id)}
                          >
                            {s.answers.interpretation.blocker ||
                              s.answers.interpretation.completed ||
                              s.answers.note}
                          </button>
                        </td>
                        <td>
                          <Status
                            issue={s.answers.interpretation.issue}
                            review={s.review_required}
                          />
                        </td>
                        <td className="date-cell">
                          {new Date(s.created).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          <small>Version {s.version}</small>
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={`View ${s.answers.site} update`}
                            onClick={() => setSelected(s.id)}
                          >
                            <ChevronRight size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <MessageSquareText size={36} />
              <h3>Your next useful update starts here.</h3>
              <p>
                Create a contextual form, or explore the full loop with prepared
                examples.
              </p>
              <button className="secondary" onClick={seed} disabled={busy}>
                Explore sample updates
                <ArrowRightIcon />
              </button>
            </div>
          )}
        </section>
        {response && (
          <ResponseDetail
            key={response.id}
            submission={response}
            onReviewed={refresh}
            onImprove={() => improveForm(response.form_id)}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
      {active.map((f) => (
        <div className="form-strip panel" key={f.id}>
          <span className="strip-icon">
            <ClipboardList size={24} />
          </span>
          <div>
            <strong>{f.title}</strong>
            <p>
              <span className="tiny-dot" />
              Version{" "}
              {data.release.find((r) => r.id === f.current_release)?.number} ·
              Published{f.sample ? " · Example workflow" : ""}
            </p>
          </div>
          <button className="text-button" onClick={() => openWorker(f.id)}>
            <ExternalLink size={16} />
            Open respondent form
          </button>
        </div>
      ))}
    </>
  );
}
function ArrowRightIcon() {
  return <ChevronRight size={17} />;
}
