import { listUserPools } from '$lib/floci/cognito';
import { getEndpoint } from '$lib/floci/aws';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: pools, error } = await safeLoad(listUserPools, []);
	return { pools, endpoint: getEndpoint(), error };
}
