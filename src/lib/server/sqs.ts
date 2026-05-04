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
import { awsConfig } from './aws';
import type { SqsQueueSummary, SqsMessage } from '$lib/types/sqs';

function client() {
	return new SQSClient(awsConfig);
}

export async function listQueues(): Promise<SqsQueueSummary[]> {
	const sqs = client();
	const urls: string[] = [];
	let nextToken: string | undefined;

	do {
		const res = await sqs.send(new ListQueuesCommand({ NextToken: nextToken }));
		if (res.QueueUrls) urls.push(...res.QueueUrls);
		nextToken = res.NextToken;
	} while (nextToken);

	const summaries = await Promise.all(
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
			} catch {
				return { name, url } satisfies SqsQueueSummary;
			}
		})
	);

	return summaries;
}

export async function getQueueUrl(name: string): Promise<string> {
	const sqs = client();
	const res = await sqs.send(new GetQueueUrlCommand({ QueueName: name }));
	return res.QueueUrl!;
}

export async function getQueueAttributes(queueUrl: string): Promise<Record<string, string>> {
	const sqs = client();
	const res = await sqs.send(
		new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ['All'] })
	);
	return res.Attributes ?? {};
}

export async function createQueue(name: string): Promise<void> {
	const sqs = client();
	await sqs.send(new CreateQueueCommand({ QueueName: name }));
}

export async function deleteQueue(queueUrl: string): Promise<void> {
	const sqs = client();
	await sqs.send(new DeleteQueueCommand({ QueueUrl: queueUrl }));
}

export async function sendMessage(queueUrl: string, body: string): Promise<void> {
	const sqs = client();
	await sqs.send(new SendMessageCommand({ QueueUrl: queueUrl, MessageBody: body }));
}

export async function receiveMessages(queueUrl: string, maxMessages = 10): Promise<SqsMessage[]> {
	const sqs = client();
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
	const sqs = client();
	await sqs.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle }));
}

export async function purgeQueue(queueUrl: string): Promise<void> {
	const sqs = client();
	await sqs.send(new PurgeQueueCommand({ QueueUrl: queueUrl }));
}
