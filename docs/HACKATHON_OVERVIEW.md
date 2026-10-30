# Hackathon overview, rules, and resources

Reference snapshot: 30 October 2026, rechecked against the official rules

## Our entry

- Product name: A variation of Liveforms or thoughtforms or melding forms.
- Value proposition: Forms that mind-meld with the user by learning and improving themselves
- Concept: template-led adaptive surveys with multimodal evidence checks and evaluated, owner-approved revisions.
- Proposed track: Best Apps and Agents.
- Solo build; Python preferred; Can also use functional programming with the concept of holes for the form composability
- Plans: [PRD](PRD.md) and [technical decisions/evaluation plan](TECHNICAL_DECISIONS.md).

## Official pages

| Page | URL |
| --- | --- |
| Overview | https://nebiusglobalaihackathon.devpost.com/ |
| Official rules | https://nebiusglobalaihackathon.devpost.com/rules |
| Resources | https://nebiusglobalaihackathon.devpost.com/resources |
| Updates | https://nebiusglobalaihackathon.devpost.com/updates |
| FAQs | https://nebiusglobalaihackathon.devpost.com/details/faqs |
| Discussions | https://nebiusglobalaihackathon.devpost.com/forum_topics |

## Dates and submission essentials

Submission deadline: **30 October 2026, 10:00 PDT / 17:00 London**. Current judging period: **December 9–23, 2026**. Winners expected around **January 25, 2027**. These judging/announcement dates supersede the earlier snapshot. Keep the demo accessible through December 23.

- Build working software using a runtime Token Factory call or Nebius AI Cloud compute, plus an NVIDIA open-source model.
- Choose a track: Coding and Agentic Engineering, Best Apps and Agents, Personal AI, or Physical AI.
- Supply a working demo/test build, description, public repository, open-source license, and setup/run instructions.
- Provide a public YouTube demonstration under three minutes and tool/model feedback.
- Give judges free access through the end of judging; supply test credentials if needed.
- Provide English materials or translations, and use assets/integrations with appropriate rights.
- Freeze submission materials by the deadline; later alterations require organizer permission.

