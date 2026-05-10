import { getHttpApiRoutes } from '$lib/server/apigateway';

export async function load({ params }) {
  const id = decodeURIComponent(params.id);
  try {
    const routes = await getHttpApiRoutes(id);
    return { id, routes, error: null };
  } catch (e) {
    return { id, routes: [], error: String(e) };
  }
}
