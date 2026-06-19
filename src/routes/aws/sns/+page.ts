import { listTopics } from '$lib/floci/sns';
import { safeLoad } from '$lib/floci/load';

export async function load() {
	const { data: topics, error } = await safeLoad(listTopics, []);
	return { topics, error };
}
