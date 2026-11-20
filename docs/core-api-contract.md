# CORE API v3 Contract Notes

## Status

- Verification date: 2026-11-20
- Official documentation: <https://api.core.ac.uk/docs/v3>
- Swagger/OpenAPI document: <https://api.core.ac.uk/swagger/v3.json>
- Live endpoint probe: `GET https://api.core.ac.uk/v3/search/works?q=drone%20AND%20(package%20OR%20delivery)&limit=1`

## Observed behavior

The unauthenticated probe reached the CORE endpoint but returned **HTTP 429 Too Many Requests**.
The response headers reported a limit of 10 requests and a retry time of 2026-11-20 16:59:46 UTC.
This proves network reachability only. It does not prove successful authenticated search access or a usable
response payload.

## Authentication

The Swagger document declares API-key authentication in either:

- `api_key` query parameter
- `Authorization: Bearer [API_KEY]` request header

An API key must be obtained through CORE. The key must not be committed or embedded in Angular environment
files or browser JavaScript. The direct-browser deployment decision must remain blocked until the key/CORS
behavior is verified.

## Search operation

Swagger operation: `GET /v3/search/{entityType}/`

Verified parameters for the search operation:

- `entityType`: path parameter; use `works` for paper records.
- `q`: query string.
- `offset`: pagination offset.
- `limit`: maximum requested result count.
- `stats`: include entity statistics when `true`.

The exact page-size maximum and exact sorting parameter behavior are not yet verified from a successful
response. The implementation must not set an assumed limit until that behavior is confirmed.

## Boolean syntax

CORE documentation describes fielded queries such as `q=abstract:"bibliometrics"` and `q=authors:David`.
The example `drone AND (package OR delivery)` is specified by the project plan, but its live acceptance,
operator behavior, and field semantics have **not yet been verified** with a successful API request.
Do not treat the fixture or UI-only validation as proof of CORE grammar.

## Response wrapper

The verified Swagger `SearchResponse` schema contains:

- `total_hits`
- `limit`
- `offset`
- `results`
- `tooks`
- `search_id`

The Swagger `results` schema is generic and no exact per-result shape is modeled in one typed union. The
verified `Work` schema exposes relevant fields including `id`, `title`, `authors`, `abstract`,
`year_published`, `published_date`, `doi`, `download_url`, `publisher`, `links`, and
`source_fulltext_urls`.

Those names must remain behind a future mapper and can change or be null. No live response is claimed in
this document.

## Backend-for-frontend decision

A backend-for-frontend is **implemented for secure key-based deployment**. The Angular client calls the
same-origin `/api/core/works` route. The Node server reads `CORE_API_KEY` from its environment, validates the
query and result limit, applies a timeout, adds the bearer token, and forwards the request to CORE. The key is
never added to the Angular build.

The BFF implementation and mocked upstream behavior are automated-test verified. A successful authenticated
CORE response is **not** yet claimed because no valid key was available during verification.

## Remaining blockers

- Successful authenticated request
- Confirmed `limit` maximum
- Confirmed pagination and sorting semantics
- Confirmed live Boolean grammar
- Confirmed live result shape and missing-field behavior
- Confirmed rate-limit reset and `Retry-After` behavior

Direct-browser CORS behavior is still unverified, but it no longer blocks the selected architecture because
the browser communicates with the same-origin BFF rather than CORE directly.
