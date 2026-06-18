import { describeUserPool, listUsers, listGroups } from '$lib/floci/cognito';
import { safeLoad } from '$lib/floci/load';
import type { CognitoUserPoolDetail } from '$lib/types/cognito';

export async function load({ params }) {
	const poolId = decodeURIComponent(params.poolId);
	const { data, error } = await safeLoad(
		() =>
			Promise.all([describeUserPool(poolId), listUsers(poolId), listGroups(poolId)]).then(
				([pool, users, groups]) => ({ pool: pool as CognitoUserPoolDetail | null, users, groups })
			),
		{ pool: null as CognitoUserPoolDetail | null, users: [], groups: [] }
	);
	return { ...data, poolId, error };
}
