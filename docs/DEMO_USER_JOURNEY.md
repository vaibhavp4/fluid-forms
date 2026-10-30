# Demo journey: a site update that learns what the office needs

Approved journey · 30 October 2026 · Web-only implementation in progress

## Product promise

Tell us what your team needs to learn. We create the experience that collects it, interpret the evidence, and help improve the workflow when the answers are not useful enough.

The form is the worker-facing surface of a generated application. Its capabilities can combine fixed validation, language interpretation, speech transcription, image processing, and specialist models. Owners describe outcomes and review changes; they do not need to select models or design a decision tree.

For this demo, show one complete cycle: create → complete → understand → request improvement → evaluate and approve → complete the improved version.

## Chosen scenario and why

**A small renovation contractor collecting end-of-day site updates.** Maya manages several jobs; Sam works on site. Maya needs to know what was completed, what is blocked, and what needs her attention tomorrow.

We propose this instead of a safety inspection for the initial demo. A wrong delivery is easy to understand visually, creates an actionable office task, and gives voice and photo inputs a natural purpose. The demonstration does not depend on claiming professional safety judgments. The business problem is missing evidence that forces Maya to call workers back after they have left the site.

The concrete incident: Sam reports that bathroom work stopped because the wrong tiles arrived. Maya later realizes that the update does not show the delivery label needed to investigate it.

This is a proposed test case, not a claim based on observed customer research. Use prepared example submissions and say so in the demo.

## The experience, screen by screen

### 1. Maya creates the first workflow

On a template screen, Maya chooses **Daily site update**. The card previews the outcome: completed work, blockers, tomorrow's needs, and optional evidence.

She types or dictates:

> “My team should give me a quick update before leaving. Ask what they finished, what held them up, and what they need tomorrow. Keep it short.”

The product presents a working preview and a readable outline:

- Select the job and date.
- Tell us how today went, by voice or text.
- Confirm the extracted update.
- If work is blocked, clarify what is needed next.
- Add an optional photo and submit.

Job and date checks use ordinary validation. Spoken meaning is interpreted. The follow-up wording can vary, but it must ask for an approved category of information. The template supplies the initial structure; Maya is not asked to invent every question.

She tries a sample response in preview and clicks **Publish version 1**. The app returns a worker link. Distribution uses a copied browser link. WhatsApp integration is out of scope.

### 2. Sam submits a useful but incomplete update

Sam opens the link on a phone, selects the job, and records:

> “Finished the prep in the bathroom. Couldn't start tiling because the wrong tiles arrived. We need the right ones tomorrow.”

The interface shows a short editable transcript and extracted cards:

| Item | Proposed value |
| --- | --- |
| Completed | Bathroom preparation |
| Blocked work | Tiling |
| Reason | Reported wrong-material delivery |
| Needed next | Correct tiles tomorrow |

Sam confirms or corrects the values. The app asks a relevant follow-up, such as “Has someone already arranged the replacement?” He answers “No.” It does not infer a deadline date without showing what “tomorrow” means.

Version 1 permits optional photos. Sam skips the upload and submits. The application has correctly followed the published workflow, but the result lacks evidence Maya needs. This is the failure we improve: business usefulness, rather than a fabricated software crash.

### 3. Maya understands the responses

Maya's **Today's updates** screen shows a small set of explicitly labeled demo submissions, including one normal day and Sam's blocked job. She sees:

> **Bathroom tiling blocked — replacement not arranged.** Sam reports that the wrong tiles arrived. No delivery photo attached.

Opening the card shows the original transcript, confirmed fields, evidence, and form version. Summary statements link back to their source. “Wrong tiles” is a worker report, not a visual fact established by the system.

The page separates **work completed**, **blockers**, and **needs attention**. A lightweight summary is enough; the MVP does not need a separate analytics platform.

### 4. Maya gives feedback in business language

On Sam's update, she clicks **Improve this workflow** and says:

> “When someone reports the wrong materials arriving, ask for a photo of the packaging or delivery label before they leave. If they can't get it, let them explain why.”

The application creates a draft change card:

| Change | Owner-facing explanation |
| --- | --- |
| Trigger | Worker confirms a wrong-material delivery |
| New step | Request a packaging or delivery-label photo |
| Evidence check | Check that packaging or a label is visible and usable |
| Exception | Worker can explain why evidence cannot be obtained; office review remains required |
| Unchanged | Normal updates, weather delays, and other unrelated blockers |
| Worker effort | One extra capture step for affected updates |

The preview exposes the affected branch. The system also states the limit: it can check the requested evidence is present; it cannot establish that the delivery is wrong without an order specification and reliable matching.

This is a proposed requirement change, so it needs Maya's approval. It is not silently published as a model optimization.

### 5. The system tests the draft before approval

Maya sees **Checking this change**, followed by a compact test report. Keep technical detail behind an expandable panel.

Representative cases:

