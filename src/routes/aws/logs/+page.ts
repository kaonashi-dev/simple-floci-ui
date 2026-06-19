import { listLogGroups } from '$lib/floci/logs';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: groups, error } = await safeLoad(listLogGroups, []);
	return { groups, error };
}
