import { getHttpApiRoutes } from '$lib/server/apigateway';
import { safeLoad } from '$lib/server/load';

export async function load({ params }) {
	const id = decodeURIComponent(params.id);
	const { data: routes, error } = await safeLoad(() => getHttpApiRoutes(id), []);
	return { id, routes, error };
}
