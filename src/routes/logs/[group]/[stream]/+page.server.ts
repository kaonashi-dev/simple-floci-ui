import { getLogEvents } from '$lib/server/logs';
import { safeLoad } from '$lib/server/load';

export async function load({ params }) {
	const groupName = decodeURIComponent(params.group);
	const streamName = decodeURIComponent(params.stream);
	const { data: events, error } = await safeLoad(() => getLogEvents(groupName, streamName), []);
	return { groupName, streamName, events, error };
}
