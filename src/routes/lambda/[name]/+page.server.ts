import { getFunction, invokeFunction } from '$lib/server/lambda';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const name = decodeURIComponent(params.name);
	try {
		const fn = await getFunction(name);
		return { fn, error: null };
	} catch (e) {
		return { fn: null, error: String(e) };
	}
}

export const actions = {
	invoke: async ({ request, params }) => {
		const name = decodeURIComponent(params.name);
		const data = await request.formData();
		const payload = (data.get('payload') as string)?.trim() || '{}';
		try {
			JSON.parse(payload);
		} catch {
			return fail(400, { actionError: 'Payload must be valid JSON', action: 'invoke' });
		}
		try {
			const result = await invokeFunction(name, payload);
			return { result, action: 'invoke' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'invoke' });
		}
	}
};
