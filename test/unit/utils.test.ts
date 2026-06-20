import { describe, expect, it } from 'vitest';
import { formatBytes } from '$lib/utils/formatBytes';
import { formatDate } from '$lib/utils/formatDate';
import { basename, breadcrumbs, parentPrefix } from '$lib/utils/objectKeys';

describe('utility helpers', () => {
	it('formats byte values', () => {
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(1024)).toBe('1 KB');
		expect(formatBytes(1536)).toBe('1.5 KB');
		expect(formatBytes(1024 * 1024)).toBe('1 MB');
	});

	it('formats optional dates', () => {
		expect(formatDate()).toBe('—');
		expect(formatDate('2026-06-19T12:00:00.000Z')).toEqual(expect.any(String));
	});

	it('extracts object basenames', () => {
		expect(basename('folder/file.txt')).toBe('file.txt');
		expect(basename('folder/')).toBe('folder');
		expect(basename('file.txt')).toBe('file.txt');
	});

	it('computes parent prefixes', () => {
		expect(parentPrefix('folder/sub/')).toBe('folder/');
		expect(parentPrefix('folder/sub/file.txt')).toBe('folder/sub/');
		expect(parentPrefix('folder')).toBe('');
	});

	it('builds breadcrumbs for prefixes', () => {
		expect(breadcrumbs('folder/sub/')).toEqual([
			{ label: 'folder', prefix: 'folder/' },
			{ label: 'sub', prefix: 'folder/sub/' }
		]);
		expect(breadcrumbs('')).toEqual([]);
	});
});
