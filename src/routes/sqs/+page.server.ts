import { listQueues, createQueue, deleteQueue } from '$lib/server/sqs';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { data: queues, error } = await safeLoad(listQueues, []);
	return { queues, error };
}

function num(v: FormDataEntryValue | null): number | undefined {
	if (v == null || v === '') return undefined;
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

export const actions = {
	createQueue: async ({ request }) => {
		const data = await request.formData();
		let name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Queue name is required' });
		const fifo = data.get('type') === 'fifo';
		if (fifo && !name.endsWith('.fifo')) name = `${name}.fifo`;
		try {
			await createQueue(name, {
				fifo,
				visibilityTimeout: num(data.get('visibilityTimeout')),
				messageRetention: num(data.get('messageRetention')),
				delaySeconds: num(data.get('delaySeconds')),
				maxMessageSizeKb: num(data.get('maxMessageSizeKb'))
			});
			return { success: `Queue "${name}" created` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	deleteQueue: async ({ request }) => {
		const data = await request.formData();
		const url = data.get('url') as string;
		if (!url) return fail(400, { actionError: 'Queue URL is required' });
		try {
			await deleteQueue(url);
			return { success: 'Queue deleted' };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	}
};
