import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bytesResponse, jsonResponse, mockFetch, textResponse } from '../../helpers/fetch';
import {
	createGcpBucket,
	deleteGcpBucket,
	deleteGcpObject,
	getGcpEndpoint,
	getGcpProject,
	getGcpObject,
	listGcpBuckets,
	listGcpObjects,
	uploadGcpObject
} from '$lib/floci/gcp';

describe('gcp REST client', () => {
	beforeEach(() => {
		vi.stubEnv('FLOCI_GCP_ENDPOINT', 'http://gcp.local:4588');
		vi.stubEnv('FLOCI_GCP_PROJECT', 'project-a');
	});

	it('resolves endpoint and project settings from env in server mode', () => {
		expect(getGcpEndpoint()).toBe('http://gcp.local:4588');
		expect(getGcpProject()).toBe('project-a');
	});

	it('lists GCP buckets from JSON', async () => {
		const fetch = mockFetch(jsonResponse({ items: [{ name: 'orders', location: 'US', timeCreated: '2026-01-01T00:00:00Z', storageClass: 'STANDARD', updated: '2026-01-02T00:00:00Z' }] }));

		await expect(listGcpBuckets()).resolves.toEqual([
			{ id: 'orders', name: 'orders', type: 'bucket', createdAt: '2026-01-01T00:00:00Z', region: 'US', metadata: { provider: 'gcp', storageService: 'cloud-storage', storageClass: 'STANDARD', updated: '2026-01-02T00:00:00Z' } }
		]);
		expect(fetch).toHaveBeenCalledWith('http://gcp.local:4588/storage/v1/b?project=project-a', {});
	});

	it('validates bucket names before creating buckets', async () => {
		const fetch = mockFetch(jsonResponse({ name: 'good-bucket' }));

		await expect(createGcpBucket('ab')).rejects.toThrow('valid GCS bucket name');
		expect(fetch).not.toHaveBeenCalled();

		await createGcpBucket('good-bucket');
		expect(fetch).toHaveBeenCalledWith(
			'http://gcp.local:4588/storage/v1/b?project=project-a',
			expect.objectContaining({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'good-bucket' }) })
		);
	});

	it('lists GCP object folders and files', async () => {
		const fetch = mockFetch(jsonResponse({
			prefixes: ['photos/2026/'],
			items: [{ name: 'photos/readme.txt', size: '12', updated: '2026-01-02T00:00:00Z', contentType: 'text/plain', storageClass: 'STANDARD', etag: 'etag' }]
		}));

		await expect(listGcpObjects('orders', 'photos/')).resolves.toEqual({
			resource: 'orders',
			prefix: 'photos/',
			folders: [{ key: 'photos/2026/', name: '2026', type: 'folder', size: null, lastModified: null, metadata: { provider: 'gcp', storageService: 'cloud-storage', prefix: 'photos/2026/' } }],
			files: [{ key: 'photos/readme.txt', name: 'readme.txt', type: 'file', size: 12, lastModified: '2026-01-02T00:00:00Z', contentType: 'text/plain', metadata: { provider: 'gcp', storageService: 'cloud-storage', storageClass: 'STANDARD', etag: 'etag' } }]
		});
		expect(fetch.mock.calls[0][0]).toBe('http://gcp.local:4588/storage/v1/b/orders/o?delimiter=%2F&prefix=photos%2F');
	});

	it('uploads, downloads, and deletes objects', async () => {
		const fetch = mockFetch(
			jsonResponse({}),
			bytesResponse(new Uint8Array([1, 2, 3]), { contentType: 'text/plain' }),
			textResponse('', { status: 404 })
		);

		await uploadGcpObject('orders', 'folder/a b.txt', new Uint8Array([9]), 'text/plain');
		await expect(getGcpObject('orders', 'folder/a b.txt')).resolves.toEqual({ body: new Uint8Array([1, 2, 3]), contentType: 'text/plain', contentLength: 3 });
		await expect(deleteGcpObject('orders', 'folder/a b.txt')).resolves.toBeUndefined();

		expect(fetch.mock.calls[0][0]).toBe('http://gcp.local:4588/upload/storage/v1/b/orders/o?uploadType=media&name=folder%2Fa%20b.txt');
		expect(fetch.mock.calls[0][1]).toEqual(expect.objectContaining({ method: 'POST', headers: { 'content-type': 'text/plain' } }));
		expect(fetch.mock.calls[2][1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
	});

	it('deletes buckets with accepted not-found responses', async () => {
		const fetch = mockFetch(textResponse('', { status: 404 }));

		await expect(deleteGcpBucket('orders')).resolves.toBeUndefined();
		expect(fetch).toHaveBeenCalledWith('http://gcp.local:4588/storage/v1/b/orders', { method: 'DELETE' });
	});

	it('surfaces HTTP and network errors with useful context', async () => {
		mockFetch(textResponse('broken', { status: 500 }), new Error('connection refused'));

		await expect(listGcpBuckets()).rejects.toThrow('GCP Storage request failed: HTTP 500 - broken');
		await expect(listGcpBuckets()).rejects.toThrow('Cannot reach Floci-GCP at http://gcp.local:4588: connection refused');
	});
});
