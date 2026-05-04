import { receiveMessages } from '$lib/server/sqs';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const queueUrl = url.searchParams.get('queueUrl');
	if (!queueUrl) throw error(400, 'queueUrl is required');

	const messages = await receiveMessages(queueUrl);
	return json(messages);
};
