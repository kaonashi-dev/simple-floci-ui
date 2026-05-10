import { getLogEvents } from '$lib/server/logs';

export async function load({ params }) {
	const groupName = decodeURIComponent(params.group);
	const streamName = decodeURIComponent(params.stream);
	try {
		const events = await getLogEvents(groupName, streamName);
		return { groupName, streamName, events, error: null };
	} catch (e) {
		return { groupName, streamName, events: [], error: String(e) };
	}
}
