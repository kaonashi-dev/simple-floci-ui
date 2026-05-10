import { listLogGroups } from '$lib/server/logs';

export async function load() {
	try {
		const groups = await listLogGroups();
		return { groups, error: null };
	} catch (e) {
		return { groups: [], error: String(e) };
	}
}
