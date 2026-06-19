import { error } from '@sveltejs/kit';
import { getAzureService } from '$lib/floci/azure-catalog';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const service = getAzureService(params.service);

	if (!service) {
		throw error(404, 'Azure service not found');
	}

	return { service };
};
