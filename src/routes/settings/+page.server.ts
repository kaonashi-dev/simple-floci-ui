import { getDbStats, resetDb } from '$lib/server/sqs-history';
import { fail } from '@sveltejs/kit';

export async function load() {
	return { db: getDbStats() };
}

export const actions = {
	resetDb: async () => {
		try {
			resetDb();
			return { success: 'Database reset successfully' };
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
