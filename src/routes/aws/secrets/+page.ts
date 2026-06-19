import { listSecrets } from '$lib/floci/secrets';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: secrets, error } = await safeLoad(listSecrets, []);
	return { secrets, error };
}
