import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  ActionProvider,
  Renderer,
  StateProvider,
  VisibilityProvider,
  type ComponentRegistry,
} from "@json-render/react";
import type { Spec } from "@json-render/core";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Mic,
  Send,
  Square,
  FileCheck2,
} from "lucide-react";
import { api, errorMessage } from "../api";
import type {
  WorkerSession,
  Interpretation,
  Photo,
  Submission,
} from "../types";
import { Busy, Notice } from "./ui";

type Runtime = {
  arranged: string;
  setArranged: (x: string) => void;
  photo: Photo | null;
  upload: (file: File) => void;
  uploading: boolean;
  exception: string;
  setException: (x: string) => void;
  sessionId: string;
};
const RuntimeContext = createContext<Runtime | null>(null);
const registry: ComponentRegistry = {
  Stack: ({ children }) => <div className="stack">{children}</div>,
  FollowUp: ({ element }) => {
    const r = useContext(RuntimeContext)!;
    return (
      <label>
        {String(element.props.question)}
        <select
          value={r.arranged}
          onChange={(e) => r.setArranged(e.target.value)}
        >
          <option value="">Choose an answer</option>
          <option value="yes">Yes, it’s arranged</option>
          <option value="no">No, we need help</option>
          <option value="unknown">I’m not sure</option>
        </select>
      </label>
    );
  },
  Evidence: ({ element }) => {
    const r = useContext(RuntimeContext)!;
    return (
      <section className="evidence-step">
        <div className="section-heading">
          <Camera size={20} />
          <h3>
            {element.props.required
              ? "Before you leave, add delivery evidence"
              : "Add a photo (optional)"}
          </h3>
        </div>
        <p>{String(element.props.prompt)}</p>
        <label className="upload-target">
          <Camera size={25} />
          <strong>
            {r.uploading
              ? "Checking your photo…"
              : r.photo
                ? "Replace photo"
                : "Take or upload a photo"}
          </strong>
          <small>JPEG, PNG, or WebP · up to 8 MB</small>
          <input
            aria-label="Upload delivery photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={r.uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) r.upload(f);
              e.target.value = "";
            }}
          />
        </label>
        {r.photo && (
          <>
            <img
              className="photo-preview"
              src={`/api/sessions/${r.sessionId}/photo?v=${r.photo.id}`}
              alt="Your delivery evidence"
            />
            <Notice
              tone={
                r.photo.observation.status === "retake" ? "warning" : "info"
              }
            >
              {r.photo.observation.explanation}
            </Notice>
          </>
        )}
        {element.props.required === true && (
          <label>
            Can’t get a suitable photo? Tell the office why.
            <textarea
              rows={2}
              value={r.exception}
              onChange={(e) => r.setException(e.target.value)}
              placeholder="For example, the packaging was already discarded."
            />
            <span className="helper">
              An exception goes to office review; it does not count as accepted
              evidence.
            </span>
          </label>
        )}
      </section>
    );
  },
};
function compileRuntime(session: WorkerSession, result: Interpretation): Spec {
  const elements: Spec["elements"] = {
    root: { type: "Stack", props: {}, children: [] },
  };
  const children: string[] = [];
  if (!["none", "uncertain"].includes(result.issue)) {
    children.push("follow");
    elements.follow = {
      type: "FollowUp",
      props: { question: session.spec.blocker_question },
    };
  }
  const required =
    session.spec.require_delivery_photo && result.issue === "wrong_material";
  children.push("evidence");
  elements.evidence = {
    type: "Evidence",
    props: {
      required,
      prompt: required
        ? session.spec.evidence_prompt
        : "Share a useful view of today’s work if it helps explain your update.",
    },
  };
  elements.root.children = children;
  return { root: "root", elements };
}

