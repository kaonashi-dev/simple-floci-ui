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
		const value = (data.get('value') as string);
		const type = (data.get('type') as string) || 'String';
		const description = ((data.get('description') as string) || '').trim();
		if (!name) return fail(400, { actionError: 'Parameter name is required' });
		if (!value) return fail(400, { actionError: 'Parameter value is required' });
		try {
			await putParameter(name, value, type, false, description || undefined);
			return { success: `Parameter "${name}" created` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},
	deleteParameter: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		if (!name) return fail(400, { actionError: 'Parameter name is required' });
		try {
			await deleteParameter(name);
			return { success: `Parameter "${name}" deleted` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	}
};
