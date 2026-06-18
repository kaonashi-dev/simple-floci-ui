import { getTopicAttributes, listSubscriptions } from '$lib/floci/sns';
import { safeLoad } from '$lib/floci/load';

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
