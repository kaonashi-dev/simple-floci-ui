import { getParameter, putParameter } from '$lib/server/ssm';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const name = decodeURIComponent(params.name);
	try {
		const parameter = await getParameter(name);
		return { parameter, error: null };
	} catch (e) {
		return { parameter: null, error: String(e) };
	}
}

export const actions = {
	updateValue: async ({ request, params }) => {
		const name = decodeURIComponent(params.name);
		const data = await request.formData();
		const value = data.get('value') as string;
		const type = (data.get('type') as string) || 'String';
		if (!value?.trim()) return fail(400, { actionError: 'Value is required', action: 'update' });
		try {
			await putParameter(name, value, type, true);
			return { success: 'Parameter updated', action: 'update' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'update' });
		}
	}
};
