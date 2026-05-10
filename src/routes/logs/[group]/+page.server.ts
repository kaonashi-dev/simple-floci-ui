import { listLogStreams, filterLogEvents } from '$lib/server/logs';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const groupName = decodeURIComponent(params.group);
	try {
		const streams = await listLogStreams(groupName);
		return { groupName, streams, error: null };
	} catch (e) {
		return { groupName, streams: [], error: String(e) };
	}
}

export const actions = {
	filter: async ({ request, params }) => {
		const groupName = decodeURIComponent(params.group);
		const data = await request.formData();
		const pattern = (data.get('pattern') as string)?.trim() || '';
		try {
			const events = await filterLogEvents(groupName, pattern);
			return { events, action: 'filter' };
		} catch (e) {
			return fail(500, { actionError: String(e), action: 'filter' });
		}
	}
};
