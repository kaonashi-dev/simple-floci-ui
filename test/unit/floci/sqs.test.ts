import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
	CreateQueueCommand,
	DeleteMessageCommand,
	DeleteQueueCommand,
	GetQueueAttributesCommand,
	GetQueueUrlCommand,
	ListQueuesCommand,
	PurgeQueueCommand,
	ReceiveMessageCommand,
	SetQueueAttributesCommand,
	SendMessageCommand,
	SQSClient
} from '@aws-sdk/client-sqs';
import { createQueue, deleteMessage, deleteQueue, getQueueAttributes, getQueueUrl, listQueues, purgeQueue, receiveMessages, sendMessage, setQueueAttributes } from '$lib/floci/sqs';

const sqsMock = mockClient(SQSClient);

describe('sqs service', () => {
	beforeEach(() => {
		sqsMock.reset();
	});

	it('lists queues across pages and keeps enrichment failures local to each queue', async () => {
		sqsMock
			.on(ListQueuesCommand)
			.resolvesOnce({ QueueUrls: ['http://localhost/000/orders', 'http://localhost/000/bad'], NextToken: 'next' })
			.resolvesOnce({ QueueUrls: ['http://localhost/000/fifo.fifo'] });
		sqsMock
			.on(GetQueueAttributesCommand, { QueueUrl: 'http://localhost/000/orders' })
			.resolves({
				Attributes: {
					ApproximateNumberOfMessages: '3',
					ApproximateNumberOfMessagesNotVisible: '1',
					ApproximateNumberOfMessagesDelayed: '2'
				}
			});
		sqsMock.on(GetQueueAttributesCommand, { QueueUrl: 'http://localhost/000/bad' }).rejects(new Error('denied'));
		sqsMock.on(GetQueueAttributesCommand, { QueueUrl: 'http://localhost/000/fifo.fifo' }).resolves({});

		const queues = await listQueues();

		expect(queues).toEqual([
			{
				name: 'orders',
				url: 'http://localhost/000/orders',
				approximateNumberOfMessages: 3,
				approximateNumberOfMessagesNotVisible: 1,
				approximateNumberOfMessagesDelayed: 2
			},
			expect.objectContaining({ name: 'bad', enrichmentError: 'Error: denied' }),
			expect.objectContaining({ name: 'fifo.fifo', approximateNumberOfMessages: 0 })
		]);
		expect(sqsMock.commandCalls(ListQueuesCommand).map((call) => call.args[0].input)).toEqual([
			{ NextToken: undefined },
			{ NextToken: 'next' }
		]);
	});

	it('maps queue creation options to SQS attributes', async () => {
		sqsMock.on(CreateQueueCommand).resolves({});

		await createQueue('orders.fifo', {
			fifo: true,
			visibilityTimeout: 30,
			messageRetention: 120,
			delaySeconds: 5,
			maxMessageSizeKb: 64
		});

		expect(sqsMock.commandCalls(CreateQueueCommand)[0].args[0].input).toEqual({
			QueueName: 'orders.fifo',
			Attributes: {
				FifoQueue: 'true',
				ContentBasedDeduplication: 'true',
				VisibilityTimeout: '30',
				MessageRetentionPeriod: '120',
				DelaySeconds: '5',
				MaximumMessageSize: String(64 * 1024)
			}
		});
	});

	it('gets queue metadata and sends queue/message mutations', async () => {
		sqsMock.on(GetQueueUrlCommand).resolves({ QueueUrl: 'queue-url' });
		sqsMock.on(GetQueueAttributesCommand).resolves({ Attributes: { VisibilityTimeout: '30' } });
		sqsMock.on(DeleteQueueCommand).resolves({});
		sqsMock.on(SetQueueAttributesCommand).resolves({});
		sqsMock.on(DeleteMessageCommand).resolves({});
		sqsMock.on(PurgeQueueCommand).resolves({});

		await expect(getQueueUrl('orders')).resolves.toBe('queue-url');
		await expect(getQueueAttributes('queue-url')).resolves.toEqual({ VisibilityTimeout: '30' });
		await deleteQueue('queue-url');
		await setQueueAttributes('queue-url', { VisibilityTimeout: '60' });
		await deleteMessage('queue-url', 'receipt');
		await purgeQueue('queue-url');

		expect(sqsMock.commandCalls(GetQueueUrlCommand)[0].args[0].input).toEqual({ QueueName: 'orders' });
		expect(sqsMock.commandCalls(GetQueueAttributesCommand)[0].args[0].input).toEqual({ QueueUrl: 'queue-url', AttributeNames: ['All'] });
		expect(sqsMock.commandCalls(DeleteQueueCommand)[0].args[0].input).toEqual({ QueueUrl: 'queue-url' });
		expect(sqsMock.commandCalls(SetQueueAttributesCommand)[0].args[0].input).toEqual({ QueueUrl: 'queue-url', Attributes: { VisibilityTimeout: '60' } });
		expect(sqsMock.commandCalls(DeleteMessageCommand)[0].args[0].input).toEqual({ QueueUrl: 'queue-url', ReceiptHandle: 'receipt' });
		expect(sqsMock.commandCalls(PurgeQueueCommand)[0].args[0].input).toEqual({ QueueUrl: 'queue-url' });
	});

	it('sends only valid message attributes', async () => {
		sqsMock.on(SendMessageCommand).resolves({ MessageId: 'msg-1' });

		await expect(
			sendMessage('queue-url', 'body', {
				delaySeconds: 3,
				messageGroupId: 'group-1',
				messageDeduplicationId: 'dedup-1',
				attributes: [
					{ name: 'kind', value: 'order', type: 'String' },
					{ name: '', value: 'ignored', type: 'String' },
					{ name: 'empty', value: '', type: 'String' }
				]
			})
		).resolves.toEqual({ messageId: 'msg-1' });

		expect(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input).toEqual({
			QueueUrl: 'queue-url',
			MessageBody: 'body',
			DelaySeconds: 3,
			MessageGroupId: 'group-1',
			MessageDeduplicationId: 'dedup-1',
			MessageAttributes: { kind: { DataType: 'String', StringValue: 'order' } }
		});
	});

	it('caps receive count and maps messages', async () => {
		sqsMock.on(ReceiveMessageCommand).resolves({
			Messages: [
				{
					MessageId: 'msg-1',
					Body: 'body',
					ReceiptHandle: 'receipt',
					MD5OfBody: 'md5',
					Attributes: { SentTimestamp: '1' },
					MessageAttributes: { kind: { DataType: 'String', StringValue: 'order' } }
				}
			]
		});

		const messages = await receiveMessages('queue-url', { maxMessages: 99, visibilityTimeout: 10 });

		expect(sqsMock.commandCalls(ReceiveMessageCommand)[0].args[0].input).toEqual({
			QueueUrl: 'queue-url',
			MaxNumberOfMessages: 10,
			VisibilityTimeout: 10,
			WaitTimeSeconds: 1,
			AttributeNames: ['All'],
			MessageAttributeNames: ['All']
		});
		expect(messages).toEqual([
			{
				messageId: 'msg-1',
				body: 'body',
				receiptHandle: 'receipt',
				md5OfBody: 'md5',
				attributes: { SentTimestamp: '1' },
				messageAttributes: { kind: { DataType: 'String', StringValue: 'order' } }
			}
		]);
	});
});
