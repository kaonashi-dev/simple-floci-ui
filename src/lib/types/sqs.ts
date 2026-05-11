export type SqsQueueSummary = {
	name: string;
	url: string;
	approximateNumberOfMessages?: number;
	approximateNumberOfMessagesNotVisible?: number;
	enrichmentError?: string;
};

export type SqsMessage = {
	messageId?: string;
	body?: string;
	receiptHandle?: string;
	attributes?: Record<string, string>;
	messageAttributes?: Record<string, unknown>;
};
