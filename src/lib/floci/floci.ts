import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { makeClient, getEndpoint } from './aws';
import type { ConnectionStatus } from '$lib/types/common';

export async function checkConnection(): Promise<ConnectionStatus> {
	const endpoint = getEndpoint();
	try {
		const client = makeClient(SQSClient);
		await client.send(new ListQueuesCommand({ MaxResults: 1 }));
		return { ok: true, endpoint };
	} catch (e) {
		return { ok: false, endpoint, error: String(e) };
	}
}
