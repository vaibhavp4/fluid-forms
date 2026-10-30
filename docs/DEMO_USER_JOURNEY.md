# Fluid Forms demo journey

Current implemented journey · 30 October 2026 · Web-only

## Product promise

Collect natural responses without losing structured information. Fluid Forms interprets what someone says, asks relevant approved follow-ups, and helps the owner improve the next person's experience when an answer is missing useful detail.

The primary example is end-of-course feedback. The same pattern supports 15 starter templates across education, retail, bookings, research and operations. Construction reports remain an alternate photo-evidence example.

## The complete loop

1. **Start from the dashboard.** The public demo opens without signup. It labels shared sample data and shows response summaries, active workflows and improvement activity.
2. **Create from a template.** Choose End-of-course feedback. The graph explains natural input → model interpretation → deterministic routing → contextual questions → structured record. Describe the desired wording, preview it, run checks, and explicitly approve publication.
3. **Give natural feedback.** A learner says the instructor was helpful but the course was too fast and the assignments confusing. Lightning interprets the mixed response. The learner can correct it; the approved negative-feedback rule asks which part caused difficulty. Pure praise avoids that branch.
4. **Understand the response.** The owner sees the original note, confirmed structured interpretation and contextual answer. A negative response is the learner's report, not an independently verified fact.
5. **Request a useful change.** The owner asks for a concrete example or change that would have helped after negative/mixed feedback. The model proposes one typed additional question. The graph and change preview make it reviewable.
6. **Check and approve.** Deterministic contract checks validate the candidate. Publication requires approval of the exact checked artifact. The new immutable release is version 2; existing sessions stay pinned to their original release.
7. **See the improved next response.** A new learner reporting a concern gets the added question. The new detail reaches the owner. The dashboard trace shows interpretation, proposal, checks and publication from stored events.

The outcome demonstrated is a more informative submission. Time saved and better business outcomes remain hypotheses until measured with real users.

## What the compiler assembles

The generated artifact is a typed workflow specification. Registered React/json-render components produce the form; Python validates inputs, chooses matching follow-up rules and controls release versions. Hosted model capabilities configure templates, interpret language and propose bounded patches. Deterministic logic and model inference each have explicit roles. The runtime does not execute arbitrary generated code or synthesize a new neural network.

## Keep the two improvement paths clear

**Workflow improvement** changes the information requested, through an explicit owner-reviewed release. That is the full live loop above.

**Implementation optimization** searches for a better implementation of an unchanged capability. The separate bounded DSPy/GEPA experiment has a recorded site-report result of 8/8 baseline and 8/8 selected on a small synthetic test set. It retained the baseline and does not establish an optimization gain or course-feedback accuracy. The dashboard labels that report separately from live release events.

## Optional photo-evidence example

In Daily site update, a contractor reports a wrong-material delivery. The owner can require a packaging/delivery-label photo on that branch. Super VL supplies advisory visibility observations; ordinary code handles image validation, site binding, retake, exception and office review. The app does not establish the correct item without an order specification or claim safety certification.

## Verified scope and next steps

The anonymous desktop/mobile loop, 19 backend tests, production build, private-data separation and restart persistence are verified. Edge inference, automatic model selection, continuous weight training, imported 50-step surveys and multi-tenant private accounts remain product vision. See [build decisions](BUILD_DECISIONS.md), [review evidence](REVIEW_GUIDE.md), [architecture](ARCHITECTURE.md) and [the full PRD](PRD.md).
