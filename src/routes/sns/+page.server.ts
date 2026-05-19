import { listTopics, createTopic, deleteTopic } from '$lib/server/sns';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { data: topics, error } = await safeLoad(listTopics, []);
	return { topics, error };
}

export const actions = {
	createTopic: async ({ request }) => {
		const data = await request.formData();
		let name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { actionError: 'Topic name is required' });
		const fifo = data.get('type') === 'fifo';
		if (fifo && !name.endsWith('.fifo')) name = `${name}.fifo`;
		try {
			await createTopic(name, { fifo });
			return { success: `Topic "${name}" created` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	deleteTopic: async ({ request }) => {
		const data = await request.formData();
		const arn = data.get('arn') as string;
		if (!arn) return fail(400, { actionError: 'Topic ARN is required' });
		try {
			await deleteTopic(arn);
			return { success: 'Topic deleted' };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	}
};
