# CORE Research Explorer

Angular research discovery application backed by CORE API v3. Live requests pass through a small
server-side proxy so the CORE API key is never included in browser code.

## Prerequisites

- Node.js supported by the installed Angular CLI
- npm
- A CORE API key obtained from CORE

## Configure live CORE search

Copy `.env.example` to `.env` and replace the placeholder value:

```dotenv
CORE_API_KEY=your_real_core_api_key
```

`.env` is ignored by Git. Do not put the key in Angular environment files, frontend source, or a
committed configuration file.

## Run locally

Install dependencies, then start the Angular client and CORE proxy together:

```bash
npm install
npm start
```

Open <http://127.0.0.1:4200/>. The client sends requests to `/api/core/works`; the Angular development
proxy forwards those requests to the local server on port 3000. The server adds the CORE bearer token
and calls `https://api.core.ac.uk/v3/search/works`.

To run the processes separately:

```bash
npm run start:server
npm run start:client
```

The server health endpoint is available at <http://127.0.0.1:3000/health>. It reports whether a key is
configured without revealing the key.

## Checks

```bash
npm run lint
npm run test:all
npm run test:e2e
npm run build
```

Unit tests use fixtures and mocked upstream requests. They do not consume the live CORE quota.

## Production deployment

Deploy the Angular build and the server proxy behind the same public origin, route `/api/core/*` to the
proxy, and configure `CORE_API_KEY` in the hosting platform's secret manager. Enforce HTTPS. The local
development proxy is not a production reverse proxy.

## Current limitations

- A successful authenticated CORE response still depends on a valid account, key, quota, and current
  upstream availability.
- The application requests at most 50 records and currently supports only the first result page.
- Live Boolean grammar and the maximum supported CORE page size must still be confirmed with a
  successful authenticated request.
- The fixture in `public/core-search-fixture.json` is test data and is not presented by the running
  application as a live search result.
