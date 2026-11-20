# CORE Research Explorer — Engineering Implementation Plan

> **Purpose:** Engineering architecture, requirements, and delivery specification for an Angular 20+ research discovery mini-app powered by CORE API v3.
>
> **Status:** Planning only. No code, API behavior, tests, deployment, or GitHub repository has yet been verified.
>
> **Companion files:** `AGENTS.md` contains Codex working instructions; `CODEX_PROMPTS.md` contains ready-to-use prompts.

## 1. Project objective

Build a responsive Angular application that searches scientific papers through the CORE API, supports Boolean keyword queries, lets users select the number of papers retrieved, displays research metadata, and charts publication-year distribution for the retrieved matching papers.

### Mandatory acceptance criteria

- [ ] Angular version **20 or higher**, standalone components and strict TypeScript.
- [ ] Real CORE API v3 integration using `GET /v3/search/works`.
- [ ] Responsive paper list with title, authors, year, abstract (if available), and source link.
- [ ] User-configurable number of papers to retrieve, within verified API limits.
- [ ] Boolean queries, e.g. `drone AND (package OR delivery)`.
- [ ] Chart aggregating publication years from matching **retrieved** papers; clearly label scope.
- [ ] Public GitHub repository with multiple incremental, working commits.
- [ ] README with setup, credentials, run, test, and build instructions.
- [ ] Enumerated additional features and known limitations in submission.

## 2. Technical decisions

| Concern    | Decision                                 | Rationale                                     |
| ---------- | ---------------------------------------- | --------------------------------------------- |
| Framework  | Angular 20+ with standalone components   | Meets assignment; modern Angular              |
| Language   | TypeScript strict mode                   | Safer integration and maintenance             |
| UI         | Angular Material + SCSS                  | Accessible, consistent controls               |
| State      | Angular Signals + RxJS                   | Lightweight state and cancellable HTTP        |
| HTTP       | Angular HttpClient                       | Native Angular integration                    |
| Charts     | Apache ECharts                           | Responsive publication trend chart            |
| Testing    | Vitest, Angular HTTP testing, Playwright | Unit, integration, E2E                        |
| CI         | GitHub Actions                           | Build and test on every push/PR               |
| Backend    | Small Node.js BFF **only if needed**     | Keep private CORE credentials off the browser |
| Deployment | Static frontend plus optional hosted BFF | Match verified authentication constraints     |

**Architecture principles:** feature-first organization; single responsibility; typed boundaries; pure aggregation functions; defensive API mapping; no unnecessary NgRx, database, authentication, or microservices.

## 3. Critical API feasibility spike — do this first

Documentation:

- <https://api.core.ac.uk/docs/v3#section/How-to-search>
- <https://core.ac.uk/>

Example endpoint:

```http
GET https://api.core.ac.uk/v3/search/works?q=drone%20AND%20(package%20OR%20delivery)
```

**Do not assume the endpoint is anonymously accessible.** Before implementation, verify:

1. Whether CORE requires an API key, registration, or other authentication.
2. Exact supported Boolean grammar and field query semantics.
3. Exact query, page-size, pagination and sorting parameter names and limits.
4. Response shape: result collection, total hits, metadata fields and URLs.
5. Rate limits, errors, CORS behavior and whether aggregation is available.
6. Whether the intended deployment can securely access the API.

Record findings in `docs/core-api-contract.md` with sample sanitized responses and references. If a private key is required, implement a BFF that stores it in server environment variables. **Never commit credentials or put secrets in Angular environment files or client bundles.** If access is unavailable, continue UI development with fixtures, but explicitly identify live integration as blocked; do not present mocked data as real API results.

## 4. User experience and screens

### Primary page layout

1. Header: app name, short description.
2. Search area: Boolean query input, example query, submit button, result count selector.
3. Results summary: query, retrieved count, total hits if API provides it, active filters.
4. Results area: responsive paper cards, skeletons, empty state, retry/error state.
5. Analytics area: publication-year bar chart with clear dataset scope.

### Search behavior

- Enter submits; button also submits.
- Boolean expression is forwarded using correct URL encoding.
- Lightweight validation catches empty input, obvious trailing operators and unmatched parentheses; API remains grammar authority.
- Use RxJS `switchMap` or equivalent cancellation to avoid stale response overwrites.
- A new search resets relevant pagination/aggregation state.
- Result-count changes trigger a new request when appropriate.
- Define count as **total records requested**; implement paginated retrieval if the verified API page limit is lower.
- Bound requested count to a safe, documented limit; do not download unlimited results.
- Clearly distinguish **retrieved papers** from **total matching papers**.

### Paper card

- Title, authors, year, short abstract with expand/collapse.
- DOI, publisher and publication link where present.
- External links use safe URLs and `rel="noopener noreferrer"` where applicable.
- Graceful fallbacks for missing data.

### States

