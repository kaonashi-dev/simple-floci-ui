import {
	SQSClient,
	ListQueuesCommand,
	GetQueueAttributesCommand,
	GetQueueUrlCommand,
	CreateQueueCommand,
	DeleteQueueCommand,
	SendMessageCommand,
	ReceiveMessageCommand,
	DeleteMessageCommand,
	PurgeQueueCommand,
	QueueAttributeName
} from '@aws-sdk/client-sqs';
import { makeClient, paginateAll } from './aws';
import type { SqsQueueSummary, SqsMessage } from '$lib/types/sqs';

const sqs = makeClient(SQSClient);

export async function listQueues(): Promise<SqsQueueSummary[]> {
	const urls = await paginateAll((token) =>
		sqs.send(new ListQueuesCommand({ NextToken: token })).then((res) => ({
			items: res.QueueUrls ?? [],
			nextToken: res.NextToken
		}))
	);

	return Promise.all(
		urls.map(async (url) => {
			const name = url.split('/').pop() ?? url;
			try {
				const attrs = await sqs.send(
					new GetQueueAttributesCommand({
						QueueUrl: url,
						AttributeNames: [
							QueueAttributeName.ApproximateNumberOfMessages,
							QueueAttributeName.ApproximateNumberOfMessagesNotVisible
						]
					})
				);
				return {
					name,
					url,
					approximateNumberOfMessages: Number(
						attrs.Attributes?.ApproximateNumberOfMessages ?? 0
					),
					approximateNumberOfMessagesNotVisible: Number(
						attrs.Attributes?.ApproximateNumberOfMessagesNotVisible ?? 0
					)
				} satisfies SqsQueueSummary;
			} catch (e) {
				return { name, url, enrichmentError: String(e) } satisfies SqsQueueSummary;
			}
		})
	);
}

export async function getQueueUrl(name: string): Promise<string> {
	const res = await sqs.send(new GetQueueUrlCommand({ QueueName: name }));
	return res.QueueUrl!;
}

export async function getQueueAttributes(queueUrl: string): Promise<Record<string, string>> {
	const res = await sqs.send(
		new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ['All'] })
	);
	return res.Attributes ?? {};
}

export async function createQueue(name: string): Promise<void> {
	await sqs.send(new CreateQueueCommand({ QueueName: name }));
}

export async function deleteQueue(queueUrl: string): Promise<void> {
	await sqs.send(new DeleteQueueCommand({ QueueUrl: queueUrl }));
}

export async function sendMessage(queueUrl: string, body: string): Promise<void> {
	await sqs.send(new SendMessageCommand({ QueueUrl: queueUrl, MessageBody: body }));
}

export async function receiveMessages(queueUrl: string, maxMessages = 10): Promise<SqsMessage[]> {
	const res = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: queueUrl,
			MaxNumberOfMessages: Math.min(maxMessages, 10),
			AttributeNames: ['All'],
			MessageAttributeNames: ['All'],
			WaitTimeSeconds: 1
		})
	);
	return (res.Messages ?? []).map((m) => ({
		messageId: m.MessageId,
		body: m.Body,
		receiptHandle: m.ReceiptHandle,
		attributes: m.Attributes as Record<string, string> | undefined,
		messageAttributes: m.MessageAttributes as Record<string, unknown> | undefined
	}));
}

export async function deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
	await sqs.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle }));
}

export async function purgeQueue(queueUrl: string): Promise<void> {
	await sqs.send(new PurgeQueueCommand({ QueueUrl: queueUrl }));
}
