import { checkConnection } from '$lib/server/floci';

export async function load() {
	const connection = await checkConnection();
	return { connection };
}
