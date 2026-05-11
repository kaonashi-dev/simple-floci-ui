import { getUserDetail } from '$lib/server/iam';
import { safeLoad } from '$lib/server/load';
import type { IamUserDetail } from '$lib/types/iam';

export async function load({ params }) {
	const username = decodeURIComponent(params.username);
	const { data: detail, error } = await safeLoad(
		() => getUserDetail(username),
		null as IamUserDetail | null
	);
	return { username, detail, error };
}
