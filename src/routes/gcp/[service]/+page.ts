import { error } from '@sveltejs/kit';
import { getGcpService } from '$lib/floci/gcp-catalog';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const service = getGcpService(params.service);

	if (!service) {
		throw error(404, 'GCP service not found');
	}

	return { service };
};
