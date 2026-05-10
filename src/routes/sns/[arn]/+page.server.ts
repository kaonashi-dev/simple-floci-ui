import { getTopicAttributes, listSubscriptions, publish } from '$lib/server/sns';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const arn = decodeURIComponent(params.arn);
	try {
		const [attributes, subscriptions] = await Promise.all([
			getTopicAttributes(arn),
			listSubscriptions(arn)
		]);
		return { arn, attributes, subscriptions, error: null };
	} catch (e) {
		return { arn, attributes: {}, subscriptions: [], error: String(e) };
	}
}

export const actions = {
	publish: async ({ request, params }) => {
		const arn = decodeURIComponent(params.arn);
		const data = await request.formData();
		const message = (data.get('message') as string)?.trim();
		const subject = (data.get('subject') as string)?.trim() || undefined;
		if (!message) return fail(400, { actionError: 'Message is required', action: 'publish' });
		try {
			await publish(arn, message, subject);
			return { success: 'Message published', action: 'publish' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'publish' });
		}
	}
};
