import { listLogStreams } from '$lib/floci/logs';
import { safeLoad } from '$lib/floci/load';

export async function load({ params }) {
	const groupName = decodeURIComponent(params.group);
	const { data: streams, error } = await safeLoad(() => listLogStreams(groupName), []);
	return { groupName, streams, error };
}