- Wrong tiles arrived → request evidence after worker confirmation.
- “The wrong tiles nearly arrived, but the supplier corrected it” → do not assume an unresolved delivery problem.
- Rain stopped outside work → preserve the existing blocker path.
- Correct materials arrived late → do not conflate lateness with the wrong delivery.
- Worker corrects the transcript to “right tiles” → remove the now-inapplicable request without losing history.
- Photo is unclear or unrelated → offer a retake or review route.
- Packaging was discarded → collect the exception explanation; never pretend evidence was accepted.

A secondary **Implementation comparison** can show a genuine offline experiment: baseline versus GEPA-optimized interpretation of the delivery issue, measured on held-out examples. Start with the same model so any gain can be attributed to the program change. Model comparison is a separate, optional experiment.

The report includes cases tested, incorrect triggers, missed triggers, uncertainty/review rate, and latency/cost. Display actual measured results only. If a candidate fails, retain the baseline; if the workflow tests fail, keep the revision in draft. A precomputed experiment is clearly labeled with its run time and dataset version, not presented as live training.

### 6. Maya approves the exact change

She reviews the new journey and test results, then clicks **Approve and publish version 2**.

The release confirmation says:

> “New updates will request delivery evidence when a worker confirms that the wrong materials arrived. Updates already started stay on version 1.”

The release history records her approval, the changed requirement, and the evaluated implementation. Maya can open the previous version or roll back for new updates. Existing submissions are not rewritten.

### 7. The next worker gets the improved experience

In a clearly labeled second demo run, another worker opens version 2 and reports a wrong-material delivery. After confirming the interpretation, they now see:

> “Before you leave, take a photo of the packaging or delivery label so the office can investigate.”

They upload a deliberately unrelated example photo. The application explains that it cannot see the requested packaging/label and offers a retake. A usable replacement photo is attached; an ambiguous image would go to review rather than automatically pass.

The next office summary includes the reported issue, photo, and follow-up need. Maya can act with the collected evidence. We demonstrate a more complete submission; reduced calls or return visits remain hypotheses until measured with real users.

## The two improvements the audience must distinguish

**Workflow improvement:** Maya changes what evidence the business needs. The product proposes and tests a new branch, then publishes it with approval.

**Implementation improvement:** The same approved task is executed more accurately, cheaply, or quickly through a better prompt/program/model. GEPA is one optimization method. Changing the model cannot silently redefine “wrong delivery,” weaken evidence requirements, or bypass approval.

The full product can choose between ordinary code, specialist models, and general models behind a stable capability contract. This demo proves the loop with a small set of real capabilities; it does not claim arbitrary model composition or neural-network synthesis already works.

## Minimum credible build

| Must work | Why it belongs |
| --- | --- |
| One curated pack plus owner instruction | Convenient creation, without blank-page setup |
| Mobile voice input with text fallback and editable transcription | Natural on-site capture and recovery from transcription mistakes |
| Structured interpretation and bounded contextual follow-up | Shows adaptation beyond static fields |
| Response list, source-linked summary, and detail view | Makes the collection useful to the owner |
| Feedback-generated evidence branch and photo interpretation | Demonstrates software changing in response to an operational need |
| Behavioral tests, immutable approval, and version pinning | Makes the change understandable and controlled |
| One real offline optimization comparison | Supports the optimization claim with evidence |

The photo checker has a narrower task than recognizing the exact tile product. OCR, product matching, object counting, custom detectors, browser models, broad document import, and a general-purpose DSL remain future capability families. They are not required to tell this story well.

Voice, interpretation, and vision all need verified integrations. If voice access blocks the build, typed input can exercise the same journey, but the demo must explicitly narrow its claim. If the photo checker is unavailable, a human-review fallback does not count as demonstrated automated vision.

## Suggested demo pacing

Target approximately 2 minutes 45 seconds:

| Time | What the viewer sees |
| --- | --- |
| 0:00–0:20 | Owner creates a daily update from a pack; show the real business need |
| 0:20–0:45 | Worker speaks; the form extracts and clarifies the blocker |
| 0:45–1:05 | Owner sees the incomplete evidence and requests the new photo branch |
| 1:05–1:40 | Draft preview, genuine test/optimization results, and owner approval |
| 1:40–2:20 | New submission receives the added branch; wrong photo and recovery |
| 2:20–2:45 | Improved summary, version history, model/service roles, and honest limits |

Show the visible before/after quickly. Keep optimizer internals in a detail drawer and supporting report. This is a product demonstration supported by architecture evidence.

## Proposed decisions for agreement

Default recommendation: daily renovation-site updates; wrong-material delivery as the improvement trigger; packaging/label presence as the photo check; owner web workspace plus worker mobile browser; one bounded GEPA experiment on issue interpretation.

The main choice to settle before building is whether this story captures the product you want to demonstrate. The compiler representation, including whether typed holes or effect handling help, can be decided after the journey is agreed. They must support the experience rather than become the demo itself.
