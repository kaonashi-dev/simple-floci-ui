import { getCallerIdentity, listUsers, listRoles, listLocalPolicies } from '$lib/floci/iam';
import { safeLoad } from '$lib/floci/load';
import type { StsIdentity } from '$lib/types/iam';

export async function load() {
	const { data, error } = await safeLoad(
		() =>
			Promise.all([getCallerIdentity(), listUsers(), listRoles(), listLocalPolicies()]).then(
				([identity, users, roles, policies]) => ({
					identity: identity as StsIdentity | null,
					users,
					roles,
					policies
				})
			),
		{
			identity: null as StsIdentity | null,
			users: [],
			roles: [],
			policies: []
		}
	);
	return { ...data, error };
}
