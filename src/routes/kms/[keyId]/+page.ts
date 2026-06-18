import { describeKey, listAliases } from '$lib/floci/kms';
import { safeLoad } from '$lib/floci/load';
import type { KmsKeyDetail, KmsAlias } from '$lib/types/kms';

export async function load({ params }) {
	const keyId = decodeURIComponent(params.keyId);
	const { data, error } = await safeLoad(
		() =>
			Promise.all([describeKey(keyId), listAliases(keyId)]).then(([key, aliases]) => ({
				key,
				aliases
			})),
		{ key: null as KmsKeyDetail | null, aliases: [] as KmsAlias[] }
	);
	return { ...data, keyId, error };
}
