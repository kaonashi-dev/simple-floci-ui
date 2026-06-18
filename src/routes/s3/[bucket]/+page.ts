import { listObjects, getBucketCors } from '$lib/floci/s3';
import { safeLoad } from '$lib/floci/load';

export async function load({ params, url }) {
	const bucket = decodeURIComponent(params.bucket);
	const prefix = url.searchParams.get('prefix') ?? '';
	const { data, error } = await safeLoad(
		() =>
			Promise.all([listObjects(bucket, prefix), getBucketCors(bucket)]).then(
				([listing, corsConfigured]) => ({ listing, corsConfigured })
			),
		{ listing: { bucket, prefix, folders: [], files: [] }, corsConfigured: false }
	);
	return { ...data, bucket, prefix, error };
}
