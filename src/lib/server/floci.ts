import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { awsConfig } from './aws';
import type { ConnectionStatus } from '$lib/types/common';

export async function checkConnection(): Promise<ConnectionStatus> {
	const endpoint = awsConfig.endpoint;
	try {
		const client = new SQSClient(awsConfig);
		await client.send(new ListQueuesCommand({ MaxResults: 1 }));
		return { ok: true, endpoint };
	} catch (e) {
		return { ok: false, endpoint, error: String(e) };
	}
}
