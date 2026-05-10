import { listLogStreams, filterLogEvents } from '$lib/server/logs';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load({ params }) {
	const groupName = decodeURIComponent(params.group);
	const { data: streams, error } = await safeLoad(() => listLogStreams(groupName), []);
	return { groupName, streams, error };
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
