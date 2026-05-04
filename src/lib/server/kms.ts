import {
	KMSClient,
	ListKeysCommand,
	DescribeKeyCommand,
	CreateKeyCommand,
	ScheduleKeyDeletionCommand,
	CancelKeyDeletionCommand,
	EnableKeyCommand,
	DisableKeyCommand,
	ListAliasesCommand,
	CreateAliasCommand,
	DeleteAliasCommand,
	GetKeyRotationStatusCommand,
	EnableKeyRotationCommand,
	DisableKeyRotationCommand,
	KeyUsageType,
	KeySpec
} from '@aws-sdk/client-kms';
import { awsConfig } from './aws';
import type { KmsKeySummary, KmsKeyDetail, KmsAlias } from '$lib/types/kms';

function client() {
	return new KMSClient({
		region: awsConfig.region,
		endpoint: awsConfig.endpoint,
		credentials: awsConfig.credentials
	});
}

export async function listKeys(): Promise<KmsKeySummary[]> {
	const kms = client();
	const keyIds: string[] = [];
	let marker: string | undefined;

	do {
		const res = await kms.send(new ListKeysCommand({ Limit: 100, Marker: marker }));
		for (const k of res.Keys ?? []) {
			if (k.KeyId) keyIds.push(k.KeyId);
		}
		marker = res.Truncated ? res.NextMarker : undefined;
	} while (marker);

	const aliasMap = await buildAliasMap();

	const summaries = await Promise.all(
		keyIds.map(async (keyId): Promise<KmsKeySummary> => {
			try {
				const res = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
				const m = res.KeyMetadata!;

				let rotationEnabled: boolean | undefined;
				try {
					const rot = await kms.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));
					rotationEnabled = rot.KeyRotationEnabled;
				} catch {
					// rotation status unavailable for asymmetric or pending-deletion keys
				}

				return {
					keyId: m.KeyId!,
					keyArn: m.Arn!,
					aliases: aliasMap[m.KeyId!] ?? [],
					description: m.Description,
					keyState: m.KeyState,
					keyUsage: m.KeyUsage,
					keySpec: m.KeySpec,
					creationDate: m.CreationDate?.toISOString(),
					rotationEnabled
				};
			} catch {
				return { keyId, keyArn: '', aliases: aliasMap[keyId] ?? [] };
			}
		})
	);

	return summaries;
}

export async function describeKey(keyId: string): Promise<KmsKeyDetail> {
	const kms = client();
	const [descRes, aliasMap] = await Promise.all([
		kms.send(new DescribeKeyCommand({ KeyId: keyId })),
		buildAliasMap(keyId)
	]);
	const m = descRes.KeyMetadata!;

	let rotationEnabled: boolean | undefined;
	try {
		const rot = await kms.send(new GetKeyRotationStatusCommand({ KeyId: m.KeyId! }));
		rotationEnabled = rot.KeyRotationEnabled;
	} catch {}

	return {
		keyId: m.KeyId!,
		keyArn: m.Arn!,
		aliases: aliasMap[m.KeyId!] ?? [],
		description: m.Description,
		keyState: m.KeyState,
		keyUsage: m.KeyUsage,
		keySpec: m.KeySpec,
		creationDate: m.CreationDate?.toISOString(),
		rotationEnabled,
		enabled: m.Enabled ?? false,
		deletionDate: m.DeletionDate?.toISOString(),
		validTo: m.ValidTo?.toISOString(),
		origin: m.Origin,
		multiRegion: m.MultiRegion
	};
}

async function buildAliasMap(keyId?: string): Promise<Record<string, string[]>> {
	const kms = client();
	const map: Record<string, string[]> = {};
	let marker: string | undefined;

	do {
		const res = await kms.send(
			new ListAliasesCommand({ KeyId: keyId, Limit: 100, Marker: marker })
		);
		for (const a of res.Aliases ?? []) {
			if (!a.TargetKeyId || !a.AliasName) continue;
			if (!map[a.TargetKeyId]) map[a.TargetKeyId] = [];
			map[a.TargetKeyId].push(a.AliasName);
		}
		marker = res.Truncated ? res.NextMarker : undefined;
	} while (marker);

	return map;
}

export async function listAliases(keyId?: string): Promise<KmsAlias[]> {
	const kms = client();
	const aliases: KmsAlias[] = [];
	let marker: string | undefined;

	do {
		const res = await kms.send(
			new ListAliasesCommand({ KeyId: keyId, Limit: 100, Marker: marker })
		);
		for (const a of res.Aliases ?? []) {
			if (!a.AliasName) continue;
			aliases.push({
				name: a.AliasName,
				targetKeyId: a.TargetKeyId,
				creationDate: a.CreationDate?.toISOString(),
				lastUpdatedDate: a.LastUpdatedDate?.toISOString()
			});
		}
		marker = res.Truncated ? res.NextMarker : undefined;
	} while (marker);

	return aliases;
}

export async function createKey(description?: string): Promise<string> {
	const kms = client();
	const res = await kms.send(
		new CreateKeyCommand({
			Description: description || undefined,
			KeyUsage: KeyUsageType.ENCRYPT_DECRYPT,
			KeySpec: KeySpec.SYMMETRIC_DEFAULT
		})
	);
	return res.KeyMetadata!.KeyId!;
}

export async function scheduleKeyDeletion(keyId: string, pendingWindowDays = 7): Promise<void> {
	const kms = client();
	await kms.send(
		new ScheduleKeyDeletionCommand({ KeyId: keyId, PendingWindowInDays: pendingWindowDays })
	);
}

export async function cancelKeyDeletion(keyId: string): Promise<void> {
	const kms = client();
	await kms.send(new CancelKeyDeletionCommand({ KeyId: keyId }));
}

export async function enableKey(keyId: string): Promise<void> {
	const kms = client();
	await kms.send(new EnableKeyCommand({ KeyId: keyId }));
}

export async function disableKey(keyId: string): Promise<void> {
	const kms = client();
	await kms.send(new DisableKeyCommand({ KeyId: keyId }));
}

export async function createAlias(aliasName: string, keyId: string): Promise<void> {
	const kms = client();
	const name = aliasName.startsWith('alias/') ? aliasName : `alias/${aliasName}`;
	await kms.send(new CreateAliasCommand({ AliasName: name, TargetKeyId: keyId }));
}

export async function deleteAlias(aliasName: string): Promise<void> {
	const kms = client();
	await kms.send(new DeleteAliasCommand({ AliasName: aliasName }));
}

export async function enableKeyRotation(keyId: string): Promise<void> {
	const kms = client();
	await kms.send(new EnableKeyRotationCommand({ KeyId: keyId }));
}

export async function disableKeyRotation(keyId: string): Promise<void> {
	const kms = client();
	await kms.send(new DisableKeyRotationCommand({ KeyId: keyId }));
}
