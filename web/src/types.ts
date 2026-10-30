export type Interpretation = {
  completed: string;
  blocker: string;
  next_action: string;
  issue:
    | "wrong_material"
    | "late_delivery"
    | "weather"
    | "other"
    | "none"
    | "uncertain";
  summary: string;
};
export type FormSpec = {
  title: string;
  description: string;
  note_prompt: string;
  blocker_question: string;
  require_delivery_photo: boolean;
  evidence_prompt: string;
  allow_exception: true;
  sites: string[];
};
export type Form = {
  id: string;
  title: string;
  brief: string;
  current_release: string | null;
  sample?: boolean;
};
export type Evaluation = {
  kind: string;
  passed: boolean;
  cases: { name: string; passed: boolean }[];
  artifact_hash: string;
  note: string;
};
export type Release = {
  id: string;
  form_id: string;
  number: number;
  spec: FormSpec;
  hash: string;
  created: string;
  sample?: boolean;
  evaluation: Evaluation;
};
export type Proposal = {
  id: string;
  form_id: string;
  base_release: string | null;
  spec: FormSpec;
  feedback: string;
  status: string;
  hash: string;
  evaluation: Evaluation | null;
  trace: Record<string, unknown>;
};
export type Photo = {
  id: string;
  hash: string;
  observation: {
    visibility: string;
    explanation: string;
    provider: string;
    status: string;
  };
};
export type Answers = {
  site: string;
  day: string;
  worker: string;
  note: string;
  interpretation: Interpretation;
  arranged: string;
  exception: string;
};
export type Submission = {
  id: string;
  form_id: string;
  release_id: string;
  version: number;
  session_id: string | null;
  answers: Answers;
  photo: Photo | null;
  review_required: boolean;
  review?: { note: string; at: string; decision: string };
  sample: boolean;
  created: string;
  trace: Record<string, unknown>;
};
export type WorkerSession = {
  id: string;
  form_id: string;
  release_id: string;
  version: number;
  spec: FormSpec;
  answers: Answers | null;
  photo: Photo | null;
  submitted: boolean;
  submission_id?: string;
  last_interpretation?: { note: string; result: Interpretation };
};
export type Workspace = {
  form: Form[];
  release: Release[];
  proposal: Proposal[];
  submission: Submission[];
};
export type Health = {
  ok: boolean;
  mode: string;
  model: string | null;
  vision: boolean;
  owner_auth: boolean;
};
