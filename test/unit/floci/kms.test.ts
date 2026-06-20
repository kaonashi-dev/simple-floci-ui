import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
	CreateAliasCommand,
	CreateKeyCommand,
	CancelKeyDeletionCommand,
	DeleteAliasCommand,
	DescribeKeyCommand,
	DisableKeyCommand,
	DisableKeyRotationCommand,
	EnableKeyCommand,
	EnableKeyRotationCommand,
	GetKeyRotationStatusCommand,
	KMSClient,
	KeyUsageType,
	ListAliasesCommand,
	ListKeysCommand,
	ScheduleKeyDeletionCommand
} from '@aws-sdk/client-kms';
import { cancelKeyDeletion, createAlias, createKey, deleteAlias, describeKey, disableKey, disableKeyRotation, enableKey, enableKeyRotation, listAliases, listKeys, scheduleKeyDeletion } from '$lib/floci/kms';

const kmsMock = mockClient(KMSClient);

describe('kms service', () => {
	beforeEach(() => {
		kmsMock.reset();
	});

	it('lists keys with aliases and tolerated rotation failures', async () => {
		kmsMock.on(ListKeysCommand).resolves({ Keys: [{ KeyId: 'key-1' }, { KeyId: 'key-2' }], Truncated: false });
		kmsMock.on(ListAliasesCommand).resolves({ Aliases: [{ AliasName: 'alias/orders', TargetKeyId: 'key-1' }] });
		kmsMock.on(DescribeKeyCommand, { KeyId: 'key-1' }).resolves({
			KeyMetadata: { KeyId: 'key-1', Arn: 'arn-1', KeyState: 'Enabled', CreationDate: new Date('2026-01-01T00:00:00Z') }
		});
		kmsMock.on(DescribeKeyCommand, { KeyId: 'key-2' }).rejects(new Error('missing'));
		kmsMock.on(GetKeyRotationStatusCommand, { KeyId: 'key-1' }).rejects(new Error('not supported'));

		await expect(listKeys()).resolves.toEqual([
			expect.objectContaining({ keyId: 'key-1', keyArn: 'arn-1', aliases: ['alias/orders'], rotationEnabled: undefined }),
			expect.objectContaining({ keyId: 'key-2', keyArn: '', aliases: [], enrichmentError: 'Error: missing' })
		]);
	});

	it('describes a key with aliases and rotation status', async () => {
		kmsMock.on(DescribeKeyCommand).resolves({
			KeyMetadata: { KeyId: 'key-1', Arn: 'arn', Enabled: true, DeletionDate: new Date('2026-02-01T00:00:00Z'), MultiRegion: false }
		});
		kmsMock.on(ListAliasesCommand).resolves({ Aliases: [{ AliasName: 'alias/orders', TargetKeyId: 'key-1' }] });
		kmsMock.on(GetKeyRotationStatusCommand).resolves({ KeyRotationEnabled: true });

		await expect(describeKey('key-1')).resolves.toEqual(
			expect.objectContaining({ keyId: 'key-1', keyArn: 'arn', aliases: ['alias/orders'], enabled: true, rotationEnabled: true, deletionDate: '2026-02-01T00:00:00.000Z' })
		);
	});

	it('lists aliases and creates aliases with a normalized prefix', async () => {
		kmsMock.on(ListAliasesCommand).resolves({ Aliases: [{ AliasName: 'alias/a', TargetKeyId: 'key-1', CreationDate: new Date('2026-01-01T00:00:00Z') }, {}] });
		await expect(listAliases()).resolves.toEqual([{ name: 'alias/a', targetKeyId: 'key-1', creationDate: '2026-01-01T00:00:00.000Z', lastUpdatedDate: undefined }]);

		kmsMock.on(CreateAliasCommand).resolves({});
		await createAlias('orders', 'key-1');
		expect(kmsMock.commandCalls(CreateAliasCommand)[0].args[0].input).toEqual({ AliasName: 'alias/orders', TargetKeyId: 'key-1' });
	});

	it('creates signing keys with RSA_2048 key spec', async () => {
		kmsMock.on(CreateKeyCommand).resolves({ KeyMetadata: { KeyId: 'key-1' } });

		await expect(createKey('signing', KeyUsageType.SIGN_VERIFY)).resolves.toBe('key-1');
		expect(kmsMock.commandCalls(CreateKeyCommand)[0].args[0].input).toEqual({ Description: 'signing', KeyUsage: KeyUsageType.SIGN_VERIFY, KeySpec: 'RSA_2048' });
	});

	it('sends key lifecycle and rotation mutations', async () => {
		kmsMock.on(ScheduleKeyDeletionCommand).resolves({});
		kmsMock.on(CancelKeyDeletionCommand).resolves({});
		kmsMock.on(EnableKeyCommand).resolves({});
		kmsMock.on(DisableKeyCommand).resolves({});
		kmsMock.on(DeleteAliasCommand).resolves({});
		kmsMock.on(EnableKeyRotationCommand).resolves({});
		kmsMock.on(DisableKeyRotationCommand).resolves({});

		await scheduleKeyDeletion('key-1', 10);
		await cancelKeyDeletion('key-1');
		await enableKey('key-1');
		await disableKey('key-1');
		await deleteAlias('alias/orders');
		await enableKeyRotation('key-1');
		await disableKeyRotation('key-1');

		expect(kmsMock.commandCalls(ScheduleKeyDeletionCommand)[0].args[0].input).toEqual({ KeyId: 'key-1', PendingWindowInDays: 10 });
		expect(kmsMock.commandCalls(CancelKeyDeletionCommand)[0].args[0].input).toEqual({ KeyId: 'key-1' });
		expect(kmsMock.commandCalls(EnableKeyCommand)[0].args[0].input).toEqual({ KeyId: 'key-1' });
		expect(kmsMock.commandCalls(DisableKeyCommand)[0].args[0].input).toEqual({ KeyId: 'key-1' });
		expect(kmsMock.commandCalls(DeleteAliasCommand)[0].args[0].input).toEqual({ AliasName: 'alias/orders' });
		expect(kmsMock.commandCalls(EnableKeyRotationCommand)[0].args[0].input).toEqual({ KeyId: 'key-1' });
		expect(kmsMock.commandCalls(DisableKeyRotationCommand)[0].args[0].input).toEqual({ KeyId: 'key-1' });
	});
});
