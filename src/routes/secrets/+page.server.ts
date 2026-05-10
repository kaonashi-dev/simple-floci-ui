import { listSecrets, createSecret, deleteSecret } from '$lib/server/secrets';
import { fail } from '@sveltejs/kit';

export async function load() {
	try {
		const secrets = await listSecrets();
		return { secrets, error: null };
	} catch (e) {
		return { secrets: [], error: String(e) };
	}
}

export const actions = {
	createSecret: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const value = (data.get('value') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		if (!name) return fail(400, { error: 'Secret name is required' });
		if (!value) return fail(400, { error: 'Secret value is required' });
		try {
			await createSecret(name, value, description);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},
	deleteSecret: async ({ request }) => {
		const data = await request.formData();
		const arn = data.get('arn') as string;
		if (!arn) return fail(400, { error: 'ARN is required' });
		try {
			await deleteSecret(arn);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
