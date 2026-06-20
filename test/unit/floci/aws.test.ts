import { describe, expect, it, vi } from 'vitest';
import { awsConfig, awsConfigNoPathStyle, getEndpoint, makeClient, paginateAll } from '$lib/floci/aws';

describe('aws helpers', () => {
	it('collects all pages until the fetcher stops returning a next token', async () => {
		const result = await paginateAll(async (token?: string) => {
			if (!token) return { items: ['a'], nextToken: 'page-2' };
			if (token === 'page-2') return { items: ['b', 'c'], nextToken: 'page-3' };
			return { items: ['d'] };
		});

		expect(result).toEqual(['a', 'b', 'c', 'd']);
	});

	it('propagates pagination errors', async () => {
		await expect(
			paginateAll(async () => {
				throw new Error('boom');
			})
		).rejects.toThrow('boom');
	});

	it('constructs clients with the provided config', () => {
		class Client {
			constructor(readonly cfg: object) {}
		}

		const cfg = { endpoint: 'http://localhost:4567' };
		const client = makeClient(Client, cfg);

		expect(client.cfg).toBe(cfg);
	});

	it('resolves endpoint, region, and credentials from env in server mode', async () => {
		vi.stubEnv('AWS_ENDPOINT_URL', 'http://localhost:4567/base');
		vi.stubEnv('AWS_REGION', 'us-west-2');
		vi.stubEnv('AWS_ACCESS_KEY_ID', 'akid');
		vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'secret');

		await expect(awsConfig.region()).resolves.toBe('us-west-2');
		await expect(awsConfig.credentials()).resolves.toEqual({ accessKeyId: 'akid', secretAccessKey: 'secret' });
		await expect(awsConfig.endpoint()).resolves.toEqual({ protocol: 'http:', hostname: 'localhost', port: 4567, path: '/base' });
		expect(getEndpoint()).toBe('http://localhost:4567/base');
		expect(awsConfig.forcePathStyle).toBe(true);
		expect('forcePathStyle' in awsConfigNoPathStyle).toBe(false);
	});
});
