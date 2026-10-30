# Application architecture — C4 views

These three views describe the working Fluid Forms application deployed at [fluid-forms.exe.xyz](https://fluid-forms.exe.xyz/). They follow the [C4 model's](https://c4model.com/diagrams) context → container → component levels, using Mermaid flowcharts that render directly on GitHub. A **container** here means an application or data store, not necessarily a Docker container.

Blue nodes are Fluid Forms software, grey nodes are external systems, green nodes are people, and amber nodes are persistent data. Dashed arrows show optional offline evaluation and its recorded artifacts; solid arrows show the live application path.

## Level 1 — System context

**Who uses Fluid Forms, and which external service powers its intelligence?**

```mermaid
flowchart LR
    owner["Business owner / office reviewer<br/>[Person]<br/>Configures workflows<br/>Approves changes"]
    worker["Respondent<br/>[Person]<br/>Shares experience<br/>Confirms details and evidence"]
    fluidforms["Fluid Forms<br/>[Software system]<br/>Contextual forms<br/>Owner-approved revisions"]
    nebius["Nebius Token Factory<br/>[External software system]<br/>NVIDIA text and vision inference"]

    owner -->|"Configure, publish and review via web app"| fluidforms
    worker -->|"Submit updates and photos via web app"| fluidforms
    fluidforms -->|"HTTPS API: typed text inference and image interpretation"| nebius

    classDef person fill:#e7f4ed,stroke:#32775a,color:#163c2d
    classDef app fill:#e8f0ff,stroke:#3868a8,color:#16345c
    classDef external fill:#f0f1f3,stroke:#6b7280,color:#303540
    class owner,worker person
    class fluidforms app
    class nebius external
```

The owner and respondent use the same web application with different views. The private workspace requires an owner access token. The public URL opens a separately deployed anonymous sandbox where visitors share sample responses and changes. Worker form/session links carry access to their workflow or session.

## Level 2 — Containers and deployment boundary

**What runs in the browser, what runs on exe.dev, and where do data and model calls go?**

```mermaid
flowchart TB
    browser["Web application<br/>[Container: React]<br/>Owner and worker UI<br/>json-render components"]
    proxy["exe.dev HTTPS proxy<br/>[External infrastructure]<br/>TLS termination and public URL"]

    subgraph vm["Deployment boundary: dedicated exe.dev VM — 2 vCPU / 4 GiB"]
        api["Fluid Forms server<br/>[Container: FastAPI]<br/>REST API and React assets<br/>systemd-managed Python"]
        db[("Workflow database<br/>[Data store: SQLite]<br/>Forms and releases<br/>Sessions and responses<br/>Proposals and audits")]
        media[("Evidence files<br/>[Data store: VM disk]<br/>Normalized JPEGs")]
        reports["Recorded evaluation artifacts<br/>[Data store: JSON files]<br/>Bundled experiment report"]
        limits[("Sandbox usage ledger<br/>[Data store: SQLite]<br/>Persistent AI and write caps")]
        private["Original private workspace<br/>[Separate process: port 8000]<br/>Token protected<br/>Separate service user and storage"]
    end

    subgraph nebius["External system: Nebius Token Factory"]
        textmodel["NVIDIA Nemotron Lightning<br/>[Hosted model]<br/>Configure and interpret<br/>Propose evidence patches"]
        visionmodel["NVIDIA Nemotron 3.5 Super VL<br/>[Hosted model]<br/>Packaging / delivery-label visibility"]
    end

    subgraph offline["Optional developer-run process — outside the live request path"]
        harness["Evaluation harness<br/>[Container: Python CLI]<br/>DSPy / GEPA<br/>Bounded experiment"]
    end

    browser -->|"HTTPS: assets, JSON, photos"| proxy
    proxy -->|"HTTP to sandbox port 8080"| api
    api -->|"SQLAlchemy reads and transactions"| db
    api -->|"Write and serve normalized images"| media
    api -->|"Read report for Improvements view"| reports
    api -->|"Reserve allowance before mutation / inference"| limits
    api -->|"DSPy typed text requests over HTTPS"| textmodel
    api -->|"httpx multimodal requests over HTTPS"| visionmodel
    harness -.->|"Optional task and reflection inference"| textmodel
    harness -.->|"Write artifacts;<br/>bundle recorded report"| reports

    classDef app fill:#e8f0ff,stroke:#3868a8,color:#16345c
    classDef external fill:#f0f1f3,stroke:#6b7280,color:#303540
    classDef data fill:#fff4dc,stroke:#a87824,color:#594017
    class browser,api,harness,private app
    class proxy,textmodel,visionmodel external
    class db,media,reports,limits data
    style vm fill:#f7fafc,stroke:#90a4b8
    style nebius fill:#f4f5f6,stroke:#6b7280
    style offline fill:#f9fafb,stroke:#aab1bb,stroke-dasharray:5 5
```

- **Browser:** both form preview and runtime conditional steps compile typed specifications into a registered json-render component tree. Optional speech input uses the browser's speech service, with editable text fallback.
- **exe.dev:** the public sandbox serves the React build and API on port 8080, with database, photos and persistent usage ledger under `/var/lib/fluidforms-demo`. A separate Linux user runs it. The original token-protected service continues on port 8000 with its original `/var/lib/fieldnote` storage. systemd starts both on boot and restarts failed processes. No private records are copied into the sandbox. There is no GPU or model server on this VM.
- **Nebius:** runtime model IDs are `nvidia/Nemotron-3_5-Lightning` and `nvidia/Nemotron-3.5-Super-VL`. Credentials stay on the server. Text requests disable thinking and cap output at 2,500 tokens; vision checks are advisory.
- **Offline evaluation:** `python -m evals.optimize` is run explicitly. It produces candidate JSON and an evaluation report; it is not a deployed background worker and does not replace the runtime program. The UI reads `.data/evaluation-report.json` when present, otherwise the committed `docs/evidence/gepa-report.json`. Publication of a model candidate is not implemented.

## Level 3 — Components inside the Python server

**How do the API, intelligent capabilities, deterministic policy and storage collaborate?**

All components inside the boundary below run in the **same FastAPI application**. They are modules or groups of route functions, not separately deployed microservices.

```mermaid
flowchart TB
    ui["Browser web application<br/>[External container]"]

    subgraph server["Container boundary: Fluid Forms Python server"]
        routes["API routes and access control<br/>[Component: main.py]<br/>Owner access<br/>Session orchestration"]
        contracts["Typed workflow contract<br/>[Component: contracts.py]<br/>Values and validation<br/>Branch predicate"]
        inference["Intelligence adapters<br/>[Component: intelligence.py]<br/>DSPy text / httpx vision<br/>Provider error handling"]
        release["Checks and release gate<br/>[Component: Python]<br/>Contract checks and hash<br/>Approval and version gate"]
        evidence["Evidence pipeline<br/>[Component: Pillow / Python]<br/>Normalize and bind to site<br/>Retake or exception"]
        repository["Record repository<br/>[Component: SQLAlchemy]<br/>Transactions and versions<br/>Session snapshots"]
        reporting["Evaluation report reader<br/>[Component: main.py]<br/>Load recorded JSON"]
        demo["Sandbox boundary and limits<br/>[Component: demo.py]<br/>Dedicated storage validation<br/>Persistent dispatch / write reservations"]
    end

    models["Nebius Token Factory<br/>[External system]<br/>NVIDIA text and vision inference"]
    database[("SQLite<br/>[External data store]")]
    photos[("Photo directory<br/>[External data store]")]
    artifacts["Recorded GEPA report<br/>[External data store: JSON]"]

    ui -->|"JSON and photo requests"| routes
    routes -->|"Validate inputs / branches"| contracts
    routes -->|"Compose / interpret / revise"| inference
    routes -->|"Evaluate, publish or roll back"| release
    routes -->|"Handle upload and evidence"| evidence
    routes -->|"Read / write records"| repository
    routes -->|"Retrieve offline result"| reporting
    routes -->|"Check public mutation allowance"| demo
    inference -->|"Reserve model call before dispatch"| demo
    release -->|"Persist release and audit"| repository
    evidence -->|"Inspect image"| inference
    evidence -->|"Read and write normalized images"| photos
    inference -->|"HTTPS model requests"| models
    repository -->|"SQL transactions"| database
    reporting -->|"Read recorded JSON"| artifacts

    classDef app fill:#e8f0ff,stroke:#3868a8,color:#16345c
    classDef external fill:#f0f1f3,stroke:#6b7280,color:#303540
    classDef data fill:#fff4dc,stroke:#a87824,color:#594017
    class routes,contracts,inference,release,evidence,repository,reporting,demo app
    class ui,models external
    class database,photos,artifacts data
    style server fill:#f7fafc,stroke:#90a4b8
```

### Templates and contextual question assembly

The owner can choose from [15 starter templates](TEMPLATES.md). `backend/templates.py` supplies typed contracts. The authoring UI immediately renders `PipelineGraph` from that contract. `InterpretFormUpdate` uses workflow context to classify unstructured feedback; deterministic rules select matching required questions. `ReviseQuestions` proposes one additional question, and the existing hash/check/approval release gate publishes the extended specification. The dashboard derives an activity trace from stored proposals, responses and releases. The GEPA harness remains offline and its recorded test covers the original site-report signature.

### Source map

| Responsibility | Implementation |
| --- | --- |
| Starter catalog and graph | [backend/templates.py](../backend/templates.py), [PipelineGraph.tsx](../web/src/components/PipelineGraph.tsx) |
| Owner navigation, responses and proposals | [App.tsx](../web/src/App.tsx) and [owner components](../web/src/components/) |
| Typed specification → preview / conditional form | [FormPreview.tsx](../web/src/components/FormPreview.tsx), [WorkerForm.tsx](../web/src/components/WorkerForm.tsx) |
| API orchestration, access control, publication, evidence and review | [backend/main.py](../backend/main.py) |
| Anonymous sandbox storage boundary and persistent usage limits | [backend/demo.py](../backend/demo.py) |
| Typed values and deterministic evidence predicate | [backend/contracts.py](../backend/contracts.py) |
| NVIDIA model adapters and DSPy signatures | [backend/intelligence.py](../backend/intelligence.py) |
| Contract regression checks and artifact hashing | [backend/evaluation.py](../backend/evaluation.py) |
| Persistence and transactions | [backend/store.py](../backend/store.py) |
| Optional GEPA experiment and labeled examples | [evals/optimize.py](../evals/optimize.py), [evals/interpretation.json](../evals/interpretation.json) |
| Restarting private and sandbox services | [fieldnote.service](../deploy/exe/fieldnote.service), [fieldnote-demo.service](../deploy/exe/fieldnote-demo.service) |

### Architectural decisions visible in the diagrams

1. **Models propose; application policy controls.** A revision changes supported typed fields. Deterministic checks, the evaluated spec hash, an unchanged base release, and explicit owner approval gate publication. No generated JavaScript or arbitrary code executes.
2. **Versions are application data.** Published releases and pinned session specifications preserve the approved behavior for an existing session; the form's current-release pointer can advance or roll back. A new question does not alter the database schema.
3. **Evidence has a review path.** Uploaded bytes must decode as an image. The server normalizes them, associates them with the selected site, and stores the model observation. A required photo marked for retake needs replacement or an explanation. Even visible packaging remains advisory and goes to office review.
4. **Evaluation has two roles.** Live contract checks validate form policy. Offline GEPA measures interpretation candidates against labeled examples. A recorded score is neither a workflow release approval nor an automatic model promotion.

These diagrams describe the deployed scope. PostgreSQL/Neon, WhatsApp, browser model inference, specialist-model training and multi-tenant isolation are not deployed components. See [build decisions](BUILD_DECISIONS.md), [deployment](DEPLOYMENT.md), and [recorded evaluation evidence](evidence/gepa-report.json).
