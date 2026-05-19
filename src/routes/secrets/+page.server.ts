import { listSecrets, createSecret, deleteSecret } from '$lib/server/secrets';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { data: secrets, error } = await safeLoad(listSecrets, []);
	return { secrets, error };
}

export const actions = {
	createSecret: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const value = (data.get('value') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		if (!name) return fail(400, { actionError: 'Secret name is required' });
		if (!value) return fail(400, { actionError: 'Secret value is required' });
		try {
			await createSecret(name, value, description);
			return { success: `Secret "${name}" created` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},
	deleteSecret: async ({ request }) => {
		const data = await request.formData();
		const arn = data.get('arn') as string;
		if (!arn) return fail(400, { actionError: 'ARN is required' });
		try {
			await deleteSecret(arn);
			return { success: 'Secret deleted' };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	}
};
