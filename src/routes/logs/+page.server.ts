import { listLogGroups } from '$lib/server/logs';
import { safeLoad } from '$lib/server/load';

export async function load() {
	const { data: groups, error } = await safeLoad(listLogGroups, []);
	return { groups, error };
}
