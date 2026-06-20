import { beforeEach, describe, expect, it, vi } from 'vitest';

const s3 = vi.hoisted(() => ({ listObjects: vi.fn(), getBucketCors: vi.fn() }));

vi.mock('$lib/floci/s3', () => s3);

describe('S3 bucket load', () => {
	beforeEach(() => {
		s3.listObjects.mockReset().mockResolvedValue({ bucket: 'bucket', prefix: 'photos/', folders: [], files: [] });
		s3.getBucketCors.mockReset().mockResolvedValue(true);
	});

	it('loads bucket listing and CORS state', async () => {
		const { load } = await import('../../../src/routes/aws/s3/[bucket]/+page');

		await expect(load({ params: { bucket: encodeURIComponent('bucket') }, url: new URL('http://test/aws/s3/bucket?prefix=photos/') } as never)).resolves.toEqual({
			listing: { bucket: 'bucket', prefix: 'photos/', folders: [], files: [] },
			corsConfigured: true,
			bucket: 'bucket',
			prefix: 'photos/',
			error: null
		});
	});

	it('returns an empty listing fallback on failure', async () => {
		s3.listObjects.mockRejectedValue(new Error('down'));
		const { load } = await import('../../../src/routes/aws/s3/[bucket]/+page');

		await expect(load({ params: { bucket: 'bucket' }, url: new URL('http://test/aws/s3/bucket') } as never)).resolves.toEqual({
			listing: { bucket: 'bucket', prefix: '', folders: [], files: [] },
			corsConfigured: false,
			bucket: 'bucket',
			prefix: '',
			error: 'Error: down'
		});
	});
});
