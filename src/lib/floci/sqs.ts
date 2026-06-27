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
	SetQueueAttributesCommand,
	QueueAttributeName,
	type MessageAttributeValue
} from '@aws-sdk/client-sqs';
import { makeClient, paginateAll } from './aws';
import type {
	SqsQueueSummary,
	SqsQueueMetrics,
	SqsMessage,
	SqsCreateQueueOptions,
	SqsSendOptions,
	SqsReceiveOptions,
	SqsMessageAttributeInput
} from '$lib/types/sqs';

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
							QueueAttributeName.ApproximateNumberOfMessagesNotVisible,
							QueueAttributeName.ApproximateNumberOfMessagesDelayed
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
					),
					approximateNumberOfMessagesDelayed: Number(
						attrs.Attributes?.ApproximateNumberOfMessagesDelayed ?? 0
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

/**
 * Lightweight numeric depth snapshot for live metrics polling. Fetches only the
 * three approximate-count attributes (not "All"), so it is cheap to call on an
 * interval while the metrics page is open.
 */
export async function getQueueMetrics(queueUrl: string): Promise<SqsQueueMetrics> {
	const res = await sqs.send(
		new GetQueueAttributesCommand({
			QueueUrl: queueUrl,
			AttributeNames: [
				QueueAttributeName.ApproximateNumberOfMessages,
				QueueAttributeName.ApproximateNumberOfMessagesNotVisible,
				QueueAttributeName.ApproximateNumberOfMessagesDelayed
			]
		})
	);
	const a = res.Attributes ?? {};
	return {
		visible: Number(a.ApproximateNumberOfMessages ?? 0),
		notVisible: Number(a.ApproximateNumberOfMessagesNotVisible ?? 0),
		delayed: Number(a.ApproximateNumberOfMessagesDelayed ?? 0)
	};
}

export async function getQueueAttributes(queueUrl: string): Promise<Record<string, string>> {
	const res = await sqs.send(
		new GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ['All'] })
	);
	return res.Attributes ?? {};
}

export async function createQueue(name: string, opts: SqsCreateQueueOptions = {}): Promise<void> {
	const attributes: Record<string, string> = {};
	if (opts.fifo) {
		attributes.FifoQueue = 'true';
		attributes.ContentBasedDeduplication = 'true';
	}
	if (opts.visibilityTimeout != null) attributes.VisibilityTimeout = String(opts.visibilityTimeout);
	if (opts.messageRetention != null)
		attributes.MessageRetentionPeriod = String(opts.messageRetention);
	if (opts.delaySeconds != null) attributes.DelaySeconds = String(opts.delaySeconds);
	if (opts.maxMessageSizeKb != null)
		attributes.MaximumMessageSize = String(opts.maxMessageSizeKb * 1024);

	await sqs.send(
		new CreateQueueCommand({
			QueueName: name,
			Attributes: Object.keys(attributes).length > 0 ? attributes : undefined
		})
	);
}

export async function deleteQueue(queueUrl: string): Promise<void> {
	await sqs.send(new DeleteQueueCommand({ QueueUrl: queueUrl }));
}

export async function setQueueAttributes(
	queueUrl: string,
	attributes: Record<string, string>
): Promise<void> {
	await sqs.send(new SetQueueAttributesCommand({ QueueUrl: queueUrl, Attributes: attributes }));
}

function toMessageAttributes(
	attrs?: SqsMessageAttributeInput[]
): Record<string, MessageAttributeValue> | undefined {
	if (!attrs?.length) return undefined;
	const out: Record<string, MessageAttributeValue> = {};
	for (const a of attrs) {
		if (!a.name || !a.value) continue;
		out[a.name] = { DataType: a.type ?? 'String', StringValue: a.value };
	}
	return Object.keys(out).length > 0 ? out : undefined;
}

export async function sendMessage(
	queueUrl: string,
	body: string,
	opts: SqsSendOptions = {}
): Promise<{ messageId?: string }> {
	const res = await sqs.send(
		new SendMessageCommand({
			QueueUrl: queueUrl,
			MessageBody: body,
			DelaySeconds: opts.delaySeconds,
			MessageGroupId: opts.messageGroupId,
			MessageDeduplicationId: opts.messageDeduplicationId,
			MessageAttributes: toMessageAttributes(opts.attributes)
		})
	);
	return { messageId: res.MessageId };
}

export async function receiveMessages(
	queueUrl: string,
	opts: SqsReceiveOptions = {}
): Promise<SqsMessage[]> {
	const res = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl: queueUrl,
			MaxNumberOfMessages: Math.min(opts.maxMessages ?? 10, 10),
			VisibilityTimeout: opts.visibilityTimeout,
			WaitTimeSeconds: opts.waitTimeSeconds ?? 1,
			AttributeNames: ['All'],
			MessageAttributeNames: ['All']
		})
	);
	return (res.Messages ?? []).map((m) => ({
		messageId: m.MessageId,
		body: m.Body,
		receiptHandle: m.ReceiptHandle,
		md5OfBody: m.MD5OfBody,
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
