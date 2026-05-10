import {
	getQueueUrl,
	getQueueAttributes,
	sendMessage,
	receiveMessages,
	deleteMessage,
	purgeQueue
} from '$lib/server/sqs';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';
import type { SqsMessage } from '$lib/types/sqs';

export async function load({ params }) {
	const name = decodeURIComponent(params.queue);
	const { data, error } = await safeLoad(
		async () => {
			const url = await getQueueUrl(name);
			return { url, attributes: await getQueueAttributes(url) };
		},
		{ url: null as string | null, attributes: {} as Record<string, string> }
	);
	return { name, url: data.url, attributes: data.attributes, error };
}

export const actions = {
	sendMessage: async ({ request, params }) => {
		const name = decodeURIComponent(params.queue);
		const data = await request.formData();
		const body = data.get('body') as string;
		if (!body?.trim()) return fail(400, { actionError: 'Message body is required', action: 'send' });
		try {
			const url = await getQueueUrl(name);
			await sendMessage(url, body);
			return { success: 'Message sent', action: 'send' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'send' });
		}
	},

	receiveMessages: async ({ params }) => {
		const name = decodeURIComponent(params.queue);
		try {
			const url = await getQueueUrl(name);
			const messages = await receiveMessages(url);
			return { messages, action: 'receive' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'receive' });
		}
	},

	deleteMessage: async ({ request, params }) => {
		const name = decodeURIComponent(params.queue);
		const data = await request.formData();
		const receiptHandle = data.get('receiptHandle') as string;
		try {
			const url = await getQueueUrl(name);
			await deleteMessage(url, receiptHandle);
			return { success: 'Message deleted', action: 'delete' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'delete' });
		}
	},

	purgeQueue: async ({ params }) => {
		const name = decodeURIComponent(params.queue);
		try {
			const url = await getQueueUrl(name);
			await purgeQueue(url);
			return { success: 'Queue purged', action: 'purge' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'purge' });
		}
	}
};
