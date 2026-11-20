# Codex Prompts — CORE Research Explorer

## Prompt 1 — Foundation and API feasibility

```text
Read AGENTS.md and CORE_RESEARCH_EXPLORER_PLAN.md as the working rules and implementation specification.
Act as a senior Angular architect and engineer. Begin with Phase 1 only.
First inspect the current workspace and check Node/npm/Angular versions.
Then propose the smallest working scaffold, including commands and files.
Verify the CORE API contract using available documentation and a real
request where possible. Do not guess API authentication or response fields.
Explain whether a backend-for-frontend is necessary and why.
Implement the foundation incrementally, run the available checks, and
report exact results, changed files, blockers, and a suggested Git commit.
Do not proceed to Phase 2 until Phase 1 is reviewed.
```

## Prompt 2 — Search and results

```text
Read AGENTS.md and CORE_RESEARCH_EXPLORER_PLAN.md. Inspect the current repository and confirm Phase 1 is complete. Implement Phase 2 only: typed CORE API adapter, Boolean query search form, configurable result count, mapped research paper cards, and essential loading/empty/error states. Use verified API behavior and protect credentials. Add focused tests and run build and test checks. Report actual results, limitations, and a suggested commit. Stop for review.
```

## Prompt 3 — Analytics and responsive UX

```text
Read AGENTS.md and CORE_RESEARCH_EXPLORER_PLAN.md. Confirm Phase 2 is working. Implement Phase 3 only: accurate publication-year aggregation over retrieved matching papers, a responsive chart, scope labeling, and accessibility/responsive refinements. Handle missing years and empty data. Add tests, verify checks, report results, and stop for review.
```

## Prompt 4 — Reliability and testing

```text
Read AGENTS.md and CORE_RESEARCH_EXPLORER_PLAN.md. Implement Phase 4 only. Expand unit, HTTP integration, and Playwright E2E coverage for Boolean queries, result counts, request cancellation, missing fields, loading/errors, chart aggregation, and keyboard accessibility. Use test-owned intercepted responses; do not add a fallback application data feed or claim automated tests verify live API access. Run available checks and report outcomes and remaining risks. Stop for review.
```

## Prompt 5 — Documentation and release

```text
Read AGENTS.md and CORE_RESEARCH_EXPLORER_PLAN.md. Implement Phase 5 only. Finalize README with reproducible setup, secrets configuration, build/run/test instructions, architecture, verified API constraints, implemented enhancements and known limitations. Configure GitHub Actions checks. Inspect actual Git history and suggest incremental commits; do not fabricate past commits. Prepare release and deployment instructions. Only claim a public repository or deployment exists after verifying it. Report final Definition of Done status.
```

## Prompt 6 — Review before submission

```text
Perform a senior-engineer code review against CORE_RESEARCH_EXPLORER_PLAN.md and AGENTS.md. Identify security, correctness, accessibility, performance, API-contract, and testing issues. Prioritize findings by severity with file paths and remediation steps. Distinguish verified behavior from assumptions. Do not make changes until the review is approved.
```
