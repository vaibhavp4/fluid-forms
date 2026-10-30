# Fieldnote review and submission guide

Verified 30 October 2026. Repository: https://github.com/vaibhavp4/fluid-forms

## Try the complete journey

Run the app using the root README. The current local review server is http://127.0.0.1:8000.

1. Choose **Create form**. Keep the Daily site update template and default brief.
2. Create the preview, run workflow checks, acknowledge the approval, and publish version 1.
3. Open the worker form. Enter a name and this report: “Finished bathroom prep. Couldn't start tiling because the wrong tiles arrived. We need the right ones tomorrow.”
4. Review the interpreted fields, correct anything needed, choose whether help is arranged, and submit.
5. Return to the owner workspace and open the update. Choose **Improve this workflow**. The proposed feedback asks for packaging/delivery-label photos on wrong-material reports.
6. Review the actual policy diff, run checks, acknowledge it, and publish version 2.
7. Start another update. Report wrong tiles again. The new evidence step appears. Upload a packaging photograph, or explain why evidence is unavailable. Images are advisory and require office review; an image with no packaging triggers a retake or exception.
8. Review the response and add an office review note. **Improvements** also shows the recorded offline GEPA result.

The sample workspace is explicitly labeled. It helps orientation but does not replace the live create-and-submit journey. A session already open on version 1 stays pinned to version 1.

## Verified behavior

- Real NVIDIA Nemotron Lightning through Nebius: creation, interpretation, and evidence-policy revisions.
- Real NVIDIA Nemotron 3.5 Super VL: image upload and a blank-image negative control, followed by retake/exception handling. This is an integration check, not a calibrated vision benchmark. No positive real-world packaging accuracy claim.
- Chromium full journey: creation, publication, worker submission, owner summary, revision, checks, second publication, changed worker form, exception, office review. No browser console errors.
- Mobile viewport 390 × 844: no horizontal overflow. Desktop viewport 1440 × 1000 reviewed visually.
- Eleven backend tests, TypeScript check, and production frontend build pass.
- Browser microphone input depends on browser speech recognition; physical microphone/device testing remains unverified.

## Model evaluation and spend

[Final recorded report](evidence/gepa-report.json): NVIDIA `nvidia/Nemotron-3_5-Lightning`, thinking disabled, train/dev/test sizes 6/6/8. Final baseline and selected program each classified 8/8 held-out synthetic examples correctly. GEPA retained the baseline; sampled training minibatches were perfect, so this final run made no reflective mutation. It made 34 requests with 16,264 input and 2,210 output tokens.

[Earlier experiment](evidence/gepa-initial-report.json): GEPA did generate a reflected candidate, but it performed worse on development data, so the baseline was retained. Baseline/selected results were both 7/8 on the synthetic test cases. This run made 38 requests, including one reflection, with 17,358 input and 2,887 output tokens.

The final prompt was manually clarified after a separate live UI check showed that needed work could be mislabeled as completed. The repeated tiny synthetic test set is smoke evidence, not an unbiased population accuracy estimate. Neither report establishes improvement from GEPA, visual accuracy, or factual fidelity of every extracted field. Workers confirm editable interpretations.

At the reference Lightning rates of $0.06/M input and $0.24/M output, these two completed experiments estimate to about $0.00324 together. Rates are a reference estimate, not a provider invoice. This excludes the earlier interrupted reasoning-mode experiment and individual integration calls; exact account spend/balance must be checked in the Nebius console. The API did not return dollar charges. [Pricing reference](https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference).

Each experiment is bounded to 56 dispatched LM requests, 50,000 prompt characters/request, 2,500 output tokens/request, no HTTP retries, one thread, and the configured wall-clock limit. It never promotes a model into production. Do not rerun it merely to get a more favorable score.


## Tool feedback

- Nebius's OpenAI-compatible endpoint works with DSPy. The authenticated catalog made exact NVIDIA model selection straightforward.
- Thinking mode exhausted small output budgets and produced incomplete structured responses. Explicit non-thinking mode reduced tokens and made this narrow workflow more reliable.
- A schema alone was insufficient guidance for form creation; supplying concrete template values fixed schema-copying. Evidence-policy patches were more reliable than asking for whole-form regeneration.
- Provider response usage contains tokens, but our adapter received no monetary charge; distinguish zero reported cost from free inference.
- json-render supports the registered component runtime. Contract checks and publication control stay in Python.

## Remaining submission steps

The local product and source are ready for review. The repository's existing MIT license is preserved. Public hosting account/URL has not been supplied, and no public deployment or YouTube video has been created. Before submission, provide a stable HTTPS deployment with persistent storage, judge access credentials, and the required video URL. Keep credentials out of the README and source. See [deployment notes](DEPLOYMENT.md).
