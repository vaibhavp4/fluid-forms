# Implementation decisions

30 October 2026. This supersedes earlier proposed MVP choices where they differ.

- The approved journey is daily renovation-site updates, with a wrong-material delivery triggering an owner-approved evidence branch.
- Web only. No WhatsApp integration.
- Working product name: Fieldnote. React/Vite interface and Python/FastAPI service.
- Use Vercel json-render 0.21.3 with registered React components and a typed form contract. Preview and runtime conditional questions use this renderer. No generated JavaScript execution.
- Keep form versions as immutable JSON records, not database schema migrations. A new branch is an application-data revision.
- SQLite provides a zero-account local review setup. SQLAlchemy keeps the storage model compatible with PostgreSQL/Neon through DATABASE_URL. Neon branching is useful for infrastructure migration tests, not required for each form revision. TypeDB is deferred because relational version records and typed contracts cover this slice.
- DSPy defines typed intelligent capabilities; GEPA runs as a separate bounded experiment. Evaluation and approval remain explicit operations.
- Real provider adapters use environment credentials. When credentials are absent, an explicitly labeled local demo mode supports reviewing the workflow; its deterministic interpretation is never described as a live model or optimization result.
- A provider error must remain visible and must not silently switch into demo results.
- Uploaded images require actual image decoding. Without a verified vision provider, record pending review rather than fabricate object recognition.
- Browser speech input may use browser-provided recognition where supported, with explicit user action and editable text fallback. Do not claim it is NVIDIA transcription.
- Local review is single workspace. Public deployment requires configured owner authentication and appropriate storage/retention. Worker sessions use unguessable IDs.

References: [json-render](https://json-render.dev/docs), [Neon branching](https://neon.com/branching), [TypeDB schema changes](https://typedb.com/docs/typeql-reference/schema/redefine/).

## Verified live integration, 30 October

The authenticated Nebius catalog and live calls verified `nvidia/Nemotron-3_5-Lightning` for text and `nvidia/Nemotron-3.5-Super-VL` for vision. Text inference explicitly disables thinking, caps output at 2,500 tokens, and has no HTTP retries. Template values accompany creation prompts; revisions are typed evidence-policy patches applied deterministically, preserving unrelated fields. This resolves observed schema copying and unchanged full-form regeneration.

The final live visual check also motivated explicit completed-work extraction rules: planned/needed work is not completed. Workers still confirm interpretations. Vision remains advisory; a retake blocks required-evidence submission until replaced or explained. Site changes invalidate attached evidence.

GEPA results, measured token usage, failed-candidate behavior, UI acceptance, and unresolved limits are recorded in [the review guide](REVIEW_GUIDE.md). The repository's existing MIT license was retained. Docker deployment files are prepared but unverified because the local Docker daemon was unavailable. Public hosting remains pending.
