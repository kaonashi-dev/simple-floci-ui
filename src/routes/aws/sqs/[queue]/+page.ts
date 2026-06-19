import { getQueueUrl, getQueueAttributes } from '$lib/floci/sqs';
import { safeLoad } from '$lib/floci/load';

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
