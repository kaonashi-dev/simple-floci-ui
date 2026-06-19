import { getQueueHistory, getQueueStats } from '$lib/floci/sqs-history';

export async function load({ params }) {
	const name = decodeURIComponent(params.queue);
	const events = getQueueHistory(name, 200);
	const stats = getQueueStats(name);
	return { name, events, stats };
}
