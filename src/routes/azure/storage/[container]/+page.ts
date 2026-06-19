import { listAzureBlobObjects } from '$lib/floci/azure';
import { safeLoad } from '$lib/floci/load';

export async function load({ params, url }) {
	const resource = decodeURIComponent(params.container);
	const prefix = url.searchParams.get('prefix') ?? '';
	const { data: listing, error } = await safeLoad(
		() => listAzureBlobObjects(resource, prefix),
		{ resource, prefix, folders: [], files: [] }
	);
	return { listing, resource, prefix, error };
}
