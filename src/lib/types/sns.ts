export type SnsTopicSummary = {
	arn: string;
	name: string;
	subscriptionCount?: number;
};

export type SnsSubscription = {
	subscriptionArn: string;
	protocol: string;
	endpoint: string;
	owner?: string;
};
