import { listEventBuses } from '$lib/floci/eventbridge';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: buses, error } = await safeLoad(listEventBuses, []);
	return { buses, error };
}
