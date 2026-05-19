import { listUserPools, createUserPool, deleteUserPool } from '$lib/server/cognito';
import { awsConfig } from '$lib/server/aws';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { data: pools, error } = await safeLoad(listUserPools, []);
	return { pools, endpoint: awsConfig.endpoint, error };
}

export const actions = {
	createPool: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { actionError: 'Pool name is required' });
		try {
			await createUserPool(name);
			return { success: `User pool "${name}" created` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	deletePool: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { actionError: 'Pool ID is required' });
		try {
			await deleteUserPool(id);
			return { success: 'User pool deleted' };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	}
};
