import { listRestApis, listHttpApis } from '$lib/floci/apigateway';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data, error } = await safeLoad(
		() =>
			Promise.all([listRestApis(), listHttpApis()]).then(([restApis, httpApis]) => ({
				restApis,
				httpApis
			})),
		{ restApis: [], httpApis: [] }
	);
	return { ...data, error };
}
