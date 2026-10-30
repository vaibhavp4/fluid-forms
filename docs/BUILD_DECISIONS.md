# Implementation decisions

30 October 2026. This supersedes earlier proposed MVP choices where they differ.

- The approved journey is daily renovation-site updates, with a wrong-material delivery triggering an owner-approved evidence branch.
- Web only. No WhatsApp integration.
- Working product name: Fieldnote. React/Vite interface and Python/FastAPI service.
- Use a constrained JSON component renderer; assess Vercel json-render against the form contract. No generated JavaScript execution.
- Keep form versions as immutable JSON records, not database schema migrations. A new branch is an application-data revision.
- SQLite provides a zero-account local review setup. SQLAlchemy keeps the storage model compatible with PostgreSQL/Neon through DATABASE_URL. Neon branching is useful for infrastructure migration tests, not required for each form revision. TypeDB is deferred because relational version records and typed contracts cover this slice.
- DSPy defines typed intelligent capabilities; GEPA runs as a separate bounded experiment. Evaluation and approval remain explicit operations.
- Real provider adapters use environment credentials. When credentials are absent, an explicitly labeled local demo mode supports reviewing the workflow; its deterministic interpretation is never described as a live model or optimization result.
- A provider error must remain visible and must not silently switch into demo results.
- Uploaded images require actual image decoding. Without a verified vision provider, record pending review rather than fabricate object recognition.
- Browser speech input may use browser-provided recognition where supported, with explicit user action and editable text fallback. Do not claim it is NVIDIA transcription.
- Local review is single workspace. Public deployment requires configured owner authentication and appropriate storage/retention. Worker sessions use unguessable IDs.

References: [json-render](https://json-render.dev/docs), [Neon branching](https://neon.com/branching), [TypeDB schema changes](https://typedb.com/docs/typeql-reference/schema/redefine/).
