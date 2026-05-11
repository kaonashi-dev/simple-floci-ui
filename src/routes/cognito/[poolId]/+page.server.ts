import {
	describeUserPool,
	listUsers,
	createUser,
	updateUserAttributes,
	deleteUser,
	enableUser,
	disableUser,
	resetUserPassword,
	setUserPassword,
	listGroups,
	createGroup,
	deleteGroup
} from '$lib/server/cognito';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';
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

export const actions = {
	createUser: async ({ request, params }) => {
		const poolId = decodeURIComponent(params.poolId);
		const data = await request.formData();
		const username = (data.get('username') as string)?.trim();
		const email = (data.get('email') as string)?.trim();
		const tempPassword = (data.get('tempPassword') as string)?.trim();
		if (!username || !email || !tempPassword)
			return fail(400, { actionError: 'Username, email and password are required', action: 'user' });
		try {
			await createUser(poolId, username, email, tempPassword);
			return { success: `User ${username} created`, action: 'user' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'user' });
		}
	},

	updateUser: async ({ request, params }) => {
		const poolId = decodeURIComponent(params.poolId);
		const data = await request.formData();
		const username = data.get('username') as string;
		const email = (data.get('email') as string)?.trim();
		if (!email) return fail(400, { actionError: 'Email is required', action: 'user' });
		try {
			await updateUserAttributes(poolId, username, { email });
			return { success: `User ${username} updated`, action: 'user' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'user' });
		}
	},

	deleteUser: async ({ request, params }) => {
		const poolId = decodeURIComponent(params.poolId);
		const data = await request.formData();
		const username = data.get('username') as string;
		try {
			await deleteUser(poolId, username);
			return { success: `User ${username} deleted`, action: 'user' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'user' });
		}
	},

	enableUser: async ({ request, params }) => {
		const poolId = decodeURIComponent(params.poolId);
		const data = await request.formData();
		const username = data.get('username') as string;
		try {
			await enableUser(poolId, username);
			return { success: `User ${username} enabled`, action: 'user' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'user' });
		}
	},

	disableUser: async ({ request, params }) => {
		const poolId = decodeURIComponent(params.poolId);
		const data = await request.formData();
		const username = data.get('username') as string;
		try {
			await disableUser(poolId, username);
			return { success: `User ${username} disabled`, action: 'user' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'user' });
		}
	},

	resetPassword: async ({ request, params }) => {
		const poolId = decodeURIComponent(params.poolId);
		const data = await request.formData();
		const username = data.get('username') as string;
		try {
			await resetUserPassword(poolId, username);
			return { success: `Password reset for ${username}`, action: 'user' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'user' });
		}
	},

	setPassword: async ({ request, params }) => {
		const poolId = decodeURIComponent(params.poolId);
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = (data.get('password') as string)?.trim();
		const permanent = data.get('permanent') === 'true';
		if (!password) return fail(400, { actionError: 'Password is required', action: 'user' });
		try {
			await setUserPassword(poolId, username, password, permanent);
			return { success: `Password updated for ${username}`, action: 'user' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'user' });
		}
	},

	createGroup: async ({ request, params }) => {
		const poolId = decodeURIComponent(params.poolId);
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		if (!name) return fail(400, { actionError: 'Group name is required', action: 'group' });
		try {
			await createGroup(poolId, name, description);
			return { success: `Group ${name} created`, action: 'group' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'group' });
		}
	},

	deleteGroup: async ({ request, params }) => {
		const poolId = decodeURIComponent(params.poolId);
		const data = await request.formData();
		const name = data.get('name') as string;
		try {
			await deleteGroup(poolId, name);
			return { success: `Group ${name} deleted`, action: 'group' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'group' });
		}
	}
};
