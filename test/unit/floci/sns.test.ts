import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
	CreateTopicCommand,
	DeleteTopicCommand,
	GetTopicAttributesCommand,
	ListSubscriptionsByTopicCommand,
	ListTopicsCommand,
	PublishCommand,
	SNSClient
} from '@aws-sdk/client-sns';
import { createTopic, deleteTopic, getTopicAttributes, listSubscriptions, listTopics, publish } from '$lib/floci/sns';

const snsMock = mockClient(SNSClient);

describe('sns service', () => {
	beforeEach(() => snsMock.reset());

	it('lists topics and isolates attribute enrichment failures', async () => {
		snsMock.on(ListTopicsCommand).resolves({ Topics: [{ TopicArn: 'arn:aws:sns:::orders' }, { TopicArn: 'arn:aws:sns:::bad' }] });
		snsMock.on(GetTopicAttributesCommand, { TopicArn: 'arn:aws:sns:::orders' }).resolves({ Attributes: { SubscriptionsConfirmed: '4' } });
		snsMock.on(GetTopicAttributesCommand, { TopicArn: 'arn:aws:sns:::bad' }).rejects(new Error('denied'));

		await expect(listTopics()).resolves.toEqual([
			{ arn: 'arn:aws:sns:::orders', name: 'orders', subscriptionCount: 4 },
			expect.objectContaining({ arn: 'arn:aws:sns:::bad', name: 'bad', enrichmentError: 'Error: denied' })
		]);
	});

	it('lists subscriptions and publishes messages', async () => {
		snsMock.on(ListSubscriptionsByTopicCommand).resolves({
			Subscriptions: [{ SubscriptionArn: 'sub', Protocol: 'sqs', Endpoint: 'queue', Owner: 'owner' }]
		});
		snsMock.on(GetTopicAttributesCommand).resolves({ Attributes: { DisplayName: 'Orders' } });
		snsMock.on(PublishCommand).resolves({});
		snsMock.on(DeleteTopicCommand).resolves({});

		await expect(getTopicAttributes('arn')).resolves.toEqual({ DisplayName: 'Orders' });
		await expect(listSubscriptions('arn')).resolves.toEqual([{ subscriptionArn: 'sub', protocol: 'sqs', endpoint: 'queue', owner: 'owner' }]);
		await publish('arn', 'message', 'subject');
		await deleteTopic('arn');

		expect(snsMock.commandCalls(PublishCommand)[0].args[0].input).toEqual({ TopicArn: 'arn', Message: 'message', Subject: 'subject' });
		expect(snsMock.commandCalls(DeleteTopicCommand)[0].args[0].input).toEqual({ TopicArn: 'arn' });
	});

	it('creates FIFO topics with content-based deduplication', async () => {
		snsMock.on(CreateTopicCommand).resolves({});

		await createTopic('orders.fifo', { fifo: true });

		expect(snsMock.commandCalls(CreateTopicCommand)[0].args[0].input).toEqual({
			Name: 'orders.fifo',
			Attributes: { FifoTopic: 'true', ContentBasedDeduplication: 'true' }
		});
	});
});
