export type SqsQueueSummary = {
	name: string;
	url: string;
	approximateNumberOfMessages?: number;
	approximateNumberOfMessagesNotVisible?: number;
	approximateNumberOfMessagesDelayed?: number;
	enrichmentError?: string;
};

export type SqsMessage = {
	messageId?: string;
	body?: string;
	receiptHandle?: string;
	md5OfBody?: string;
	attributes?: Record<string, string>;
	messageAttributes?: Record<string, unknown>;
};

export type SqsMessageAttributeInput = {
	name: string;
	value: string;
	type?: 'String' | 'Number' | 'Binary';
};

export type SqsCreateQueueOptions = {
	fifo?: boolean;
	visibilityTimeout?: number;
	messageRetention?: number;
	delaySeconds?: number;
	maxMessageSizeKb?: number;
};

export type SqsSendOptions = {
	delaySeconds?: number;
	messageGroupId?: string;
	messageDeduplicationId?: string;
	attributes?: SqsMessageAttributeInput[];
};

export type SqsReceiveOptions = {
	maxMessages?: number;
	visibilityTimeout?: number;
	waitTimeSeconds?: number;
};
