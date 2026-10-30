# Deployment

The verified setup is the single-server local build in the root README. A Dockerfile is provided for a host with a persistent disk. The Docker daemon was unavailable in the development environment, so the container build itself has not been verified.

```sh
docker build -t fieldnote .
# .env must include a nonempty OWNER_TOKEN before external exposure.
docker run --env-file .env -p 8000:8000 -v fieldnote-data:/app/.data fieldnote
```

The server listens on port 8000. Configure HTTPS at the hosting platform. Keep `.data` on persistent storage: it contains the SQLite database and photos. The Docker build context excludes local credentials, runtime data, and dependencies. Never bake `.env` into the image.

Set `NEBIUS_API_KEY`, `NEBIUS_MODEL=nvidia/Nemotron-3_5-Lightning`, `VISION_MODEL=nvidia/Nemotron-3.5-Super-VL`, and a long random `OWNER_TOKEN` as private host environment variables. The owner UI asks for its access token. Worker links and session IDs grant access to that workflow/session; this prototype is a single workspace, not a multi-tenant deployment.

Neon/PostgreSQL can replace SQLite using `DATABASE_URL`, but that production configuration has not been verified. It does not replace the need for persistent photo storage. The prototype has no automated retention scheduler. The anonymous sandbox below adds bounded shared usage; monitor provider usage separately.

Verify `/api/health`, then complete the review journey over HTTPS, including mobile upload and owner authentication. Give judges access through the judging period. Do not treat an untested URL or a process running only on a laptop as a hosted demo.

## Live exe.dev deployment

Deployed with owner approval on 30 October 2026 at **https://fluid-forms.exe.xyz/**, using a dedicated VM within the account's existing included capacity. No new subscription or plan upgrade was purchased. Python services are managed by systemd, with SQLite and photos on persistent disk. The original workspace remains token protected; the public URL now targets a separate anonymous sandbox as described below. The full HTTPS browser journey, live photo retake/exception handling, and record/photo persistence across a service restart have been verified.

- The dedicated VM has 2 vCPUs, 4 GiB memory, and a 20 GB disk.
- Build React once and serve it with the existing FastAPI application on port 8000. No local GPU is needed: NVIDIA inference stays on Nebius Token Factory.
- Store database/photos under `/var/lib/fieldnote` on the persistent VM disk. The new deployment starts with an empty workspace; local review data is not copied automatically.
- Run the service through systemd using [the prepared unit](../deploy/exe/fieldnote.service), so it restarts after failure/reboot.
- Supply Nebius credentials and a fresh owner access token in a root-owned `/etc/fieldnote/fieldnote.env`, readable only by root; systemd injects its variables. Do not store them in source or the image. Provision Python dependencies where the service user can read them, rather than under a root-only home directory.
- Proxy port 8000 through exe.dev's managed HTTPS. Make that single web endpoint public only after owner authorization and authenticated smoke checks. Keep owner API actions behind the existing token; provide the judge token privately in Devpost testing instructions.
- Verify uploads, persistence across a restart, and the complete live journey on the deployed URL. Keep the service/account active through 23 December 2026.

exe.dev currently lists Personal from **$15/month**, including a 2 vCPU / 4 GiB pool; hosting charges are separate from the user's $25 Nebius inference credit. Confirm the actual account plan and checkout before any purchase. The seven-day trial alone does not cover judging. [Pricing](https://exe.dev/pricing), [persistent VMs](https://exe.dev/docs/what-is-exe), [HTTPS/visibility](https://exe.dev/docs/proxy).

Modal is a viable alternative, with CPU web serving and usage-based hosting. Its Starter page currently lists $30/month in compute credits, subject to the actual account. Our current SQLite file must not simply be put on a shared Modal Volume: those volumes have commit/reload semantics and favor write-once/read-many data. A robust Modal route would externalize the database to PostgreSQL and adapt photo persistence, then verify restart/concurrency behavior. That is more work than the VM route for this submission. [Servers](https://modal.com/docs/guide/servers), [Volumes](https://modal.com/docs/guide/volumes), [pricing](https://modal.com/pricing).

Recording notes, judging/testing credentials, and the submission handoff are saved locally outside Git. They are not part of the public repository or deployed source bundle.

## Anonymous public sandbox

The public URL targets port **8080**, served by [fieldnote-demo.service](../deploy/exe/fieldnote-demo.service). The private `fieldnote.service` continues on port **8000** with its original token, database and photos. The sandbox has separate source (`/opt/fluid-forms-demo`), a separate Linux service user (`fluidforms-demo`), and private state (`/var/lib/fluidforms-demo`). No private workspace records or credentials are copied into the public browser.

Set these only in the sandbox's root-readable `/etc/fieldnote-demo/fieldnote.env`, alongside server-side Nebius settings and a distinct random `OWNER_TOKEN` for the serving command's exposure guard:

```dotenv
PUBLIC_DEMO=1
DEMO_DATA_ROOT=/var/lib/fluidforms-demo
DATABASE_URL=sqlite:////var/lib/fluidforms-demo/demo.db
MEDIA_DIR=/var/lib/fluidforms-demo/media
DEMO_AI_REQUEST_LIMIT=500
DEMO_AI_PER_MINUTE=12
DEMO_WRITE_LIMIT=2000
DEMO_WRITES_PER_MINUTE=60
```

Startup refuses sandbox mode unless database/media paths match this dedicated data root. Sandbox owner operations intentionally allow anonymous use. All visitors share its responses, proposals and published changes; the UI labels this clearly. Use synthetic/sample data only. This is a demonstration environment, not private accounts or tenant isolation between guests.

The persistent `limits.db` ledger reserves each model dispatch before inference and limits all mutating API requests. The allowances survive process restarts and are shared across workers; failed requests may consume an allowance. Text and vision use the same AI allowance. Requests are limited to 64 KiB except photo uploads (9 MiB request, 8 MiB original image); normalized demo photos have a 100 MiB shared storage allowance. Read-only browsing remains available after the write/AI allowance is exhausted. The request cap bounds usage, but is not a dollar-denominated Nebius billing cap.

Provision source and dependencies without `.env`, local submission documents or private runtime files. Start and check the sandbox on 8080 before switching the exe.dev proxy. Seed only the built-in labeled examples, then verify a fresh anonymous browser can create, fill and improve a form. Check that a known private record ID returns 404 in the sandbox, the original service still rejects unauthenticated workspace access, and its record count is unchanged. Preserve `limits.db` during redeployments; deleting it resets the allowance. Access the private service through an SSH tunnel rather than publishing its owner token.
