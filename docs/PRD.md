# Adaptive form platform product requirements

Draft for discussion · Declarative optimization architecture · 29 October 2026

## Product vision

Enable a small business owner or operations manager to select a survey template, import an existing checklist, or describe a workflow in a web workspace, then publish an adaptive application for customers or field staff. People complete it using text, documents, images, measurements, or speech. The system compiles the approved requirements into a versioned form program, verifies its behavior, and proposes improvements using observed failures and business feedback.

The product should reduce the work required to obtain a usable submission, including avoidable return visits to collect missing evidence. A completed form is valuable when the business can act on its contents. Collected evidence, machine validation, and professional sign-off are separate states.

The long-term architectural contribution is a form compiler whose intelligent capabilities are declarative, measurable programs and model calls - it can assemble and improve pipelines of models (ideally edge sized running on webgpu) to collect, process, and adapt to information being supplied. Each capability specifies its inputs, outputs, approved meaning, constraints, and evaluation criteria; a bounded optimization process searches for better implementations. Frequent tasks may eventually be specialized into smaller models or ordinary code when independently verified. The compiler, generated form, execution history, and evaluations are individually versioned. Changes to an individual form and changes to the generator are separate release processes.

This PRD describes the intended finished product first. The hackathon slice near the end is a proposal for discussion, not a finalized scope or an implementation claim. A web-only implementation now exists; see BUILD_DECISIONS.md and the root README for current scope and verification limits. This document retains the broader product vision.

## Current implementation scope

The daily-site-update journey was approved on 30 October. The build is web-only, uses Vercel json-render, and stores immutable form contracts with SQLAlchemy. See [build decisions](BUILD_DECISIONS.md) for the current implementation; the broader capabilities below remain the product vision.

## Assumptions
- Owners use a browser workspace for creation, review, and approvals. Workers open mobile-friendly browser links. WhatsApp integration was removed from the MVP.
- The implementation uses Vercel json-render with controlled React components. Earlier OpenUI references below record the initial research option.
- Initial candidates are mystery-shopping operators, and visual merchandising auditors; later on web forms remain a very big and powerful market (for embedding on websites for booking, signups, appointments, surveys etc)
- Forms may execute registered model capabilities. The exact browser models and hosted NVIDIA model IDs are selected through compatibility and quality tests.
- The owner reviews publication and material business-rule changes. Later automatic publication can be limited to explicitly authorized change categories.
- Personalization changes presentation and relevant questions while preserving the business's required information and validation rules.

## Users and impact

| Persona | Current difficulty | Intended outcome |
| --- | --- | --- |
| Owner or operator | Reconstructing an established process as questions and rules takes time | Select a suitable template or import a checklist, resolve gaps, and publish |
| Customer or respondent | Re-entering information already present in a document; unclear questions; irrelevant steps | Provide existing evidence, correct extracted values, answer only necessary questions |
| Staff receiving submissions | Missing information requires follow-up; inconsistent answers are hard to process | Receive structured, source-linked, confirmed information |
| Field surveyor or auditor | Long forms, repeated assets, poor connectivity, and rejected evidence cause rework | Follow a guided site workflow, capture usable evidence, and resume without losing work |
| Platform maintainer | Generated forms and generator updates can silently regress | Reproduce failures, test changes, compare versions, and roll back |

The proposed practical testbed is an equipment site survey with a boiler photograph, identifying details, repeatable assets, and an exception path. It gathers evidence, not a safety certification. The market and final template remain unselected. Actual bookings, if later supported, require transactional confirmation beyond form submission.

## Differentiation and alternatives

