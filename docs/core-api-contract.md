# CORE API v3 Contract Notes

## Status

- Verification date: 2026-11-21
- Official documentation: <https://api.core.ac.uk/docs/v3>
- Swagger/OpenAPI document: <https://api.core.ac.uk/swagger/v3.json>
- Live endpoint probe: `GET https://api.core.ac.uk/v3/search/works?q=drone%20AND%20(package%20OR%20delivery)&limit=1`

## Observed behavior

An earlier unauthenticated probe reached CORE but returned **HTTP 429 Too Many Requests**. On 2026-11-21,
an authenticated request through the local BFF succeeded for `drone AND (package OR delivery)` with
`limit=1` and returned one work. No credential or response content is recorded here.

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
CORE accepted `drone AND (package OR delivery)` in the successful authenticated request. This confirms
acceptance of that expression only; broader operator behavior and field semantics still require verification.

## Response wrapper

The successful live response used these camelCase wrapper fields:

- `totalHits`
- `limit`
- `offset`
- `results`
- `searchId`

The observed work used camelCase fields including `id`, `title`, `authors`, `abstract`, `yearPublished`,
`doi`, `downloadUrl`, `publisher`, `links`, and `sourceFulltextUrls`. Authors were objects containing a
`name`; links were objects containing `type` and `url`. The mapper also accepts documented legacy
snake_case variants defensively.

Those names remain behind the mapper and can change or be null.

## Backend-for-frontend decision

A backend-for-frontend is **implemented for secure key-based deployment**. The Angular client calls the
same-origin `/api/core/works` route. The Node server reads `CORE_API_KEY` from its environment, validates the
query and result limit, applies a timeout, adds the bearer token, and forwards the request to CORE. The key is
never added to the Angular build.

The BFF implementation is verified with automated tests that intercept upstream requests and with the
successful authenticated request described above.

## Remaining blockers

- Confirmed `limit` maximum
- Confirmed pagination and sorting semantics
- Confirmed behavior for Boolean expressions beyond the tested query
- Confirmed missing-field behavior across representative live results
- Confirmed rate-limit reset and `Retry-After` behavior

Direct-browser CORS behavior is still unverified, but it no longer blocks the selected architecture because
the browser communicates with the same-origin BFF rather than CORE directly.
