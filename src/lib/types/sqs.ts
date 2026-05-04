export type SqsQueueSummary = {
	name: string;
	url: string;
	approximateNumberOfMessages?: number;
	approximateNumberOfMessagesNotVisible?: number;
};

export type SqsMessage = {
	messageId?: string;
	body?: string;
	receiptHandle?: string;
	attributes?: Record<string, string>;
	messageAttributes?: Record<string, unknown>;
};
