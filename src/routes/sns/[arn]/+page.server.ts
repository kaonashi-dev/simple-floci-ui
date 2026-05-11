import { getTopicAttributes, listSubscriptions, publish } from '$lib/server/sns';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const arn = decodeURIComponent(params.arn);
	const { data, error } = await safeLoad(
		() =>
			Promise.all([getTopicAttributes(arn), listSubscriptions(arn)]).then(
				([attributes, subscriptions]) => ({ attributes, subscriptions })
			),
		{ attributes: {} as Record<string, string>, subscriptions: [] }
	);
	return { arn, ...data, error };
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
