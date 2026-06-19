/**
 * Local production server (Bun) for the static SPA + the same-origin Floci proxy.
 *
 * Plain ESM JavaScript so it stays out of `svelte-check`. Run with: `bun server.js`.
 *
 * - Serves the adapter-static SPA from `./build`, with `--single`-style fallback:
 *   unknown non-asset routes return `build/index.html`.
 * - Delegates `${FLOCI_PROXY_PREFIX}/*` to the shared `handleFlociProxy` so the
 *   browser talks same-origin to a loopback Floci runtime (no CORS).
 * - Binds to 127.0.0.1 by default. The proxy forwards to loopback Floci, so binding
 *   0.0.0.0 would expose the user's local Floci to the LAN. Honor HOST/PORT env.
 *
 * NOTE: this is the LOCAL prod server. Railway uses bare sirv (no proxy) because the
 * hosted box cannot reach the user's localhost.
 */

import { existsSync, statSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { FLOCI_PROXY_PREFIX } from './src/lib/proxy-shared.ts';
import { handleFlociProxy } from './src/lib/server/floci-proxy.ts';

const HOST = process.env.HOST ?? '127.0.0.1';
const PORT = Number(process.env.PORT ?? 3000);
const BUILD_DIR = fileURLToPath(new URL('./build', import.meta.url));
const INDEX_HTML = join(BUILD_DIR, 'index.html');

const server = Bun.serve({
	hostname: HOST,
	port: PORT,
	async fetch(request) {
		const url = new URL(request.url);

		if (url.pathname.startsWith(`${FLOCI_PROXY_PREFIX}/`)) {
			return proxy(request, url);
		}

		// Try the requested static asset, then fall back to the SPA shell (`--single`).
		const asset = serveStatic(url.pathname);
		if (asset) return asset;
		if (existsSync(INDEX_HTML)) return new Response(Bun.file(INDEX_HTML));
		return new Response('Not found', { status: 404 });
	}
});

console.log(`Floci UI (local prod + proxy) listening on http://${server.hostname}:${server.port}`);

/**
 * Resolve a static file inside ./build, guarding against path traversal. Returns a
 * Response for a real file, or null so the caller can apply the SPA fallback.
 * @param {string} pathname
 * @returns {Response | null}
 */
function serveStatic(pathname) {
	const decoded = safeDecode(pathname);
	if (decoded === null) return null;
	const filePath = normalize(join(BUILD_DIR, decoded));
	if (filePath !== BUILD_DIR && !filePath.startsWith(BUILD_DIR + sep)) return null;
	if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;
	return new Response(Bun.file(filePath));
}

/**
 * Bridge the Web Request to the Node-style `handleFlociProxy(req, res)` and capture
 * its output as a Web Response.
 * @param {Request} request
 * @param {URL} url
 * @returns {Promise<Response>}
 */
function proxy(request, url) {
	return new Promise((resolve) => {
		const req = toNodeRequest(request, url);
		const res = createResponseCapture(resolve);
		void handleFlociProxy(req, res);
	});
}

/**
 * Adapt a Web Request into the minimal Node IncomingMessage shape the proxy reads:
 * a Readable (the body) carrying `url`, `method`, and `headers`.
 * @param {Request} request
 * @param {URL} url
 */
function toNodeRequest(request, url) {
	const body =
		request.body && request.method !== 'GET' && request.method !== 'HEAD'
			? Readable.fromWeb(request.body)
			: Readable.from([]);
	const req = /** @type {any} */ (body);
	req.url = `${url.pathname}${url.search}`;
	req.method = request.method;
	req.headers = headersToObject(request.headers);
	return req;
}

/**
 * Minimal Node ServerResponse shim that buffers status/headers/body and resolves a
 * Web Response when `end()` is called.
 * @param {(response: Response) => void} resolve
 */
function createResponseCapture(resolve) {
	const headers = new Headers();
	/** @type {Uint8Array[]} */
	const chunks = [];
	let done = false;

	const finish = () => {
		if (done) return;
		done = true;
		const status = res.statusCode || 200;
		const hasBody = chunks.length > 0 && status !== 204 && status !== 304;
		resolve(new Response(hasBody ? Buffer.concat(chunks) : null, { status, headers }));
	};

	const res = {
		statusCode: 200,
		/** @param {string} key @param {string} value */
		setHeader(key, value) {
			headers.set(key, value);
		},
		/** @param {Uint8Array | string} [chunk] */
		write(chunk) {
			if (chunk != null) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
			return true;
		},
		/** @param {Uint8Array | string} [chunk] */
		end(chunk) {
			if (chunk != null) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
			finish();
		}
	};
	return res;
}

/** @param {Headers} headers @returns {Record<string, string>} */
function headersToObject(headers) {
	/** @type {Record<string, string>} */
	const out = {};
	headers.forEach((value, key) => {
		out[key] = value;
	});
	return out;
}

/** @param {string} value @returns {string | null} */
function safeDecode(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		return null;
	}
}
