import { listBuckets } from '$lib/floci/s3';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: buckets, error } = await safeLoad(listBuckets, []);
	return { buckets, error };
}
