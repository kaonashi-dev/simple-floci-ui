import { getFunction } from '$lib/floci/lambda';
import { safeLoad } from '$lib/floci/load';
import type { LambdaFunctionDetail } from '$lib/types/lambda';

export async function load({ params }) {
	const name = decodeURIComponent(params.name);
	const { data: fn, error } = await safeLoad(
		() => getFunction(name),
		null as LambdaFunctionDetail | null
	);
	return { fn, name, error };
}
