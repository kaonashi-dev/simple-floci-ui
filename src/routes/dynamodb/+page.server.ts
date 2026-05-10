import { listTables, deleteTable } from '$lib/server/dynamodb';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { data: tables, error } = await safeLoad(listTables, []);
	return { tables, error };
}

export const actions = {
	deleteTable: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		if (!name) return fail(400, { error: 'Table name is required' });
		try {
			await deleteTable(name);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
