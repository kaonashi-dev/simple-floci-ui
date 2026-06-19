import { listRules } from '$lib/floci/eventbridge';
import { safeLoad } from '$lib/floci/load';

export async function load({ params }) {
	const busName = decodeURIComponent(params.bus);
	const { data: rules, error } = await safeLoad(() => listRules(busName), []);
	return { busName, rules, error };
}
