import { getRestApiResources, getRestApiStages } from '$lib/floci/apigateway';
import { safeLoad } from '$lib/floci/load';

export async function load({ params }) {
	const id = decodeURIComponent(params.id);
	const { data, error } = await safeLoad(
		() =>
			Promise.all([getRestApiResources(id), getRestApiStages(id)]).then(([resources, stages]) => ({
				resources,
				stages
			})),
		{ resources: [], stages: [] }
	);
	return { id, ...data, error };
}
