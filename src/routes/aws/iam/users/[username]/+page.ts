import { getUserDetail } from '$lib/floci/iam';
import { safeLoad } from '$lib/floci/load';
import type { IamUserDetail } from '$lib/types/iam';

export async function load({ params }) {
	const username = decodeURIComponent(params.username);
	const { data: detail, error } = await safeLoad(
		() => getUserDetail(username),
		null as IamUserDetail | null
	);
	return { username, detail, error };
}
