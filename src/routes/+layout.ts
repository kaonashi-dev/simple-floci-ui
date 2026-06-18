import { checkConnection } from '$lib/floci/floci';

// Render and fetch entirely in the browser: the hosted UI is just static assets,
// and every Floci/AWS call must run on the developer's own machine (browser →
// their local LocalStack), never on the Railway server.
export const ssr = false;
export const prerender = false;

export async function load() {
	const connection = await checkConnection();
	return { connection };
}
