import { listObjects, uploadObject, deleteObject } from '$lib/server/s3';
import { fail } from '@sveltejs/kit';

export async function load({ params, url }) {
	const bucket = decodeURIComponent(params.bucket);
	const prefix = url.searchParams.get('prefix') ?? '';

	try {
		const listing = await listObjects(bucket, prefix);
		return { listing, bucket, prefix, error: null };
	} catch (e) {
		return {
			listing: { bucket, prefix, folders: [], files: [] },
			bucket,
			prefix,
			error: String(e)
		};
	}
}

export const actions = {
	uploadObject: async ({ request, params, url }) => {
		const bucket = decodeURIComponent(params.bucket);
		const prefix = url.searchParams.get('prefix') ?? '';
		const data = await request.formData();
		const file = data.get('file') as File | null;

		if (!file || file.size === 0) return fail(400, { actionError: 'No file selected' });

		try {
			const key = prefix + file.name;
			const buffer = Buffer.from(await file.arrayBuffer());
			await uploadObject(bucket, key, buffer, file.type || undefined);
			return { success: `Uploaded ${file.name}` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	},

	deleteObject: async ({ request, params }) => {
		const bucket = decodeURIComponent(params.bucket);
		const data = await request.formData();
		const key = data.get('key') as string;
		if (!key) return fail(400, { actionError: 'Object key is required' });
		try {
			await deleteObject(bucket, key);
			return { success: `Deleted ${key}` };
		} catch (e) {
			return fail(500, { actionError: String(e) });
		}
	}
};
