import { listQueues, createQueue, deleteQueue } from '$lib/server/sqs';
import { fail } from '@sveltejs/kit';

export async function load() {
	try {
		const queues = await listQueues();
		return { queues, error: null };
	} catch (e) {
		return { queues: [], error: String(e) };
	}
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
