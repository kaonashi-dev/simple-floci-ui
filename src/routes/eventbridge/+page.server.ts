import { listEventBuses } from '$lib/server/eventbridge';

export async function load() {
	try {
		const buses = await listEventBuses();
		return { buses, error: null };
	} catch (e) {
		return { buses: [], error: String(e) };
	}
}
