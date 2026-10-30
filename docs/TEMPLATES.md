# Starter templates and capability scope

Fluid Forms exposes 15 editable starting contracts. Each selection changes context choices, respondent-facing prompts, extraction labels, and a declared attention route. These are starter intake/feedback workflows, not complete booking systems, compliance checklists or domain certifications.

| Template | Domain | Context | Initial contextual route |
| --- | --- | --- | --- |
| Daily site report | Operations | Site | Report clarification; optional delivery-photo revision |
| End-of-course feedback | Education | Course | negative feedback → Which part of the course caused the difficulty? |
| Product feedback | Research | Product | negative feedback → What were you trying to do when the problem occurred? |
| Service experience | Customer experience | Service | negative feedback → Which part of the service disappointed you? |
| Booking enquiry | Bookings | Service | request → What time window and group size would work for you? |
| Market research interview | Research | Study | negative feedback → Can you describe the most recent time you experienced that frustration? |
| Mystery shopping visit | Retail | Store | negative feedback → Where in the customer journey did the experience fall short? |
| Visual merchandising audit | Retail | Location | other → Which display or location needs attention? |
| Event feedback | Events | Event | negative feedback → Which part of the event needs improvement? |
| Customer onboarding | Customer success | Product | request → What outcome would make this onboarding successful? |
| Support intake | Customer support | Area | other → What happened immediately before you noticed the problem? |
| Property visit report | Property | Property | other → Which part of the property is affected? |
| Volunteer application | Community | Programme | request → What availability or support would help you take part? |
| Delivery experience | Logistics | Delivery | wrong material → Which item or part of the delivery needs attention? |
| Team pulse survey | People | Team | negative feedback → What is the main source of friction this week? |

## Implemented assembly and improvement

The template is a typed `FormSpec`. The owner’s brief customizes its introduction and opening questions. A fixed component registry renders the assembled workflow; this prototype does not execute generated JavaScript. The graph displays the same conditional questions used by the respondent runtime.

For general templates, DSPy `InterpretFormUpdate` interprets the response in workflow context. It returns factual/positive details, concerns, a requested next step, and an explicit issue/intent category. Negative or mixed feedback activates `negative_feedback` questions. Positive responses without concerns use `none` and skip those questions. Respondents confirm or correct the interpretation.

Owner feedback invokes `ReviseQuestions` to append one typed question with an explicit trigger (up to five total). The existing questions remain in the contract. The server checks the exact revision, requires owner approval, and pins each new session to its release. Required contextual answers are enforced server-side, not only in the UI. The construction workflow retains its existing delivery-photo patch and NVIDIA vision review.

The dashboard shows actual proposal, interpretation, contract-check and publication records. The separate recorded GEPA experiment covers the original site-report classifier. No on-the-fly model training, automatic model replacement, edge inference or model-routing optimization is claimed by the current runtime. These remain part of the wider product vision.

## Validation

All 15 contracts were created, checked and published in isolated API tests. The live browser acceptance journey exercises course selection, the graph, mixed-feedback classification, conditional questioning, an approved second question in version 2, a positive response with no unnecessary branch, and the dashboard trace. Existing construction regression tests remain in the suite.
