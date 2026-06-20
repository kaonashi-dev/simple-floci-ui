import { describe, expect, it } from 'vitest';
import {
	FLOCI_PROXY_PREFIX,
	firstPathSplit,
	isLoopbackHost,
	isLoopbackTarget,
	normalizeProxyPath,
	parseProxyUrl,
	withTrailingSlash
} from '$lib/proxy-shared';

describe('proxy shared helpers', () => {
	it('allows only explicit loopback hosts', () => {
		expect(isLoopbackHost('localhost')).toBe(true);
		expect(isLoopbackHost('127.0.0.1')).toBe(true);
		expect(isLoopbackHost('::1')).toBe(true);
		expect(isLoopbackHost('0.0.0.0')).toBe(false);
		expect(isLoopbackHost('example.com')).toBe(false);
	});

	it('allows only http or https loopback targets', () => {
		expect(isLoopbackTarget(new URL('http://localhost:4567'))).toBe(true);
		expect(isLoopbackTarget(new URL('https://127.0.0.1:4567'))).toBe(true);
		expect(isLoopbackTarget(new URL('ftp://localhost:4567'))).toBe(false);
		expect(isLoopbackTarget(new URL('https://example.com'))).toBe(false);
	});

	it('finds the first path or query split', () => {
		expect(firstPathSplit('target/path')).toBe(6);
		expect(firstPathSplit('target?x=1')).toBe(6);
		expect(firstPathSplit('target')).toBe(-1);
	});

	it('normalizes empty and query-only proxy paths', () => {
		expect(normalizeProxyPath('')).toBe('/');
		expect(normalizeProxyPath('?x=1')).toBe('/?x=1');
		expect(normalizeProxyPath('/path?x=1')).toBe('/path?x=1');
	});

	it('parses an encoded proxy URL', () => {
		const target = 'http://localhost:4567';
		const parsed = parseProxyUrl(
			`${FLOCI_PROXY_PREFIX}/${encodeURIComponent(target)}/queues?limit=1`
		);

		expect(parsed.target.href).toBe(`${target}/`);
		expect(parsed.path).toBe('/queues?limit=1');
	});

	it('parses query-only proxy tails', () => {
		const target = 'http://localhost:4567';
		const parsed = parseProxyUrl(`${FLOCI_PROXY_PREFIX}/${encodeURIComponent(target)}?health=1`);

		expect(parsed.target.href).toBe(`${target}/`);
		expect(parsed.path).toBe('/?health=1');
	});

	it('adds a trailing slash without mutating the original URL', () => {
		const original = new URL('http://localhost:4567/base');
		const next = withTrailingSlash(original);

		expect(next.href).toBe('http://localhost:4567/base/');
		expect(original.href).toBe('http://localhost:4567/base');
	});
});
