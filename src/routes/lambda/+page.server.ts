import { listFunctions } from '$lib/server/lambda';
import { safeLoad } from '$lib/server/load';

export async function load() {
	const { data: functions, error } = await safeLoad(listFunctions, []);
	return { functions, error };
}
