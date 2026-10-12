# ADLC 10-Template Process Explainer Script

## Audience
- Team members (engineering, QA, product, architecture, operations)
- Leadership (delivery leaders, program managers, governance/compliance stakeholders)

## Duration Options
- 10-minute executive overview
- 20-minute team and leadership walkthrough (recommended)
- 30-minute deep dive with Q&A

## How To Use This Script
- Read the "Speaker" lines as your narrative.
- Use the "Leadership Emphasis" and "Team Emphasis" bullets depending on audience mix.
- Keep examples specific to your project domain.

---

## Slide 1: Why We Changed The ADLC Model

Speaker:
"We moved to the optimized ADLC model to reduce process overhead while preserving enterprise-grade control. Instead of generating many separate documents, we now generate a focused, traceable set of 10 core artifacts plus one validation report. This gives us speed for delivery teams and confidence for leadership."

Leadership Emphasis:
- Faster planning-to-build cycle with stronger auditability.
- Better visibility into readiness, blockers, and risk ownership.

Team Emphasis:
- Fewer duplicate documents.
- Clear upstream/downstream ownership.
- Better reuse of source inputs without manual reformatting.

---

## Slide 2: What "Optimized" Means

Speaker:
"Optimized does not mean less rigor. It means the same detailed information model is preserved in fewer artifacts. The detailed 01-23 templates remain as reference, but the default delivery path is the optimized artifact set."

Leadership Emphasis:
- Governance remains intact.
- Enterprise and regulated controls are enforced by validation.

Team Emphasis:
- Less time spent on formatting, more time on engineering quality.
- Clear artifact dependency order avoids rework.

---

## Slide 3: The 10 Core Artifacts At A Glance

Speaker:
"The process centers on these 10 core artifacts, each with a distinct purpose and handoff role."

1. `00_Project_Intake_And_Mode.md` - classifies project and selects mode/tier.
2. `01_Source_Baseline.md` - inventories all usable inputs and source precedence.
3. `02_Requirements_And_Scope.md` - defines FRs, NFRs, scope, flows, and constraints.
4. `03_Current_State_Analysis.md` - captures existing system behavior and debt (when applicable).
5. `04_Target_Solution_Architecture.md` - defines target architecture, integration, data, security.
6. `05_Technology_Engineering_And_Design.md` - engineering standards, stack, UI/design system.
7. `06_Backlog_Delivery_And_Migration_Plan.md` - phases, dependencies, estimates, migration path.
8. `07_Quality_Test_And_Validation.md` - testing strategy, quality gates, readiness scoring.
9. `08_Release_Operations_And_Governance.md` - release, operations, approvals, audit readiness.
10. `09_Build_Prompt.md` - implementation handoff for build agents/teams.

Speaker:
"After these, `10_ADLC_Validation_Report.md` confirms whether we are build-ready or blocked."

---

## Slide 4: Two Primary Delivery Objectives

Speaker:
"This model supports two common realities: greenfield build and legacy modernization."

- Forward Engineering:
  - Use when no current codebase evidence exists.
  - Usually skips artifact 03.

- Reverse-To-Forward Engineering:
  - Use when modernizing or migrating existing systems.
  - Requires clear separation of current state, target state, and transition plan.

Leadership Emphasis:
- Reduces modernization risk by forcing explicit current-to-target mapping.

Team Emphasis:
- Prevents accidental carry-forward of legacy behavior.

---

## Slide 5: Execution Modes And Run Modes

Speaker:
"We manage work in two dimensions: project execution mode and lifecycle run mode."

Execution Modes:
- Forward Engineering
- Reverse Engineering Only
- Reverse-To-Forward Engineering
- Enhancement
- Migration/Modernization

Lifecycle Run Modes:
- Initial Generation
- Change Impact
- Targeted Regeneration
- Full Regeneration

Speaker:
"When sources change, we do not regenerate blindly. We update source baseline, assess impact, regenerate only what is affected, and then revalidate."

---

## Slide 6: Source Discipline And Traceability

Speaker:
"Every decision is source-backed. Inputs are references until their facts are extracted into ADLC artifacts."