AI authoring and branching are established capabilities. Typeform documents prompt and voice-based creation, logic changes, and uploaded builder context. We should compare against an AI-assisted conditional form, not only a manually built static form. [Typeform AI](https://help.typeform.com/hc/en-us/articles/42053773420948-Use-Typeform-AI), [AI creation](https://help.typeform.com/hc/en-us/articles/43349373185812--Create-your-form-using-AI).

The proposed advantage is the combination below. Its superiority is unproven until evaluated.

| Alternative | What it already does well | Our hypothesis to test |
| --- | --- | --- |
| AI-assisted form builder | Quickly generates questions and conditional flows | Evidence extraction and targeted clarification reduce respondent effort while preserving data quality |
| Messaging-based intake | Familiar interface and flexible answers | A compiled browser experience produces more consistent submissions with less staff rework |
| Custom web application | Can implement precise business behavior | Conversational authoring and verified revisions reduce implementation and maintenance time |
| Generic generated UI | Composes interactive interfaces | A durable form contract keeps branching, extracted evidence, submission validation, and revisions consistent |

OpenUI provides component-based UI generation and streaming rendering. Our proposed compiler and evaluation loop sit above that rendering layer. [OpenUI documentation](https://www.openui.com/docs).

Inspection software is also a direct comparison. SafetyCulture offers inspection templates and publication workflows; its documentation states that published changes apply to new inspections. ODK documents repeating groups and constraints. Templates, repeatable assets, and version pinning are therefore expected foundations, not novelty claims. The differentiating hypothesis is earlier detection of unusable evidence combined with understandable, tested revisions that preserve operational intent. [SafetyCulture publication](https://help.safetyculture.com/en-US/005883/), [ODK form logic](https://docs.getodk.org/form-logic/).

## Finished product journey

### Owner creates and maintains a workflow

1. The owner selects a workflow pack, uploads an existing checklist, or starts from a conversational brief. WhatsApp can send a deep link to the relevant pack and workspace.
2. The agent asks for context that affects applicability: work type, site type, intended report, operating region where relevant, and who signs off.
3. The system assembles sections from reusable modules and shows what came from the template, imported source, or agent suggestion. It asks only unresolved questions.
4. The owner reviews a section outline, required evidence, validation policies, and exception paths. A visual preview shows typical, exceptional, and repeated-asset journeys.
5. The compiler validates references, types, branches, capabilities, and submission rules. Browser tests exercise representative respondent paths.
6. The owner approves a named release and assigns it to jobs or shares a link. Staff see the current instructions and applicable release.
7. Proposed improvements arrive as grouped change cards with business effects and evaluation results. Owners review them in the workspace and approve a specific revision before publication.

WhatsApp is a transport adapter rather than the source of workflow state. The adapter must handle duplicate deliveries and delayed events. Meta onboarding, media handling, business messaging permissions, templates, and current account constraints are a pre-implementation check; documentation access was rate-limited during drafting. [Meta Cloud API documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/overview).

### Respondent completes a form

1. Open a browser link without installing an application.
2. See the purpose, job or site context, section checklist, evidence examples, and available input modes.
3. Upload a supported document or record audio if helpful; typed input always remains available.
4. Review extracted values with their source and correct or confirm them.
5. Answer relevant follow-up questions and repeat sections for each room or asset. Deterministic rules handle known branches; model-assisted interpretation resolves ambiguity within the form contract.
6. Save and resume. Review unresolved items and explicit exceptions, then submit. A note is not automatically an acceptable substitute for a required photo or measurement.
7. Receive a truthful status: draft saved locally, uploading, received pending checks, awaiting reviewer, or finalized. Only the server can confirm receipt or finalization.

Existing sessions stay pinned to their published form version. A new release affects new sessions unless a deliberate migration is approved.

## Functional requirements

| ID | Requirement | Acceptance condition |
| --- | --- | --- |
| F1 | Conversational authoring | A supported brief produces a valid specification; missing business decisions are surfaced rather than invented |
| F2 | Versioned compilation | Every release records specification, compiler, component library, prompts, and model configuration |
| F3 | Adaptive presentation | Relevant branches render correctly; answers persist across navigation; hidden required fields cannot trap the user |
| F4 | Multimodal extraction | Supported document and audio inputs produce editable proposed values with provenance; uncertain output requests confirmation |
| F5 | Capability routing | Every model task uses an allowed local or cloud route and records route, latency, and outcome |
| F6 | Validated submission | Backend independently enforces types, required information, cross-field constraints, and duplicate-submission handling |
| F7 | Inspectable execution | Owners can trace a submission to form version, capability results, corrections, and validation events |
| F8 | Feedback-driven revision | A proposed change has supporting feedback, a diff, regression results, and a publication decision |
| F9 | Generator improvement | Generator updates run against a multi-form regression suite before release |
| F10 | Accessible fallback | Keyboard navigation, labeled inputs, readable errors, and typed alternatives work even if a model capability fails |
| F11 | Template and import onboarding | Owner sees template provenance and an import coverage report; unresolved source requirements block release |
| F12 | Long surveys and repeated assets | Stable section and asset IDs, autosave, resume, explicit exceptions, and sync states preserve collected work |
| F13 | Typed evidence validation | Each check has scope, outcome policy, examples, test fixtures, and a reviewer route; uncertain output is not a pass |
| F14 | Understandable release review | Owner can inspect changed journeys and report effects, approve an exact candidate, and see staff acknowledgment requirements |
| F15 | Declarative capability optimization | Each intelligent module has a typed contract, baseline, dataset versions, metric, allowed search space, budget, and immutable candidate artifact |
| F16 | Independent promotion gate | Optimization cannot modify the evaluator or policy; candidates require held-out evaluation and the existing approval process before release |

## Template led onboarding and long surveys

### Workflow packs

A pack includes sections, questions, evidence instructions, optional modules, deterministic rules, model capability bindings, exception reasons, review roles, sample reports, and evaluation fixtures. Catalog cards show intended use, publisher, revision, applicable context, and last review. Packs are curated or licensed; public availability does not grant permission to copy a commercial checklist. Community, organization-approved, and professionally reviewed packs carry distinct labels.

For fire-safety surveys, applicability and review are first-class metadata. A generic pack must not claim to cover all buildings or certify compliance. A business's competent reviewer approves the checklist and source requirements. The agent assists translation and evidence collection; it must not invent required tests or infer that a pictured installation is safe. Community-template limitations are an existing industry concern. [SafetyCulture template provenance](https://safetyculture.com/library/property-and-facilities-management/emergency-and-resilience-fire-safety-qovz9xyt2eoipl03).

### Creating a 50 step workflow

The owner chooses a pack or imports their existing PDF, spreadsheet, or document. The workspace presents, for example, six sections and 50 possible questions rather than a blank chat requesting 50 instructions. Reusable modules cover site details, asset inventory, evidence capture, observations, exceptions, and sign-off. This structure is illustrative, not a prescribed safety checklist.

An import coverage view maps each source requirement to a field, check, branch, or explanatory instruction. It flags ambiguous units, unreadable passages, missing answer options, and possible duplicates. Unmapped requirements remain visible until resolved. Agent-proposed additions are separate from imported requirements. Templates similarly expose inherited defaults and organization overrides.

The owner reviews differences: which modules apply, who fills them out, which evidence is mandatory, what happens when it cannot be obtained, and who can accept exceptions. Bulk editing applies within an explicit scope. Preview modes include the common path, exception path, and repeated-asset path. A 50-question pack need not show every question to every person, but tests must cover its relevant paths.

Template updates create candidate upgrades. The system compares the old base pack, organization customizations, and new pack; conflicting edits require a decision. It never silently overwrites local requirements. Every requirement retains a stable ID and provenance.

### Field experience

- Organize the survey around rooms, zones, assets, or visits. Each repeated item has a stable ID; removing an item with evidence requires confirmation and preserves audit history.
- Present section progress as complete, incomplete, awaiting checks, or exception. Do not display misleading fixed progress percentages when branches and repeat counts are unknown.
- Show a capture guide and accepted examples before asking for a photo. Support camera capture, permitted gallery uploads, compression, rotation, and an explicit upload state.
- Autosave answers and maintain an upload queue. Offline drafts are not server-received submissions. Where browser storage cannot safely retain a large file, warn before navigation and provide a recoverable path.
- Missing connectivity leaves cloud checks pending. After reconnection, match results to the image hash and field revision; late results for replaced photos must not overwrite newer decisions.
- A dependent answer change marks affected evidence or results stale. Keep the old evidence in history and request revalidation rather than silently deleting it.
- Optional or inaccessible assets use named exception reasons and reviewer handling. Respondents cannot create their own exemptions from required evidence.

## Evidence validation example for a boiler photo

### Owner configuration

The owner selects a prebuilt Photo evidence component and chooses its purpose: equipment overview, identifying label, installation context, or documented issue. The template supplies instructions and policies. The owner configures the target as boiler, the applicable asset, acceptable views, whether multiple photos are allowed, and the uncertainty/exception route. A single check does not establish object presence, correct identity, and safety simultaneously.

### Execution pipeline

1. Deterministic intake verifies file limits, actual decodability, orientation, and adequate dimensions. Corrupt or unsupported files require replacement or conversion.
2. Quality checks assess blur, darkness, and framing. They produce specific retake guidance; thresholds must be tuned against representative photos.
3. A registered visual capability assesses whether the intended object is visible. It uses a tested vision model or specialist detector with a versioned rubric. OCR alone cannot determine that an object is a boiler. Classification alone does not provide a reliable bounding box.
4. Identity checks, if required, are separate: read a label from a close-up, confirm extracted text, and compare with an asset record. A label match is evidence about identity, not proof of the site's current condition or photo authenticity.
5. The backend policy evaluator maps observations to accepted evidence, retake requested, needs human review, or pending/error. It stores the check version, asset ID, media hash, observations, and decision. The model does not decide business policy by free text.

Example capability contract:

```yaml
check_id: boiler_overview
kind: image_object_presence
capability: visual_presence_v1
target: boiler
asset_binding: current_asset.id
outcomes:
  visible: accept_evidence
  not_visible: request_retake
  indeterminate: request_retake_or_review
  unavailable: retain_pending
retake_limit: 2
after_limit: reviewer_required
```

The values are proposed policy defaults, not tested model settings. Capabilities return structured observations such as object visibility and image quality, plus a short evidence description. The server validates that structure. Model-reported confidence is not a calibrated probability; auto-acceptance requires empirical evaluation. Before that evaluation, results are advisory or reviewer-confirmed.

### Respondent outcomes

| Input or condition | Message and next action | Status |
| --- | --- | --- |
| Clear relevant overview | Photo appears to show the requested equipment; continue | Evidence accepted, not equipment certified |
| Clearly unrelated object | This looks like a radiator; capture the boiler overview shown in the guide | Retake requested; respondent can dispute |
| Cropped or ambiguous equipment | Cannot determine from this view; step back or add another view | Indeterminate |
| Cannot access equipment | Select reason and provide permitted contextual evidence | Exception awaiting reviewer |
| No model/network response | Photo saved; check will resume when available | Pending, never automatic pass |
| Two rejected attempts | Preserve photos and explanation; route to supervisor | Review required |

An equipment-presence rule must be tested with positives, unrelated objects, visually similar equipment, occluded views, labels-only images, low light, screenshots, and unusual legitimate models. Include corrected false rejections. Evaluate false acceptance, false rejection, abstention/review rate, latency, and repeat-photo burden separately. Photos and metadata cannot prove liveness or location; those would require a separately designed evidence policy. Workers must never be asked to open equipment or take unsafe positions to satisfy a photo check.

For the first implementation, cloud vision is the default semantic check after verifying the model endpoint. Browser-local execution is an optimization only for a model that passes the same task suite. Client results help capture UX; server validation or reviewer confirmation is required for authoritative acceptance when the client cannot be trusted.

## Practical workflow comparisons

| Workflow | Setup and field behavior | Useful machine checks | Human responsibility |
| --- | --- | --- | --- |
| Contractor equipment survey | Select pack, repeat per asset, capture overview and identifying label | Photo relevance, label extraction, missing evidence, inconsistent asset references | Equipment condition and professional judgment |
| Ramp site survey | Import approved specification; capture endpoints, measurements, units, and views | Validate units; compute rise/run from measured values; flag missing inputs | Measurement accuracy, applicable criteria, suitability; no absolute dimensions inferred from an uncalibrated photo |
| Fire safety evidence survey | Organization-approved checklist with controlled modules and sign-off | Evidence completeness, legibility, conflicting answers, unresolved exceptions | Checklist applicability and safety/compliance conclusions |
| Mystery shopping | Assign a visit pack; record observations, receipt, timing, and narrative | Receipt extraction and timeline consistency | Subjective service assessment; AI must not invent an interaction or score from a photo |
| Visual merchandising audit | Select store/campaign and reference layout; repeat per display | Compare visible products/signage with supplied reference; flag missing or unreadable evidence | Approve ambiguous counts, occluded items, and contextual exceptions |

Different packs share the compiler, but use different capability contracts and evaluation sets. A generic vision prompt is not a validated universal auditor.

## Owner understanding and change approval

### Authoritative workspace

The owner workspace always shows Published release, Draft changes, and Pending proposals separately. Its current workflow view contains a section outline, human-readable rule cards, a branch map, required evidence, and the exported report schema. These are generated from the same approved FormSpec as the respondent UI; an independently written summary can drift and must not become the authority.

WhatsApp notifications summarize a proposal and link to its exact candidate. Publishing requires an authenticated actor authorized for the affected scope. A casual reply or approval of an older proposal cannot authorize a newer revision. Batches may be approved together only when their effects and dependencies are presented together.

### Change cards

Every proposal states what changed, why, the source of the suggestion, affected roles and sections, likely added effort, report/scoring effects, failed and passing examples, evaluation results, and rollout policy. Owners can preview before and after with the same sample answers. They can accept, edit, reject, or defer. Unreviewed proposals remain proposals; the existing form continues to operate.

Illustrative proposal: Several accepted boiler models were rejected when closely cropped. Change the capture instruction and add an optional second view when the result is indeterminate. Preserve the required equipment evidence and all acceptance thresholds. Show actual counts when available, the relevant examples, and held-out false-acceptance results. A competing proposal to weaken the object check must be treated as a policy change, not a wording improvement.

### Approval classes

| Change | Required handling |
| --- | --- |
| Adaptation already permitted by published rules | Execute within the session; record the chosen branch |
| Layout or help-text revision | Owner approval initially; later eligible for an explicitly configured narrow auto-release policy |
| New check, required field, branch, scoring rule, threshold, or exception | Workflow owner approval after impact preview and regression tests |
| Professional or safety checklist requirement | Named qualified/domain reviewer plus required organization approval |
| Vision model, prompt, or routing update | Treat as a validator revision; evaluate against the pack's fixtures and apply the same approval policy as behavioral changes |
| Shared compiler/component change | Platform review and cross-pack regression suite; no autonomous production code replacement |

### Keeping staff and records synchronized

Publish an immutable release with an effective date, concise change summary, and generated updated instructions. Material changes require acknowledgment by assigned staff where configured. Existing jobs/sessions remain pinned; the owner sees which versions are still in use. A critical change may pause affected jobs and require explicit migration with retained answers and additional checks. Never silently migrate or erase evidence.

Submitted records retain their original schema and rubric. Reports group by version and identify incompatible fields/scores rather than merging them as equivalent. Rollback changes the version for future work; it does not rewrite past submissions. A newer draft or template update invalidates stale approval tokens, so an owner can only publish the exact evaluated candidate they reviewed.

## Architecture and technical components

### Form compiler and executable artifact

The agent produces a typed FormSpec, an intermediate representation of the workflow. It includes template provenance, section and repeat-group definitions, fields with stable IDs, output schema, required information, branches, constraints, evidence-check contracts, exception and approval policies, UI preferences, capability calls, and allowed side effects. JSON Schema and Pydantic describe and validate the contract. Generated UI never becomes the authority for business rules.

Compilation produces a FormBundle containing the normalized specification, rendered UI definition, a deterministic branch plan, a model-capability manifest, test cases, and release metadata. The runtime executes this bundle. This is a compilation process into a constrained executable representation; arbitrary generated JavaScript is not required for every form.

In the full product, custom component or compiler code generation is supported in isolated development environments. Generated patches must pass type checks, restricted-dependency checks, browser tests, and cross-form regressions before becoming releases. The agent may propose changes to code that generates forms, but those changes cannot silently replace production code.

### Proposed component choices

| Layer | Proposed technology | Responsibility and adoption condition |
| --- | --- | --- |
| Owner messaging | WhatsApp Business Platform Cloud API | Messages and media in; previews, links, and approved updates out; account readiness required |
| Application backend | Python, FastAPI, Pydantic | Tenant boundaries, APIs, validation, capability gateway, and publication |
| Agent orchestration | LangGraph | Durable authoring and improvement runs with checkpoints and owner review |
| Declarative intelligence | DSPy signatures and modules | Typed model programs for authoring, extraction, evidence interpretation, and change proposals |
| Optimization | DSPy GEPA initially; simpler few-shot baseline | Budgeted instruction optimization with feedback-rich metrics; model/provider compatibility verified in a spike |
| Specialization experiments | PyTorch training and ONNX export; compatible DSPy fine-tuning where available | Optional small specialist models with their own training pipeline and held-out evaluation; no automatic browser export assumed |
| Core model | Supported NVIDIA Nemotron through Nebius Token Factory | Brief interpretation, specification generation, ambiguity resolution, and proposed revisions; exact ID tested before locking |
| Multimodal cloud processing | Compatible vision model and speech transcription service | Document and audio interpretation; verify availability and supported input formats separately |
| Browser application | React, TypeScript, Vite | Owner previews, respondent experience, review screen, and release comparison |
| Generated UI | Thesys OpenUI with an approved component library | Render generated layouts; prove stable field binding, validation, and state preservation in a spike |
| Template catalog | Versioned workflow packs and organization overrides | Curated content, applicability metadata, source mapping, and upgrade reconciliation |
| Evidence policy | Typed validator registry and server policy evaluator | Bind specialist capabilities to explicit acceptance, retake, pending, and review behavior |
| Approval workspace | React views derived from FormSpec and release records | Rule cards, journey comparison, impact review, staff change summaries, and exact-version approval |
| Deterministic form semantics | JSON Schema, AJV, explicit rule evaluator | Shared field contract and client checks; server remains authoritative |
| Browser model execution | Transformers.js with its ONNX runtime support | One or more verified compact models; WebGPU where supported, WASM where feasible, otherwise manual or consented cloud fallback |
| Persistence | PostgreSQL and SQLAlchemy | Form versions, runs, submissions, approvals, evaluations, and metadata |
| Media and artifacts | S3-compatible object storage | Source files, bundles, reports, scoped access, and retention controls |
| Long-running work | Durable job records and a worker | Compilation, evaluations, and revisions survive request timeouts; Nebius Jobs can run bounded batch workloads |
| Verification | pytest and Playwright | Contract checks, branch tests, keyboard journeys, and visual inspection |
| Deployment | Docker for backend and workers; static browser bundle | Reproducible deployment; host selection follows available credentials and runtime requirements |

OpenUI supports a constrained component vocabulary and direct model-provider use; a paid gateway is not assumed. Its generation layer does not automatically supply our business-rule engine. JSON Forms demonstrates schema-based show/hide/enable/disable rules and is an alternative renderer if the OpenUI integration cannot preserve the required semantics. [OpenUI](https://www.openui.com/docs), [JSON Forms rules](https://jsonforms.io/docs/uischema/rules/).

Transformers.js supports WebGPU execution. Browser support, model compatibility, memory, and initial downloads remain device-dependent. Pin a tested stable package/model pair; documentation for a development version is not proof of a released feature. [WebGPU guide](https://huggingface.co/docs/transformers.js/guides/webgpu).

### Local and cloud decision execution

Each capability declares input/output schema, model revision, resource estimate, supported environments, and fallback policy. Route using device capability, data permissions, workload size, and measured quality. Model-reported confidence alone does not justify automatic acceptance.

Use ordinary code for required-field checks, arithmetic, date constraints, and known branches. Use models for interpretation, extraction, or classification where those capabilities add value. Never claim that all data remains local: owner messages travel through WhatsApp, and cloud inference processes the inputs sent to it. A local-only mode must disable incompatible cloud routes and communicate its limits.

### Execution flow

Template selection or checklist import → gap clarification → FormSpec → compilation and tests → owner preview and approval → published FormBundle.

Respondent input → deterministic rules or permitted model capability → value confirmation → updated UI → server validation → submission.

Observed feedback → diagnosed failure → proposed patch → regression evaluation → owner decision → new version or rejection.

## Declarative optimization architecture

### Design principle

Declare the required behavior once and evaluate candidate implementations against it. Apply this contract-first discipline throughout the product, but use learned optimization only where behavior genuinely requires inference or design judgment. Storage, authorization, business policy, arithmetic, release gates, and deterministic branches remain ordinary tested code. A model must not learn whether an unauthorized person may publish a survey.

The user-supplied image motivates moving expensive reasoning into a preparation stage and compiling frequently repeated tasks into specialized execution. The proposal of a tiny disposable network is a research direction, not evidence that every form capability can fit into a 100,000-parameter model. In particular, a small classifier over image embeddings still depends on a larger visual encoder; report the size, download, and compute of the whole pipeline.

### Two compilation stages

1. Semantic compilation converts a selected pack and approved owner changes into FormSpec. It establishes what the survey means and which requirements cannot change.
2. Implementation compilation binds each capability to a measured implementation: fixed code, optimized model instructions, approved examples, a smaller model, or a bounded code module. It establishes how the declared task executes.

A new photo classifier may preserve the definition of acceptable evidence. Adding a requirement to photograph the equipment label changes the survey contract. The latter requires a semantic change proposal even if it improves a metric.

### Capability specification

Each CapabilitySpec declares: stable ID, typed input/output, contract revision, rubric revision, hard invariants, permitted runtime locations and data use, fallback behavior, training and evaluation manifests, metrics, optimization budget, allowed parameters, and release owner. Business invariants live outside tunable prompt text and are independently checked.

Illustrative declaration, not a built-in DSPy API:

```yaml
capability: boiler_presence
contract_revision: 1
inputs: [image, approved_evidence_rubric]
outputs:
  visibility: [visible, not_visible, indeterminate]
  evidence_description: string
invariants:
  - no_equipment_safety_conclusion
  - preserve_indeterminate_and_review_paths
tunable: [task_instructions, demonstrations]
frozen: [rubric, output_schema, acceptance_policy, evaluator]
evaluation:
  split_unit: site_and_asset
  report: [false_accept_rate, false_reject_rate, review_rate, latency, cost]
promotion: held_out_gate_then_owner_review
```

DSPy signatures supply typed input/output contracts and modules supply execution strategies. Our dataset registry, business constraints, approval system, and deployment compiler remain application components. [DSPy signatures](https://dspy.ai/current/diving-deeper/signatures-in-depth/).

### Module map

| Capability | Declarative contract | Evaluation | Permitted optimization |
| --- | --- | --- | --- |
| Template selection | Business context and catalog → ranked pack IDs and unresolved questions | Correct applicability, useful clarification, no invented packs | Instructions and examples |
| Checklist import | Source and pack → mapped requirements and ambiguities | Source coverage, extraction accuracy, no silent omissions | Extraction instructions and pipeline decomposition |
| Form composition | Approved requirements and components → FormSpec and UI definition | Contract preservation, valid components, tested respondent paths | Composition instructions and constrained implementation proposals |
| Photo interpretation | Image and rubric → observations with abstention | Human-labeled visual outcomes and error rates | Instructions/examples; later specialist training |
| Label extraction | Image and field definitions → sourced values and unknowns | Field accuracy, unsupported-value rate | OCR/model pipeline and extraction instructions |
| Audio interpretation | Recording or transcript and context → supported field values | Transcription/entity accuracy, correction burden | Tested speech model configuration and extraction program |
| Next-question proposal | Session and permitted question set → question ID or completion proposal | Relevant questions, preserved mandatory information | Proposal strategy; deterministic eligibility remains fixed |
| Feedback diagnosis | Labeled events and release → supported failure hypotheses | Correct attribution, evidence coverage | Diagnostic instructions |
| Revision proposal | Contract and failure evidence → bounded patch and explanation | Correct repairs, no policy drift, held-out regressions | Instructions; later sandboxed implementation search |
| Backend and rules | Inputs and approved contract → state transition | Property tests, invariant checks, transactional correctness | Conventional implementation improvements with code review |

Optimize modules individually to diagnose errors, then evaluate the complete workflow. A better classifier can still worsen the experience by asking for too many retakes. UI render validity is a useful automated metric, but it cannot substitute for human usability evaluation.

### What DSPy does and what we add

Start with a direct predictor and labeled few-shot baseline. GEPA uses metric feedback to propose instruction changes; MIPROv2 is an alternative for instruction/example search. These optimize the model program without necessarily training new weights. [DSPy optimizers](https://dspy.ai/current/diving-deeper/choosing-an-optimizer/), [GEPA](https://dspy.ai/current/diving-deeper/gepa-in-depth/).

DSPy's current documentation describes experimental Flex modules for optimizing module source with GEPA. Treat this as an optional isolated experiment, gated on a pinned package test, not a dependency for the first demo. It cannot rewrite our evaluator, approval service, or security boundaries. [DSPy Flex](https://dspy.ai/current/diving-deeper/flex/).

BootstrapFinetune can use successful teacher traces to train a compatible student LM, but it requires a supported training backend. An OpenAI-compatible inference API does not establish fine-tuning compatibility. Training a tiny image classifier and exporting it to a browser runtime requires a separate pipeline. [BootstrapFinetune](https://dspy.ai/current/api/optimizers/BootstrapFinetune/).

DSPy also documents experimental typed decisions with Jev/System One models. This is a possible text decision backend, subject to access and testing. It is not evidence that Jev can run in a browser, perform boiler-image recognition, or satisfy the NVIDIA requirement. [Decision types](https://dspy.ai/current/api/experimental/DecisionTypes/).

### The optimization loop

1. Establish an executable baseline and human-reviewed contract. A new pack without enough data uses the baseline with review; it does not claim to be optimized.
2. Curate consented examples, corrections, counterexamples, and uncertain cases. Teacher-generated labels are provisional until reviewed; respondent overrides are feedback, not unquestionable ground truth.
3. Split train, development, and sealed test data by site/asset or other source entity. Keep near-duplicate images and related sessions in the same partition.
4. Freeze rubric, metric, and hard gates. Search only the permitted parameters under explicit time, spend, candidate, and token limits.
5. Use train/development outcomes to propose and select candidates. The optimizer cannot inspect sealed test labels or edit evaluation code.
6. Evaluate the selected candidate on the sealed test and end-to-end path suite. Report denominators, data composition, and uncertainty; zero observed errors in a small set does not establish zero real-world error.
7. Present the owner with the same business-impact change card, now including baseline/candidate metrics and artifact references. Approve and deploy an immutable revision, or retain the baseline if no candidate meets the gates.
8. Collect failures for a later labeled dataset revision. Repeated tuning against revealed test results requires a fresh holdout before further claims of generalization.

Hard constraints precede performance optimization. Require acceptable false-acceptance and false-rejection behavior, adequate automatic-decision coverage, preserved mandatory evidence, and correct permissions. Within feasible candidates compare respondent burden, latency, total cost, and download size. An always-abstain classifier must not win by avoiding false positives; a permissive classifier must not win by maximizing completion.

Optimization runs offline or as a bounded job after sufficient new feedback or an explicit request. It does not retrain on every submission. Failure to improve is a valid result and must be reported honestly.

### Specialization and amortized execution

The long-term search space contains ordinary deterministic code, an optimized hosted predictor, an existing compact model, a trained task-specific head over a shared encoder, and a fine-tuned specialist. A future compiler controller chooses among these only where compatible datasets, trainers, exports, and runtimes exist. This controller is our proposed engineering work, not a capability DSPy automatically provides.

Reuse validated capabilities across compatible packs when permissions allow. Compile per capability family or meaningful rubric revision, not per field or per respondent. Low-volume tasks may be cheaper to keep hosted. Evaluate break-even as preparation/training cost divided by positive per-inference savings, including feature extraction, fallback calls, hosting, downloads, and review burden. No cost advantage exists if the denominator is not positive.

Nebius Token Factory hosts verified NVIDIA Nemotron task or teacher calls. Nebius Jobs can run bounded evaluations and compatible training workloads; PyTorch/ONNX tooling handles a custom specialist where needed. OpenUI renders the resulting UI, and the browser executes only approved runtime artifacts. DSPy itself remains in the Python build/optimization service; saving a DSPy program does not turn it into browser JavaScript or an ONNX model.

Every deployed capability records contract/rubric revision, program/model hash, preprocessing version, dataset split hashes, optimizer settings, metric revision, baseline comparison, budget spent, permitted execution route, and approval. A form release pins these references. Authorized staff can see what changed without reading model instructions or training code.

## Continuous evaluation and improvement

### Three separate improvement scopes

1. Within a session: resolve ambiguous input and adapt the next question without changing the published contract.
2. Across sessions: propose revisions to wording, input affordances, branches, or extraction instructions for one form.
3. Across forms: improve compiler code, component implementations, or generation prompts against a shared suite.

Each scope uses the declarative optimization lifecycle above where applicable. Model fine-tuning is a later fourth mechanism requiring consented, curated examples and held-out evaluation. Prompt changes and rule updates are not model-weight learning.

### Feedback and release process

Record validation errors, extraction corrections, explicit respondent feedback, owner rework labels, abandonment points, and successful outcomes. Minimize raw-data capture; keep event metadata separate from source material. Completion rate alone is insufficient: the system must not improve it by deleting required questions or weakening validation.

The improvement agent produces a patch with a hypothesis, affected paths, supporting events, and expected effect. Replay consented/redacted failure examples and a held-out suite. Publish only after contract checks, regression tests, and required approval pass. Preserve failures as regression cases and retain rollback artifacts.

A changed business requirement requires owner confirmation. Low-confidence extraction requires correction or escalation. A broken model or unsupported device falls back without destroying the session. Permitting a new optional branch still changes the workflow and requires approval; an extra clarification within an already approved branch does not create a new release.

LLM evaluation can diagnose issues and assess wording. Deterministic assertions and human labels establish correctness where possible. Generated tests cannot be the only judge of the generator that created them. Synthetic sessions provide branch coverage, not evidence that real users find the product easier.

## Measurement plan

All thresholds below are proposed validation targets, not achieved results or marketing claims.

| Outcome | Measure | Initial target or gate |
| --- | --- | --- |
| Less owner setup work | Time from identical brief to correct published workflow | At least 30% lower median time than an AI-assisted form-builder baseline |
| Less respondent effort | Completion time and number of manually entered fields | At least 20% lower median time on document-assisted tasks, with no increase in required-data errors |
| Less staff rework | Submissions requiring clarification | Reduction against baseline; establish a real pilot baseline before promising a percentage |
| Correct execution | Required information, branch reachability, valid submissions | All defined contract and critical path tests pass |
| Verified repair | Previously failing cases fixed; held-out regressions | Fix selected failure with no critical regression in the held-out suite |
| Responsive UI | Local deterministic interaction latency | Proposed p95 below 100 ms on a declared reference device |
| Useful local inference | Cold download, warm latency, memory, extraction quality | Report each separately; choose a task-specific budget after model testing |
| Sustainable cost | Model and infrastructure cost per usable submission | Measure against all-cloud and simpler deterministic baselines |
| Convenient long-form setup | Time and owner decisions needed to adapt a 50-question pack | Compare against equivalent template-based inspection software; count missed source requirements |
| Evidence quality | False acceptance, false rejection, review rate, and extra captures | Publish separately on a labeled, held-out pack-specific image set |
| Understandable changes | Owner can explain changed behavior after reading a change card | Usability test with expected answers; record missed policy changes |
| Field reliability | Draft recovery, upload completion, stale-result handling | No answer loss in defined interruption/reconnect tests; unresolved checks never shown as passed |

Run a counterbalanced usability pilot with 5–10 owners/respondents when possible, using identical tasks and equivalent information requirements. This is exploratory evidence, not statistically established market superiority. Report failures, task counts, device details, and model revisions. In the hackathon, publish measured technical results and identify synthetic scenarios clearly.

## Data and release requirements

Entities: Tenant, OwnerIdentity, WorkflowPackVersion, OrganizationOverride, SourceRequirement, FormSpecVersion, FormBundle, CapabilityRevision, Job, AssetInstance, RespondentSession, Submission, EvidenceReference, ValidationDecision, ExceptionReview, ExecutionEvent, FeedbackItem, ChangeProposal, Approval, EvaluationRun, Release, and StaffAcknowledgment.

Each session references an immutable release. Each submitted value records whether it was entered, extracted, inferred, or confirmed. Media access is scoped to the tenant and session; logs must not include credentials or unnecessary personal content. Owner-selected retention and deletion cover source media and derived records. Cross-tenant learning is opt-in and uses appropriately de-identified examples.

Client code contains no provider secrets. Backend enforces permissions and validates results independently. Generated components use approved actions; arbitrary external calls and generated scripts require an isolated execution path. Publication records the approving actor and the evaluated artifact.

## Proposed hackathon slice

### Demonstration claim

An owner adapts an existing survey pack with minimal input; a field worker receives useful guidance when photo evidence is wrong or ambiguous; a proposed improvement is explained, tested, approved, and released without changing an active survey.

### Core slice for discussion

- One curated equipment-survey pack with a handful of sections, a repeated asset group, and a small approved component library. It demonstrates structure that could support 50 steps without claiming broad template coverage.
- Template picker, short configuration flow, and owner text edits; real WhatsApp transport if a test account is ready. Otherwise a clearly labeled web authoring interface using the same backend; do not claim WhatsApp is demonstrated.
- Real Nemotron calls through Token Factory for specification generation and revision proposals.
- DSPy signatures for intelligent capabilities and one real, bounded offline optimization experiment. Compare a photo-interpretation or specification-generation baseline with its compiled candidate on separate development and held-out examples. Keep the baseline if optimization does not improve it; publish the actual result.
- One real boiler-photo validation capability with accepted, retake, indeterminate/review, and pending/error behavior; verify the vision endpoint before committing to it. Deterministic branches and a structured submission with separate review status.
- OpenUI rendering after a focused compatibility check; versioned schema and stable renderer if that check fails, with OpenUI identified as planned.
- Version 1, one explicitly recorded failure or owner feedback item, a readable change card, agent-proposed version 2, held-out regression report, exact-version approval, publication, and rollback. Show an active version 1 session remaining unchanged.
- Responsive browser UI and a public testable demo with non-sensitive example inputs.

### Stretch capabilities

- One real local model capability through WebGPU, with a route indicator and measured cold/warm behavior.
- Short audio input and transcription with correction.
- WhatsApp voice authoring and preview notifications.
- More automated browser evaluation and a wider held-out suite.
- One specialist-model experiment with measured total pipeline size and execution cost, only after the hosted baseline is working; no assumed 100,000-parameter target.

### Full product capabilities deferred from the slice

General-purpose arbitrary code generation, autonomous compiler rewrites, broad browser/device support, full offline media synchronization, arbitrary checklist import, template marketplace and upgrade merging, continuous production experiments, model fine-tuning, multiple vertical templates, billing, extensive integrations, and automatic cross-tenant learning. These stay in the vision, with no claim they exist in the demo.

### Demo sequence

1. Owner chooses the equipment-survey template, answers a few configuration questions, and previews sections and evidence rules.
2. Field worker supplies a radiator photo and receives a retake request, then supplies a clear boiler photo and proceeds. Show an ambiguous case routed to review rather than passed.
3. Show recorded feedback that the capture instruction caused an avoidable crop or an unnecessary repeated question; label a prepared failure as such.
4. Agent proposes a targeted instruction or branch revision. Display the changed journey, any additional worker effort, preserved requirements, and before/after regression results. Behavioral model changes require a labeled image suite, not just rendered UI checks.
5. Owner approves the exact candidate; publish for new work while an active version 1 survey stays unchanged. Demonstrate rollback and retained audit history.

The failure must be real in the demonstrated version and identified as a prepared test case if seeded. Do not describe synthetic events as customer telemetry. A correction that only changes styling does not prove the improvement claim.

## Implementation sequence after scope discussion

1. Verify Token Factory credentials and selected model capabilities, OpenUI state binding, and WhatsApp account readiness. Benchmark a browser model only if local execution remains in scope.
2. Define the curated pack, FormSpec, evidence contracts, immutable versions, and labeled photo/path fixtures.
3. Complete one vertical flow from template selection through field evidence capture and reviewed submission.
4. Add evidence-backed revision proposals, a bounded DSPy optimization run, and before-and-after held-out evaluation. Save the program artifact and preserve owner approval before publication.
5. Add only the stretch capabilities that fit remaining time and pass real tests.
6. Package the demo, public repository, license, setup guide, limitations, and measured results.

The official deadline is 30 October 2026 at 10:00 PDT, or 17:00 London. Reserve time for the public video under three minutes and submission materials. Keep the working project available through the end of judging on 15 December. The proposed track is Best Apps and Agents. The required runtime Nebius use and NVIDIA model must be visible in the actual implementation. [Official rules](https://nebiusglobalaihackathon.devpost.com/rules).

## Decisions for the next discussion

1. Confirm the owner WhatsApp and respondent browser split and which OpenUI project was intended.
2. Choose one real workflow and obtain a permissioned checklist, representative photos, reviewer labels, and a correct submission example.
3. Decide whether local browser inference or the verified revision loop is the primary technical demonstration. Both remain in the full vision.
4. Select the hackathon slice after the integration checks; defer package and model version commitments until verified.
5. Agree which changes owners must approve and which may eventually be automatically published under explicit policy.

## Pitch boundaries

Full vision: a conversationally managed form platform that compiles business intent into adaptive experiences and uses verified outcomes to improve its forms and generator.

Prototype claim: only the creation, completion, and evaluated revision capabilities actually demonstrated.

Evidence claim: publish exact test outcomes and timings. Do not claim proven completion uplift, universal browser-local processing, autonomous self-improvement, or competitive superiority without the corresponding evidence.