- Initial: show instructions, sample query and no chart.
- Loading: accessible progress indication and skeleton cards.
- Success: list and chart updated from the same result set.
- Empty: explain no results and suggest broadening the query.
- Error: meaningful explanation and retry; distinguish 401/403, 429, network and 5xx.

### Accessibility

Target WCAG 2.2 AA: semantic headings, labeled inputs, keyboard operation, visible focus, contrast, meaningful link text, screen-reader status updates and responsive layouts.

## 5. Data model and API adapter

Use an internal model that does not expose raw third-party response shape to components:

```ts
export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  publishedYear: number | null;
  doi: string | null;
  sourceUrl: string | null;
  downloadUrl: string | null;
  publisher: string | null;
}

export interface ResearchSearchResult {
  papers: ResearchPaper[];
  totalHits: number | null;
  retrievedCount: number;
  query: string;
}
```

Create a dedicated mapper after inspecting actual API responses. Validate/coerce missing or malformed fields. Do not invent CORE field names before verifying the contract.

### HTTP reliability

- Encode query parameters with `HttpParams` or equivalent.
- Add reasonable timeouts and cancel stale searches.
- Avoid retrying authentication errors; respect `Retry-After` for 429 if available.
- Avoid logging keys or sensitive headers.
- Preserve an understandable user-visible error state.
- Unit-test the adapter with mock HTTP responses.

## 6. Analytics

**MVP chart:** publication count by year, derived from the papers retrieved for the active query.

Algorithm:

1. Iterate normalized `ResearchPaper[]`.
2. Ignore null, invalid or implausible publication years.
3. Group by year and count.
4. Sort years ascending.
5. Render a bar chart with axes, accessible labels and empty state.

Include a note such as **“Publication years among 50 retrieved papers; not all CORE matches.”** Optionally show the number excluded for missing years. Do not label sample aggregates as database-wide statistics. Only add all-match aggregation after verifying that CORE supports it or after implementing a documented, bounded collection strategy.

Optional summary metrics: retrieved paper count, year range and DOI coverage.

## 7. Proposed repository structure

```text
core-research-explorer/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── api/core-api.service.ts
│   │   │   ├── models/research-paper.model.ts
│   │   │   ├── models/search-response.model.ts
│   │   │   └── interceptors/api-error.interceptor.ts
│   │   ├── features/
│   │   │   ├── research-search/
│   │   │   │   ├── components/search-form/
│   │   │   │   ├── components/paper-card/
│   │   │   │   ├── components/results-list/
│   │   │   │   ├── research.store.ts
│   │   │   │   └── search.page.ts
│   │   │   └── analytics/
│   │   │       ├── components/publication-chart/
│   │   │       └── publication-analytics.ts
│   │   ├── shared/
│   │   │   ├── components/empty-state/
│   │   │   ├── components/error-state/
│   │   │   ├── components/loading-skeleton/
│   │   │   └── utils/boolean-query.utils.ts
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.ts
│   └── styles.scss
├── server/                         # Only if private-key BFF is necessary
├── e2e/
├── docs/
│   ├── architecture.md
│   ├── core-api-contract.md
│   └── decisions/
├── .github/workflows/ci.yml
├── .env.example                    # Placeholder names only; no real secrets
├── README.md
└── package.json
```

Adjust generated filenames to the Angular CLI version actually installed.

## 8. Delivery roadmap and task checklist

### Phase 1 — Foundation and feasibility (0.5–1 day)

- [ ] Check installed Node.js and supported Angular CLI version.
- [ ] Scaffold Angular 20+ with routing, standalone components and SCSS.
- [ ] Enable strict typing, linting, formatting and baseline tests.
- [ ] Verify CORE authentication, Boolean search, pagination and response format.
- [ ] Decide direct API vs BFF from observed security constraints.
- [ ] Document contract and add sanitized fixture data.
- [ ] Commit a working baseline.

**Exit:** App builds and serves; API approach is documented; successful real request demonstrated or external access blocker recorded.

### Phase 2 — Search and results (1–1.5 days)

- [ ] Define models and response mapper.
- [ ] Implement typed CORE client/BFF adapter.
- [ ] Implement Boolean search form and validation.
- [ ] Add configurable result count and bounded pagination.
- [ ] Implement research store with Signals and RxJS cancellation.
- [ ] Build accessible paper cards and results list.
- [ ] Handle loading, empty and error states.
- [ ] Add unit and HTTP integration tests.
- [ ] Commit independently working increments.

**Exit:** Users can search and browse real paper results.

### Phase 3 — Analytics and UX (0.5–1 day)

- [ ] Implement pure year-aggregation function.
- [ ] Add publication-year chart.
- [ ] Synchronize chart and search results.
- [ ] Label loaded-data scope and missing-year exclusions.
- [ ] Improve responsive layout and keyboard accessibility.
- [ ] Test aggregation and empty chart cases.

**Exit:** Chart accurately reflects the current retrieved result set.

### Phase 4 — Quality and resilience (1 day)

