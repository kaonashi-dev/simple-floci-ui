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
		const name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Topic name is required' });
		try {
			await createTopic(name);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},

	deleteTopic: async ({ request }) => {
		const data = await request.formData();
		const arn = data.get('arn') as string;
		if (!arn) return fail(400, { error: 'Topic ARN is required' });
		try {
			await deleteTopic(arn);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
