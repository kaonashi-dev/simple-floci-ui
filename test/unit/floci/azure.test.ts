import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bytesResponse, mockFetch, textResponse } from '../../helpers/fetch';
import {
	createAzureBlobContainer,
	deleteAzureBlobContainer,
	deleteAzureBlobObject,
	getAzureAccountName,
	getAzureBlobObject,
	getAzureEndpoint,
	listAzureBlobContainers,
	listAzureBlobObjects,
	uploadAzureBlobObject
} from '$lib/floci/azure';

describe('azure REST client', () => {
	beforeEach(() => {
		vi.stubEnv('FLOCI_AZURE_ENDPOINT', 'http://azure.local:4577');
		vi.stubEnv('FLOCI_AZURE_ACCOUNT_NAME', 'acct');
	});

	it('resolves endpoint and account settings from env in server mode', () => {
		expect(getAzureEndpoint()).toBe('http://azure.local:4577');
		expect(getAzureAccountName()).toBe('acct');
	});

	it('lists blob containers from Azure XML', async () => {
		const fetch = mockFetch(
			textResponse(`
				<EnumerationResults>
					<Containers>
						<Container><Name>orders</Name><Properties><Last-Modified>Fri, 19 Jun 2026 12:00:00 GMT</Last-Modified></Properties></Container>
						<Container><Name>logs&amp;data</Name></Container>
					</Containers>
				</EnumerationResults>`)
		);

		await expect(listAzureBlobContainers()).resolves.toEqual([
			{ id: 'orders', name: 'orders', type: 'container', createdAt: 'Fri, 19 Jun 2026 12:00:00 GMT', region: null, metadata: { provider: 'azure', storageService: 'blob' } },
			{ id: 'logs&data', name: 'logs&data', type: 'container', createdAt: null, region: null, metadata: { provider: 'azure', storageService: 'blob' } }
		]);
		expect(fetch).toHaveBeenCalledWith('http://azure.local:4577/acct?comp=list', expect.objectContaining({ method: 'GET' }));
	});

	it('returns empty container and object lists on 404', async () => {
		mockFetch(textResponse('not found', { status: 404 }), textResponse('not found', { status: 404 }));

		await expect(listAzureBlobContainers()).resolves.toEqual([]);
		await expect(listAzureBlobObjects('orders', 'prefix/')).resolves.toEqual({ resource: 'orders', prefix: 'prefix/', folders: [], files: [] });
	});

	it('lists blob prefixes and files from XML', async () => {
		mockFetch(
			textResponse(`
				<EnumerationResults>
					<Blobs>
						<BlobPrefix><Name>photos/2026/</Name></BlobPrefix>
						<Blob><Name>photos/readme.txt</Name><Properties><Content-Length>12</Content-Length><Last-Modified>Fri, 19 Jun 2026 12:00:00 GMT</Last-Modified><Content-Type>text/plain</Content-Type><Etag>etag</Etag></Properties></Blob>
					</Blobs>
				</EnumerationResults>`)
		);

		await expect(listAzureBlobObjects('orders', 'photos/')).resolves.toEqual({
			resource: 'orders',
			prefix: 'photos/',
			folders: [{ key: 'photos/2026/', name: '2026', type: 'folder', size: null, lastModified: null, metadata: { provider: 'azure', storageService: 'blob', prefix: 'photos/2026/' } }],
			files: [{ key: 'photos/readme.txt', name: 'readme.txt', type: 'file', size: 12, lastModified: 'Fri, 19 Jun 2026 12:00:00 GMT', contentType: 'text/plain', metadata: { provider: 'azure', storageService: 'blob', etag: 'etag', blobType: undefined, accessTier: undefined } }]
		});
	});

	it('validates container names before creating containers', async () => {
		const fetch = mockFetch(textResponse('', { status: 201 }));

		await expect(createAzureBlobContainer('Bad_Name')).rejects.toThrow('valid Azure container name');
		expect(fetch).not.toHaveBeenCalled();

		await createAzureBlobContainer('good-name');
		expect(fetch).toHaveBeenCalledWith('http://azure.local:4577/acct/good-name?restype=container', expect.objectContaining({ method: 'PUT' }));
	});

	it('uploads, downloads, and deletes containers/blobs with encoded paths', async () => {
		const fetch = mockFetch(
			textResponse('', { status: 201 }),
			bytesResponse(new Uint8Array([1, 2, 3]), { contentType: 'text/plain' }),
			textResponse('', { status: 202 }),
			textResponse('', { status: 202 })
		);

		await uploadAzureBlobObject('orders', 'folder/a b.txt', new Uint8Array([9]), 'text/plain');
		await expect(getAzureBlobObject('orders', 'folder/a b.txt')).resolves.toEqual({ body: new Uint8Array([1, 2, 3]), contentType: 'text/plain', contentLength: 3 });
		await deleteAzureBlobObject('orders', 'folder/a b.txt');
		await deleteAzureBlobContainer('orders');

		expect(fetch.mock.calls[0][0]).toBe('http://azure.local:4577/acct/orders/folder/a%20b.txt');
		expect(fetch.mock.calls[0][1]).toEqual(expect.objectContaining({ method: 'PUT', headers: expect.objectContaining({ 'x-ms-blob-type': 'BlockBlob', 'content-type': 'text/plain' }) }));
		expect(fetch.mock.calls[2][1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
		expect(fetch.mock.calls[3][0]).toBe('http://azure.local:4577/acct/orders?restype=container');
	});

	it('surfaces HTTP and network errors with useful context', async () => {
		mockFetch(textResponse('broken', { status: 500 }), new Error('connection refused'));

		await expect(listAzureBlobContainers()).rejects.toThrow('Azure runtime request failed: HTTP 500 /acct?comp=list - broken');
		await expect(listAzureBlobContainers()).rejects.toThrow('Cannot reach Floci-AZ at http://azure.local:4577: connection refused');
	});
});