- [ ] Unit-test query validation and response mapping.
- [ ] Test HTTP errors, timeouts, stale response cancellation and rate limits.
- [ ] Add Playwright E2E for search, count control, results and chart.
- [ ] Test missing metadata and zero-result scenarios.
- [ ] Check keyboard usability and accessibility.
- [ ] Run production build and verify secrets are absent from bundles.

**Exit:** Critical tests and quality checks pass.

### Phase 5 — Delivery (0.5–1 day)

- [ ] Configure GitHub Actions for lint, tests and production build.
- [ ] Write README with exact setup, run, test, build and credential steps.
- [ ] Document architecture, tradeoffs and known limitations.
- [ ] Enumerate optional features implemented.
- [ ] Verify all commits build and checks pass.
- [ ] Push to public GitHub repository.
- [ ] Optionally deploy a live preview with secure backend configuration.
- [ ] Provide actual GitHub URL and optional deployment URL.

**Exit:** Reviewer can clone, configure, run and assess the project.

## 9. Testing matrix

| Level         | Cases                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Unit          | Boolean input checks; mapper; year counts; missing metadata               |
| HTTP          | Query encoding; result count; pagination; 401/403; 429; 5xx; cancellation |
| Component     | Search submit; loading; cards; empty and error states                     |
| E2E           | Boolean search; change count; result list; chart updates; mobile          |
| Accessibility | Keyboard focus; labels; announcements; contrast                           |
| Security      | No secrets in Git, browser JS, logs or CI artifacts                       |

**Minimum critical tests:**

- [ ] `drone AND (package OR delivery)` is transmitted correctly.
- [ ] Changing requested count affects the API request and result display.
- [ ] Old requests cannot overwrite the newest query's results.
- [ ] Missing abstracts, years, URLs and authors do not crash rendering.
- [ ] Empty results render a helpful state.
- [ ] Chart counts match the current normalized papers.
- [ ] API failures have clear messages and retry paths.

## 10. Incremental Git strategy

Suggested commits (each must leave the app working):

```text
chore: initialize Angular application
chore: configure linting and test infrastructure
docs: document verified CORE API contract
feat: add CORE API client and paper models
feat: implement Boolean research search
feat: add configurable result limits
feat: render responsive research paper cards
feat: add publication year analytics
feat: improve loading and error handling
test: cover search and analytics workflows
ci: configure automated quality checks
docs: finalize README and architecture notes
```

Use genuine commits in chronological implementation order. Do not fabricate a commit history. Before each commit, run applicable tests and the production build.

## 11. Risk register

| Risk                                    | Priority | Mitigation                                                          |
| --------------------------------------- | -------- | ------------------------------------------------------------------- |
| CORE requires private credentials       | High     | Validate early; use server-side BFF                                 |
| CORE API unavailable or quota exhausted | High     | Explicit blocked status, fixtures for UI tests, rate-limit handling |
| CORS blocks browser calls               | High     | Secure BFF rather than unsafe browser workarounds                   |
| API schema changes                      | Medium   | Mapping boundary and fixture tests                                  |
| Unsupported Boolean syntax              | Medium   | Validate against documentation and real queries                     |
| Large result sets                       | Medium   | Bounded count, pagination, request cancellation                     |
| Missing publication years               | Low      | Exclude and disclose chart omissions                                |
| Secret exposure                         | High     | Env vars server-side, secret scanning, no client keys               |

## 12. Optional enhancements (only after MVP)

**P1:** shareable search URL, recent queries, loading skeletons, improved error states.

**P2:** publication-date sorting, CSV export, dark mode.

**P3:** saved papers, subject/topic visualization.

List every actually implemented enhancement in the README. Do not claim unimplemented features.

## 13. Definition of done

- [ ] Angular 20+ builds and runs.
- [ ] Real CORE API search works or a documented external blocker is disclosed.
- [ ] Boolean query and configurable result count work.
- [ ] Paper cards render actual mapped metadata.
- [ ] Publication-year chart is accurate and scope-labeled.
- [ ] Empty, loading and error states work.
- [ ] Automated tests and production build pass.
- [ ] UI is responsive and keyboard accessible.
- [ ] Credentials are not exposed.
- [ ] GitHub repository is public with incremental working commits.
- [ ] README enables reproducible setup and clearly lists extras and limitations.

## 14. Submission checklist and template

```text
Project: CORE Research Explorer
GitHub repository: <actual public repository URL>
Live preview: <actual deployed URL, if available>

Mandatory features:
- Angular 20+ research search
- Boolean keyword queries
- Configurable paper retrieval count
- Research paper cards
- Publication-year analytics

Additional features actually implemented:
1. <feature and why it helps>
2. <feature and why it helps>

Known limitations:
- <accurate limitation>

How to run:
- See README.md
```

---

**Planning estimate:** 3.5–5.5 engineering days for one experienced engineer, contingent on API access and no substantial integration blockers. This is an estimate, not a commitment.
