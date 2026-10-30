import { UpdatesView } from "./components/UpdatesView";
import { FormsView } from "./components/FormsView";
import { ImprovementsView } from "./components/ImprovementsView";
import { useCallback, useEffect, useState } from "react";
import {
  Home,
  ClipboardList,
  MessageSquareText,
  ChartNoAxesColumnIncreasing,
  Plus,
  Check,
  LogOut,
  Sparkles,
} from "lucide-react";
import { api, errorMessage } from "./api";
import type { Workspace, Health, Proposal, Form } from "./types";
import { Busy, Notice, Modal } from "./components/ui";
import { CreateForm } from "./components/CreateForm";
import { ProposalView } from "./components/ProposalView";
import { WorkerForm } from "./components/WorkerForm";

const empty: Workspace = {
  form: [],
  release: [],
  submission: [],
  proposal: [],
};
const nav = [
  { name: "Overview", icon: Home },
  { name: "Forms", icon: ClipboardList },
  { name: "Responses", icon: MessageSquareText },
  { name: "Improvements", icon: ChartNoAxesColumnIncreasing },
];

export default function App() {
  const [data, setData] = useState<Workspace>(empty);
  const [health, setHealth] = useState<Health | null>(null);
  const [page, setPage] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [improve, setImprove] = useState<Form | null>(null);
  const [feedback, setFeedback] = useState(
    "When someone reports the wrong materials arriving, ask for a photo of the packaging or delivery label before they leave. If they can’t get it, let them explain why.",
  );
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [auth, setAuth] = useState(false);
  const [experiment, setExperiment] = useState<any>(null);
  const workerId = new URLSearchParams(window.location.search).get("form");
  const refresh = useCallback(async () => {
    try {
      const [h, w] = await Promise.all([
        api<Health>("/health"),
        api<Workspace>("/workspace"),
      ]);
      setHealth(h);
      setData(w);
      setAuth(false);
      return w;
    } catch (e) {
      if (errorMessage(e) === "Owner access required") setAuth(true);
      else setError(errorMessage(e));
      return empty;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!workerId) refresh();
    else
      api<Health>("/health")
        .then(setHealth)
        .catch(() => {});
  }, [refresh, workerId]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);
  async function seed() {
    setBusy(true);
    setError("");
    try {
      await api("/demo/seed", "POST");
      const w = await refresh();
      setSelected(
        w.submission.find(
          (s) => s.answers.interpretation.issue === "wrong_material",
        )?.id || null,
      );
      setToast("Prepared examples loaded. These are not customer submissions.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function propose() {
    if (!improve) return;
    setBusy(true);
    setError("");
    try {
      const p = await api<Proposal>(`/forms/${improve.id}/proposals`, "POST", {
        feedback,
      });
      setProposal(p);
      setImprove(null);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function navigate(name: string) {
    setPage(name);
    setProposal(null);
    setError("");
    if (name === "Improvements")
      api("/evaluations")
        .then(setExperiment)
        .catch((e) => setError(errorMessage(e)));
  }
  async function rollback(formId: string, releaseId: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/forms/${formId}/rollback/${releaseId}`, "POST");
      await refresh();
      setToast(
        "Previous version restored for new updates. Existing sessions are unchanged.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const response = data.submission.find((s) => s.id === selected);
  const active = data.form.filter((f) => f.current_release);
  const attention = data.submission.filter(
    (s) => s.answers.interpretation.issue !== "none" || s.review_required,
  ).length;
  function improveForm(formId: string) {
    setImprove(data.form.find((f) => f.id === formId) || null);
    setError("");
  }
  function openWorker(formId: string) {
    window.open(`/?form=${formId}`, "_blank", "noopener,noreferrer");
  }
  if (workerId)
    return (
      <>
        <div
          className={`runtime-ribbon ${health?.mode === "live" ? "live" : ""}`}
        >
          {health?.mode === "live"
            ? "Connected inference"
            : "Local demo mode · interpretation uses example rules"}
          {health && !health.vision ? " · photos go to office review" : ""}
        </div>
        <WorkerForm
          formId={workerId}
          onExit={() => {
            window.location.href = "/";
          }}
        />
      </>
    );
  if (auth)
    return (
      <main className="worker-page">
        <section className="panel worker-card">
          <h1>Welcome back.</h1>
          <p>Enter your configured owner token to open this workspace.</p>
          <label>
            Owner token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <button
            className="primary full"
            onClick={() => {
              sessionStorage.setItem("fieldnote-owner-token", token);
              refresh();
            }}
          >
            Open workspace
          </button>
        </section>
      </main>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          Fieldnote
          <span className="brand-dot" />
        </a>
        <nav aria-label="Workspace navigation">
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={page === name ? "nav-item active" : "nav-item"}
              onClick={() => navigate(name)}
            >
              <Icon size={20} />
              <span>{name}</span>
              {name === "Improvements" &&
                data.proposal.filter((p) => p.status === "draft").length >
                  0 && (
                  <small>
                    {data.proposal.filter((p) => p.status === "draft").length}
                  </small>
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-avatar">M</div>
          <div>
            <strong>My workspace</strong>
            <small>
              {health?.mode === "live"
                ? "Connected to Nebius"
                : "Local demo workspace"}
            </small>
          </div>
          {health?.owner_auth && (
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={() => {
                sessionStorage.removeItem("fieldnote-owner-token");
                refresh();
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
      <main className="main">
        <div className="runtime-line">
          <span
            className={`connection-dot ${health?.mode === "live" ? "connected" : ""}`}
          />
          {health?.mode === "live"
            ? `Nebius connected · ${health.model}`
            : "Local demo · connect Nebius to enable model-generated interpretation"}
          <button className="text-button" onClick={seed} disabled={busy}>
            Load sample workspace
          </button>
        </div>
        {toast && (
          <div className="toast" role="status">
            <Check size={18} />
            {toast}
          </div>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        {loading ? (
          <Busy text="Opening your workspace…" />
        ) : proposal ? (
          <ProposalView
            key={proposal.id}
            proposal={proposal}
            baseline={
              data.release.find((r) => r.id === proposal.base_release)?.spec
            }
            onBack={() => setProposal(null)}
            onRefresh={refresh}
            onPublished={async () => {
              await refresh();
              setProposal(null);
              setPage("Forms");
              setToast(
                "Published. New updates use this version; existing sessions stay unchanged.",
              );
            }}
          />
        ) : (
          <>
            <div className="page-heading">
              <div>
                <h1>
                  {page === "Overview"
                    ? "Site updates"
                    : page === "Forms"
                      ? "Your workflows"
                      : page === "Responses"
                        ? "Every update, in context"
                        : "Better with every lesson"}
                </h1>
                <p>
                  {page === "Overview"
                    ? "A clearer picture of every day on site."
                    : page === "Forms"
                      ? "Simple for your team. Adaptable for your business."
                      : page === "Responses"
                        ? "What happened, what’s needed, and the evidence behind it."
                        : "Turn missing information into a better next update."}
                </p>
              </div>
              <button className="primary" onClick={() => setCreating(true)}>
                <Plus size={19} />
                Create form
              </button>
            </div>
            {(page === "Overview" || page === "Responses") && (
              <UpdatesView
                data={data}
                response={response}
                attention={attention}
                active={active}
                selected={selected}
                setSelected={setSelected}
                busy={busy}
                seed={seed}
                refresh={refresh}
                improveForm={improveForm}
                openWorker={openWorker}
              />
            )}
            {page === "Forms" && (
              <FormsView
                data={data}
                setCreating={setCreating}
                openWorker={openWorker}
                improveForm={improveForm}
                setToast={setToast}
                setProposal={setProposal}
                busy={busy}
                rollback={rollback}
              />
            )}
            {page === "Improvements" && (
              <ImprovementsView
                data={data}
                setProposal={setProposal}
                experiment={experiment}
              />
            )}
          </>
        )}
        {creating && (
          <CreateForm
            onClose={() => setCreating(false)}
            onCreated={(p) => {
              setCreating(false);
              setProposal(p);
              refresh();
            }}
          />
        )}
        {improve && (
          <Modal
            title="What should the next update do better?"
            onClose={() => setImprove(null)}
          >
            <p className="muted">
              Describe what you needed. We’ll propose the smallest useful
              change.
            </p>
            <label>
              Your feedback
              <textarea
                autoFocus
                rows={6}
                maxLength={4000}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </label>
            <Notice>
              Nothing changes for your team until you review and publish.
            </Notice>
            {error && <Notice tone="error">{error}</Notice>}
            <button
              className="primary full"
              disabled={busy || feedback.trim().length < 10}
              onClick={propose}
            >
              {busy ? (
                <Busy text="Preparing a revision…" />
              ) : (
                <>
                  <Sparkles size={17} />
                  Preview improvement
                </>
              )}
            </button>
          </Modal>
        )}
      </main>
    </div>
  );
}
