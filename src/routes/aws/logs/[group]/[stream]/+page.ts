import { getLogEvents } from '$lib/floci/logs';
import { safeLoad } from '$lib/floci/load';

export async function load({ params }) {
	const groupName = decodeURIComponent(params.group);
	const streamName = decodeURIComponent(params.stream);
	const { data: events, error } = await safeLoad(() => getLogEvents(groupName, streamName), []);
	return { groupName, streamName, events, error };
}
