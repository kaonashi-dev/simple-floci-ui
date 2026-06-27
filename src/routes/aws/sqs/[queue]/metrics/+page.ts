import { getQueueHistory, getQueueStats } from '$lib/floci/sqs-history';
import { MAX_EVENTS } from '$lib/floci/storage/memory';

export async function load({ params }) {
	const name = decodeURIComponent(params.queue);
	// Pull the full retained event log (not the 200-row default) so charts can
	// span the whole locally-recorded history.
	const events = getQueueHistory(name, MAX_EVENTS);
	const stats = getQueueStats(name);
	return { name, events, stats, isFifo: name.endsWith('.fifo') };
}
