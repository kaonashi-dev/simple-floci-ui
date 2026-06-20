import { vi } from 'vitest';

export function jsonResponse(value: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(value), {
		status: 200,
		headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
		...init
	});
}

export function textResponse(value: string, init: ResponseInit = {}): Response {
	return new Response(value, { status: 200, ...init });
}

export function bytesResponse(
	value: Uint8Array,
	init: ResponseInit & { contentType?: string } = {}
): Response {
	const { contentType, headers, ...responseInit } = init;
	const copy = new Uint8Array(value);
	return new Response(copy.buffer, {
		status: 200,
		headers: {
			'content-length': String(value.byteLength),
			...(contentType ? { 'content-type': contentType } : {}),
			...(headers ?? {})
		},
		...responseInit
	});
}

export function mockFetch(...responses: Array<Response | Error>): ReturnType<typeof vi.fn> {
	const fn = vi.fn();
	for (const response of responses) {
		if (response instanceof Error) fn.mockRejectedValueOnce(response);
		else fn.mockResolvedValueOnce(response);
	}
	vi.stubGlobal('fetch', fn);
	return fn;
}
