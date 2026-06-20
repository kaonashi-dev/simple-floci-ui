import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { CreateSecretCommand, DeleteSecretCommand, GetSecretValueCommand, ListSecretsCommand, PutSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { createSecret, deleteSecret, getSecretValue, listSecrets, updateSecretValue } from '$lib/floci/secrets';

const secretsMock = mockClient(SecretsManagerClient);

describe('secrets service', () => {
	beforeEach(() => secretsMock.reset());

	it('lists secrets across pages', async () => {
		secretsMock
			.on(ListSecretsCommand)
			.resolvesOnce({ SecretList: [{ Name: 'a', ARN: 'arn:a', LastChangedDate: new Date('2026-01-01T00:00:00Z') }], NextToken: 'next' })
			.resolvesOnce({ SecretList: [{ Name: 'b', ARN: 'arn:b' }] });

		await expect(listSecrets()).resolves.toEqual([
			{ name: 'a', arn: 'arn:a', description: undefined, lastChangedDate: '2026-01-01T00:00:00.000Z', lastAccessedDate: undefined },
			{ name: 'b', arn: 'arn:b', description: undefined, lastChangedDate: undefined, lastAccessedDate: undefined }
		]);
	});

	it('returns secret metadata when value lookup fails', async () => {
		secretsMock.on(ListSecretsCommand).resolves({ SecretList: [{ Name: 'a', ARN: 'arn:a' }] });
		secretsMock.on(GetSecretValueCommand).rejects(new Error('denied'));

		await expect(getSecretValue('arn:a')).resolves.toEqual({ name: 'a', arn: 'arn:a' });
	});

	it('decodes binary secret values and sends mutations', async () => {
		secretsMock.on(ListSecretsCommand).resolves({ SecretList: [{ Name: 'a', ARN: 'arn:a' }] });
		secretsMock.on(GetSecretValueCommand).resolves({ SecretBinary: Uint8Array.from(Buffer.from('secret')) });
		secretsMock.on(CreateSecretCommand).resolves({});
		secretsMock.on(PutSecretValueCommand).resolves({});
		secretsMock.on(DeleteSecretCommand).resolves({});

		await expect(getSecretValue('arn:a')).resolves.toEqual({ name: 'a', arn: 'arn:a', secretValue: 'secret' });
		await createSecret('a', 'value', 'desc');
		await updateSecretValue('arn:a', 'next');
		await deleteSecret('arn:a');

		expect(secretsMock.commandCalls(CreateSecretCommand)[0].args[0].input).toEqual({ Name: 'a', SecretString: 'value', Description: 'desc' });
		expect(secretsMock.commandCalls(PutSecretValueCommand)[0].args[0].input).toEqual({ SecretId: 'arn:a', SecretString: 'next' });
		expect(secretsMock.commandCalls(DeleteSecretCommand)[0].args[0].input).toEqual({ SecretId: 'arn:a', ForceDeleteWithoutRecovery: true });
	});
});
