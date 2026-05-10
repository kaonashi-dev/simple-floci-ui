import { listQueues, createQueue, deleteQueue } from '$lib/server/sqs';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { data: queues, error } = await safeLoad(listQueues, []);
	return { queues, error };
}

export const actions = {
	createQueue: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Queue name is required' });
		try {
			await createQueue(name);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},

	deleteQueue: async ({ request }) => {
		const data = await request.formData();
		const url = data.get('url') as string;
		if (!url) return fail(400, { error: 'Queue URL is required' });
		try {
			await deleteQueue(url);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
