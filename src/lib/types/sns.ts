export type SnsTopicSummary = {
	arn: string;
	name: string;
	subscriptionCount?: number;
	enrichmentError?: string;
};

export type SnsSubscription = {
	subscriptionArn: string;
	protocol: string;
	endpoint: string;
	owner?: string;
};
