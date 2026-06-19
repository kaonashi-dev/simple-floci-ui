import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { makeClient, getEndpoint } from './aws';
import { checkAzureConnection, getAzureEndpoint } from './azure';
import { checkGcpConnection, getGcpEndpoint } from './gcp';
import type { ConnectionStatus, MultiCloudConnectionStatus } from '$lib/types/common';

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

async function checkAzure(): Promise<ConnectionStatus> {
	const endpoint = getAzureEndpoint();
	try {
		await checkAzureConnection();
		return { ok: true, endpoint };
	} catch (e) {
		return { ok: false, endpoint, error: String(e) };
	}
}

async function checkGcp(): Promise<ConnectionStatus> {
	const endpoint = getGcpEndpoint();
	try {
		await checkGcpConnection();
		return { ok: true, endpoint };
	} catch (e) {
		return { ok: false, endpoint, error: String(e) };
	}
}

export async function checkConnections(): Promise<MultiCloudConnectionStatus> {
	const [aws, azure, gcp] = await Promise.all([checkConnection(), checkAzure(), checkGcp()]);
	return { aws, azure, gcp };
}
