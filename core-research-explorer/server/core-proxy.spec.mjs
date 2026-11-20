import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { createCoreProxyServer } from './core-proxy.mjs';

const openServers = [];

afterEach(async () => {
  await Promise.all(
    openServers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))),
  );
});

async function startServer(options) {
  const server = createCoreProxyServer(options);
  openServers.push(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

describe('CORE proxy', () => {
  it('fails safely when the API key is missing', async () => {
    const baseUrl = await startServer({ apiKey: '' });
    const response = await fetch(`${baseUrl}/api/core/works?q=drone&limit=10&offset=0`);
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.code, 'CORE_API_KEY_MISSING');
  });

  it('forwards validated parameters and server-side authorization', async () => {
    let receivedUrl;
    let receivedAuthorization;
    const baseUrl = await startServer({
      apiKey: 'test-key',
      fetchImpl: async (url, options) => {
        receivedUrl = new URL(url);
        receivedAuthorization = options.headers.authorization;
        return new Response(JSON.stringify({ total_hits: 1, results: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    const query = 'drone AND (package OR delivery)';
    const response = await fetch(
      `${baseUrl}/api/core/works?q=${encodeURIComponent(query)}&limit=20&offset=0`,
    );

    assert.equal(response.status, 200);
    assert.equal(receivedUrl.searchParams.get('q'), query);
    assert.equal(receivedUrl.searchParams.get('limit'), '20');
    assert.equal(receivedUrl.searchParams.get('offset'), '0');
    assert.equal(receivedAuthorization, 'Bearer test-key');
  });

  it('rejects out-of-range result limits before contacting CORE', async () => {
    let fetchCalled = false;
    const baseUrl = await startServer({
      apiKey: 'test-key',
      fetchImpl: async () => {
        fetchCalled = true;
        return new Response('{}');
      },
    });

    const response = await fetch(`${baseUrl}/api/core/works?q=drone&limit=51&offset=0`);

    assert.equal(response.status, 400);
    assert.equal(fetchCalled, false);
  });
});
