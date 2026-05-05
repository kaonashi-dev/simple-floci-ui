import { listUserPools, createUserPool, deleteUserPool } from '$lib/server/cognito';
import { awsConfig } from '$lib/server/aws';
import { fail } from '@sveltejs/kit';

export async function load() {
	try {
		const pools = await listUserPools();
		return { pools, endpoint: awsConfig.endpoint, error: null };
	} catch (e) {
		return { pools: [], endpoint: awsConfig.endpoint, error: String(e) };
	}
}

export const actions = {
	createPool: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Pool name is required' });
		try {
			await createUserPool(name);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},

	deletePool: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Pool ID is required' });
		try {
			await deleteUserPool(id);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
