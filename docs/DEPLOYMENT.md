# Deployment

The verified setup is the single-server local build in the root README. A Dockerfile is provided for a host with a persistent disk. The Docker daemon was unavailable in the development environment, so the container build itself has not been verified.

```sh
docker build -t fieldnote .
# .env must include a nonempty OWNER_TOKEN before external exposure.
docker run --env-file .env -p 8000:8000 -v fieldnote-data:/app/.data fieldnote
```

The server listens on port 8000. Configure HTTPS at the hosting platform. Keep `.data` on persistent storage: it contains the SQLite database and photos. The Docker build context excludes local credentials, runtime data, and dependencies. Never bake `.env` into the image.

Set `NEBIUS_API_KEY`, `NEBIUS_MODEL=nvidia/Nemotron-3_5-Lightning`, `VISION_MODEL=nvidia/Nemotron-3.5-Super-VL`, and a long random `OWNER_TOKEN` as private host environment variables. The owner UI asks for its access token. Worker links and session IDs grant access to that workflow/session; this prototype is a single workspace, not a multi-tenant deployment.

Neon/PostgreSQL can replace SQLite using `DATABASE_URL`, but that production configuration has not been verified. It does not replace the need for persistent photo storage. The prototype has no automated retention scheduler or public abuse throttling; share the judge deployment deliberately and monitor provider usage.

Verify `/api/health`, then complete the review journey over HTTPS, including mobile upload and owner authentication. Give judges access through the judging period. Do not treat an untested URL or a process running only on a laptop as a hosted demo.
