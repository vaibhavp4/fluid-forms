# Technical decisions and evaluation plan

29 October 2026 · Proposed architecture · Companion to [the PRD](PRD.md)

This records intended choices, their assumptions, alternatives, and the evidence needed to adopt them. It is not a record of completed integrations or benchmark results. Update, 30 October: the web application and provider adapters are implemented. Live model access and the optimization experiment remain unverified without credentials. See [current build decisions](BUILD_DECISIONS.md), which supersede earlier proposed choices below. “Nebius” is the infrastructure provider referred to in the discussion.

## Decision status and architectural claim

**Design constraint** means a boundary adopted in this specification. **Proposed** means the default implementation choice, subject to verification. **Conditional** means a dependency must pass a named experiment. **Deferred** means outside the initial slice. These labels do not imply final user approval of scope.

The claim to test: approved business requirements can be compiled into adaptive evidence-collection workflows whose AI capabilities improve through bounded optimization, without silently changing those requirements.

DSPy is the AI programming framework. GEPA is the optimization algorithm. Our evaluation harness supplies cases, measurements, and promotion gates. A separate runtime executes published artifacts. Neural-network training is another pipeline, not a capability implied by using GEPA.

## Connection to hackathon judging

The official criteria cover technological implementation, design, potential impact, and quality of the idea. Our evidence should address each, rather than equating more infrastructure with a stronger submission. [Official criteria](https://nebiusglobalaihackathon.devpost.com/)

| Criterion | Architecture decision | Evidence to demonstrate |
| --- | --- | --- |
| Technological implementation | Real Nebius inference with NVIDIA Nemotron; versioned capabilities; independent evaluation | Trace an actual call through a completed workflow; reproduce baseline/candidate results; demonstrate error handling |
| Design | Template onboarding, evidence guidance, readable change cards, stable published sessions | Owner configures a workflow without describing every field; worker recovers from rejected/ambiguous evidence; owner understands and approves a revision |
| Potential impact | One concrete equipment-survey workflow | Measure usable evidence, corrections, time, and review burden against the same workflow without assistance |
| Quality of the idea | Compile requirements separately from optimizing their implementation | Show a measured capability improvement while required information, exception policy, and active sessions remain unchanged |

Judging criteria are not our optimization loss. A visually polished demo cannot compensate for a validator accepting incorrect evidence. Hackathon eligibility and submission requirements must also be checked independently against the official rules before submission.

## Decision register

### D01 — Separate semantic and implementation compilation

**Design constraint.** An approved FormSpec describes required information, branches, evidence rubrics, and exception policy. A FormBundle binds that specification to renderer components and versioned capability implementations.

Assumption: business intent changes less frequently than implementation details. This allows a predictor to improve without allowing it to remove inconvenient requirements. A single agent generating arbitrary executable applications would couple policy, UI, and model behavior too tightly.

Acceptance: every generated field/rule maps to a requirement ID; missing or contradictory requirements block publication. The backend enforces the published contract independently of the generated UI.

### D02 — Python backend and explicit state

**Proposed.** Python, FastAPI, Pydantic, PostgreSQL/SQLAlchemy, and a worker backed by durable job records. React/TypeScript serves the mobile browser experience. Media and immutable evaluation artifacts use S3-compatible storage. Package versions remain unpinned until the integration spike.

Rationale: aligns with the builder's Python preference and DSPy ecosystem while separating interactive requests from lengthy compilation/evaluation jobs. PostgreSQL holds authoritative workflow state; object storage holds large blobs. No specific database or storage hosting vendor is selected yet.

Tests: retries do not duplicate submissions or releases; interrupted jobs resume or fail explicitly; replaced images invalidate stale model results. Client-side validation improves UX but cannot finalize a submission.

### D03 — DSPy programs with GEPA optimization

**Proposed.** Typed DSPy signatures/modules for specification generation, photo interpretation, extraction, feedback diagnosis, and revision proposals. Begin with a fixed instruction/few-shot baseline. Run bounded GEPA optimization offline on one capability first.

GEPA uses reflective feedback to propose improvements; evaluation determines their merit. Its reflection model is not an independent source of ground truth. [DSPy GEPA](https://dspy.ai/current/diving-deeper/gepa-in-depth/)

Assumptions: representative labeled cases exist, and repeated inference fits the budget. If these fail, retain a manually specified baseline and report the limitation. MIPROv2 is an alternative experiment, not another required production dependency.

Frozen: requirement semantics, output schema, evaluator, label set, acceptance policy, and release permissions. Tunable initially: module instructions. Demonstration selection or code search requires an explicitly expanded experiment definition. GEPA does not inherently optimize every possible artifact.

### D04 — Harness and orchestration responsibilities

**Proposed.** A small repository-owned Python evaluation runner loads versioned datasets, calls DSPy programs, computes metrics, and writes machine-readable results plus an owner-facing comparison. Use pytest for deterministic contracts and Playwright for browser journeys. DSPy evaluation utilities can provide module execution; our runner supplies leakage controls and promotion policy.

Use explicit state-machine transitions and persisted jobs for the MVP. **Conditional:** adopt LangGraph for durable multi-step agent orchestration if checkpoint/resume complexity warrants it. LangGraph is an orchestration candidate in the PRD, not the evaluation algorithm or a required layer.

Avoid introducing a general autonomous coding-agent harness into production. A controlled capability graph is easier to replay and evaluate. Experimental DSPy Flex code optimization is deferred until its pinned API, sandbox, and regression boundary are verified. [DSPy Flex](https://dspy.ai/current/diving-deeper/flex/)

### D05 — Nebius services

| Service/feature | Status and role | Assumption or adoption gate |
| --- | --- | --- |
| Token Factory public inference API | Proposed MVP route for hosted NVIDIA reasoning | Credentials, exact model ID, structured response behavior, timeouts, and cost pass a live smoke test |
| Dedicated inference endpoint | Deferred; consider predictable capacity or isolation later | Public endpoint limitations must justify deployment overhead |
| Nebius AI Cloud GPU compute | Conditional route for an unavailable vision endpoint or future specialist training | Quota, deployment time, serving compatibility, and total cost verified before adoption |
| Nebius Jobs/batch execution | Conditional placement for bounded evaluation/training workloads | Verify actual product/API availability and job recovery; a normal worker is sufficient initially |
| Managed training/fine-tuning | Deferred | Inference API compatibility does not establish a supported training backend |

Token Factory provides an OpenAI-compatible inference interface and lists NVIDIA model options; this is not evidence that every NVIDIA model is available through the same endpoint or supports every modality. [Nebius model catalog](https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference)

### D06 — NVIDIA model candidates and selection

| Role | Proposed candidate | Selection evidence |
| --- | --- | --- |
| FormSpec generation and revision proposals | Nemotron 3.5 Lightning; compare Nemotron 3 Super if requirements are lost | Requirement preservation, schema validity, branch correctness, cost, and latency on identical cases |
| GEPA reflection | Start with the verified reasoning endpoint; test a stronger Nemotron candidate only if necessary | Better held-out outcome per optimization dollar, including reflection tokens |
| Boiler image interpretation | Nemotron 3.5 Super VL as a candidate | Real image API/deployment access, hard-negative accuracy, abstention behavior, latency, and data handling |
| Document structure/OCR | No model selected | Needed only if import enters scope; benchmark field/provenance accuracy separately |
| Audio transcription | No model selected; deferred | Actual language/noise samples and correction effort |
| Browser specialist | No model selected; deferred | Total model/encoder size, device compatibility, quality, and end-to-end economics |

Nebius currently lists Lightning and Super among inference options. Exact identifiers will be copied from the authenticated catalog and tested, not inferred from display names. [Nebius NVIDIA models](https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference)

NVIDIA describes Super VL as a multimodal model; that establishes it as a candidate, not its availability in our Nebius account. Do not send images to a text-only endpoint. If vision deployment fails the spike, select a verified alternative vision endpoint while retaining genuine NVIDIA/Nebius use for reasoning, and document the actual split. [NVIDIA Super VL announcement](https://developer.nvidia.com/blog/nvidia-nemotron-3-5-super-vl-powers-specialized-agents-with-multimodal-reasoning/)

NIM, NeMo, TensorRT, and GPU training are not mandatory architecture layers. Add them only when a verified deployment or training need warrants their complexity. NVIDIA models must contribute to the working workflow, not appear only in the pitch.

### D07 — Constrained UI and template-first authoring

**Proposed:** curated equipment-survey pack, reusable sections, stable IDs, and repeatable assets. **Conditional:** Thesys OpenUI renders a constrained component vocabulary after a state-binding spike. Otherwise use a conventional React schema renderer and mark OpenUI as planned. [OpenUI](https://www.openui.com/docs)

Assumption: owners can recognize and customize an existing workflow more easily than dictate 50 questions. UI generation must not create new requirements or executable policy. Owner approval uses section/rule cards and before/after journeys rather than a raw code diff.

Acceptance: values survive navigation, conditional fields cannot trap users, repeated assets stay distinct, keyboard journeys work, and the server rejects invalid submissions regardless of client behavior.

### D08 — Evidence observations are separate from acceptance

**Design constraint.** Decode and validate uploads in ordinary code. A visual predictor returns visible/not-visible/indeterminate observations with a short explanation. Server policy maps those observations to accepted evidence, retake, review, or pending/error.

A boiler-presence check does not establish equipment identity, authenticity, operational condition, or safety. Label OCR and asset matching are separate capabilities. Confidence text is not a calibrated probability.

Assumption: early feedback can reduce unusable submissions. Test the whole worker interaction, because a stricter detector can increase retakes and abandonment. Timeouts never become passes. Client-only predictions remain advisory unless an explicit trust policy supports authoritative use.

### D09 — Approval and versioning

**Design constraint.** Pin active sessions to immutable bundles. Each proposal identifies changed requirements, behavior, report fields, affected users, test results, and expected effort. Approve an exact artifact hash; a subsequent edit requires fresh approval.

MVP: owner approval for every published revision. Future automatic promotion requires an explicitly authorized change class. Separate form revision, capability revision, and compiler revision; compiler changes need a cross-template suite. Rollback affects new sessions by default and preserves existing evidence/history.

### D10 — Specialization, privacy, and integration scope

**Deferred:** specialist training and browser/WebGPU inference. Compare total pipeline size and compute, including the encoder, download, fallback, and review cost. A tiny classifier head is not a tiny complete vision system. Distillation uses a separate training pipeline and independently labeled evaluation; teacher agreement alone is insufficient.

**Proposed:** WhatsApp as an owner transport adapter; browser as creation/review and respondent UI. Real WhatsApp depends on account readiness; label a web-only fallback honestly. Avoid putting raw customer images into optimization traces by default. Require dataset permission, tenant isolation, retention rules, and redacted logs. Cross-tenant training is outside the MVP.

## Evaluation specification

### Data and baseline protocol

Create permissioned, human-reviewed fixtures before optimization. Split by site and asset, including near-duplicate grouping, rather than randomly splitting photos. Maintain training, development, and sealed test manifests. GEPA sees only permitted training/development feedback. Test labels and cases cannot flow into reflection, demonstrations, or candidate selection.

For the MVP, aim for a development set and a separate held-out set spanning clear boilers, unrelated objects, confusing equipment, occlusion, poor lighting, labels-only images, and unsupported inputs. Actual counts depend on available representative data; publish denominators and gaps. Small demo sets prove a working experiment, not production reliability. Synthetic examples are labeled separately from field evidence.

Compare the same model and cases before/after optimization first. Model swaps, prompt changes, and UI changes are separate comparisons so improvement can be attributed. Human disagreement is adjudicated or retained as ambiguity rather than forced into a convenient label.

### Metrics and gates

| Capability | Primary measurement | Constraints and failure analysis |
| --- | --- | --- |
| Requirement import/generation | Fraction of source requirements correctly represented, plus omissions/additions | All required fixture requirements preserved; valid schema; no unsupported business rules |
| Boiler evidence check | False acceptance: nonconforming inputs accepted / labeled nonconforming inputs | False rejection on conforming inputs, abstention/review rate, errors, automatic coverage; inspect confusing-equipment slice separately |
| Extraction | Field accuracy and unsupported-value rate | Provenance correctness, missing values, human correction burden |
| Branching/submission | Correct expected outcomes across path fixtures | Required-field bypass, stale results, cross-asset mixing, duplicate finalization must fail tests |
| Revision proposal | Fixes the target failure while preserving unaffected requirements | Regression suite, added steps, owner understanding, version isolation |
| Worker experience | Usable submissions, completion time, retakes, follow-up work | Compare the same tasks; distinguish measured users from synthetic runs |
| Performance/economics | p50/p95 end-to-end latency and cost per usable submission | Include retries, reflection, reviewer time assumptions, compilation amortization, and browser cold start if applicable |

Every report includes raw counts and sample size. Define false rejection as conforming evidence explicitly rejected; report conforming evidence sent to review separately. Do not hide abstentions inside accuracy or count them as correct decisions. Report uncertainty intervals where meaningful and avoid precision unsupported by sample size.

### Optimization score versus release decision

GEPA needs a scalar score plus actionable feedback; production needs multiple gates. Proposed search score is macro-averaged correctness across labeled visibility classes, with structured failure feedback. Abstention is rewarded only on genuinely ambiguous examples. Operational auto-acceptance is evaluated separately after policy mapping.

Before the first optimization run, freeze numeric risk limits and cost/latency budgets in an experiment manifest. These values are **not agreed yet**: the workflow owner must establish acceptable false acceptance and review burden. Until then, use advisory/reviewer-confirmed model outcomes and do not claim production acceptance thresholds.

Promotion requires: deterministic invariant tests pass; no prohibited behavior; held-out risk limits pass; quality does not regress beyond a declared tolerance; and the chosen benefit exceeds a predeclared minimum while meeting cost/latency limits. If statistical evidence is insufficient, classify the candidate as experimental and retain reviewer confirmation. Always-abstain and accept-everything policies must fail the gate.

### Bounded optimization and reproducibility

Each run records dataset hashes, labels/rubric version, model endpoint and revision where available, DSPy/GEPA package versions, baseline instructions, tunable fields, random seeds, temperature, call/token/currency/time budgets, and candidate artifacts. Enforce budgets in the runner; do not assume an evaluation-count cap controls reflection spend.

Store per-case predictions, durations, token usage, errors, and feedback with sensitive inputs referenced through controlled storage. Rerun finalists when variability affects conclusions. Record provider drift when the endpoint does not expose immutable weights. Never promise exact replay from a seed alone.

Run final held-out evaluation after selecting a candidate on development data. Failure is a valid result: retain the baseline. Repeated examination contaminates a holdout; subsequent optimization requires a fresh test set. Production corrections enter the next reviewed dataset, not an immediate self-modifying deployment.

## First implementation experiments and unresolved choices

1. **Inference spike:** confirm credentials, candidate IDs, text/vision modalities, structured responses, timeout behavior, and cost. Select a working NVIDIA reasoning route and a real vision route.
2. **Contract spike:** one pack, typed FormSpec, boiler evidence rubric, and labeled cases. Decide which outcomes require human review and freeze the initial experiment manifest.
3. **Renderer spike:** prove repeated assets, controlled inputs, and branching with OpenUI. Choose the fallback if that fails.
4. **Vertical flow:** owner preview/approval → worker capture → validated submission → traceable stored result.
5. **Optimization experiment:** baseline versus one GEPA-optimized capability, with a held-out report and immutable artifact. Do not attempt simultaneous optimization of the entire product.
6. **Release demonstration:** readable proposed change, exact approval, old-session pinning, new-session behavior, and rollback.

Still open: final vertical/template, source material and dataset permissions, numeric risk thresholds, exact model IDs, authenticated vision availability, UI compatibility, hosting region, retention periods, WhatsApp readiness, and evaluation budget. These are tracked decisions, not concealed implementation assumptions.

Completion of this document means the rationale and evaluation plan are recorded. It does not mean the proposed choices have passed their experiments or the product has been built.
