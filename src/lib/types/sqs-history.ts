export type SqsEventType = 'sent' | 'received' | 'deleted';

export type SqsHistoryEvent = {
	id: number;
	queueName: string;
	messageId: string | null;
	eventType: SqsEventType;
	bodyPreview: string | null;
	sentTsMs: number | null;
	eventAtMs: number;
	queueTimeMs: number | null;
};

export type SqsQueueStats = {
	totalSent: number;
	totalReceived: number;
	totalDeleted: number;
	avgQueueTimeMs: number | null;
	minQueueTimeMs: number | null;
	maxQueueTimeMs: number | null;
};
