import { listGcpObjects } from '$lib/floci/gcp';
import { safeLoad } from '$lib/floci/load';

export async function load({ params, url }) {
	const resource = decodeURIComponent(params.bucket);
	const prefix = url.searchParams.get('prefix') ?? '';
	const { data: listing, error } = await safeLoad(
		() => listGcpObjects(resource, prefix),
		{ resource, prefix, folders: [], files: [] }
	);
	return { listing, resource, prefix, error };
}
