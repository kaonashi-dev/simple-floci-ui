import { listKeys } from '$lib/floci/kms';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: keys, error } = await safeLoad(listKeys, []);
	return { keys, error };
}
