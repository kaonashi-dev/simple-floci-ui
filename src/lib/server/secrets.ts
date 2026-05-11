import {
	SecretsManagerClient,
	ListSecretsCommand,
	GetSecretValueCommand,
	CreateSecretCommand,
	PutSecretValueCommand,
	DeleteSecretCommand
} from '@aws-sdk/client-secrets-manager';
import { makeClient, paginateAll } from './aws';
import type { SecretSummary, SecretDetail } from '$lib/types/secrets';

const sm = makeClient(SecretsManagerClient);

export async function listSecrets(): Promise<SecretSummary[]> {
	const secrets = await paginateAll((token) =>
		sm.send(new ListSecretsCommand({ NextToken: token })).then((res) => ({
			items: res.SecretList ?? [],
			nextToken: res.NextToken
		}))
	);
	return secrets.map((s) => ({
		name: s.Name!,
		arn: s.ARN!,
		description: s.Description,
		lastChangedDate: s.LastChangedDate?.toISOString(),
		lastAccessedDate: s.LastAccessedDate?.toISOString()
	}));
}

export async function getSecretValue(arn: string): Promise<SecretDetail> {
	const list = await listSecrets();
	const meta = list.find((s) => s.arn === arn) ?? { name: arn, arn };
	try {
		const res = await sm.send(new GetSecretValueCommand({ SecretId: arn }));
		const secretValue =
			res.SecretString ?? (res.SecretBinary ? Buffer.from(res.SecretBinary).toString('utf-8') : undefined);
		return { ...meta, secretValue };
	} catch {
		return { ...meta };
	}
}

export async function createSecret(name: string, value: string, description?: string): Promise<void> {
	await sm.send(
		new CreateSecretCommand({ Name: name, SecretString: value, Description: description || undefined })
	);
}

export async function updateSecretValue(arn: string, value: string): Promise<void> {
	await sm.send(new PutSecretValueCommand({ SecretId: arn, SecretString: value }));
}

export async function deleteSecret(arn: string): Promise<void> {
	await sm.send(new DeleteSecretCommand({ SecretId: arn, ForceDeleteWithoutRecovery: true }));
}
