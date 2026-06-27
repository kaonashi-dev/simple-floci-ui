import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { makeClient, getEndpoint } from './aws';
import { checkAzureConnection, getAzureEndpoint } from './azure';
import { checkGcpConnection, getGcpEndpoint } from './gcp';
import type { ConnectionStatus, MultiCloudConnectionStatus } from '$lib/types/common';

/**
 * Run one runtime reachability check and report it as a `ConnectionStatus`.
 * `endpoint` is captured up front so it is reported on both success and failure;
 * any thrown error is stringified into `error`.
 */
async function probe(endpoint: string, check: () => Promise<unknown>): Promise<ConnectionStatus> {
	try {
		await check();
		return { ok: true, endpoint };
	} catch (e) {
		return { ok: false, endpoint, error: String(e) };
	}
}

export function checkConnection(): Promise<ConnectionStatus> {
	return probe(getEndpoint(), () =>
		makeClient(SQSClient).send(new ListQueuesCommand({ MaxResults: 1 }))
	);
}

export async function checkConnections(): Promise<MultiCloudConnectionStatus> {
	const [aws, azure, gcp] = await Promise.all([
		checkConnection(),
		probe(getAzureEndpoint(), checkAzureConnection),
		probe(getGcpEndpoint(), checkGcpConnection)
	]);
	return { aws, azure, gcp };
}