Key Rules:
- Every usable source file is inventoried.
- Every FR maps to source, backlog, validation, and build prompt.
- Every NFR includes target metric, validation method, owner, and evidence.
- Conflicts and open questions are explicitly tracked, not hidden.

Leadership Emphasis:
- Strong defensibility during audits and steering reviews.

Team Emphasis:
- Clear acceptance criteria and less ambiguity in implementation.

---

## Slide 7: Governance Gates And Build Control

Speaker:
"Coding does not begin by default. Build starts only when validation confirms readiness or approved exceptions are documented."

Mandatory Gate:
- `10_ADLC_Validation_Report.md` must pass (or be conditionally approved with waivers).

Enterprise/Regulated Expectations:
- Security controls and threat model
- Data classification and privacy controls
- Compliance mapping
- Release and rollback readiness
- Operational support and approvals

Speaker:
"This gate protects schedule and quality by catching missing decisions early."

---

## Slide 8: Roles And Accountability

Speaker:
"This process works because ownership is explicit."

- Product/Business: scope, priority, acceptance intent
- Architecture/Engineering: solution integrity, technical choices
- QA/Quality: test strategy, coverage, release quality confidence
- Operations/SRE: deployment readiness, rollback, observability
- Governance/Leadership: risk decisions, waivers, final go/no-go

Leadership Emphasis:
- Decisions are attributable and reviewable.

Team Emphasis:
- Reduced confusion around who approves what.

---

## Slide 9: Metrics Leadership Should Track

Speaker:
"To evaluate process health, track these indicators each cycle."

- Intake-to-validation lead time
- Percent of FRs with full traceability chain
- NFR validation pass rate
- Open blocker count at validation time
- Post-generation source change frequency
- Build prompt stale-to-refreshed turnaround time
- Release rollback readiness score

---

## Slide 10: What Changes For The Team Day-To-Day

Speaker:
"For contributors, the biggest shift is disciplined upstream clarity before build execution."

New Working Norms:
- Keep source evidence current and explicit.
- Resolve conflicts in upstream artifacts, not in code comments.
- Treat quality and operations readiness as first-class work.
- Use targeted regeneration after source updates.

Expected Benefits:
- Fewer late-stage surprises
- Better delivery predictability
- Cleaner handoff to implementation agents and development teams

---

## Slide 11: Suggested Rollout Plan (First 30 Days)

Speaker:
"We will adopt this in controlled steps so teams can learn without delivery disruption."

Week 1:
- Align on execution mode and delivery tier definitions.
- Run one pilot project through artifacts 00-02.

Week 2:
- Complete architecture, technology/design, and backlog artifacts (04-06).
- Baseline traceability checks.

Week 3:
- Complete quality and release/governance artifacts (07-08).
- Run first validation report.

Week 4:
- Generate build prompt (09) after readiness.
- Capture lessons learned and update operating guidance.

---

## Slide 12: Closing Statement

Speaker:
"This ADLC model is designed to balance speed with control. Teams get a practical path from source evidence to implementation. Leadership gets traceable decisions, measurable readiness, and stronger governance. If we follow the artifact flow and enforce the validation gate, we reduce delivery risk while increasing execution clarity."

---

## Q&A Prompts (Optional)

- "How does this reduce cycle time if we added validation?"
- "When should we choose full regeneration instead of targeted regeneration?"
- "What is the minimum acceptable evidence for FR/NFR traceability?"
- "How do we handle approved exceptions without blocking delivery?"
- "What changes in reverse-to-forward projects versus greenfield projects?"

---

## 2-Minute Executive Summary Script (Optional)

Speaker:
"We have standardized delivery using an optimized ADLC model with 10 core artifacts and one validation report. This reduces document sprawl while preserving enterprise rigor. The process starts with project intake and source baselining, then moves through requirements, architecture, engineering design, backlog planning, quality validation, and release governance before build handoff. We support both greenfield and modernization paths, with strict separation of current and target state in legacy scenarios. Every requirement is traceable, every non-functional commitment is measurable, and build execution is gated by validation readiness. This gives delivery teams clarity and gives leadership visibility, control, and audit confidence."