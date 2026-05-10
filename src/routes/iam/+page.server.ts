import { getCallerIdentity, listUsers, listRoles, listLocalPolicies } from '$lib/server/iam';

export async function load() {
  try {
    const [identity, users, roles, policies] = await Promise.all([
      getCallerIdentity(),
      listUsers(),
      listRoles(),
      listLocalPolicies()
    ]);
    return { identity, users, roles, policies, error: null };
  } catch (e) {
    return { identity: null, users: [], roles: [], policies: [], error: String(e) };
  }
}
