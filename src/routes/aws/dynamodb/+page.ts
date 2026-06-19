import { listTables } from '$lib/floci/dynamodb';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: tables, error } = await safeLoad(listTables, []);
	return { tables, error };
}
