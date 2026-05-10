export type EventBusSummary = {
	name: string;
	arn: string;
};

export type EventRuleSummary = {
	name: string;
	arn?: string;
	state?: string;
	description?: string;
	scheduleExpression?: string;
	eventPattern?: string;
};

export type EventRuleTarget = {
	id: string;
	arn: string;
	input?: string;
};
