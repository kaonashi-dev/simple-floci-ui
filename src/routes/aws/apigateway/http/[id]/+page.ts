import { getHttpApiRoutes } from '$lib/floci/apigateway';
import { safeLoad } from '$lib/floci/load';

export async function load({ params }) {
	const id = decodeURIComponent(params.id);
	const { data: routes, error } = await safeLoad(() => getHttpApiRoutes(id), []);
	return { id, routes, error };
}
