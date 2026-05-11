import { describeTable, scanTable } from '$lib/server/dynamodb';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';
import type { DynamoTableDetail, DynamoScanResult } from '$lib/types/dynamodb';

export async function load({ params }) {
	const name = decodeURIComponent(params.table);
	const { data, error } = await safeLoad(
		() =>
			Promise.all([describeTable(name), scanTable(name, 50)]).then(([detail, scan]) => ({
				detail,
				scan
			})),
		{
			detail: null as DynamoTableDetail | null,
			scan: null as DynamoScanResult | null
		}
	);
	return { name, ...data, error };
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
