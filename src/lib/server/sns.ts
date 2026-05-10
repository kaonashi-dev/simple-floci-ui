import {
	SNSClient,
	ListTopicsCommand,
	GetTopicAttributesCommand,
	ListSubscriptionsByTopicCommand,
	PublishCommand,
	CreateTopicCommand,
	DeleteTopicCommand
} from '@aws-sdk/client-sns';
import { awsConfig } from './aws';
import type { SnsTopicSummary, SnsSubscription } from '$lib/types/sns';

function client() { return new SNSClient(awsConfig); }

export async function listTopics(): Promise<SnsTopicSummary[]> {
	const sns = client();
	const arns: string[] = [];
	let nextToken: string | undefined;
	do {
		const res = await sns.send(new ListTopicsCommand({ NextToken: nextToken }));
		if (res.Topics) arns.push(...res.Topics.map(t => t.TopicArn!));
		nextToken = res.NextToken;
	} while (nextToken);

	return Promise.all(arns.map(async (arn) => {
		const name = arn.split(':').pop() ?? arn;
		try {
			const attrs = await sns.send(new GetTopicAttributesCommand({ TopicArn: arn }));
			return {
				arn,
				name,
				subscriptionCount: Number(attrs.Attributes?.SubscriptionsConfirmed ?? 0)
			} satisfies SnsTopicSummary;
		} catch {
			return { arn, name } satisfies SnsTopicSummary;
		}
	}));
}

export async function getTopicAttributes(arn: string): Promise<Record<string, string>> {
	const sns = client();
	const res = await sns.send(new GetTopicAttributesCommand({ TopicArn: arn }));
	return res.Attributes ?? {};
}

export async function listSubscriptions(arn: string): Promise<SnsSubscription[]> {
	const sns = client();
	const res = await sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: arn }));
	return (res.Subscriptions ?? []).map(s => ({
		subscriptionArn: s.SubscriptionArn ?? '',
		protocol: s.Protocol ?? '',
		endpoint: s.Endpoint ?? '',
		owner: s.Owner
	}));
}

export async function publish(arn: string, message: string, subject?: string): Promise<void> {
	const sns = client();
	await sns.send(new PublishCommand({ TopicArn: arn, Message: message, Subject: subject || undefined }));
}

export async function createTopic(name: string): Promise<void> {
	const sns = client();
	await sns.send(new CreateTopicCommand({ Name: name }));
}

export async function deleteTopic(arn: string): Promise<void> {
	const sns = client();
	await sns.send(new DeleteTopicCommand({ TopicArn: arn }));
}
