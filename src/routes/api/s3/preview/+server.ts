import { getObject } from '$lib/server/s3';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TEXT_TYPES = ['text/', 'application/json', 'application/xml', 'application/javascript'];

export const GET: RequestHandler = async ({ url }) => {
	const bucket = url.searchParams.get('bucket');
	const key = url.searchParams.get('key');

	if (!bucket || !key) throw error(400, 'bucket and key are required');

	const obj = await getObject(bucket, key);
	const ct = obj.contentType ?? 'application/octet-stream';
	const isText = TEXT_TYPES.some((t) => ct.startsWith(t));

	if (!isText) {
		return new Response(obj.body.buffer as ArrayBuffer, { headers: { 'Content-Type': ct } });
	}

	const text = new TextDecoder().decode(obj.body);
	return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
