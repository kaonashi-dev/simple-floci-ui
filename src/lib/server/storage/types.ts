export type StorageEventType = 'sent' | 'received' | 'deleted';

export type StorageEvent = {
	id: number;
	queueName: string;
	messageId: string | null;
	eventType: StorageEventType;
	bodyPreview: string | null;
	sentTsMs: number | null;
	eventAtMs: number;
	queueTimeMs: number | null;
};

export type QueueStats = {
	totalSent: number;
	totalReceived: number;
	totalDeleted: number;
	avgQueueTimeMs: number | null;
	minQueueTimeMs: number | null;
	maxQueueTimeMs: number | null;
};

export type StoreInfo = {
	path: string;
	sizeBytes: number;
	totalEvents: number;
};

export interface StorageService {
	insertEvent(event: Omit<StorageEvent, 'id'>): void;
	queryEvents(queueName: string, limit: number): StorageEvent[];
	statsForQueue(queueName: string): QueueStats;
	reset(): void;
	info(): StoreInfo;
}
