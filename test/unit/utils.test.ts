import { describe, expect, it } from 'vitest';
import { formatBytes } from '$lib/utils/formatBytes';
import { formatDate } from '$lib/utils/formatDate';
import { basename, breadcrumbs, parentPrefix } from '$lib/utils/objectKeys';
import { safePreviewContentType } from '$lib/utils/objectPreview';

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

describe('safePreviewContentType', () => {
	it('passes through inert, renderable content types', () => {
		expect(safePreviewContentType('image/png')).toBe('image/png');
		expect(safePreviewContentType('application/pdf')).toBe('application/pdf');
		expect(safePreviewContentType('text/plain')).toBe('text/plain');
		expect(safePreviewContentType('video/mp4')).toBe('video/mp4');
		expect(safePreviewContentType('audio/mpeg')).toBe('audio/mpeg');
	});

	it('neutralizes script-capable types to inert plain text', () => {
		// These would execute in this app's origin via a blob: preview navigation.
		expect(safePreviewContentType('text/html')).toBe('text/plain');
		expect(safePreviewContentType('image/svg+xml')).toBe('text/plain');
		expect(safePreviewContentType('application/xhtml+xml')).toBe('text/plain');
		expect(safePreviewContentType('application/javascript')).toBe('text/plain');
	});

	it('neutralizes unknown or missing types', () => {
		expect(safePreviewContentType(undefined)).toBe('text/plain');
		expect(safePreviewContentType(null)).toBe('text/plain');
		expect(safePreviewContentType('')).toBe('text/plain');
		expect(safePreviewContentType('application/octet-stream')).toBe('text/plain');
	});

	it('ignores charset params and casing when matching', () => {
		expect(safePreviewContentType('IMAGE/PNG')).toBe('image/png');
		expect(safePreviewContentType('text/plain; charset=utf-8')).toBe('text/plain');
		// A dangerous type with parameters is still neutralized.
		expect(safePreviewContentType('text/html; charset=utf-8')).toBe('text/plain');
	});
});
