import { describeTable, scanTable } from '$lib/floci/dynamodb';
import { safeLoad } from '$lib/floci/load';
import type { DynamoTableDetail, DynamoScanResult } from '$lib/types/dynamodb';

function num(v: string | null | undefined): number | undefined {
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
			]).then(([detail, scan]) => ({ detail, scan })),
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
