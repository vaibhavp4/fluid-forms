import { useEffect, useState } from "react";
import { ArrowRight, WandSparkles, Layers } from "lucide-react";
import { api, errorMessage } from "../api";
import type { Form, Proposal, Template } from "../types";
import { Modal, Busy, Notice } from "./ui";
import { PipelineGraph } from "./PipelineGraph";
export function CreateForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: Proposal) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [id, setId] = useState("daily-site");
  const [title, setTitle] = useState("Daily site report");
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<Template[]>("/templates")
      .then((t) => {
        if (active) {
          setTemplates(t);
          setBrief(t[0].brief);
        }
      })
      .catch((e) => active && setError(errorMessage(e)));
    return () => {
      active = false;
    };
  }, []);
  const selected = templates.find((t) => t.id === id);
  function choose(value: string) {
    const t = templates.find((t) => t.id === value);
    if (t) {
      setId(value);
      setTitle(t.name);
      setBrief(t.brief);
    }
  }
  async function create() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ form: Form; proposal: Proposal }>(
        "/forms",
        "POST",
        { title, brief, template_id: id },
      );
      onCreated(r.proposal);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Start with a familiar workflow" onClose={onClose} wide>
      <div className="creation-layout">
        <div>
          <p className="eyebrow">
            <Layers size={15} /> {templates.length || 15} STARTER TEMPLATES
          </p>
          <label>
            Starter template
            <select
              aria-label="Starter template"
              value={id}
              onChange={(e) => choose(e.target.value)}
              disabled={!templates.length}
            >
              {templates.length ? (
                templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.category}
                  </option>
                ))
              ) : (
                <option>Loading templates…</option>
              )}
            </select>
          </label>
          <p className="helper">
            Education · Retail · Bookings · Research · Operations · Community
          </p>
          <label>
            Form name
            <input
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            What should this form collect?
            <textarea
              rows={5}
              value={brief}
              maxLength={4000}
              onChange={(e) => setBrief(e.target.value)}
            />
          </label>
          <p className="helper">
            Your template supplies the starting contract. Describe the outcome;
            review the assembled workflow before publishing.
          </p>
          {error && <Notice tone="error">{error}</Notice>}
          <button
            className="primary full"
            disabled={
              busy ||
              !selected ||
              brief.trim().length < 10 ||
              title.trim().length < 3
            }
            onClick={create}
          >
            {busy ? (
              <Busy text="Assembling your workflow…" />
            ) : (
              <>
                <WandSparkles size={18} />
                Create preview
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
        <div className="creation-preview">
          {selected && (
            <>
              <span className="status neutral">{selected.category}</span>
              <h3>{selected.name}</h3>
              <p className="muted">{selected.description}</p>
              <PipelineGraph spec={selected.spec} />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
