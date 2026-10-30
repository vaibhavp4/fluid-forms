# Fluid Forms review guide

Verified 30 October 2026. [Live demo](https://fluid-forms.exe.xyz/) · [Source](https://github.com/vaibhavp4/fluid-forms)

The public URL opens a shared sample-data sandbox without signup or an owner token. Guests share responses and workflow changes. The original workspace remains private with separate storage and its original token. Use synthetic data only. [Deployment and usage limits](DEPLOYMENT.md#anonymous-public-sandbox).

## Try the primary journey

1. Open **Create form**, choose **End-of-course feedback** from the 15 starter templates, and inspect the capability graph. Create the preview, run checks, acknowledge approval, and publish version 1.
2. Open the respondent link. Enter a name and a mixed response such as: “The instructor was helpful, but the course moved too fast and the assignments were confusing.” Review the interpretation. The contextual question asks which part caused difficulty. Answer it, select whether follow-up is wanted, and submit.
3. Return to **Overview** and open the response. Use **Improve this workflow** to request: “When someone gives negative or mixed feedback, also ask what specific example or change would have made the experience better.”
4. Inspect the proposed additional question and graph, run checks, acknowledge approval, and publish version 2.
5. Start a fresh respondent update. Negative feedback now activates both contextual questions. An existing version-1 session retains its original contract. A purely positive response skips the negative-feedback questions.
6. On **Overview**, expand **Improvement activity → View decision and optimization trace** to inspect the real interpretation, proposal, check, and publication events. **Improvements** separately shows a recorded offline GEPA experiment; it is not the live workflow release loop.

See [the demo journey](DEMO_USER_JOURNEY.md) for the product explanation and [the template catalog](TEMPLATES.md) for scope.

## Alternate photo-evidence journey

Choose **Daily site update**, publish, and report that wrong tiles arrived. After the first submission, request a packaging/delivery-label photo for wrong-material reports and publish the checked revision. The next respondent sees the evidence step. A photo without the expected packaging requests a retake or an explanation; unavailable or ambiguous vision requires human review. A site change invalidates attached evidence. This supports collecting evidence, not independently verifying that the delivered item is wrong.

## Verified behavior

- Live NVIDIA Nemotron Lightning on Nebius: template configuration, contextual response interpretation, additional-question proposals and evidence-policy patches.
- Live NVIDIA Nemotron 3.5 Super VL: image upload and blank-image negative control with retake/exception handling. This is an integration check, not a calibrated visual accuracy benchmark.
- Anonymous Chromium desktop/mobile journey: creation, graph, publication, contextual submission, improvement, checked version 2, changed questions, positive skip path and dashboard trace. No browser errors; no horizontal overflow at 390 × 844.
- Nineteen backend tests and the production frontend build pass, including access isolation and rejection before inference when the public allowance is exhausted.
- All 27 original private records were unchanged after the access repair. Their IDs are unavailable in the sandbox; the sandbox service user cannot read the private database or owner environment.
- Sandbox records and its AI allowance survived a service restart. Original database/photo restart persistence was also verified.
- Browser microphone input uses browser speech recognition where supported. Physical microphone/device testing remains unverified; this is not NVIDIA transcription.

## Model evaluation and spend


[Final recorded report](evidence/gepa-report.json): NVIDIA `nvidia/Nemotron-3_5-Lightning`, thinking disabled, train/dev/test sizes 6/6/8. Final baseline and selected program each classified 8/8 held-out synthetic examples correctly. GEPA retained the baseline; sampled training minibatches were perfect, so this final run made no reflective mutation. It made 34 requests with 16,264 input and 2,210 output tokens.

[Earlier experiment](evidence/gepa-initial-report.json): GEPA did generate a reflected candidate, but it performed worse on development data, so the baseline was retained. Baseline/selected results were both 7/8 on the synthetic test cases. This run made 38 requests, including one reflection, with 17,358 input and 2,887 output tokens.

The final prompt was manually clarified after a separate live UI check showed that needed work could be mislabeled as completed. The repeated tiny synthetic test set is smoke evidence, not an unbiased population accuracy estimate. Neither report establishes improvement from GEPA, visual accuracy, or factual fidelity of every extracted field. Workers confirm editable interpretations.

At the reference Lightning rates of $0.06/M input and $0.24/M output, these two completed experiments estimate to about $0.00324 together. Rates are a reference estimate, not a provider invoice. This excludes the earlier interrupted reasoning-mode experiment and individual integration calls; exact account spend/balance must be checked in the Nebius console. The API did not return dollar charges. [Pricing reference](https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference).

Each experiment is bounded to 56 dispatched LM requests, 50,000 prompt characters/request, 2,500 output tokens/request, no HTTP retries, one thread, and the configured wall-clock limit. It never promotes a model into production. Do not rerun it merely to get a more favorable score.

## Operational scope

The live app uses hosted inference and registered typed components. It does not execute arbitrary generated JavaScript, train browser models, automatically switch models, or promote GEPA candidates. Recording scripts, project-page copy and credentials are local-only files excluded from Git.
