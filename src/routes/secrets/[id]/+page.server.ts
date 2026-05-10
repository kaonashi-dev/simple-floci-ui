import { getSecretValue, updateSecretValue } from '$lib/server/secrets';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const arn = decodeURIComponent(params.id);
	try {
		const secret = await getSecretValue(arn);
		return { secret, error: null };
	} catch (e) {
		return { secret: null, error: String(e) };
	}
}

export const actions = {
	updateValue: async ({ request, params }) => {
		const arn = decodeURIComponent(params.id);
		const data = await request.formData();
		const value = data.get('value') as string;
		if (!value?.trim()) return fail(400, { actionError: 'Value is required', action: 'update' });
		try {
			await updateSecretValue(arn, value);
			return { success: 'Secret value updated', action: 'update' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'update' });
		}
	}
};
