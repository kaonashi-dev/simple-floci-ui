import { listGcpBuckets } from '$lib/floci/gcp';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: resources, error } = await safeLoad(listGcpBuckets, []);
	return { resources, error };
}
