/**
 * Server-only Floci forwarding handler (node/bun runtime).
 *
 * IMPORTANT: this module must NEVER be imported by client/browser code — it uses
 * `node:stream`. It is shared between the Vite dev middleware (`vite.config.ts`)
 * and the local production server (`server.js`).
 *
 * Behavior: forwards `${FLOCI_PROXY_PREFIX}/<encoded-target>/<path>` to a loopback
 * Floci runtime so the browser talks same-origin (no CORS). Only loopback targets
 * are allowed (403 otherwise); responses always get `access-control-allow-origin: *`,
 * hop-by-hop headers are stripped, and upstream failures yield a 502.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import {
	FLOCI_PROXY_PREFIX,
	isLoopbackTarget,
	parseProxyUrl,
	withTrailingSlash
} from '../proxy-shared';

type Next = (err?: unknown) => void;

/**
 * Connect/Vite-compatible `(req, res, next)` middleware. Returns `true` once it has
 * handled (or claimed) the request, `false` if the URL is not a proxy request so the
 * caller can fall through to its own routing. When `next` is provided (Vite), a
 * non-proxy request calls `next()` instead.
 */
export async function handleFlociProxy(
	req: IncomingMessage,
	res: ServerResponse,
	next?: Next
): Promise<boolean> {
	const reqUrl = req.url ?? '';
	if (!reqUrl.startsWith(`${FLOCI_PROXY_PREFIX}/`)) {
		next?.();
		return false;
	}

	try {
		const { target, path } = parseProxyUrl(reqUrl);
		if (!isLoopbackTarget(target)) {
			res.statusCode = 403;
			res.end('Floci proxy only allows loopback targets');
			return true;
		}

		const upstream = await fetch(new URL(path, withTrailingSlash(target)), {
			method: req.method,
			headers: requestHeaders(req.headers),
			body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req),
			duplex: 'half'
		} as RequestInit & { duplex: 'half' });

		res.statusCode = upstream.status;
		upstream.headers.forEach((value, key) => {
			if (!isHopByHopHeader(key)) res.setHeader(key, value);
		});
		res.setHeader('access-control-allow-origin', '*');

		if (!upstream.body || req.method === 'HEAD') {
			res.end();
			return true;
		}

		res.end(Buffer.from(await upstream.arrayBuffer()));
		return true;
	} catch (error) {
		res.statusCode = 502;
		res.end(error instanceof Error ? error.message : String(error));
		return true;
	}
}

function requestHeaders(headers: IncomingMessage['headers']): Headers {
	const next = new Headers();
	for (const [key, value] of Object.entries(headers)) {
		if (!value || isHopByHopHeader(key)) continue;
		if (Array.isArray(value)) {
			for (const item of value) next.append(key, item);
		} else {
			next.set(key, value);
		}
	}
	return next;
}

function isHopByHopHeader(key: string): boolean {
	return [
		'connection',
		'content-encoding',
		'content-length',
		'host',
		'keep-alive',
		'proxy-authenticate',
		'proxy-authorization',
		'te',
		'trailer',
		'transfer-encoding',
		'upgrade'
	].includes(key.toLowerCase());
}
