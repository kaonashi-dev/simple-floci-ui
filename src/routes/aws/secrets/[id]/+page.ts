import { getSecretValue } from '$lib/floci/secrets';
import { safeLoad } from '$lib/floci/load';
import type { SecretDetail } from '$lib/types/secrets';

export async function load({ params }) {
	const arn = decodeURIComponent(params.id);
	const { data: secret, error } = await safeLoad(() => getSecretValue(arn), null as SecretDetail | null);
	return { secret, error };
}
