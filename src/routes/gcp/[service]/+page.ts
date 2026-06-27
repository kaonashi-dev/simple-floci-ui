import { error } from '@sveltejs/kit';
import { getService } from '$lib/catalog';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const service = getService('gcp', params.service);

	if (!service) {
		throw error(404, 'GCP service not found');
	}

	return { service };
};
