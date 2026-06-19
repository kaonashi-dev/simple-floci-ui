import { listParameters } from '$lib/floci/ssm';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: parameters, error } = await safeLoad(listParameters, []);
	return { parameters, error };
}
