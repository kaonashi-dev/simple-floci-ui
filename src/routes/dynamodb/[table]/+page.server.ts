import { describeTable, scanTable } from '$lib/server/dynamodb';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';
import type { DynamoTableDetail, DynamoScanResult } from '$lib/types/dynamodb';

function num(v: FormDataEntryValue | null | undefined): number | undefined {
	if (v == null || v === '') return undefined;
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

export async function load({ params, url }) {
	const name = decodeURIComponent(params.table);
	const limit = num(url.searchParams.get('limit')) ?? 50;
	const indexName = url.searchParams.get('index') || undefined;
	const filterAttr = url.searchParams.get('fa') || undefined;
	const filterValue = url.searchParams.get('fv') || undefined;

	const { data, error } = await safeLoad(
		() =>
			Promise.all([
				describeTable(name),
				scanTable(name, {
					limit,
					indexName,
					filter: filterAttr && filterValue ? { attribute: filterAttr, value: filterValue } : undefined
				})
			]).then(([detail, scan]) => ({
				detail,
				scan
			})),
		{
			detail: null as DynamoTableDetail | null,
			scan: null as DynamoScanResult | null
		}
	);
	return {
		name,
		limit,
		indexName,
		filterAttr,
		filterValue,
		...data,
		error
	};
}

export const actions = {
	loadMore: async ({ request, params }) => {
		const name = decodeURIComponent(params.table);
		const data = await request.formData();
		const lastKeyRaw = data.get('lastKey') as string;
		const lastKey = lastKeyRaw ? JSON.parse(lastKeyRaw) : undefined;
		const limit = num(data.get('limit')) ?? 50;
		const indexName = (data.get('index') as string) || undefined;
		const fa = (data.get('fa') as string) || undefined;
		const fv = (data.get('fv') as string) || undefined;
		try {
			const scan = await scanTable(name, {
				limit,
				indexName,
				lastKey,
				filter: fa && fv ? { attribute: fa, value: fv } : undefined
			});
			return { scan, action: 'loadMore' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'loadMore' });
		}
	}
};
