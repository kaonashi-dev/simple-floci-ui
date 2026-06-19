/**
 * Shared, client-safe proxy helpers.
 *
 * IMPORTANT: this module must stay pure TypeScript with NO node imports, because
 * it is imported from browser code (`settings.svelte.ts`). The node/bun-only
 * forwarding logic lives in `./server/floci-proxy.ts`.
 *
 * The same-origin proxy convention is: `${FLOCI_PROXY_PREFIX}/<encoded-target>/<path>`
 * where `<encoded-target>` is `encodeURIComponent(<full loopback origin>)`. Always
 * match/build the prefix with a single trailing slash.
 */

export const FLOCI_PROXY_PREFIX = '/__floci-proxy';

/** Loopback hostnames the proxy is allowed to forward to. Deliberately excludes `0.0.0.0`. */
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]'];

export function isLoopbackHost(hostname: string): boolean {
	return LOOPBACK_HOSTS.includes(hostname);
}

export function isLoopbackTarget(url: URL): boolean {
	return (
		(url.protocol === 'http:' || url.protocol === 'https:') && isLoopbackHost(url.hostname)
	);
}

export function parseProxyUrl(reqUrl: string): { target: URL; path: string } {
	const tail = reqUrl.slice(`${FLOCI_PROXY_PREFIX}/`.length);
	const splitAt = firstPathSplit(tail);
	const encodedTarget = splitAt === -1 ? tail : tail.slice(0, splitAt);
	const path = splitAt === -1 ? '/' : normalizeProxyPath(tail.slice(splitAt));
	return { target: new URL(decodeURIComponent(encodedTarget)), path };
}

export function firstPathSplit(value: string): number {
	const slash = value.indexOf('/');
	const query = value.indexOf('?');
	if (slash === -1) return query;
	if (query === -1) return slash;
	return Math.min(slash, query);
}

export function normalizeProxyPath(value: string): string {
	if (!value) return '/';
	return value.startsWith('?') ? `/${value}` : value;
}

export function withTrailingSlash(url: URL): URL {
	const copy = new URL(url);
	if (!copy.pathname.endsWith('/')) copy.pathname += '/';
	return copy;
}
