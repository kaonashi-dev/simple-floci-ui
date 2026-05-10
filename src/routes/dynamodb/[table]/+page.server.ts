import { describeTable, scanTable } from '$lib/server/dynamodb';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const name = decodeURIComponent(params.table);
	try {
		const [detail, scan] = await Promise.all([describeTable(name), scanTable(name, 50)]);
		return { name, detail, scan, error: null };
	} catch (e) {
		return { name, detail: null, scan: null, error: String(e) };
	}
}

export const actions = {
	loadMore: async ({ request, params }) => {
		const name = decodeURIComponent(params.table);
		const data = await request.formData();
		const lastKeyRaw = data.get('lastKey') as string;
		const lastKey = lastKeyRaw ? JSON.parse(lastKeyRaw) : undefined;
		try {
			const scan = await scanTable(name, 50, lastKey);
			return { scan, action: 'loadMore' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'loadMore' });
		}
	}
};
