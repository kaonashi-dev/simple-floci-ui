import { listAzureBlobContainers } from '$lib/floci/azure';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: resources, error } = await safeLoad(listAzureBlobContainers, []);
	return { resources, error };
}
