import { getSecretValue, updateSecretValue } from '$lib/server/secrets';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';
import type { SecretDetail } from '$lib/types/secrets';

export async function load({ params }) {
	const arn = decodeURIComponent(params.id);
	const { data: secret, error } = await safeLoad(
		() => getSecretValue(arn),
		null as SecretDetail | null
	);
	return { secret, error };
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
