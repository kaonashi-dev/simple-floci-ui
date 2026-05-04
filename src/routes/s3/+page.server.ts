import { listBuckets, createBucket, deleteBucket } from '$lib/server/s3';
import { fail } from '@sveltejs/kit';

export async function load() {
	try {
		const buckets = await listBuckets();
		return { buckets, error: null };
	} catch (e) {
		return { buckets: [], error: String(e) };
	}
}

export const actions = {
	createBucket: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Bucket name is required' });
		try {
			await createBucket(name);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	},

	deleteBucket: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		if (!name) return fail(400, { error: 'Bucket name is required' });
		try {
			await deleteBucket(name);
		} catch (e) {
			return fail(500, { error: String(e) });
		}
	}
};
