import { insertEvent, queryEvents, statsForQueue, resetStore, storeInfo } from './db';
import type { SqsHistoryEvent, SqsQueueStats } from '$lib/types/sqs-history';
import type { SqsMessage } from '$lib/types/sqs';

const BODY_PREVIEW_LEN = 200;

export function recordSent(queueName: string, messageId: string | undefined, body: string): void {
	insertEvent({
		queueName,
		messageId: messageId ?? null,
		eventType: 'sent',
		bodyPreview: body.slice(0, BODY_PREVIEW_LEN),
		sentTsMs: null,
		eventAtMs: Date.now(),
		queueTimeMs: null
	});
}

export function recordReceived(queueName: string, messages: SqsMessage[]): void {
	const now = Date.now();
	for (const msg of messages) {
		const sentTs = Number(msg.attributes?.SentTimestamp);
		const validSentTs = Number.isFinite(sentTs) && sentTs > 0;
		insertEvent({
			queueName,
			messageId: msg.messageId ?? null,
			eventType: 'received',
			bodyPreview: msg.body ? msg.body.slice(0, BODY_PREVIEW_LEN) : null,
			sentTsMs: validSentTs ? sentTs : null,
			eventAtMs: now,
			queueTimeMs: validSentTs ? now - sentTs : null
		});
	}
}

export function recordDeleted(queueName: string): void {
	insertEvent({
		queueName,
		messageId: null,
		eventType: 'deleted',
		bodyPreview: null,
		sentTsMs: null,
		eventAtMs: Date.now(),
		queueTimeMs: null
	});
}

export function getQueueHistory(queueName: string, limit = 200): SqsHistoryEvent[] {
	return queryEvents(queueName, limit).map((e) => ({
		id: e.id,
		queueName: e.queueName,
		messageId: e.messageId,
		eventType: e.eventType,
		bodyPreview: e.bodyPreview,
		sentTsMs: e.sentTsMs,
		eventAtMs: e.eventAtMs,
		queueTimeMs: e.queueTimeMs
	}));
}

export function getQueueStats(queueName: string): SqsQueueStats {
	return statsForQueue(queueName);
}

export function resetDb(): void {
	resetStore();
}

export function getDbStats(): { path: string; sizeBytes: number; totalEvents: number } {
	return storeInfo();
}
