import { beforeEach, describe, expect, it, vi } from 'vitest';

const azure = vi.hoisted(() => ({ listAzureBlobObjects: vi.fn() }));
const gcp = vi.hoisted(() => ({ listGcpObjects: vi.fn() }));

vi.mock('$lib/floci/azure', () => azure);
vi.mock('$lib/floci/gcp', () => gcp);

describe('cloud storage route loads', () => {
	beforeEach(() => {
		azure.listAzureBlobObjects.mockReset().mockResolvedValue({ resource: 'container', prefix: 'a/', folders: [], files: [] });
		gcp.listGcpObjects.mockReset().mockResolvedValue({ resource: 'bucket', prefix: 'a/', folders: [], files: [] });
	});

	it('loads Azure blob object listings', async () => {
		const { load } = await import('../../../src/routes/azure/storage/[container]/+page');

		await expect(load({ params: { container: 'container' }, url: new URL('http://test/azure/storage/container?prefix=a/') } as never)).resolves.toEqual({
			listing: { resource: 'container', prefix: 'a/', folders: [], files: [] },
			resource: 'container',
			prefix: 'a/',
			error: null
		});
	});

	it('loads GCP object listings', async () => {
		const { load } = await import('../../../src/routes/gcp/storage/[bucket]/+page');

		await expect(load({ params: { bucket: 'bucket' }, url: new URL('http://test/gcp/storage/bucket?prefix=a/') } as never)).resolves.toEqual({
			listing: { resource: 'bucket', prefix: 'a/', folders: [], files: [] },
			resource: 'bucket',
			prefix: 'a/',
			error: null
		});
	});

	it('returns Azure fallback listing on failure', async () => {
		azure.listAzureBlobObjects.mockRejectedValue(new Error('down'));
		const { load } = await import('../../../src/routes/azure/storage/[container]/+page');

		await expect(load({ params: { container: 'container' }, url: new URL('http://test/azure/storage/container') } as never)).resolves.toEqual({
			listing: { resource: 'container', prefix: '', folders: [], files: [] },
			resource: 'container',
			prefix: '',
			error: 'Error: down'
		});
	});
});
