import { listEventBuses } from '$lib/server/eventbridge';
import { safeLoad } from '$lib/server/load';

export async function load() {
	const { data: buses, error } = await safeLoad(listEventBuses, []);
	return { buses, error };
}
