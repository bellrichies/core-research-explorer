import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const DEFAULT_CORE_URL = 'https://api.core.ac.uk/v3/search/works';
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function parsePositiveInteger(value, defaultValue) {
  if (value === null) return defaultValue;
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

export function createCoreProxyServer({
  apiKey = process.env.CORE_API_KEY,
  coreUrl = process.env.CORE_API_URL ?? DEFAULT_CORE_URL,
  fetchImpl = globalThis.fetch,
  requestTimeoutMs = Number(process.env.CORE_REQUEST_TIMEOUT_MS ?? 10_000),
} = {}) {
  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');

    if (requestUrl.pathname === '/health') {
      sendJson(response, 200, {
        status: 'ok',
        coreConfigured: Boolean(apiKey),
      });
      return;
    }

    if (requestUrl.pathname !== '/api/core/works') {
      sendJson(response, 404, { error: 'Route not found.' });
      return;
    }

    if (request.method !== 'GET') {
      sendJson(response, 405, { error: 'Method not allowed.' }, { allow: 'GET' });
      return;
    }

    if (!apiKey) {
      sendJson(response, 503, {
        error: 'CORE live search is not configured on the server.',
        code: 'CORE_API_KEY_MISSING',
      });
      return;
    }

    const query = requestUrl.searchParams.get('q')?.trim() ?? '';
    const limit = parsePositiveInteger(requestUrl.searchParams.get('limit'), 10);
    const offset = parsePositiveInteger(requestUrl.searchParams.get('offset'), 0);

    if (!query || query.length > 500) {
      sendJson(response, 400, { error: 'Query must contain between 1 and 500 characters.' });
      return;
    }
    if (limit === null || limit < 1 || limit > 50) {
      sendJson(response, 400, { error: 'Limit must be an integer between 1 and 50.' });
      return;
    }
    if (offset !== 0) {
      sendJson(response, 400, { error: 'Only offset 0 is currently supported.' });
      return;
    }

    const upstreamUrl = new URL(coreUrl);
    upstreamUrl.searchParams.set('q', query);
    upstreamUrl.searchParams.set('offset', String(offset));
    upstreamUrl.searchParams.set('limit', String(limit));

    try {
      const upstreamResponse = await fetchImpl(upstreamUrl, {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(
          Number.isFinite(requestTimeoutMs) && requestTimeoutMs > 0 ? requestTimeoutMs : 10_000,
        ),
      });
      const body = await upstreamResponse.text();

      if (Buffer.byteLength(body) > MAX_RESPONSE_BYTES) {
        sendJson(response, 502, { error: 'CORE returned a response that was too large.' });
        return;
      }

      const retryAfter = upstreamResponse.headers.get('retry-after');
      response.writeHead(upstreamResponse.status, {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        'x-content-type-options': 'nosniff',
        ...(retryAfter ? { 'retry-after': retryAfter } : {}),
      });
      response.end(body || '{}');
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      sendJson(response, timedOut ? 504 : 502, {
        error: timedOut ? 'CORE did not respond in time.' : 'CORE could not be reached.',
      });
    }
  });
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  const port = Number(process.env.CORE_PORT ?? 3000);
  const server = createCoreProxyServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`CORE proxy listening on http://127.0.0.1:${port}`);
  });
}