Judging equally weights technological implementation, design, potential impact, and idea quality. Official rules require IRL event attendance for City Winner eligibility, despite contradictory wording on Resources. Verify any disputed eligibility with organizers. Read the full rules for eligibility, prizes, and terms. [Source: official rules](https://nebiusglobalaihackathon.devpost.com/rules)

## Platform clarification

Calling an NVIDIA model through Token Factory meets the platform requirement; the frontend and unrelated backend processing can run elsewhere. Token Factory promotional credits are not AI Cloud credits, and the FAQ lists no separate published AI Cloud grant. Missing credits or provisioning issues are directed to Nebius support via Discord. [Official FAQ](https://nebiusglobalaihackathon.devpost.com/details/faqs)

## Credits and account access

| Resource | URL / note |
| --- | --- |
| Token Factory console | https://tokenfactory.nebius.com/ |
| AI Cloud console | https://console.nebius.com/ |
| Hackathon credit form | https://nebius.com/promo-code?utm_promo_activation_code=NEBIUS-DEVPOST-GLOBAL26&utm_promo_code_type=Token_Factory&utm_promo_event_code=2026-devpost-global-ai-hack |
| Activation code | `NEBIUS-DEVPOST-GLOBAL26` |
| Builder Program | https://dev.nebius.com/builders |

## Technical documentation and examples

| Resource | URL | Intended use |
| --- | --- | --- |
| Nebius developer hub | https://dev.nebius.com/ | Starting point and support links |
| Token Factory documentation | https://docs.tokenfactory.nebius.com/ | Authentication, inference, endpoint behavior |
| AI Cloud documentation | https://docs.nebius.com/ | Optional deployment/compute path |
| NVIDIA models on Nebius | https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference | Candidate selection; verify exact IDs and modalities |
| Token Factory cookbook repository | https://github.com/nebius/token-factory-cookbook | Reusable examples; review dependencies/licenses |
| Agentic cost benchmark | https://dev.nebius.com/cookbook/agent-cost-benchmark | Compare correctness, latency, tokens, and cost on identical tasks |
| Vision and human validation cookbook | https://dev.nebius.com/cookbook/invoice-vision-human-validation | Reference for evidence extraction and escalation |
| NVIDIA Super VL announcement | https://developer.nvidia.com/blog/nvidia-nemotron-3-5-super-vl-powers-specialized-agents-with-multimodal-reasoning/ | Vision candidate; announcement does not confirm our endpoint access |
| Retail agents/blueprints | https://nebius.com/blog/posts/retail-ai-agents-nvidia-blueprints-nebius | Sponsor architecture context |
| Agentic search context | https://nebius.com/blog/posts/bringing-agentic-search-into-the-production-ai-stack | Optional grounded research; not required for the MVP |

Our cost benchmark will use our own form tasks and labels. Measure cost per correct result, including retries; report GEPA compilation costs separately. A cookbook result is not a prediction of our workload's performance.

## Framework references under consideration

These are project research references, not hackathon requirements.

| Area | URL |
| --- | --- |
| DSPy signatures | https://dspy.ai/current/diving-deeper/signatures-in-depth/ |
| DSPy optimizers | https://dspy.ai/current/diving-deeper/choosing-an-optimizer/ |
| GEPA algorithm in DSPy | https://dspy.ai/current/diving-deeper/gepa-in-depth/ |
| Experimental optimizable code: Flex | https://dspy.ai/current/diving-deeper/flex/ |
| Fine-tuning optimizer | https://dspy.ai/current/api/optimizers/BootstrapFinetune/ |
| Experimental decision types/Jev | https://dspy.ai/current/api/experimental/DecisionTypes/ |
| Thesys OpenUI | https://www.openui.com/docs |
| OpenUI source | https://github.com/thesysdev/openui |
| Browser WebGPU inference | https://huggingface.co/docs/transformers.js/guides/webgpu |
| JSON Forms rules | https://jsonforms.io/docs/uischema/rules/ |
| WhatsApp Cloud API | https://developers.facebook.com/docs/whatsapp/cloud-api/overview |

## Product research references

- [ODK repeating groups and form logic](https://docs.getodk.org/form-logic/): existing form semantics to account for.
- [SafetyCulture publication workflow](https://help.safetyculture.com/en-US/005883/): version/publication comparison.
- [Community fire-safety template](https://safetyculture.com/library/property-and-facilities-management/emergency-and-resilience-fire-safety-qovz9xyt2eoipl03): research only; not an approved checklist or permission to copy.
- [Typeform AI](https://help.typeform.com/hc/en-us/articles/42053773420948-Use-Typeform-AI): existing AI authoring capabilities.

## Workshops, judging advice, and support

- [Will your project ship? Recording and judges' summary](https://nebiusglobalaihackathon.devpost.com/updates/47163-recording-will-your-project-ship): demonstrate useful behavior early, focus scope, identify model roles, document failure cases, and reserve packaging time. The page links to the recording.
- [Live build session recording and resources](https://nebiusglobalaihackathon.devpost.com/updates/46337-build-session-recording-resources-available-live-coding-your-first-app-with-nebius): links to video, Devpost Discord, Hermes setup, and related resources. Inspiration for screenshot-feedback loops, not a requirement to use its stack.
- [Nebius community entry point](https://dev.nebius.com/): current Discord, office-hours, GitHub, YouTube, and social links. Use the Devpost Global AI Hackathon Discord channel for project questions.
- [Builders & Brews](https://luma.com/builderandbrews): events/community. The hackathon Resources page lists the London session as September 15, already past at this snapshot.
- [Discussions](https://nebiusglobalaihackathon.devpost.com/forum_topics): account and judging-access questions; titles alone do not establish organizer policy.

## Optional promotional video

The registration email supplied by the user invites a 30–60-second horizontal video covering the project, first impressions of tools, and what the builder has gained. It says participation is optional, does not affect judging, and grants sharing permission to Devpost, Nebius, and NVIDIA. This is separate from the required project demonstration.

The email's upload-form URL was not included in the pasted text. Retrieve it from the original email if participating; no replacement URL is assumed.

## Submission preparation for this project

- [x] Verify live model calls and record actual service/model IDs.
- [x] Complete one coherent workflow and document limitations.
- [x] Record baseline versus GEPA-selected held-out results, with token usage and cost estimates; no optimization gain claimed.
- [x] Add installation, configuration, run/test commands and screenshots to the root README.
- [x] Preserve the repository's MIT license and publish source/assets required to reproduce the demo.
- [x] Record specific onboarding/tool feedback during implementation.
- [ ] Deploy a persistent HTTPS demo after the owner's approval and add its URL to the README.
- [ ] Test judge access and capture the final public demo video.
- [ ] Recheck official rules and submit the actual working scope.

See [deployment notes](DEPLOYMENT.md). Submission copy and recording scripts are maintained locally outside Git.

Keep API keys, private account details, customer evidence, and test-user passwords out of this public reference document.
