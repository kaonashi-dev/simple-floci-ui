import { error } from '@sveltejs/kit';
import { getService } from '$lib/catalog';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const service = getService('azure', params.service);

	if (!service) {
		throw error(404, 'Azure service not found');
	}

	return { service };
};
