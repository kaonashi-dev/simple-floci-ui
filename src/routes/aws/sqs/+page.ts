import { listQueues } from '$lib/floci/sqs';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: queues, error } = await safeLoad(listQueues, []);
	return { queues, error };
}
