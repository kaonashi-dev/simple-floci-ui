import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { Readable } from 'node:stream';
import { defineConfig, type Plugin } from 'vite';

const FLOCI_DEV_PROXY_PREFIX = '/__floci-proxy/';

export default defineConfig({
	plugins: [tailwindcss(), flociDevCorsProxy(), sveltekit()]
});

function flociDevCorsProxy(): Plugin {
	return {
		name: 'floci-dev-cors-proxy',
		configureServer(server) {
			server.middlewares.use(async (req, res, next) => {
				const reqUrl = req.url ?? '';
				if (!reqUrl.startsWith(FLOCI_DEV_PROXY_PREFIX)) return next();

				try {
					const { target, path } = parseProxyUrl(reqUrl);
					if (!isLoopbackTarget(target)) {
						res.statusCode = 403;
						res.end('Floci dev proxy only allows loopback targets');
						return;
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
						return;
					}

					res.end(Buffer.from(await upstream.arrayBuffer()));
				} catch (error) {
					res.statusCode = 502;
					res.end(error instanceof Error ? error.message : String(error));
				}
			});
		}
	};
}

function parseProxyUrl(reqUrl: string): { target: URL; path: string } {
	const tail = reqUrl.slice(FLOCI_DEV_PROXY_PREFIX.length);
	const splitAt = firstPathSplit(tail);
	const encodedTarget = splitAt === -1 ? tail : tail.slice(0, splitAt);
	const path = splitAt === -1 ? '/' : normalizeProxyPath(tail.slice(splitAt));
	return { target: new URL(decodeURIComponent(encodedTarget)), path };
}

function firstPathSplit(value: string): number {
	const slash = value.indexOf('/');
	const query = value.indexOf('?');
	if (slash === -1) return query;
	if (query === -1) return slash;
	return Math.min(slash, query);
}

function normalizeProxyPath(value: string): string {
	if (!value) return '/';
	return value.startsWith('?') ? `/${value}` : value;
}

function withTrailingSlash(url: URL): URL {
	const copy = new URL(url);
	if (!copy.pathname.endsWith('/')) copy.pathname += '/';
	return copy;
}

function isLoopbackTarget(url: URL): boolean {
	return (
		(url.protocol === 'http:' || url.protocol === 'https:') &&
		['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'].includes(url.hostname)
	);
}

function requestHeaders(headers: Record<string, string | string[] | undefined>): Headers {
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