export function WorkerForm({
  formId,
  onExit,
}: {
  formId: string;
  onExit: () => void;
}) {
  const [session, setSession] = useState<WorkerSession | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [worker, setWorker] = useState("");
  const [site, setSite] = useState("");
  const [day, setDay] = useState(new Date().toLocaleDateString("en-CA"));
  const [result, setResult] = useState<Interpretation | null>(null);
  const [arranged, setArranged] = useState("");
  const [exception, setException] = useState("");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [receipt, setReceipt] = useState<Submission | null>(null);
  const [recording, setRecording] = useState(false);
  const recognition = useRef<any>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const existing = localStorage.getItem("fieldnote-session-" + formId);
        let s: WorkerSession;
        try {
          s = existing
            ? await api<WorkerSession>("/sessions/" + existing)
            : await api<WorkerSession>("/sessions", "POST", {
                form_id: formId,
              });
        } catch {
          s = await api<WorkerSession>("/sessions", "POST", {
            form_id: formId,
          });
        }
        if (cancelled) return;
        localStorage.setItem("fieldnote-session-" + formId, s.id);
        setSession(s);
        setSite(s.spec.sites[0]);
        setPhoto(s.photo);
        if (s.answers) {
          setWorker(s.answers.worker);
          setSite(s.answers.site);
          setDay(s.answers.day);
          setNote(s.answers.note);
          setResult(s.answers.interpretation);
          setArranged(s.answers.arranged);
          setException(s.answers.exception);
        } else {
          const draft = localStorage.getItem("fieldnote-draft-" + s.id);
          if (draft) {
            try {
              const d = JSON.parse(draft);
              setNote(d.note || "");
              setWorker(d.worker || "");
              setSite(d.site || s.spec.sites[0]);
              setDay(d.day || new Date().toLocaleDateString("en-CA"));
            } catch {}
          }
        }
        if (s.submitted) setBusy("already-submitted");
      } catch (e) {
        if (!cancelled) setError(errorMessage(e));
      }
    }
    load();
    return () => {
      cancelled = true;
      recognition.current?.stop();
    };
  }, [formId]);
  useEffect(() => {
    if (session && !session.submitted)
      localStorage.setItem(
        "fieldnote-draft-" + session.id,
        JSON.stringify({ note, worker, site, day }),
      );
  }, [session, note, worker, site, day]);
  function editNote(value: string) {
    setNote(value);
    setResult(null);
    setArranged("");
    setException("");
  }
  function toggleVoice() {
    if (recording) {
      recognition.current?.stop();
      return;
    }
    const Speech =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Speech) {
      setError(
        "Voice input is not supported in this browser. Type your update below.",
      );
      return;
    }
    const rec = new Speech();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event: any) => {
      let words = "";
      for (let i = event.resultIndex; i < event.results.length; i++)
        words += event.results[i][0].transcript + " ";
      setNote((n) => (n + " " + words).trim());
      setResult(null);
    };
    rec.onerror = (e: any) => {
      setError(
        "Voice input stopped: " + e.error + ". You can still type your update.",
      );
      setRecording(false);
    };
    rec.onend = () => setRecording(false);
    recognition.current = rec;
    setError("");
    try {
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone could not start. Please type your update.");
    }
  }
  async function interpret() {
    if (!session) return;
    recognition.current?.stop();
    setBusy("interpret");
    setError("");
    try {
      const r = await api<{ interpretation: Interpretation }>(
        `/sessions/${session.id}/interpret`,
        "POST",
        { note },
      );
      setResult(r.interpretation);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  async function upload(file: File) {
    if (!session) return;
    setBusy("photo");
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      setPhoto(await api<Photo>(`/sessions/${session.id}/photo`, "POST", data));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  async function submit() {
    if (!session || !result) return;
    setBusy("submit");
    setError("");
    try {
      await api(`/sessions/${session.id}`, "PUT", {
        worker,
        site,
        day,
        note,
        interpretation: result,
        arranged,
        exception,
      });
      const s = await api<Submission>(`/sessions/${session.id}/submit`, "POST");
      setReceipt(s);
      localStorage.removeItem("fieldnote-draft-" + session.id);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  function next() {
    localStorage.removeItem("fieldnote-session-" + formId);
    window.location.reload();
  }
  if (receipt || busy === "already-submitted")
    return (
      <div className="worker-page">
        <div className="worker-brand">
          Fieldnote<span>Site updates</span>
        </div>
        <section className="panel receipt">
          <CheckCircle2 size={52} />
          <h1>Your update is with the office.</h1>
          <p>
            {receipt?.review_required
              ? "Your evidence or exception needs office review. Your original report is safely attached."
              : "Thanks. Your report has been received and saved."}
          </p>
          <div className="receipt-detail">
            <span>{site}</span>
            <span>Version {session?.version}</span>
          </div>
          <button className="primary full" onClick={next}>
            Start another update
            <ArrowRight size={17} />
          </button>
          <button className="text-button" onClick={onExit}>
            Back to workspace
          </button>
        </section>
      </div>
    );
  if (!session)
    return (
      <div className="worker-page">
        <Busy text="Opening your site update…" />
        {error && <Notice tone="error">{error}</Notice>}
        <button className="text-button" onClick={onExit}>
          Back to workspace
        </button>
      </div>
    );
  const required =
    session.spec.require_delivery_photo && result?.issue === "wrong_material";
  const canSubmit =
    !!result &&
    worker.trim() &&
    site &&
    day &&
    (!required || photo || exception.trim().length >= 5) &&
    (["none", "uncertain"].includes(result.issue) || arranged);
  return (
    <div className="worker-page">
      <div className="worker-brand">
        Fieldnote<span>Site updates</span>
      </div>
      <button className="text-button" onClick={onExit}>
        <ArrowLeft size={16} />
        Workspace
      </button>
      <header className="worker-heading">
        <span className="version-label">
          {session.spec.title} · Version {session.version}
        </span>
        <h1>
          A quick update.
          <br />A clearer tomorrow.
        </h1>
        <p>{session.spec.description}</p>
      </header>
      <section className="panel worker-card">
        <div className="section-heading">
          <span className="number">1</span>
          <h2>Start with your day</h2>
        </div>
        <div className="two-fields">
          <label>
            Your name
            <input
              value={worker}
              onChange={(e) => setWorker(e.target.value)}
              placeholder="Your name"
              maxLength={100}
            />
          </label>
          <label>
            Site
            <select value={site} onChange={(e) => setSite(e.target.value)}>
              {session.spec.sites.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Date
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </label>
        <label>
          {session.spec.note_prompt}
          <textarea
            rows={5}
            value={note}
            onChange={(e) => editNote(e.target.value)}
            maxLength={6000}
            placeholder="Finished bathroom prep. Couldn’t start tiling because the wrong tiles arrived…"
          />
        </label>
        <div className="note-actions">
          <button
            className={recording ? "secondary recording" : "secondary"}
            onClick={toggleVoice}
          >
            {recording ? (
              <>
                <Square size={16} />
                Stop recording
              </>
            ) : (
              <>
                <Mic size={17} />
                Speak your update
              </>
            )}
          </button>
          <small>{note.length}/6000</small>
        </div>
        <p className="helper">
          Voice uses your browser’s speech service where available. Review the
          text before sending. Typed drafts stay on this device.
        </p>
        <button
          className="primary full"
          disabled={!!busy || note.trim().length < 5 || !worker.trim() || !day}
          onClick={interpret}
        >
          {busy === "interpret" ? (
            <Busy text="Making sense of your update…" />
          ) : (
            <>
              Review my update
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </section>
      {error && <Notice tone="error">{error}</Notice>}
      {result && (
        <section className="panel worker-card">
          <div className="section-heading">
            <span className="number">2</span>
            <h2>Does this look right?</h2>
          </div>
          <p className="muted">
            Correct anything we missed. Your original note stays attached.
          </p>
          <label>
            Work completed
            <textarea
              rows={2}
              value={result.completed}
              onChange={(e) =>
                setResult({ ...result, completed: e.target.value })
              }
            />
          </label>
          <label>
            What held things up?
            <textarea
              rows={2}
              value={result.blocker}
              onChange={(e) =>
                setResult({ ...result, blocker: e.target.value })
              }
            />
          </label>
          <label>
            Issue type
            <select
              value={result.issue}
              onChange={(e) => {
                setResult({
                  ...result,
                  issue: e.target.value as Interpretation["issue"],
                });
                setArranged("");
              }}
            >
              <option value="none">No blocker</option>
              <option value="wrong_material">Wrong materials delivered</option>
              <option value="late_delivery">Late delivery</option>
              <option value="weather">Weather delay</option>
              <option value="other">Other blocker</option>
              <option value="uncertain">Not sure</option>
            </select>
          </label>
          <label>
            What do you need next?
            <textarea
              rows={2}
              value={result.next_action}
              onChange={(e) =>
                setResult({ ...result, next_action: e.target.value })
              }
            />
          </label>
          <div className="divider" />
          <RuntimeContext.Provider
            value={{
              arranged,
              setArranged,
              photo,
              upload,
              uploading: busy === "photo",
              exception,
              setException,
              sessionId: session.id,
            }}
          >
            <StateProvider initialState={{}}>
              <VisibilityProvider>
                <ActionProvider handlers={{}}>
                  <Renderer
                    spec={compileRuntime(session, result)}
                    registry={registry}
                  />
                </ActionProvider>
              </VisibilityProvider>
            </StateProvider>
          </RuntimeContext.Provider>
          {required && (
            <p className="helper">
              <FileCheck2 size={14} />
              This version requests delivery evidence. Photo checks are advisory
              until reviewed.
            </p>
          )}
          <button
            className="primary full"
            disabled={!!busy || !canSubmit}
            onClick={submit}
          >
            {busy === "submit" ? (
              <Busy text="Sending your update…" />
            ) : (
              <>
                <Send size={17} />
                Confirm and send update
              </>
            )}
          </button>
          <p className="helper centered">
            Your update uses version {session.version}, even if the form
            changes.
          </p>
        </section>
      )}
    </div>
  );
}
