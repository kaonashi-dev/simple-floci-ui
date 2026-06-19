import { listFunctions } from '$lib/floci/lambda';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: functions, error } = await safeLoad(listFunctions, []);
	return { functions, error };
}
