import {
	getQueueUrl,
	getQueueAttributes,
	sendMessage,
	receiveMessages,
	deleteMessage,
	purgeQueue,
	setQueueAttributes
} from '$lib/server/sqs';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';
import type { SqsMessageAttributeInput } from '$lib/types/sqs';

export async function load({ params }) {
	const name = decodeURIComponent(params.queue);
	const { data, error } = await safeLoad(
		async () => {
			const url = await getQueueUrl(name);
			return { url, attributes: await getQueueAttributes(url) };
		},
		{ url: null as string | null, attributes: {} as Record<string, string> }
	);
	return {
		name,
		url: data.url,
		attributes: data.attributes,
		isFifo: name.endsWith('.fifo'),
		error
	};
}

function num(v: FormDataEntryValue | null): number | undefined {
	if (v == null || v === '') return undefined;
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

function parseAttributes(raw: FormDataEntryValue | null): SqsMessageAttributeInput[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(String(raw));
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((a: unknown): a is SqsMessageAttributeInput =>
				typeof a === 'object' && a != null && typeof (a as { name: unknown }).name === 'string'
			)
			.map((a) => ({
				name: a.name,
				value: a.value,
				type: a.type
			}));
	} catch {
		return [];
	}
}

export const actions = {
	sendMessage: async ({ request, params }) => {
		const name = decodeURIComponent(params.queue);
		const data = await request.formData();
		const body = data.get('body') as string;
		if (!body?.trim())
			return fail(400, { actionError: 'Message body is required', action: 'send' });
		const isFifo = name.endsWith('.fifo');
		try {
			const url = await getQueueUrl(name);
			const res = await sendMessage(url, body, {
				delaySeconds: isFifo ? undefined : num(data.get('delaySeconds')),
				messageGroupId: isFifo
					? (((data.get('messageGroupId') as string) || 'default').trim())
					: undefined,
				messageDeduplicationId: isFifo
					? ((data.get('messageDeduplicationId') as string)?.trim() || undefined)
					: undefined,
				attributes: parseAttributes(data.get('attributes'))
			});
			return { success: `Message sent (${res.messageId ?? 'ok'})`, action: 'send' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'send' });
		}
	},

	receiveMessages: async ({ request, params }) => {
		const name = decodeURIComponent(params.queue);
		const data = await request.formData();
		try {
			const url = await getQueueUrl(name);
			const messages = await receiveMessages(url, {
				maxMessages: num(data.get('maxMessages')),
				visibilityTimeout: num(data.get('visibilityTimeout')),
				waitTimeSeconds: num(data.get('waitTimeSeconds'))
			});
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
	},

	updateAttributes: async ({ request, params }) => {
		const name = decodeURIComponent(params.queue);
		const data = await request.formData();
		const attrs: Record<string, string> = {};
		const visibility = data.get('VisibilityTimeout');
		const retention = data.get('MessageRetentionPeriod');
		const delay = data.get('DelaySeconds');
		if (visibility) attrs.VisibilityTimeout = String(visibility);
		if (retention) attrs.MessageRetentionPeriod = String(retention);
		if (delay) attrs.DelaySeconds = String(delay);
		if (Object.keys(attrs).length === 0)
			return fail(400, { actionError: 'No attributes provided', action: 'updateAttributes' });
		try {
			const url = await getQueueUrl(name);
			await setQueueAttributes(url, attrs);
			return { success: 'Attributes updated', action: 'updateAttributes' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'updateAttributes' });
		}
	}
};
