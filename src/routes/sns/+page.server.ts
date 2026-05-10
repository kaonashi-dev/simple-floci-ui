import { listTopics, createTopic, deleteTopic } from '$lib/server/sns';
import { fail } from '@sveltejs/kit';

export async function load() {
	try {
		const topics = await listTopics();
		return { topics, error: null };
	} catch (e) {
		return { topics: [], error: String(e) };
	}
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
