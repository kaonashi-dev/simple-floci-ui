import { getParameter } from '$lib/floci/ssm';
import { safeLoad } from '$lib/floci/load';
import type { SsmParameterDetail } from '$lib/types/ssm';

export async function load({ params }) {
	const name = decodeURIComponent(params.name);
	const { data: parameter, error } = await safeLoad(
		() => getParameter(name),
		null as SsmParameterDetail | null
	);
	return { parameter, error };
}
