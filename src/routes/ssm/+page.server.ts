import { listParameters, putParameter, deleteParameter } from '$lib/server/ssm';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { data: parameters, error } = await safeLoad(listParameters, []);
	return { parameters, error };
}

export const actions = {
	createParameter: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const value = (data.get('value') as string)?.trim();
		const type = (data.get('type') as string) || 'String';
		if (!name) return fail(400, { error: 'Parameter name is required' });
		if (!value) return fail(400, { error: 'Parameter value is required' });
		try {
			await putParameter(name, value, type, false);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},
	deleteParameter: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		if (!name) return fail(400, { error: 'Parameter name is required' });
		try {
			await deleteParameter(name);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
