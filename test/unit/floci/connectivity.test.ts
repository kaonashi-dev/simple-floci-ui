import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { ListQueuesCommand, SQSClient } from '@aws-sdk/client-sqs';
import { jsonResponse, textResponse } from '../../helpers/fetch';
import { checkConnection, checkConnections } from '$lib/floci/floci';

const sqsMock = mockClient(SQSClient);

describe('connection checks', () => {
	beforeEach(() => {
		sqsMock.reset();
		vi.stubEnv('AWS_ENDPOINT_URL', 'http://aws.local:4567');
		vi.stubEnv('FLOCI_AZURE_ENDPOINT', 'http://azure.local:4577');
		vi.stubEnv('FLOCI_GCP_ENDPOINT', 'http://gcp.local:4588');
		vi.stubEnv('FLOCI_AZURE_ACCOUNT_NAME', 'acct');
		vi.stubEnv('FLOCI_GCP_PROJECT', 'project-a');
	});

	it('reports successful AWS connections', async () => {
		sqsMock.on(ListQueuesCommand).resolves({ QueueUrls: [] });

		await expect(checkConnection()).resolves.toEqual({ ok: true, endpoint: 'http://aws.local:4567' });
		expect(sqsMock.commandCalls(ListQueuesCommand)[0].args[0].input).toEqual({ MaxResults: 1 });
	});

	it('reports failed AWS connections with endpoint context', async () => {
		sqsMock.on(ListQueuesCommand).rejects(new Error('down'));

		await expect(checkConnection()).resolves.toEqual({ ok: false, endpoint: 'http://aws.local:4567', error: 'Error: down' });
	});

	it('checks all cloud runtimes in parallel', async () => {
		sqsMock.on(ListQueuesCommand).resolves({ QueueUrls: [] });
		vi.stubGlobal(
			'fetch',
			vi.fn((input: string | URL | Request) => {
				const url = String(input);
				if (url.startsWith('http://azure.local:4577')) return Promise.resolve(textResponse('<EnumerationResults />'));
				if (url.startsWith('http://gcp.local:4588')) return Promise.resolve(jsonResponse({ items: [] }));
				return Promise.reject(new Error(`unexpected ${url}`));
			})
		);

		await expect(checkConnections()).resolves.toEqual({
			aws: { ok: true, endpoint: 'http://aws.local:4567' },
			azure: { ok: true, endpoint: 'http://azure.local:4577' },
			gcp: { ok: true, endpoint: 'http://gcp.local:4588' }
		});
	});
});
