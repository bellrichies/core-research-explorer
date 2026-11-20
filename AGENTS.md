# Codex Agent Instructions — CORE Research Explorer

> Applies to this repository. The engineering specification is in `docs\CORE_RESEARCH_EXPLORER_PLAN.md`.

## Working agreement for Codex

Use this document as the source of truth. Work in **small, verifiable increments**. At the start of each phase:

1. Inspect the existing repository and summarize what is already implemented.
2. Identify the smallest next task and files that need changes.
3. State any assumptions or unverified CORE API behavior.
4. Implement only the selected task, using existing conventions.
5. Add or update tests for the behavior changed.
6. Run relevant checks and report results truthfully.
7. Summarize files changed, remaining risks and a suggested commit message.
8. Stop for review before proceeding to the next major phase.

**Guardrails for Codex:**

- Do not invent API fields, pagination parameters, access policies or response payloads.
- Do not claim live API access without a successful real request.
- Do not expose API keys in frontend code or commit them.
- Do not change scope or add major dependencies without explaining tradeoffs.
- Do not create a backend unless justified by verified authentication/CORS/security needs.
- Do not treat sample/fixture papers as live search results.
- Do not claim commands, tests, commits, pushes or deployments succeeded unless they actually did.
- Keep application compilable at each meaningful checkpoint.

## Initial setup commands

Use a current Angular CLI version meeting Angular 20+, and confirm its supported Node.js version first.

```bash
npx @angular/cli@latest new core-research-explorer --routing --style=scss --strict
cd core-research-explorer
npm start
```

On Windows PowerShell, enter the commands on separate lines. Install and configure UI, charting, linting and test dependencies deliberately in their respective phases, not all at once.
