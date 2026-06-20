import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { FLOCI_PROXY_PREFIX } from '$lib/proxy-shared';
import { handleFlociProxy } from '$lib/server/floci-proxy';

function proxyPath(target: string, path = '/health'): string {
	return `${FLOCI_PROXY_PREFIX}/${encodeURIComponent(target)}${path}`;
}

function req(url: string, method = 'GET', headers: IncomingMessage['headers'] = {}, body = ''): IncomingMessage {
	const stream = Readable.from(body ? [body] : []);
	return Object.assign(stream, { url, method, headers }) as IncomingMessage;
}

function res(): ServerResponse & { body: string; headers: Record<string, string> } {
	const response = {
		statusCode: 200,
		headers: {} as Record<string, string>,
		body: '',
		setHeader(key: string, value: number | string | readonly string[]) {
			this.headers[key.toLowerCase()] = Array.isArray(value) ? value.join(',') : String(value);
		},
		end(chunk?: string | Uint8Array) {
			if (chunk != null) this.body += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
		}
	};
	return response as ServerResponse & { body: string; headers: Record<string, string> };
}

describe('handleFlociProxy', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	it('falls through non-proxy requests', async () => {
		const next = vi.fn();
		const response = res();

		await expect(handleFlociProxy(req('/app'), response, next)).resolves.toBe(false);

		expect(next).toHaveBeenCalledOnce();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('rejects non-loopback targets', async () => {
		const response = res();

		await expect(handleFlociProxy(req(proxyPath('https://example.com')), response)).resolves.toBe(true);

		expect(response.statusCode).toBe(403);
		expect(response.body).toBe('Floci proxy only allows loopback targets');
	});

	it('forwards loopback requests and strips hop-by-hop response headers', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response('ok', { status: 201, headers: { 'content-type': 'text/plain', connection: 'close' } }));
		const response = res();

		await expect(handleFlociProxy(req(proxyPath('http://localhost:4567', '/v1?x=1'), 'GET', { host: 'local', authorization: 'Bearer test' }), response)).resolves.toBe(true);

		expect(fetch).toHaveBeenCalledWith(new URL('http://localhost:4567/v1?x=1'), expect.objectContaining({ method: 'GET' }));
		expect(response.statusCode).toBe(201);
		expect(response.headers['content-type']).toBe('text/plain');
		expect(response.headers.connection).toBeUndefined();
		expect(response.headers['access-control-allow-origin']).toBe('*');
		expect(response.body).toBe('ok');
	});

	it('does not write upstream bodies for HEAD requests', async () => {
		vi.mocked(fetch).mockResolvedValue(new Response('ignored', { status: 200 }));
		const response = res();

		await expect(handleFlociProxy(req(proxyPath('http://localhost:4567'), 'HEAD'), response)).resolves.toBe(true);

		expect(response.statusCode).toBe(200);
		expect(response.body).toBe('');
	});

	it('returns 502 for upstream failures', async () => {
		vi.mocked(fetch).mockRejectedValue(new Error('connection refused'));
		const response = res();

		await expect(handleFlociProxy(req(proxyPath('http://localhost:4567')), response)).resolves.toBe(true);

		expect(response.statusCode).toBe(502);
		expect(response.body).toBe('connection refused');
	});
});
