import {
  MessageSquareText,
  BrainCircuit,
  GitBranch,
  Database,
  Camera,
  CheckCircle2,
} from "lucide-react";
import type { FormSpec, Interpretation } from "../types";
import { issueLabels } from "../workflow";
export function PipelineGraph({
  spec,
  activeIssue,
}: {
  spec: FormSpec;
  activeIssue?: Interpretation["issue"];
}) {
  const rules = spec.follow_up_rules || [];
  return (
    <section className="pipeline" aria-label="Workflow capability graph">
      <div className="section-heading">
        <GitBranch size={19} />
        <h3>How this form adapts</h3>
        <span className="status neutral">Typed workflow</span>
      </div>
      <div className="pipeline-stages">
        <div className="pipeline-node">
          <MessageSquareText />
          <small>01 · UNSTRUCTURED INPUT</small>
          <strong>A natural response</strong>
          <p>
            Text or browser voice input. {spec.context_label || "Site"} and date
            give context.
          </p>
        </div>
        <div className="pipeline-node model">
          <BrainCircuit />
          <small>02 · LANGUAGE MODEL</small>
          <strong>Extract + understand</strong>
          <p>
            Nemotron Lightning on Nebius extracts facts, concerns and intent.
          </p>
        </div>
        <div className="pipeline-node">
          <GitBranch />
          <small>03 · DETERMINISTIC ROUTER</small>
          <strong>Match the context</strong>
          <p>
            Issue / sentiment → the relevant question. Other paths stay short.
          </p>
        </div>
        <div className="pipeline-node">
          <Database />
          <small>04 · STRUCTURED RECORD</small>
          <strong>Confirm + save</strong>
          <p>Editable details, source response and the exact form version.</p>
        </div>
      </div>
      <div className="pipeline-branches">
        {rules.map((r) => (
          <div
            key={r.id}
            className={`pipeline-branch ${activeIssue === r.trigger ? "matched" : ""}`}
          >
            <span className="route-label">
              {activeIssue === r.trigger ? (
                <CheckCircle2 size={14} />
              ) : (
                <GitBranch size={14} />
              )}{" "}
              If {issueLabels[r.trigger]?.toLowerCase() || r.trigger}
            </span>
            <strong>{r.question}</strong>
            <small>Contextual text question · required on this path</small>
          </div>
        ))}
        {spec.require_delivery_photo && (
          <div className="pipeline-branch">
            <span className="route-label">
              <Camera size={14} /> If wrong materials
            </span>
            <strong>{spec.evidence_prompt}</strong>
            <small>Photo → Nemotron Super VL → retake / office review</small>
          </div>
        )}
        {!rules.length && !spec.require_delivery_photo && (
          <p className="helper">
            Starts with the report and a relevant clarification. Owner feedback
            can add a checked contextual branch.
          </p>
        )}
      </div>
    </section>
  );
}
