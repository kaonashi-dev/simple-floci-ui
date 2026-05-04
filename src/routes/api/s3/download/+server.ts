import { getObject } from '$lib/server/s3';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const bucket = url.searchParams.get('bucket');
	const key = url.searchParams.get('key');

	if (!bucket || !key) throw error(400, 'bucket and key are required');

	const obj = await getObject(bucket, key);
	const filename = key.split('/').pop() ?? 'download';

	return new Response(obj.body.buffer as ArrayBuffer, {
		headers: {
			'Content-Type': obj.contentType ?? 'application/octet-stream',
			'Content-Disposition': `attachment; filename="${filename}"`,
			...(obj.contentLength ? { 'Content-Length': String(obj.contentLength) } : {})
		}
	});
};
