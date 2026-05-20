import { listBuckets, createBucket, deleteBucket } from '$lib/server/s3';
import { safeLoad } from '$lib/server/load';
import { fail } from '@sveltejs/kit';

export async function load() {
	const { data: buckets, error } = await safeLoad(listBuckets, []);
	return { buckets, error };
}

export const actions = {
	createBucket: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { actionError: 'Bucket name is required' });
		try {
			await createBucket(name);
			return { success: `Bucket "${name}" created` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	deleteBucket: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		if (!name) return fail(400, { actionError: 'Bucket name is required' });
		try {
			await deleteBucket(name);
			return { success: `Bucket "${name}" deleted` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	}
};
