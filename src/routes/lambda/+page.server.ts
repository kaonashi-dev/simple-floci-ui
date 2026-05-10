import { listFunctions } from '$lib/server/lambda';

export async function load() {
	try {
		const functions = await listFunctions();
		return { functions, error: null };
	} catch (e) {
		return { functions: [], error: String(e) };
	}
}
